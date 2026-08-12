"use client";

import { useMemo, useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface BeliefPanelProps {
  beliefData?: { name: string; prob: number }[];
  isTrap?: boolean;
}

const TOOLTIP_STYLE = { backgroundColor: '#0F1115', borderColor: '#262B33', color: '#F8FAFC', borderRadius: '6px' };
const CURSOR_STYLE = { fill: '#262B33' };
const CHART_MARGIN = { top: 0, right: 10, left: 10, bottom: 0 };
const XAXIS_DOMAIN: [number, number] = [0, 1];
const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];
const TOOLTIP_FORMATTER = (val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Probability'];

const DEFAULT_DATA = [
  { name: "NORMAL", prob: 0.65 },
  { name: "CONSERVE", prob: 0.20 },
  { name: "PUSH", prob: 0.10 },
  { name: "TRAP_DEFEND", prob: 0.05 }
];

export function BeliefPanel({ beliefData, isTrap = false }: BeliefPanelProps) {

  const safeData = useMemo(() => {
    return beliefData && beliefData.length > 0 ? beliefData : DEFAULT_DATA;
  }, [beliefData]);

  return (
    <div className="bg-[#16191E] border border-[#262B33] rounded-lg p-6 w-full h-[250px] flex flex-col justify-between">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Opponent HMM Belief State</h2>
          {isTrap && (
            <span className="text-[10px] font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 px-2 py-0.5 rounded animate-pulse">
              TRAP DETECTED
            </span>
          )}
        </div>
        <span className="text-xs bg-[#0F1115] px-2 py-1 rounded text-[#94A3B8] border border-[#262B33]">40-State HMM</span>
      </div>

      <div className="w-full h-[170px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={170}>
          <BarChart data={safeData} margin={CHART_MARGIN} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#262B33" horizontal={true} vertical={false} />
            <XAxis type="number" domain={XAXIS_DOMAIN} hide />
            <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} axisLine={false} tickLine={false} width={100} />
            <Tooltip 
              contentStyle={TOOLTIP_STYLE}
              formatter={TOOLTIP_FORMATTER}
              cursor={CURSOR_STYLE}
            />
            <Bar dataKey="prob" radius={BAR_RADIUS}>
              {safeData.map((entry, index) => (
                <Cell 
                  key={`cell-${entry.name}-${index}`} 
                  fill={entry.name === 'TRAP_DEFEND' ? '#F59E0B' : entry.prob > 0.5 ? '#2563EB' : '#334155'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}




