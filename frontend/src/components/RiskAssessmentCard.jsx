import React from 'react';
import { Gauge } from 'lucide-react';

export default function RiskAssessmentCard({ result }) {
  const score = result ? result.multi_dimensional_risk_score : null;
  const isAvailable = score !== null && score !== undefined;

  const displayScore = isAvailable ? score.toFixed(1) : '--';
  const scoreWidth = isAvailable ? Math.min(Math.max(score, 0), 100) : 0;

  // Determine threat level & styling in light organic tones
  let statusText = 'Awaiting Ingestion';
  let scoreColor = 'text-[#7A7067]';
  let barColor = 'bg-[#DFD8CD]';
  let badgeColor = 'bg-[#FAF8F5] border-[#DFD8CD] text-[#7A7067]';

  if (isAvailable) {
    if (score >= 75.0) {
      statusText = 'Critical Risk · Policy Restricted';
      scoreColor = 'text-[#8C3535]';
      barColor = 'bg-[#8C3535]';
      badgeColor = 'bg-[#FAEAEA] border-[#E8C2C2] text-[#8C3535] font-bold';
    } else if (score >= 40.0) {
      statusText = 'Guarded Risk · Review Required';
      scoreColor = 'text-[#8A5D19]';
      barColor = 'bg-[#C5A880]';
      badgeColor = 'bg-[#FAF3E3] border-[#EBD6B0] text-[#8A5D19] font-bold';
    } else {
      statusText = 'Safe Baseline · Unrestricted';
      scoreColor = 'text-[#24593E]';
      barColor = 'bg-[#24593E]';
      badgeColor = 'bg-[#EBF4EE] border-[#C2DFCE] text-[#24593E] font-bold';
    }
  }

  // Component contributions breakdown
  const spamProb = result?.predictions?.spam_probability ?? 0;
  const toxProb = result?.predictions?.toxicity_probability ?? 0;
  const evasionPenalty = result?.preprocessed_analysis?.evasion_detected ? 15.0 : 0.0;
  const spamContrib = (spamProb * 35.0).toFixed(1);
  const toxContrib = (toxProb * 50.0).toFixed(1);

  return (
    <div className="bg-white border border-[#DFD8CD] shadow-sm rounded-2xl p-6 transition-all duration-300">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-[#C5A880]" />
          <h3 className="text-xs font-bold tracking-wider text-[#2C2623] uppercase font-mono">
            Composite Threat Assessment
          </h3>
        </div>
        <span className="text-[11px] text-[#7A7067] font-mono">
          Unified Threat Index (0–100)
        </span>
      </div>

      {/* Main Score & Classification */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div className="flex items-baseline space-x-2">
          <span className={`text-5xl font-black font-mono tracking-tight transition-colors duration-500 ${scoreColor}`}>
            {displayScore}
          </span>
          <span className="text-sm font-mono text-[#7A7067]">/ 100.0</span>
        </div>

        <span className={`text-xs px-3 py-1 rounded-full border font-mono font-medium self-start sm:self-auto transition-colors duration-300 shadow-sm ${badgeColor}`}>
          {statusText}
        </span>
      </div>

      {/* Unified Threat Index Meter Track */}
      <div className="space-y-2 mb-4">
        <div className="w-full bg-[#EFECE6] h-3 rounded-full overflow-hidden p-0.5 border border-[#DFD8CD]">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${scoreWidth}%` }}
          />
        </div>

        {/* Milestone Threshold Indicators */}
        <div className="flex justify-between text-[10px] text-[#7A7067] font-mono px-0.5">
          <div className="flex flex-col items-start">
            <span className="text-[#2C2623] font-semibold">0.0</span>
            <span>Safe Baseline</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[#8A5D19] font-semibold">40.0</span>
            <span>Review Threshold</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[#8C3535] font-semibold">75.0</span>
            <span>Restricted Limit</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[#2C2623] font-semibold">100.0</span>
            <span>Maximum</span>
          </div>
        </div>
      </div>

      {/* Mathematical Contribution Decomposition */}
      {isAvailable && (
        <div className="mt-4 pt-3.5 border-t border-[#DFD8CD] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DFD8CD]">
            <div className="text-[10px] text-[#7A7067] uppercase">Spam Contribution</div>
            <div className="text-[#2C2623] font-semibold mt-0.5">+{spamContrib} <span className="text-[10px] text-[#7A7067] font-normal">(35% wgt)</span></div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DFD8CD]">
            <div className="text-[10px] text-[#7A7067] uppercase">Toxicity Contribution</div>
            <div className="text-[#2C2623] font-semibold mt-0.5">+{toxContrib} <span className="text-[10px] text-[#7A7067] font-normal">(50% wgt)</span></div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DFD8CD]">
            <div className="text-[10px] text-[#7A7067] uppercase">Evasion Penalty</div>
            <div className={`font-semibold mt-0.5 ${evasionPenalty > 0 ? 'text-[#8A5D19]' : 'text-[#7A7067]'}`}>
              +{evasionPenalty.toFixed(1)} <span className="text-[10px] text-[#7A7067] font-normal">{evasionPenalty > 0 ? '(Bypass Flagged)' : '(Clean)'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
