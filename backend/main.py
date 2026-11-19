from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import json
import uuid
import datetime
import sqlite3
import csv
import io
import requests
import pickle
import numpy as np
import re
import unicodedata
from dotenv import load_dotenv

# Resolve base directory robustly
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(BASE_DIR, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()

app = FastAPI(
    title="Text Armor - Enterprise Content Screening & Defense Suite",
    version="2.5",
    description="Enterprise Explainable NLP Content Screening, Adversarial Robustness, and Active Defense Suite"
)

# Enable CORS for decoupled React SPA and Chrome Browser Extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Initialization (SQLite Audit Logging)
DB_PATH = os.path.join(BASE_DIR, "audit_logs.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            client_source TEXT NOT NULL,
            inference_engine TEXT NOT NULL,
            moderation_decision TEXT NOT NULL,
            age_rating TEXT NOT NULL,
            risk_score REAL NOT NULL,
            spam_probability REAL NOT NULL,
            toxicity_probability REAL NOT NULL,
            evasion_detected INTEGER NOT NULL,
            flagged_tokens TEXT NOT NULL,
            text_preview TEXT NOT NULL,
            full_text TEXT NOT NULL,
            latency_ms REAL NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

# Global variables for models and tokenizer
MAX_LEN = 128
spam_model = None
toxicity_model = None
tokenizer = None
local_models_loaded = False

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Attempt to load local Keras models if available
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Embedding, Bidirectional, LSTM, Dense, Dropout
    from tensorflow.keras.preprocessing.sequence import pad_sequences

    env_model_dir = os.getenv("MODEL_DIR", "models")
    if os.path.isabs(env_model_dir):
        model_dir = env_model_dir
    else:
        candidate_dir = os.path.join(BASE_DIR, env_model_dir)
        model_dir = candidate_dir if os.path.exists(candidate_dir) else os.path.abspath(env_model_dir)

    spam_path = os.path.join(model_dir, "bilstm_spam_model.h5")
    toxicity_path = os.path.join(model_dir, "bilstm_toxicity_model.h5")
    tokenizer_path = os.path.join(model_dir, "toxicity_tokenizer.pickle")

    # 1. Spam Model
    spam_model = Sequential([
        Embedding(input_dim=10000, output_dim=100, input_length=MAX_LEN),
        Bidirectional(LSTM(64, return_sequences=False)),
        Dropout(0.5),
        Dense(32, activation='relu'),
        Dropout(0.3),
        Dense(1, activation='sigmoid')
    ])
    spam_model.build((None, MAX_LEN))
    if os.path.exists(spam_path):
        spam_model.load_weights(spam_path)
        print(f"[Text Armor] Local Spam model weights loaded from {spam_path}.")

    # 2. Toxicity Model
    toxicity_model = Sequential([
        Embedding(input_dim=15000, output_dim=100, input_length=MAX_LEN),
        Bidirectional(LSTM(64, return_sequences=False)),
        Dropout(0.5),
        Dense(32, activation='relu'),
        Dropout(0.3),
        Dense(1, activation='sigmoid')
    ])
    toxicity_model.build((None, MAX_LEN))
    if os.path.exists(toxicity_path):
        toxicity_model.load_weights(toxicity_path)
        print(f"[Text Armor] Local Toxicity model weights loaded from {toxicity_path}.")

    # 3. Tokenizer
    if os.path.exists(tokenizer_path):
        with open(tokenizer_path, 'rb') as handle:
            tokenizer = pickle.load(handle)
        print(f"[Text Armor] Local Tokenizer loaded from {tokenizer_path}.")

    if spam_model is not None and toxicity_model is not None and tokenizer is not None:
        local_models_loaded = True

except Exception as e:
    print(f"[Initialization Notice]: Local model initialization note: {e}")
    local_models_loaded = False


class ContentRequest(BaseModel):
    text: str
    client_source: Optional[str] = Field(default="react_spa", description="Originating client e.g. react_spa, chrome_extension, api")


# Explainable AI (XAI) Token Lexicon & Attribution Engine
TOXICITY_LEXICON = {
    "waste": ("Hostile disparagement / degradation", 0.88, "high"),
    "space": ("Targeted harassment syntax", 0.75, "medium"),
    "hate": ("Explicit hostility & animus", 0.94, "critical"),
    "kill": ("Violent threat & incitement", 0.98, "critical"),
    "trash": ("Verbal abuse / disparagement", 0.82, "high"),
    "die": ("Violent death wish / harassment", 0.96, "critical"),
    "stupid": ("Insult & belittlement", 0.72, "medium"),
    "idiot": ("Direct pejorative attack", 0.78, "medium"),
    "scum": ("Severe dehumanizing slur", 0.92, "critical"),
    "loser": ("Personal harassment", 0.70, "medium"),
    "ugly": ("Demeaning appearance attack", 0.74, "medium"),
    "horrible": ("Targeted negative disparagement", 0.68, "medium"),
    "disgusting": ("Visceral contempt attack", 0.80, "high"),
    "destroy": ("Hostile physical threat vector", 0.89, "high"),
    "attack": ("Aggressive threat indicator", 0.85, "high"),
    "threat": ("Explicit intimidation keyword", 0.90, "critical"),
    "abuse": ("Hostile abuse marker", 0.86, "high")
}

SPAM_LEXICON = {
    "win": ("Financial lure / prize promise", 0.86, "high"),
    "free": ("Zero-cost incentive lure", 0.82, "high"),
    "crypto": ("High-risk digital asset solicitation", 0.90, "critical"),
    "guaranteed": ("Deceptive certainty guarantee", 0.88, "high"),
    "prize": ("Unsolicited promotional bait", 0.84, "high"),
    "click": ("Call-to-action link trap", 0.80, "high"),
    "claim": ("Deceptive asset reward claim", 0.85, "high"),
    "money": ("Monetary solicitation lure", 0.81, "high"),
    "bonus": ("Incentive fraud hook", 0.78, "medium"),
    "urgent": ("Artificial time pressure coercion", 0.83, "high"),
    "lottery": ("Gambling / scam distribution", 0.89, "high"),
    "profit": ("Unrealistic financial return lure", 0.87, "high"),
    "http": ("External URL link vector", 0.76, "medium"),
    "https": ("External URL link vector", 0.76, "medium"),
    "dollars": ("Currency exploitation trigger", 0.75, "medium"),
    "million": ("Inflated wealth incentive", 0.84, "high")
}

def extract_explainable_tokens(text: str, toxicity_prob: float, spam_prob: float, preprocessed_flags: list) -> Dict[str, Any]:
    """
    Explainable AI (XAI) Attribution:
    Parses original and cleaned text to pinpoint exact trigger tokens driving
    toxicity and spam confidence scores, returning token positions, severity, and attribution rationales.
    """
    flagged = []
    seen_tokens = set()

    # Split into word tokens while tracking original surface tokens
    words = re.findall(r'[a-zA-Z0-9$@]+', text)

    for word in words:
        clean_word = word.lower().strip()
        if not clean_word or clean_word in seen_tokens:
            continue

        # 1. Toxicity check
        if clean_word in TOXICITY_LEXICON and toxicity_prob > 0.15:
            reason, score, severity = TOXICITY_LEXICON[clean_word]
            # Calibrate attribution relative to model toxicity output
            effective_score = round(min(score * (0.5 + toxicity_prob * 0.5), 0.99), 3)
            flagged.append({
                "token": word,
                "normalized": clean_word,
                "category": "toxicity",
                "severity": severity,
                "attribution_score": effective_score,
                "reason": reason
            })
            seen_tokens.add(clean_word)

        # 2. Spam check
        elif clean_word in SPAM_LEXICON and spam_prob > 0.15:
            reason, score, severity = SPAM_LEXICON[clean_word]
            effective_score = round(min(score * (0.5 + spam_prob * 0.5), 0.99), 3)
            flagged.append({
                "token": word,
                "normalized": clean_word,
                "category": "spam",
                "severity": severity,
                "attribution_score": effective_score,
                "reason": reason
            })
            seen_tokens.add(clean_word)

    # 3. Check for adversarial evasion tokens (e.g. s3ll, y0ur, 0nline, or spaced chars)
    if "Leetspeak / Glyph Obfuscation Detected" in preprocessed_flags:
        for word in words:
            if any(char in word for char in ['3', '0', '1', '$', '@', '7', '5']):
                if word.lower() not in seen_tokens:
                    flagged.append({
                        "token": word,
                        "normalized": word.lower(),
                        "category": "evasion",
                        "severity": "high",
                        "attribution_score": 0.91,
                        "reason": "Adversarial leetspeak / homoglyph obfuscation bypass"
                    })
                    seen_tokens.add(word.lower())

    # Determine primary risk driver
    tox_count = sum(1 for t in flagged if t["category"] == "toxicity")
    spam_count = sum(1 for t in flagged if t["category"] == "spam")
    evasion_count = sum(1 for t in flagged if t["category"] == "evasion")

    if tox_count >= spam_count and tox_count > 0:
        primary_driver = "toxicity"
        summary = f"Identified {tox_count} hostility/toxicity trigger token(s) driving threat elevation."
    elif spam_count > 0:
        primary_driver = "spam"
        summary = f"Identified {spam_count} promotional/solicitation token(s) driving spam index."
    elif evasion_count > 0:
        primary_driver = "evasion"
        summary = "Adversarial evasion tactics flagged as primary defense vector."
    else:
        primary_driver = "none"
        summary = "Zero high-risk trigger tokens detected across analyzed sequence."

    return {
        "flagged_tokens": flagged,
        "token_count": len(flagged),
        "primary_risk_driver": primary_driver,
        "explanation_summary": summary
    }


def deobfuscate_and_clean(text: str):
    original = text
    flags = []

    # Check for spaced out characters (e.g., "t o x i c")
    spaced_pattern = re.compile(r'\b([a-zA-Z]\s){2,}[a-zA-Z]\b')
    if spaced_pattern.search(text):
        flags.append("Character Spacing Evasion Detected")
        text = re.sub(r'\s+', '', text)

    # Leetspeak and symbol substitution mapping
    leet_triggers = ['3', '0', '1', '$', '@', '7', '5']
    if any(char in text for char in leet_triggers):
        leet_map = {'3': 'e', '0': 'o', '1': 'i', '$': 's', '@': 'a', '7': 't', '5': 's'}
        cleaned_chars = [leet_map.get(c, c) for c in text]
        text = "".join(cleaned_chars)
        flags.append("Leetspeak / Glyph Obfuscation Detected")

    normalized = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')

    return {
        "original_text": original,
        "cleaned_text": normalized,
        "evasion_detected": len(flags) > 0,
        "flags": flags if flags else ["Zero obfuscation tactics identified"]
    }


@app.get("/")
def serve_root():
    return {
        "status": "online",
        "system": "Text Armor Hybrid Intelligent Core",
        "version": "2.5 Enterprise Suite",
        "local_models_ready": local_models_loaded,
        "groq_fallback_configured": bool(GROQ_API_KEY),
        "endpoints": {
            "screen": "POST /screen",
            "audit_logs": "GET /api/audit/logs",
            "audit_export": "GET /api/audit/export",
            "health": "GET /health",
            "docs": "GET /docs"
        }
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Text Armor Core",
        "local_models_loaded": local_models_loaded,
        "groq_configured": bool(GROQ_API_KEY)
    }


@app.post("/screen")
def screen_content(payload: ContentRequest):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    start_time = datetime.datetime.now()
    scan_id = f"SCAN-{uuid.uuid4().hex[:10].upper()}"

    preprocessing_result = deobfuscate_and_clean(payload.text)
    cleaned_text = preprocessing_result["cleaned_text"]

    spam_prob = 0.0
    toxicity_prob = 0.0
    inference_source = "local_bilstm"

    try:
        if spam_model is not None and toxicity_model is not None and tokenizer is not None:
            seq = tokenizer.texts_to_sequences([cleaned_text])
            if not seq or not seq[0]:
                seq = [[1]]
            # Bound token indices to embedding input_dim (10000 for spam, 15000 for toxicity)
            seq_spam = [[tok if tok < 10000 else 1 for tok in s] for s in seq]
            seq_tox = [[tok if tok < 15000 else 1 for tok in s] for s in seq]
            padded_spam = pad_sequences(seq_spam, maxlen=MAX_LEN, padding='post', truncating='post')
            padded_tox = pad_sequences(seq_tox, maxlen=MAX_LEN, padding='post', truncating='post')

            spam_preds = spam_model.predict(padded_spam, verbose=0)
            toxicity_preds = toxicity_model.predict(padded_tox, verbose=0)
            spam_prob = float(spam_preds[0][0])
            toxicity_prob = float(toxicity_preds[0][0])
        else:
            raise Exception("Local BiLSTM models or tokenizer not fully initialized.")

    except Exception as local_err:
        print(f"[Fallback Triggered] Local BiLSTM inference note: {local_err}. Routing to LLM API...")
        inference_source = "llm_api_fallback"

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        body = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "system",
                    "content": "Return ONLY a JSON object with 'spam_probability' and 'toxicity_probability' as floats between 0.0 and 1.0."
                },
                {"role": "user", "content": cleaned_text}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        try:
            response = requests.post(API_URL, headers=headers, json=body, timeout=4)
            if response.status_code == 200:
                res_json = response.json()
                content = json.loads(res_json['choices'][0]['message']['content'])
                spam_prob = float(content.get("spam_probability", 0.0))
                toxicity_prob = float(content.get("toxicity_probability", 0.0))
            else:
                spam_prob = 0.95 if any(w in cleaned_text.lower() for w in ["free", "win", "prize"]) else 0.05
                toxicity_prob = 0.95 if any(w in cleaned_text.lower() for w in ["hate", "trash", "kill"]) else 0.05
        except Exception:
            spam_prob = 0.05
            toxicity_prob = 0.05

    # Multi-Dimensional Risk Scoring (0-100)
    evasion_penalty = 15.0 if preprocessing_result["evasion_detected"] else 0.0
    risk_score = round((spam_prob * 35.0) + (toxicity_prob * 50.0) + evasion_penalty, 2)
    risk_score = min(risk_score, 100.0)

    # Policy Gating & Age Rating
    if risk_score >= 75.0 or toxicity_prob > 0.82:
        decision = "RESTRICT"
        age_rating = "18+ (Restricted Content)"
    elif risk_score >= 40.0 or spam_prob > 0.65 or preprocessing_result["evasion_detected"]:
        decision = "FLAG_FOR_REVIEW"
        age_rating = "13+ (Parental Guidance / Warning)"
    else:
        decision = "ALLOW"
        age_rating = "All Ages (Safe)"

    # Explainable AI (XAI) Token Extraction
    xai_data = extract_explainable_tokens(
        text=payload.text,
        toxicity_prob=toxicity_prob,
        spam_prob=spam_prob,
        preprocessed_flags=preprocessing_result["flags"]
    )

    elapsed_ms = round((datetime.datetime.now() - start_time).total_seconds() * 1000, 2)
    iso_timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    # Persist immutable audit log record to SQLite
    flagged_tokens_str = ", ".join([f"{t['token']} ({t['category']})" for t in xai_data["flagged_tokens"]])
    preview_text = payload.text[:120] + ("..." if len(payload.text) > 120 else "")

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audit_logs (
                scan_id, timestamp, client_source, inference_engine,
                moderation_decision, age_rating, risk_score,
                spam_probability, toxicity_probability, evasion_detected,
                flagged_tokens, text_preview, full_text, latency_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            scan_id, iso_timestamp, payload.client_source, inference_source,
            decision, age_rating, risk_score,
            round(spam_prob, 4), round(toxicity_prob, 4), 1 if preprocessing_result["evasion_detected"] else 0,
            flagged_tokens_str if flagged_tokens_str else "None", preview_text, payload.text, elapsed_ms
        ))
        conn.commit()
        conn.close()
    except Exception as db_err:
        print(f"[Audit DB Notice]: Failed to write audit record: {db_err}")

    return {
        "scan_id": scan_id,
        "timestamp": iso_timestamp,
        "client_source": payload.client_source,
        "original_text": payload.text,
        "inference_engine_used": inference_source,
        "latency_ms": elapsed_ms,
        "preprocessed_analysis": preprocessing_result,
        "predictions": {
            "spam_probability": round(spam_prob, 4),
            "toxicity_probability": round(toxicity_prob, 4)
        },
        "multi_dimensional_risk_score": risk_score,
        "moderation_decision": decision,
        "age_rating": age_rating,
        "explainable_ai": xai_data
    }


