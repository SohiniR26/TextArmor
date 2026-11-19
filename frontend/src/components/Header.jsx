import React from 'react';
import { Shield, Cpu, ExternalLink } from 'lucide-react';

export default function Header({ systemStatus = 'online', engineMode = 'hybrid' }) {
  return (
    <header className="border-b border-taupe-200 bg-[#F7F4F0]/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-3">
        {/* Brand & Editorial Identity */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-taupe-200 shadow-editorial">
            <Shield className="w-5 h-5 text-champagne-500" strokeWidth={2.2} />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-champagne-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-champagne-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-espresso-800 font-serif">
                TEXT ARMOR
              </h1>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-champagne-100 text-champagne-600 border border-champagne-300 rounded-md font-mono font-medium">
                V2.5 Enterprise
              </span>
            </div>
            <p className="text-xs text-espresso-muted tracking-wide font-normal">
              Explainable NLP Content Screening & Adversarial Defense Suite
            </p>
          </div>
        </div>

        {/* Status Badges & Telemetry */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* System Online Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-status-safe-bg border border-status-safe-border rounded-full text-xs font-medium text-status-safe font-mono">
            <span className="w-2 h-2 rounded-full bg-status-safe"></span>
            <span className="tracking-wide">System Online</span>
          </div>

          {/* Cascading Engine Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-taupe-200 rounded-full text-xs font-mono text-espresso-700 shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-champagne-500" />
            <span className="hidden sm:inline text-espresso-muted">Cascade:</span> BiLSTM + Groq Llama 3.1
          </div>

          {/* API Docs Link */}
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1 text-xs text-espresso-muted hover:text-espresso-800 hover:border-taupe-300 border border-transparent rounded-full transition-all duration-200 font-mono"
          >
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3 text-champagne-500" />
          </a>
        </div>
      </div>
    </header>
  );
}
