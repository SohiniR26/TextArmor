import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import IngestionBox from './components/IngestionBox';
import VerdictBanner from './components/VerdictBanner';
import RiskAssessmentCard from './components/RiskAssessmentCard';
import ProbabilityBreakdown from './components/ProbabilityBreakdown';
import XAIHighlightBox from './components/XAIHighlightBox';
import EvasionPanel from './components/EvasionPanel';
import AuditLogViewer from './components/AuditLogViewer';
import { AlertCircle, Shield, Chrome } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [latency, setLatency] = useState(null);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState('online');
  const [auditTrigger, setAuditTrigger] = useState(0);

  // Initial check on backend health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
        if (res.ok) {
          setSystemHealth('online');
        } else {
          setSystemHealth('degraded');
        }
      } catch (err) {
        setSystemHealth('online');
      }
    };
    checkHealth();
  }, []);

  const handleScreenContent = async () => {
    if (!text.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);
    const startTime = performance.now();

    try {
      let response;
      try {
        response = await fetch('/screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            client_source: 'react_spa'
          })
        });
      } catch (proxyErr) {
        response = await fetch(`${API_BASE_URL}/screen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            client_source: 'react_spa'
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown screening error' }));
        throw new Error(errorData.detail || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const elapsed = (endTime - startTime).toFixed(2);

      setLatency(elapsed);
      setResult(data);
      // Trigger audit log sync
      setAuditTrigger(prev => prev + 1);
    } catch (err) {
      console.error('[Text Armor] Screening error:', err);
      setError(err.message || 'Unable to communicate with the Text Armor backend inference server.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setText('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F4F0] text-espresso-800 flex flex-col font-sans">
      {/* Editorial Header */}
      <Header systemStatus={systemHealth} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error notification banner if backend is unreachable */}
        {error && (
          <div className="p-4 rounded-xl bg-status-restrict-bg border border-status-restrict-border text-espresso-800 flex items-start space-x-3 shadow-editorial animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-status-restrict shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-mono font-bold text-status-restrict uppercase">
                Inference Engine Communication Alert
              </div>
              <div className="text-xs text-espresso-700 mt-1">
                {error}
              </div>
              <div className="text-[11px] text-espresso-muted mt-1.5 font-mono">
                Verify the FastAPI backend is running on <code className="text-espresso-800 font-bold font-mono">http://127.0.0.1:8000</code> with CORS enabled.
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-espresso-muted hover:text-espresso-800 text-xs font-mono px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input Ingestion Console */}
          <div className="lg:col-span-5 space-y-6">
            <IngestionBox
              text={text}
              setText={setText}
              onAnalyze={handleScreenContent}
              isAnalyzing={isAnalyzing}
              onClear={handleClear}
            />

            {/* Active Shield Chrome Extension Card */}
            <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#DFD8CD] flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#DFD8CD] flex items-center justify-center text-[#C5A880] shadow-sm">
                  <Chrome className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-[#2C2623] uppercase">
                    Active Shield Extension
                  </div>
                  <div className="text-[11px] text-[#7A7067]">
                    Real-time field interceptor active in <code className="text-[#2C2623] font-semibold font-mono">extension/</code>
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 bg-[#EBF4EE] text-[#24593E] border border-[#C2DFCE] rounded font-mono font-bold shadow-sm">
                READY
              </span>
            </div>
          </div>

          {/* Right Column: Multi-Dimensional Results Telemetry */}
          <div className="lg:col-span-7 space-y-6">
            <VerdictBanner
              result={result}
              latency={latency}
              isAnalyzing={isAnalyzing}
            />

            <XAIHighlightBox
              result={result}
            />

            <RiskAssessmentCard
              result={result}
            />

            <ProbabilityBreakdown
              result={result}
            />

            <EvasionPanel
              result={result}
            />
          </div>
        </div>

        {/* Bottom Section: Enterprise Audit & Compliance Registry */}
        <div className="pt-2">
          <AuditLogViewer triggerRefresh={auditTrigger} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-taupe-200 bg-[#F7F4F0]/90 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-espresso-muted font-mono">
          <div className="flex items-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-champagne-500" />
            <span className="text-espresso-700 font-medium">Text Armor · Organic Minimalist Content Screening Suite</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>React 18 + Vite SPA</span>
            <span>·</span>
            <span>Chrome Active Shield</span>
            <span>·</span>
            <span>Explainable AI (XAI)</span>
            <span>·</span>
            <span>FastAPI Audit Registry</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
