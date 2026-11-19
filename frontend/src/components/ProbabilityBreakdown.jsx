import React from 'react';
import { Mail, Flame, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProbabilityBreakdown({ result }) {
  const spamProb = result?.predictions?.spam_probability ?? null;
  const toxProb = result?.predictions?.toxicity_probability ?? null;

  const spamPct = spamProb !== null ? (spamProb * 100).toFixed(1) : null;
  const toxPct = toxProb !== null ? (toxProb * 100).toFixed(1) : null;

  const isSpamFlagged = spamProb !== null && spamProb >= 0.50;
  const isToxFlagged = toxProb !== null && toxProb >= 0.60;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Spam Probability Card */}
      <div className="bg-white border border-[#DFD8CD] shadow-sm rounded-2xl p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#DFD8CD] flex items-center justify-center shadow-sm">
              <Mail className="w-4 h-4 text-[#C5A880]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7067]">
                Dimension I
              </span>
              <h4 className="text-xs font-bold text-[#2C2623] uppercase tracking-wider">
                Spam Probability
              </h4>
            </div>
          </div>

          <span className="text-base font-mono font-bold text-[#2C2623]">
            {spamPct !== null ? `${spamPct}%` : '--%'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#EFECE6] h-2.5 rounded-full overflow-hidden mb-3 border border-[#DFD8CD]">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isSpamFlagged ? 'bg-[#C5A880]' : 'bg-[#C5A880]/50'
            }`}
            style={{ width: spamPct !== null ? `${Math.min(spamPct, 100)}%` : '0%' }}
          />
        </div>

        {/* Status & Threshold info */}
        <div className="flex justify-between items-center text-[11px] font-mono">
          <span className="text-[#7A7067]">Trigger: &gt; 0.50</span>
          {spamProb !== null ? (
            isSpamFlagged ? (
              <span className="inline-flex items-center gap-1 text-[#8A5D19] font-bold">
                <AlertCircle className="w-3 h-3" />
                <span>Spam Flagged</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#24593E] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Normal</span>
              </span>
            )
          ) : (
            <span className="text-[#7A7067]">Standby</span>
          )}
        </div>
      </div>

      {/* Toxicity Probability Card */}
      <div className="bg-white border border-[#DFD8CD] shadow-sm rounded-2xl p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#DFD8CD] flex items-center justify-center shadow-sm">
              <Flame className="w-4 h-4 text-[#8C3535]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7067]">
                Dimension II
              </span>
              <h4 className="text-xs font-bold text-[#2C2623] uppercase tracking-wider">
                Toxicity Probability
              </h4>
            </div>
          </div>

          <span className="text-base font-mono font-bold text-[#8C3535]">
            {toxPct !== null ? `${toxPct}%` : '--%'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#EFECE6] h-2.5 rounded-full overflow-hidden mb-3 border border-[#DFD8CD]">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isToxFlagged ? 'bg-[#8C3535]' : 'bg-[#8C3535]/40'
            }`}
            style={{ width: toxPct !== null ? `${Math.min(toxPct, 100)}%` : '0%' }}
          />
        </div>

        {/* Status & Threshold info */}
        <div className="flex justify-between items-center text-[11px] font-mono">
          <span className="text-[#7A7067]">Trigger: &gt; 0.60</span>
          {toxProb !== null ? (
            isToxFlagged ? (
              <span className="inline-flex items-center gap-1 text-[#8C3535] font-bold">
                <AlertCircle className="w-3 h-3" />
                <span>Toxicity Flagged</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#24593E] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Clean</span>
              </span>
            )
          ) : (
            <span className="text-[#7A7067]">Standby</span>
          )}
        </div>
      </div>
    </div>
  );
}