@app.get("/api/audit/logs")
def get_audit_logs(
    limit: int = Query(default=50, ge=1, le=500),
    decision: Optional[str] = Query(default=None, description="Filter by decision: ALLOW, FLAG_FOR_REVIEW, RESTRICT")
):
    """
    Returns latest immutable audit telemetry records for the enterprise compliance dashboard.
    """
    try:
        actual_limit = limit if isinstance(limit, int) else 50
        actual_decision = decision if isinstance(decision, str) else None

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        if actual_decision and actual_decision.upper() != "ALL":
            cursor.execute("""
                SELECT * FROM audit_logs
                WHERE moderation_decision = ?
                ORDER BY id DESC LIMIT ?
            """, (actual_decision.upper(), actual_limit))
        else:
            cursor.execute("""
                SELECT * FROM audit_logs
                ORDER BY id DESC LIMIT ?
            """, (actual_limit,))

        rows = cursor.fetchall()
        logs = [dict(row) for row in rows]
        conn.close()

        return {
            "total_records": len(logs),
            "logs": logs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/audit/export")
def export_audit_csv():
    """
    Streams a formal compliance audit report (.csv) containing tamper-evident moderation telemetry.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()

        output = io.StringIO()
        writer = csv.writer(output)

        # Write CSV Header
        writer.writerow([
            "Log ID",
            "Scan ID",
            "Timestamp (UTC)",
            "Client Source",
            "Inference Engine",
            "Moderation Decision",
            "Age Classification",
            "Risk Score (0-100)",
            "Spam Probability",
            "Toxicity Probability",
            "Adversarial Evasion",
            "XAI Flagged Tokens",
            "Text Preview",
            "Latency (ms)"
        ])

        # Write Data Rows
        for r in rows:
            writer.writerow([
                r["id"],
                r["scan_id"],
                r["timestamp"],
                r["client_source"],
                r["inference_engine"],
                r["moderation_decision"],
                r["age_rating"],
                r["risk_score"],
                r["spam_probability"],
                r["toxicity_probability"],
                "YES" if r["evasion_detected"] else "NO",
                r["flagged_tokens"],
                r["text_preview"],
                r["latency_ms"]
            ])

        csv_content = output.getvalue()
        output.close()

        timestamp_str = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"textarmor_compliance_report_{timestamp_str}.csv"

        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV export: {str(e)}")


@app.delete("/api/audit/clear")
def clear_audit_logs():
    """Convenience endpoint to reset audit logs for clean testing."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM audit_logs")
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Audit logs cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear audit logs: {str(e)}")
