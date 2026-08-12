import { useState, useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import { runHMMInference, validateRules } from "@/lib/api-client";

export function DiagnosticsTerminal({ currentLap, isPlaying }: { currentLap: number; isPlaying: boolean }) {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLap = useRef<number>(currentLap);

  useEffect(() => {
    if (currentLap !== prevLap.current) {
      prevLap.current = currentLap;
      
      const isTrap = [15, 28, 42].includes(currentLap);
      const featureVector = isTrap ? [0, 2, 3, 3] : [0, 0, 1, 0];

      // Async backend API calls
      const executeBackendPipeline = async () => {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        
        setLogs(prev => [...prev.slice(-30), `[${timestamp}] > POST /api/hmm -> Ingesting lap ${currentLap} features...`]);

        const hmmResult = await runHMMInference(featureVector);
        
        if (hmmResult.success && hmmResult.probabilities) {
          const domState = hmmResult.probabilities.dominantState;
          const conf = (hmmResult.probabilities.confidence * 100).toFixed(1);
          
          if (hmmResult.probabilities.deceptionRisk) {
            setLogs(prev => [
              ...prev.slice(-30),
              `> [HMM 200 OK] ⚠️ ANOMALY DETECTED: Opponent State -> ${domState} (${conf}%)`,
              `> [HMM] Deception Risk Flag: HIGH (Probability spike > 0.40)`
            ]);
          } else {
            setLogs(prev => [
              ...prev.slice(-30),
              `> [HMM 200 OK] Viterbi State -> ${domState} (${conf}%)`
            ]);
          }

          // Trigger Rules API
          const carState = {
            speed: 312,
            soc: 68,
            energyRecovered_MJ: 4.2,
            mgukEnergy_MJ: 3.1,
            thermalState_C: 94,
            leadingCarGap_s: 0.85
          };
          const recommendation = {
            action: isTrap ? "HOLD_ENERGY" : "ATTACK_NOW",
            isOverride: !isTrap,
            power_kW: isTrap ? 100 : 350
          };

          setLogs(prev => [...prev.slice(-30), `> POST /api/rules -> Validating FIA 2026 Engine Constraints...`]);
          const rulesResult = await validateRules(carState, recommendation);

          if (rulesResult.success && rulesResult.result) {
            const passedCount = rulesResult.result.checks.filter(c => c.passed).length;
            const totalCount = rulesResult.result.checks.length;
            setLogs(prev => [
              ...prev.slice(-30),
              `> [RULES 200 OK] Guardrails Check: ${passedCount}/${totalCount} Passed. Status: ${rulesResult.result?.passed ? 'VALIDATED' : 'VIOLATION'}`
            ]);
          } else {
            setLogs(prev => [...prev.slice(-30), `> [RULES ERROR] ${rulesResult.error || 'Validation failed'}`]);
          }

        } else {
          setLogs(prev => [...prev.slice(-30), `> [HMM ERROR] ${hmmResult.error || 'Inference call failed'}`]);
        }
      };

      executeBackendPipeline();
    }
  }, [currentLap]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#16191E] border border-[#262B33] rounded-lg flex flex-col h-[250px] overflow-hidden">
      <div className="bg-[#1E293B] px-4 py-2 border-b border-[#262B33] flex items-center gap-2 shrink-0">
        <Terminal className="w-4 h-4 text-pink-500" />
        <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">AI Diagnostics & Rules Engine (Live APIs)</h2>
      </div>
      <div ref={scrollRef} className="flex-1 p-4 font-mono text-xs text-[#94A3B8] overflow-y-auto leading-relaxed">
        {logs.length === 0 ? (
          <div className="text-[#64748B]">System initialized. Waiting for track events to trigger API pipeline...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`whitespace-pre mb-1 ${log.includes('⚠️') ? 'text-amber-500 font-semibold' : log.includes('[RULES 200 OK]') ? 'text-green-400' : log.includes('POST /api') ? 'text-cyan-400' : ''}`}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
