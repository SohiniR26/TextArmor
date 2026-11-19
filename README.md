# Text Armor: Enterprise Content Moderation & Adversarial Defense Suite

## Abstract
**Text Armor** is an enterprise-grade, multi-component content moderation and NLP adversarial defense suite designed for real-time detection of cyber toxicity, spam, and adversarial evasion vectors. Refactored into a high-performance **Single Page Application (SPA)** using **React 18 and Vite**, paired with an asynchronous **FastAPI** backend and an **Active Shield Chrome Browser Extension (Manifest V3)**, Text Armor delivers sub-millisecond screening telemetry, explainable AI token attribution, and immutable compliance audit logging.

The entire user interface and extension panels strictly adhere to an **"Organic Minimalist Editorial"** visual identity—utilizing **Warm Antique Cream (`#F7F4F0`)**, **Deep Espresso (`#2C2623`)**, **Subtle Taupe (`#DFD8CD`)**, and **Soft Champagne Gold (`#C5A880`)**, completely eliminating dark navy, slate, and neon glow aesthetics in favor of a clean, light-mode, luxury design aesthetic with refined desaturated status tones.

---

## Three Major Advanced Capabilities

### 1. Active Shield Chrome Browser Extension (`extension/`)
- **Manifest V3 Architecture**: Automatically monitors editable inputs (`<textarea>`, `<input type="text">`, `[contenteditable]`) across live web pages (e.g. YouTube, Twitter/X, Reddit, internal CMS tools).
- **Asynchronous Real-Time Interception**: Posts content to the local FastAPI backend (`http://127.0.0.1:8000/screen`) with debounced input processing.
- **Dynamic Policy Enforcement**:
  - Automatically blurs restricted content (`filter: blur(3px)`) and mounts an executive Luxury Enterprise warning overlay.
  - Displays XAI flagged trigger tokens with one-click actions: **Review & Edit**, **Clear Input**, and **Dismiss**.
  - Renders temporary non-intrusive compliance badges for verified safe content.
- **Dedicated Extension Popup (`popup.html`)**: Includes an on/off toggle, live core telemetry monitor, and an instant text screening sandbox.

### 2. Explainable AI (XAI) Token Attribution
- **Attribution Engine (`extract_explainable_tokens`)**: Pinpoints exact tokens driving toxicity and spam confidence scores with quantitative attribution weights (0.0 to 1.0) and clinical/security rationales.
- **Interactive Highlighting (`XAIHighlightBox.jsx`)**: Visually flags words in the original sentence using soft gold and subdued garnet highlights with hoverable tooltips showing category, severity, and attribution percentage.

### 3. Enterprise Audit Logging & CSV Compliance Export
- **Immutable SQLite Registry (`audit_logs.db`)**: Automatically records every screening transaction with unique `SCAN-ID`, ISO timestamp, client source, inference engine used, multi-dimensional risk score, moderation decision, and flagged vectors.
- **Compliance Registry UI (`AuditLogViewer.jsx`)**: Live telemetry table with real-time status indicators, search query filtering, and decision categorizers (`ALLOW`, `FLAG_FOR_REVIEW`, `RESTRICT`).
- **Downloadable CSV Export (`GET /api/audit/export`)**: Direct "Export Compliance CSV" action button generating RFC 4180 compliant audit reports for regulatory reviews and security audits.

---

## Project Directory & File Structure

```text
TextArmor_Project/
├── models/
│   ├── bilstm_spam_model.h5
│   ├── bilstm_toxicity_model.h5
│   └── toxicity_tokenizer.pickle
├── frontend/                     # React 18 + Vite SPA (Luxury Enterprise UI)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── IngestionBox.jsx
│   │   │   ├── VerdictBanner.jsx
│   │   │   ├── RiskAssessmentCard.jsx
│   │   │   ├── ProbabilityBreakdown.jsx
│   │   │   ├── XAIHighlightBox.jsx   # XAI Token Highlighting Component
│   │   │   └── AuditLogViewer.jsx    # Audit Table & CSV Export Button
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── extension/                    # Chrome Browser Extension (Active Shield)
│   ├── manifest.json
│   ├── content.js
│   └── popup.html
├── .env
├── main.py                       # FastAPI Backend with CORS, XAI, and Audit Logs
├── requirements.txt
└── README.md
```

---

## Component Architecture Overview

| Component / File | Responsibility & Visual Presentation |
| :--- | :--- |
| **`Header.jsx`** | Executive navigation bar displaying real-time system status badges, engine cascade telemetry, and interactive API documentation links. |
| **`IngestionBox.jsx`** | Interactive input console featuring 4 one-click test presets (Spam, Toxic, Evasion, Safe), character/word metrics, <kbd>Ctrl</kbd> + <kbd>Enter</kbd> shortcuts, and an overview of the defense formula. |
| **`VerdictBanner.jsx`** | Dynamic policy gating indicator presenting `ALLOW`, `FLAG FOR REVIEW`, or `RESTRICT` verdicts with subdued luxury jewel tones, age rating badges, latency telemetry, and active inference engine tags. |
| **`RiskAssessmentCard.jsx`** | Unified Threat Index meter (0–100) with smooth CSS transitions, threshold milestone markers (Safe Baseline, Review Limit, Restricted Limit), and mathematical contribution breakdowns. |
| **`ProbabilityBreakdown.jsx`** | Dual analytical cards tracking isolated Spam and Toxicity probabilities, threshold triggers, and fine-tuned progress meters. |
| **`XAIHighlightBox.jsx`** | Explainable AI token highlighter rendering in-sentence trigger word badges with interactive hover cards displaying category, attribution weights, and clinical rationales. |
| **`AuditLogViewer.jsx`** | Live enterprise compliance registry with search, filter tabs, telemetry status badges, and direct "Export Compliance CSV" report streaming. |
| **`content.js`** | Active Shield content script intercepting form fields on web pages, issuing live screening requests, blurring violations, and displaying custom shadow DOM overlays. |
| **`popup.html`** | Chrome extension popup featuring Active Shield on/off toggle, backend telemetry ping, and instant sandbox tester. |

---

## Installation & Execution Guide

### 1. Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js 18+** & **npm**
- **Google Chrome** (or Chromium-based browser)

### 2. Backend Setup (FastAPI)
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Verify `.env` configuration:
   ```env
   PORT=8000
   HOST=127.0.0.1
   MODEL_DIR=models/
   GROQ_API_KEY=your_groq_api_key_here
   ```
3. Start the FastAPI backend server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   *The backend will be available at `http://127.0.0.1:8000`, with interactive OpenAPI documentation at `http://127.0.0.1:8000/docs`.*

### 3. Frontend Setup (React 18 + Vite SPA)
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *Access the Luxury Enterprise dashboard at `http://localhost:5173`.*

4. To build for production:
   ```bash
   npm run build
   ```

### 4. Chrome Extension Setup (Active Shield)
1. Open Google Chrome and navigate to: `chrome://extensions/`
2. Enable **Developer mode** using the toggle switch in the top right corner.
3. Click the **Load unpacked** button in the top left.
4. Select the `extension/` directory inside `TextArmor_Project`:
   ```text
   C:\Users\user\Downloads\TextArmor_Project\extension
   ```
5. The **Text Armor — Active Shield** extension will be active immediately. Open any webpage with text fields or comment boxes to observe real-time protection and policy gating!
