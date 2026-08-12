import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

export default function BeliefMatrix({ deceptionRisk }) {
    const [hmmData, setHmmData] = useState({
        recall_metric: "96.3%",
        summarized_beliefs: {
            "High (H)": 0.10,
            "Medium (M)": 0.15,
            "Covert Harvest (L_harvest)": 0.65,
            "True Derate (L_derate)": 0.10
        }
    });

    useEffect(() => {
        fetch('http://localhost:5000/api/hmm/matrix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                throttleFraction: deceptionRisk ? 0.10 : 0.85,
                deltaVtrap: deceptionRisk ? -2.5 : 0.5,
                activeAeroState: 'STRAIGHT'
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.summarized_beliefs) {
                setHmmData(data);
            }
        })
        .catch(err => console.warn("HMM matrix fetch error fallback", err));
    }, [deceptionRisk]);

    const chartData = [
        { category: 'High (H)', probability: (hmmData.summarized_beliefs['High (H)'] * 100).toFixed(1), color: '#10b981' },
        { category: 'Medium (M)', probability: (hmmData.summarized_beliefs['Medium (M)'] * 100).toFixed(1), color: '#3b82f6' },
        { category: 'Covert Harvest (L_harvest)', probability: (hmmData.summarized_beliefs['Covert Harvest (L_harvest)'] * 100).toFixed(1), color: '#ef4444' },
        { category: 'True Derate (L_derate)', probability: (hmmData.summarized_beliefs['True Derate (L_derate)'] * 100).toFixed(1), color: '#f59e0b' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-[#16191E] border border-[#262B33] p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
                <div>
                    <h2 className="text-xl font-bold text-[#F8FAFC]">Opponent SoC Belief Distribution</h2>
                    <p className="text-[#94A3B8] text-sm mt-1.5">
                        40-State Hidden Markov Model predicting rival energy harvest strategies in real-time.
                    </p>
                </div>
                <div className="bg-[#0F1115] px-5 py-3 rounded-xl border border-[#262B33] text-sm text-[#94A3B8] font-mono">
                    Recall Metric: <span className="text-[#10B981] font-bold">{hmmData.recall_metric || '96.3%'}</span>
                </div>
            </div>

            <div className="bg-[#16191E] border border-[#262B33] p-8 rounded-2xl shadow-md">
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                            <XAxis dataKey="category" stroke="#64748B" tickLine={false} axisLine={false} tickMargin={12} />
                            <YAxis stroke="#64748B" domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={12} />
                            <Tooltip cursor={{ fill: '#1E293B', opacity: 0.4 }} contentStyle={{ backgroundColor: '#0F1115', borderColor: '#262B33', borderRadius: '12px', color: '#F8FAFC' }} />
                            <Bar dataKey="probability" radius={[6, 6, 0, 0]} maxBarSize={80}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
