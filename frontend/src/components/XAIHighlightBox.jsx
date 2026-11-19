import React, { useState } from 'react';
import { Eye, Info, Sparkles } from 'lucide-react';

export default function XAIHighlightBox({ result }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!result || !result.explainable_ai) {
    return (
      <div className="bg-white border border-[#DFD8CD] shadow-sm rounded-2xl p-6 transition-all duration-300">
        <div className="flex items-center space-x-2 mb-3">
          <Eye className="w-4 h-4 text-[#C5A880]" />
          <h3 className="text-xs font-bold text-[#2C2623] uppercase tracking-wider font-mono">
            Explainable AI (XAI) Token Attribution
          </h3>
        </div>
        <p className="text-xs text-[#7A7067] leading-relaxed">
          Submit text to inspect token-level feature attribution highlighting specific trigger words contributing to risk elevation.
        </p>
      </div>
    );
  }

  const { original_text, explainable_ai } = result;
  const { flagged_tokens = [], token_count = 0, primary_risk_driver = 'none', explanation_summary = '' } = explainable_ai;

  // Build a lookup map of normalized flagged tokens
  const tokenMap = new Map();
  flagged_tokens.forEach(t => {
    tokenMap.set(t.normalized.toLowerCase(), t);
    tokenMap.set(t.token.toLowerCase(), t);
  });

  // Tokenize original text preserving spaces and punctuation
  const rawParts = original_text.split(/(\s+|[.,!?;:()\[\]"'/]+)/);

  return (
    <div className="bg-white border border-[#DFD8CD] shadow-sm rounded-2xl p-6 transition-all duration-300 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-[#C5A880]" />
          <h3 className="text-xs font-bold text-[#2C2623] uppercase tracking-wider font-mono">
            Explainable AI (XAI) Token Attribution
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border uppercase bg-[#FAF8F5] border-[#DFD8CD] text-[#7A7067]">
            Driver: <span className="text-[#2C2623] font-bold">{primary_risk_driver}</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border uppercase bg-[#FAF8F5] border-[#DFD8CD] text-[#7A7067]">
            Flagged Tokens: <span className="text-[#2C2623] font-bold">{token_count}</span>
          </span>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#DFD8CD] flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
        <div className="text-xs text-[#2C2623]/90 leading-relaxed font-sans">
          {explanation_summary}
        </div>
      </div>

      {/* Visual Token Highlighting Canvas */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7067] mb-2 font-mono">
          Attributed Sentence View (Hover/Tap word for attribution rationale):
        </label>

        <div className="p-4 bg-[#FAF8F5] border border-[#DFD8CD] rounded-xl font-mono text-sm leading-loose break-words shadow-sm">
          {rawParts.map((part, index) => {
            const cleanKey = part.toLowerCase().replace(/[^a-zA-Z0-9$@]/g, '');
            const match = tokenMap.get(cleanKey);

            if (!match || !cleanKey) {
              return <span key={index} className="text-[#2C2623]">{part}</span>;
            }

            // Light organic highlight colors based on category
            let badgeStyle = "bg-[#FAEAEA] border-[#E8C2C2] text-[#8C3535]";
            let dotColor = "bg-[#8C3535]";
            if (match.category === 'spam') {
              badgeStyle = "bg-[#FAF3E3] border-[#EBD6B0] text-[#8A5D19]";
              dotColor = "bg-[#C5A880]";
            } else if (match.category === 'evasion') {
              badgeStyle = "bg-[#FAF3E3] border-[#EBD6B0] text-[#8A5D19]";
              dotColor = "bg-[#8A5D19]";
            }

            const isHovered = activeTooltip === index;

            return (
              <span
                key={index}
                className="relative inline-block cursor-pointer mx-0.5 group"
                onMouseEnter={() => setActiveTooltip(index)}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={() => setActiveTooltip(isHovered ? null : index)}
              >
                <span className={`px-1.5 py-0.5 rounded-md border font-bold transition-all duration-200 inline-flex items-center gap-1 shadow-sm ${badgeStyle} hover:brightness-95`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  {part}
                </span>

                {/* Tooltip Overlay */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white border border-[#DFD8CD] rounded-xl shadow-md z-50 text-left pointer-events-none animate-fadeIn font-sans">
                    <div className="flex justify-between items-center mb-1 pb-1 border-b border-[#DFD8CD]">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#2C2623]">
                        Token: {match.token}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold bg-[#FAF8F5] border border-[#DFD8CD] text-[#7A7067]">
                        {match.severity}
                      </span>
                    </div>

                    <div className="text-xs text-[#2C2623] font-semibold mt-1">
                      {match.reason}
                    </div>

                    <div className="mt-2 flex justify-between items-center text-[10px] font-mono text-[#7A7067] pt-1 border-t border-[#DFD8CD]/80">
                      <span>Category: <strong className="text-[#2C2623] capitalize">{match.category}</strong></span>
                      <span>Weight: <strong className="text-[#C5A880] font-bold">{(match.attribution_score * 100).toFixed(0)}%</strong></span>
                    </div>
                  </div>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Flagged Tokens Inventory Table */}
      {flagged_tokens.length > 0 && (
        <div className="pt-2">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7067] mb-2 font-mono">
            Trigger Lexicon Attribution Breakdown:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {flagged_tokens.map((token, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DFD8CD] flex items-start justify-between gap-2 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#2C2623] truncate">
                      "{token.token}"
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white border border-[#DFD8CD] font-mono text-[#7A7067]">
                      {token.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#7A7067] mt-0.5 truncate">
                    {token.reason}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-[#2C2623]">
                    {(token.attribution_score * 100).toFixed(0)}%
                  </span>
                  <div className="text-[9px] font-mono text-[#7A7067]">Attribution</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
