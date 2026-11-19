import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Copy, Check, Binary, Sparkles } from 'lucide-react';

export default function EvasionPanel({ result }) {
  const [copied, setCopied] = useState(false);

  const evasion = result?.preprocessed_analysis;
  const isAvailable = Boolean(evasion);

  const originalText = isAvailable ? evasion.original_text : '--';
  const cleanedText = isAvailable ? evasion.cleaned_text : '--';
  const isEvasion = isAvailable && evasion.evasion_detected;
  const flags = isAvailable ? evasion.flags : [];

  const handleCopyCleaned = () => {
    if (!isAvailable || !cleanedText || cleanedText === '--') return;
    navigator.clipboard.writeText(cleanedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-[#DFD8CD] shadow-sm rounded-2xl p-6 transition-all duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <Binary className="w-4 h-4 text-[#C5A880]" />
          <h3 className="text-xs font-bold text-[#2C2623] uppercase tracking-wider font-mono">
            Adversarial Robustness & Evasion Deobfuscator
          </h3>
        </div>

        {isAvailable ? (
          isEvasion ? (
            <span className="text-xs px-2.5 py-1 bg-[#FAF3E3] border border-[#EBD6B0] text-[#8A5D19] rounded-md font-mono font-bold self-start sm:self-auto flex items-center gap-1.5 shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Evasion Vectors Flagged (+15 Penalty)</span>
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 bg-[#EBF4EE] border border-[#C2DFCE] text-[#24593E] rounded-md font-mono font-bold self-start sm:self-auto flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Standard Ingestion (Clean)</span>
            </span>
          )
        ) : (
          <span className="text-xs px-2.5 py-1 bg-[#FAF8F5] border border-[#DFD8CD] text-[#7A7067] rounded-md font-mono self-start sm:self-auto">
            Awaiting Ingestion
          </span>
        )}
      </div>

      {/* Triggered Obfuscation Vectors */}
      <div className="space-y-3">
        <div>
          <span className="text-[11px] text-[#7A7067] font-semibold uppercase tracking-wider font-mono">
            Triggered Obfuscation Vectors:
          </span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {isAvailable ? (
              flags.map((flag, idx) => (
                <span
                  key={idx}
                  className={`text-xs px-2.5 py-1 rounded-md font-mono border ${
                    isEvasion
                      ? 'bg-[#FAF3E3] border-[#EBD6B0] text-[#8A5D19] font-semibold'
                      : 'bg-[#FAF8F5] border-[#DFD8CD] text-[#2C2623]'
                  }`}
                >
                  {flag}
                </span>
              ))
            ) : (
              <span className="text-xs px-2.5 py-1 bg-[#FAF8F5] border border-[#DFD8CD] rounded-md text-[#7A7067] font-mono">
                None detected
              </span>
            )}
          </div>
        </div>

        {/* Comparison Displays */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Original Ingested Text */}
          <div className="bg-[#FAF8F5] border border-[#DFD8CD] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-[#7A7067] uppercase font-mono tracking-wider font-semibold">
              Original Ingested Input
            </span>
            <div className="text-xs font-mono text-[#2C2623] mt-1.5 break-all line-clamp-3">
              {originalText}
            </div>
            <div className="mt-2 text-[10px] text-[#7A7067] font-mono">
              Raw bytes before deobfuscation
            </div>
          </div>

          {/* Deobfuscated & Cleaned Text */}
          <div className="bg-white border border-[#C5A880]/50 rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#2C2623] uppercase font-mono tracking-wider font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#C5A880]" />
                <span>Deobfuscated & Cleaned Text</span>
              </span>
              {isAvailable && (
                <button
                  onClick={handleCopyCleaned}
                  className="text-[#7A7067] hover:text-[#2C2623] transition-colors p-1 rounded"
                  title="Copy normalized text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#24593E]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <div className="text-xs font-mono text-[#2C2623] mt-1.5 break-all line-clamp-3 font-semibold">
              {cleanedText}
            </div>
            <div className="mt-2 text-[10px] text-[#7A7067] font-mono">
              Normalized sequence sent to inference engines
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
