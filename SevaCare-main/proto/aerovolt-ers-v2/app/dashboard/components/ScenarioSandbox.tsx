"use client";

import { Shield, Zap, Battery, AlertCircle, CloudRain } from "lucide-react";

interface ScenarioSandboxProps {
  activeScenario: string;
  setActiveScenario: (scenario: string) => void;
}

const scenarios = [
  { id: "attack", name: "Attack", icon: Zap, delta: "-0.4s lap time", soc: "-12% SoC" },
  { id: "defend", name: "Defend", icon: Shield, delta: "+0.1s lap time", soc: "+4% SoC" },
  { id: "harvest", name: "Harvest", icon: Battery, delta: "+0.8s lap time", soc: "+18% SoC" },
  { id: "sc", name: "Safety Car", icon: AlertCircle, delta: "Pace Car Delta", soc: "+25% SoC" },
  { id: "rain", name: "Rain", icon: CloudRain, delta: "+4.2s wet lap", soc: "Low Thermal" },
];

export function ScenarioSandbox({ activeScenario, setActiveScenario }: ScenarioSandboxProps) {
  const current = scenarios.find(s => s.id === activeScenario) || scenarios[0];

  return (
    <div className="bg-[#16191E] border border-[#262B33] rounded-lg p-6 w-full">
      <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">What-If Scenario Sandbox</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        {scenarios.map(s => (
          <button 
            key={s.id}
            onClick={() => setActiveScenario(s.id)}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-pointer select-none active:scale-95 ${
              activeScenario === s.id 
                ? 'bg-[#2563EB]/20 border-[#2563EB] text-[#2563EB] shadow-md shadow-blue-900/20' 
                : 'bg-[#0F1115] border-[#262B33] text-[#64748B] hover:border-[#64748B] hover:text-[#F8FAFC]'
            }`}
          >
            <s.icon className="w-5 h-5 mb-1.5" />
            <span className="text-xs font-semibold">{s.name}</span>
          </button>
        ))}
      </div>
      
      <div className="p-3 bg-[#0F1115] border border-[#262B33] rounded-md text-xs space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[#94A3B8]">Selected Profile:</span>
          <span className="font-bold text-[#F8FAFC] uppercase">{current.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#94A3B8]">Impact Delta:</span>
          <span className={activeScenario === 'attack' ? 'text-[#10B981] font-semibold' : 'text-[#F59E0B] font-semibold'}>
            {current.delta}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#94A3B8]">SoC Impact:</span>
          <span className="text-[#2563EB] font-semibold">{current.soc}</span>
        </div>
      </div>
    </div>
  );
}
