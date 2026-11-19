# Text Armor: Empirical Evaluation Benchmark Report

## Table 1: Baseline Neural Classification Performance & Hybrid Cascade Gain
| Model Architecture | Accuracy | Precision | Recall | Specificity | F1-Score |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BiLSTM Spam Classifier (Standalone Local)** | 50.0% | 0.0% | 0.0% | 100.0% | 0.0% |
| **Text Armor Cascading Spam Engine (Hybrid)** | 85.0% | 88.89% | 80.0% | 90.0% | 84.21% |
| **BiLSTM Toxicity Classifier** | 95.0% | 100.0% | 90.0% | 100.0% | 94.74% |
| **Text Armor Composite Core** | **90.00%** | **94.44%** | **85.00%** | **95.00%** | **89.47%** |

---

## Table 2: Adversarial Robustness Ablation Study
| Attack Vector | Samples | Baseline Without Deobfuscator | Text Armor With Deobfuscator | Robustness Gain |
| :--- | :--- | :--- | :--- | :--- |
| **Character Spacing** | 4 | 25.0% | **100.0%** | +75.0% |
| **Leetspeak / Glyph** | 2 | 50.0% | **100.0%** | +50.0% |
| **Mixed Compound** | 4 | 25.0% | **100.0%** | +75.0% |
| **Overall Attack Recovery** | **10** | **30.0%** | **100.0%** | **+70.0%** |

* **Attack Success Rate (Bypass Rate) Reduction:** Drops from **70.0%** down to **0.0%**.

---

## Table 3: Inference Latency & Cascading Throughput
| Inference Tier | Mean Latency | Median Latency | Tail Latency (p99) | Throughput |
| :--- | :--- | :--- | :--- | :--- |
| **Local BiLSTM Dual-Core** | 72.94 ms | 69.12 ms | 99.17 ms | ~13.7 req/sec |
| **Groq Cloud LLM Fallback** | 1680.0 ms | 1620.0 ms | ~1890 ms | Failover redundancy |

---

## Table 4: Multi-Dimensional Risk Aggregation & Calibration
* **Formula:** `Risk = min((Spam * 35) + (Toxicity * 50) + EvasionPenalty, 100)`
* **Allow Tier (`Risk < 40`):** Compliant, wholesome enterprise correspondence.
* **Review Tier (`40 <= Risk < 75`):** Moderate suspicion or detected evasion vectors (+15 penalty).
* **Restrict Tier (`Risk >= 75` or `Tox > 0.82`):** Acute toxicity, violent threat, or severe scam propagation.
