import React from 'react';
import { Send, Trash2, RefreshCw, Terminal, Info } from 'lucide-react';

const PRESETS = [
  {
    id: 'spam',
    label: 'Sample Spam',
    description: 'Financial solicitations & scam lures',
    content: 'WIN $1,000,000 FREE CRYPTO NOW CLICK HERE http://claim-prize.com GUARANTEED MONEY!!!',
    dotColor: 'bg-[#C5A880]',
    borderColor: 'hover:border-[#C5A880]'
  },
  {
    id: 'toxic',
    label: 'Sample Toxic',
    description: 'Severe hostility & targeted harassment',
    content: 'You are an absolute waste of space, nobody wants you here, go away.',
    dotColor: 'bg-[#B88B6E]',
    borderColor: 'hover:border-[#B88B6E]'
  },
  {
    id: 'evasion',
    label: 'Sample Evasion',
    description: 'Character spacing & leetspeak bypass tactics',
    content: 't o x i c b e h a v i o r s3ll y0ur s0ul 0nline',
    dotColor: 'bg-[#8F6423]',
    borderColor: 'hover:border-[#8F6423]'
  },
  {
    id: 'safe',
    label: 'Sample Safe',
    description: 'Compliant enterprise correspondence',
    content: 'Hello everyone! Hope you are all having a wonderful and productive day.',
    dotColor: 'bg-[#2D5F45]',
    borderColor: 'hover:border-[#2D5F45]'
  }
];

export default function IngestionBox({
  text,
  setText,
  onAnalyze,
  isAnalyzing,
  onClear
}) {
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isAnalyzing && text.trim()) {
        onAnalyze();
      }
    }
  };

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      {/* Ingestion Container */}
      <div className="bg-white border border-[#DFD8CD] shadow-sm rounded-2xl p-6 transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-[#C5A880]" />
            <h2 className="text-xs font-bold tracking-wider text-[#2C2623] uppercase font-mono">
              Content Ingestion Console
            </h2>
          </div>
          <button
            onClick={onClear}
            disabled={!text || isAnalyzing}
            className="flex items-center space-x-1.5 text-xs text-[#7A7067] hover:text-[#2C2623] disabled:opacity-40 disabled:hover:text-[#7A7067] transition-colors px-2 py-1 rounded font-mono"
            title="Clear text input"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#7A7067]" />
            <span>Clear</span>
          </button>
        </div>

        {/* Preset Test Scenarios */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7067] mb-2 font-mono">
            Preset Test Scenarios:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setText(preset.content)}
                disabled={isAnalyzing}
                className={`group text-left px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#DFD8CD] ${preset.borderColor} hover:bg-white hover:shadow-sm transition-all duration-200 flex items-start space-x-2.5`}
              >
                <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${preset.dotColor}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#2C2623] group-hover:text-[#1F1A18]">
                    {preset.label}
                  </div>
                  <div className="text-[10px] text-[#7A7067] truncate">
                    {preset.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Area */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={5}
            placeholder="Enter raw text to screen for adversarial evasion, cyber toxicity, and spam..."
            className="w-full bg-white border border-[#DFD8CD] rounded-xl p-4 text-[#2C2623] placeholder-[#9E948B] focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/40 transition text-sm font-mono leading-relaxed resize-none shadow-sm"
          />

          <div className="flex justify-between items-center text-[11px] text-[#7A7067] font-mono mt-1.5 px-1">
            <span>{wordCount} words · {charCount} chars</span>
            <span>UTF-8 Normalized</span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-3.5 border-t border-[#DFD8CD]">
          <div className="text-xs text-[#7A7067] flex items-center space-x-1.5 font-mono">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-[#EFECE6] border border-[#DFD8CD] rounded text-[10px] text-[#2C2623] font-semibold">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-[#EFECE6] border border-[#DFD8CD] rounded text-[10px] text-[#2C2623] font-semibold">Enter</kbd>
            <span>to screen</span>
          </div>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={!text.trim() || isAnalyzing}
            className="w-full sm:w-auto bg-[#C5A880] hover:bg-[#B59468] active:bg-[#A98455] text-[#1F1A18] font-bold px-6 py-2.5 rounded-xl transition duration-200 shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono tracking-wider uppercase flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#1F1A18]" />
                <span>Screening Armor...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-[#1F1A18]" />
                <span>Screen Content & Armor</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Defense Architecture Overview Card */}
      <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#DFD8CD]">
        <div className="flex items-center space-x-2 mb-2.5">
          <Info className="w-4 h-4 text-[#C5A880]" />
          <h3 className="text-xs font-bold text-[#2C2623] uppercase tracking-wider font-mono">
            Defense Architecture Overview
          </h3>
        </div>
        <p className="text-xs text-[#7A7067] leading-relaxed">
          Text Armor executes a sequential threat inspection pipeline:
          raw text passes through an adversarial preprocessor neutralizing character-spacing and leetspeak glyphs.
          Cleaned sequences stream to local twin Bidirectional LSTM networks with automatic cloud Groq LLM API fallback cascading to compute a multi-dimensional risk index.
        </p>
        <div className="mt-3 p-3 bg-white rounded-xl border border-[#DFD8CD] font-mono text-[11px] text-[#2C2623] flex items-center justify-between shadow-sm">
          <span className="text-[#7A7067] font-medium">Formula:</span>
          <span className="tracking-wide">Risk = min((Spam × 35) + (Toxicity × 50) + EvasionPenalty, 100)</span>
        </div>
      </div>
    </div>
  );
}
