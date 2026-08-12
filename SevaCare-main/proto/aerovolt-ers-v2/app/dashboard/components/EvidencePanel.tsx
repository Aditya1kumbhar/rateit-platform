"use client";

import { Activity, Zap, Thermometer, AlertTriangle } from "lucide-react";

interface EvidencePanelProps {
  evidenceList?: { title: string; subtitle: string; type: "critical" | "warning" | "nominal" }[];
}

export function EvidencePanel({ evidenceList = [] }: EvidencePanelProps) {
  const safeList = evidenceList.length > 0 ? evidenceList : [
    { title: "Rival Telemetry Profile: Nominal", subtitle: "Standard speed & sector time progression", type: "nominal" as const },
    { title: "Battery SoC Budget: 68%", subtitle: "Optimal operating window for MGU-K deploy", type: "nominal" as const }
  ];

  return (
    <div className="bg-[#16191E] border border-[#262B33] rounded-lg p-6 w-full">
      <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">Telemetry Evidence & Signals</h2>
      <div className="flex flex-col gap-3">
        {safeList.map((item, idx) => {
          const isWarning = item.type === "warning";
          const isCritical = item.type === "critical";

          return (
            <div 
              key={idx} 
              className={`flex items-start gap-3 p-3 rounded-md bg-[#0F1115] border ${
                isCritical 
                  ? 'border-[#EF4444]/40 bg-[#EF4444]/5' 
                  : isWarning 
                  ? 'border-[#F59E0B]/40 bg-[#F59E0B]/5' 
                  : 'border-[#262B33]'
              }`}
            >
              {isCritical ? (
                <AlertTriangle className="w-5 h-5 text-[#EF4444] mt-0.5 shrink-0" />
              ) : isWarning ? (
                <Activity className="w-5 h-5 text-[#F59E0B] mt-0.5 shrink-0" />
              ) : (
                <Zap className="w-5 h-5 text-[#2563EB] mt-0.5 shrink-0" />
              )}
              <div>
                <div className="text-sm font-semibold text-[#F8FAFC]">{item.title}</div>
                <div className="text-xs text-[#94A3B8] mt-0.5">{item.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
