"use client";

import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface EnergyEnvelopeProps {
  currentLap: number;
  activeScenario: string;
}

const TOOLTIP_STYLE = { backgroundColor: '#0F1115', borderColor: '#262B33', color: '#F8FAFC', borderRadius: '6px' };
const ITEM_STYLE = { color: '#F8FAFC' };
const CHART_MARGIN = { top: 10, right: 10, left: -20, bottom: 0 };
const YAXIS_DOMAIN: [number, number] = [0, 100];
const REF_LABEL_30 = { value: 'SoC Floor (30%)', fill: '#EF4444', fontSize: 10 };

export function EnergyEnvelope({ currentLap, activeScenario }: EnergyEnvelopeProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate lap SoC data anchored around current lap
  const data = useMemo(() => {
    return Array.from({ length: 51 }).map((_, i) => {
      const lapNum = i + 1;
      let baseSoC = 85 - (i * 0.9);
      if (activeScenario === 'attack') baseSoC -= 12;
      if (activeScenario === 'harvest') baseSoC += 15;
      if (activeScenario === 'sc') baseSoC = Math.min(95, baseSoC + 20);
      
      // Add realistic variation
      const soc = Math.max(10, Math.min(98, baseSoC + Math.sin(i * 0.8) * 8));
      return {
        lap: lapNum,
        soc: Number(soc.toFixed(1)),
        minEnvelope: 20,
        maxEnvelope: 85
      };
    });
  }, [activeScenario]);

  const currentLapLabel = useMemo(() => ({
    value: `L${currentLap}`, fill: '#2563EB', fontSize: 10
  }), [currentLap]);

  return (
    <div className="bg-[#16191E] border border-[#262B33] rounded-lg p-6 w-full h-[300px] flex flex-col justify-between">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Energy Envelope Projection (SoC Budget)</h2>
        <span className="text-xs text-[#64748B] font-mono">Lap {currentLap} Highlighted</span>
      </div>
      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={220}>
          <AreaChart data={data} margin={CHART_MARGIN}>
            <defs>
              <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262B33" vertical={false} />
            <XAxis dataKey="lap" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} domain={YAXIS_DOMAIN} />
            <Tooltip 
              contentStyle={TOOLTIP_STYLE}
              itemStyle={ITEM_STYLE}
            />
            <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="3 3" label={REF_LABEL_30} />
            <ReferenceLine x={currentLap} stroke="#2563EB" strokeWidth={2} label={currentLapLabel} />
            <Area type="monotone" dataKey="soc" stroke="#10B981" fillOpacity={1} fill="url(#socGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}




