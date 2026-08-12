"use client";

import { CheckCircle2, Info } from "lucide-react";

export interface DecisionCardProps {
  primaryAction?: string;
  expectedOutcome?: string;
  confidence?: number;
  evidence?: string[];
  ruleChecksPassed?: number;
  totalRuleChecks?: number;
  ruleList?: string[];
  alternatives?: { action: string; outcome: string; confidence: number }[];
  radioText?: string;
}

export function DecisionCard({
  primaryAction = "ATTACK_NOW",
  expectedOutcome = "Deploy MGU-K override in DRS zone for position gain",
  confidence = 0.85,
  evidence = [],
  ruleChecksPassed = 6,
  totalRuleChecks = 6,
  ruleList = [],
  alternatives = [],
  radioText = ""
}: DecisionCardProps) {
  return (
    <div className="bg-[#16191E] border border-[#262B33] rounded-lg p-6 flex flex-col gap-6 w-full shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Primary Recommendation</h2>
          <div className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">{primaryAction}</div>
          <p className="text-[#64748B] mt-1 text-sm">{expectedOutcome}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-3xl font-black text-[#2563EB]">{(confidence * 100).toFixed(0)}%</div>
          <div className="text-xs text-[#94A3B8] uppercase tracking-wider">Confidence</div>
        </div>
      </div>
      
      {/* Rule Checks Guardrail Box */}
      <div className="bg-[#0F1115] rounded-md p-4 border border-[#262B33]">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="text-[#10B981] w-5 h-5" />
          <span className="font-semibold text-sm text-[#10B981]">{ruleChecksPassed}/{totalRuleChecks} FIA 2026 Guardrails Passed</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(ruleList || []).map((rule, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-[#94A3B8]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence List */}
      <div>
        <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Evidence & Signals</h3>
        <ul className="space-y-2">
          {(evidence || []).map((ev, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-[#F8FAFC]">
              <Info className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
              <span>{ev}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* AI Radio Box */}
      {radioText && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-md p-4 shadow-inner">
          <h3 className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest mb-1">🎙️ AI Pit-Wall Radio (Groq/Gemini)</h3>
          <p className="text-sm text-[#F8FAFC] italic font-semibold leading-relaxed">
            "{radioText}"
          </p>
        </div>
      )}

      {/* Alternative Recommendations */}
      <div className="border-t border-[#262B33] pt-4">
        <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Alternative Strategies</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(alternatives || []).map((alt, idx) => (
            <div key={idx} className="bg-[#0F1115] p-3 rounded border border-[#262B33] flex flex-col justify-between">
              <div>
                <div className="text-sm font-bold text-[#F8FAFC]">{alt.action}</div>
                <div className="text-xs text-[#64748B] mb-2">{alt.outcome}</div>
              </div>
              <div className="text-xs text-[#2563EB] font-medium font-mono">{(alt.confidence * 100).toFixed(0)}% Confidence</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
