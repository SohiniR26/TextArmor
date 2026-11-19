import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Shield, Clock, Cpu } from 'lucide-react';

export default function VerdictBanner({ result, latency, isAnalyzing }) {
  if (!result) {
    return (
      <div className="bg-white border border-[#DFD8CD] shadow-sm rounded-2xl p-6 transition-all duration-300">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#DFD8CD] flex items-center justify-center text-[#C5A880] shadow-sm">
              <Shield className="w-5 h-5 text-[#C5A880]" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#7A7067]">
                Policy Gating Verdict
              </span>
              <div className="text-2xl font-bold font-serif text-[#2C2623] mt-0.5">
                Awaiting Ingestion
              </div>
              <p className="text-xs text-[#7A7067] mt-1.5 leading-relaxed">
                Submit text via the ingestion console to evaluate automated moderation policy and age restriction classifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs px-2.5 py-1 bg-[#FAF8F5] border border-[#DFD8CD] text-[#7A7067] rounded-lg font-mono">
              -- ms
            </span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#DFD8CD] flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-[#FAF8F5] border border-[#DFD8CD] rounded-md text-[#7A7067] font-mono inline-flex items-center gap-1.5 shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-[#C5A880]" />
            Engine: Standby
          </span>
        </div>
      </div>
    );
  }

  const decision = result.moderation_decision;
  const ageRating = result.age_rating;
  const engineUsed = result.inference_engine_used;

  // Refined, light organic tones (high readability, zero dark navy)
  let config = {
    badge: 'ALLOW',
    titleColor: 'text-[#24593E]',
    bgColor: 'bg-[#EBF4EE]',
    borderColor: 'border-[#C2DFCE]',
    desc: 'Content verified compliant with enterprise safety protocols across all audience tiers.',
    icon: <ShieldCheck className="w-6 h-6 text-[#24593E]" />,
    iconBg: 'bg-white border-[#C2DFCE]',
    statusBadgeColor: 'bg-white text-[#24593E] border-[#C2DFCE] shadow-sm',
  };

  if (decision === 'RESTRICT') {
    config = {
      badge: 'RESTRICT',
      titleColor: 'text-[#8C3535]',
      bgColor: 'bg-[#FAEAEA]',
      borderColor: 'border-[#E8C2C2]',
      desc: 'High risk detected. Content contains abusive language, acute toxicity, or severe policy violations.',
      icon: <ShieldAlert className="w-6 h-6 text-[#8C3535]" />,
      iconBg: 'bg-white border-[#E8C2C2]',
      statusBadgeColor: 'bg-white text-[#8C3535] border-[#E8C2C2] shadow-sm',
    };
  } else if (decision === 'FLAG_FOR_REVIEW') {
    config = {
      badge: 'FLAG FOR REVIEW',
      titleColor: 'text-[#8A5D19]',
      bgColor: 'bg-[#FAF3E3]',
      borderColor: 'border-[#EBD6B0]',
      desc: 'Moderate risk or adversarial evasion tactics detected. Human-in-the-loop review recommended.',
      icon: <AlertTriangle className="w-6 h-6 text-[#8A5D19]" />,
      iconBg: 'bg-white border-[#EBD6B0]',
      statusBadgeColor: 'bg-white text-[#8A5D19] border-[#EBD6B0] shadow-sm',
    };
  }

  return (
    <div className={`rounded-2xl p-6 transition-all duration-300 border shadow-sm ${config.bgColor} ${config.borderColor}`}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
        <div className="flex items-start space-x-3.5">
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${config.iconBg}`}>
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#7A7067]">
                Policy Gating Verdict
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${config.statusBadgeColor}`}>
                {config.badge}
              </span>
            </div>

            <div className={`text-2xl font-bold font-serif mt-1 ${config.titleColor}`}>
              {ageRating}
            </div>
            <p className="text-xs text-[#2C2623]/90 mt-1.5 leading-relaxed max-w-xl font-sans">
              {config.desc}
            </p>
          </div>
        </div>

        {/* Telemetry latency */}
        <div className="flex sm:flex-col items-end gap-1.5 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#DFD8CD] text-[#2C2623] rounded-lg font-mono text-xs shadow-sm">
            <Clock className="w-3 h-3 text-[#C5A880]" />
            <span>{latency ? `${latency} ms` : '< 1 ms'}</span>
          </div>
          <span className="text-[10px] text-[#7A7067] font-mono hidden sm:block">
            Inference Latency
          </span>
        </div>
      </div>

      {/* Engine Telemetry */}
      <div className="mt-5 pt-4 border-t border-[#DFD8CD]/70 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-xs px-2.5 py-1 bg-white border border-[#DFD8CD] rounded-md font-mono text-[#2C2623] shadow-sm">
          <Cpu className="w-3.5 h-3.5 text-[#C5A880]" />
          {engineUsed === 'local_bilstm' ? (
            <span className="text-[#24593E] font-semibold">
              Engine: Local BiLSTM Dual-Core Active
            </span>
          ) : (
            <span className="text-[#8A5D19] font-semibold">
              Engine: Groq LLM API Fallback Cascade (Llama 3.1)
            </span>
          )}
        </div>

        <div className="text-[11px] font-mono text-[#7A7067]">
          Screened at {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
