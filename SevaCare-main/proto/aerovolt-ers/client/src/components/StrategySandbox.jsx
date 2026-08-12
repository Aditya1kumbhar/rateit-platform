import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function StrategySandbox() {
    const [targetSocBuffer, setTargetSocBuffer] = useState(25);
    const [liftAndCoastAggression, setLiftAndCoastAggression] = useState(15);
    const [driverMode, setDriverMode] = useState('ATTACK_PUSH');

    const [sandboxResults, setSandboxResults] = useState({
        predictedLapDelta: -0.37,
        thermalHealthScore: 83.5,
        stintDegradationCurve: []
    });

    useEffect(() => {
        fetch('http://localhost:5000/api/sandbox/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetSocBuffer, liftAndCoastAggression, driverMode })
        })
        .then(res => res.json())
        .then(data => {
            if (data.stintDegradationCurve) {
                setSandboxResults(data);
            }
        })
        .catch(err => console.warn("Sandbox simulation fetch error", err));
    }, [targetSocBuffer, liftAndCoastAggression, driverMode]);

    return (
        <div className="space-y-6">
            <div className="bg-[#16191E] border border-[#262B33] p-8 rounded-2xl shadow-md">
                <h2 className="text-xl font-bold text-[#F8FAFC]">Strategy Sandbox</h2>
                <p className="text-[#94A3B8] text-sm mt-1.5">
                    Simulate stint parameters dynamically in real-time.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls */}
                <div className="bg-[#16191E] p-8 rounded-2xl border border-[#262B33] space-y-8 shadow-md">
                    <div>
                        <label className="text-[11px] uppercase font-mono tracking-wider text-[#64748B] block mb-3">Driver Mode</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'ATTACK_PUSH', label: 'Attack' },
                                { id: 'SUSTAINABLE_PACE', label: 'Pace' },
                                { id: 'DEFEND_POSITION', label: 'Defend' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setDriverMode(item.id)}
                                    className={`py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${driverMode === item.id ? 'bg-[#2563EB] text-white shadow-md shadow-blue-900/20' : 'bg-[#0F1115] border border-[#262B33] text-[#94A3B8] hover:text-white'}`}>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-3">
                            <span className="text-[#E2E8F0] font-medium">Target SoC Buffer</span>
                            <span className="font-mono text-[#10B981] font-bold">{targetSocBuffer}%</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="90"
                            value={targetSocBuffer}
                            onChange={(e) => setTargetSocBuffer(Number(e.target.value))}
                            className="w-full h-1.5 bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-3">
                            <span className="text-[#E2E8F0] font-medium">Lift & Coast</span>
                            <span className="font-mono text-[#F59E0B] font-bold">{liftAndCoastAggression}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="30"
                            value={liftAndCoastAggression}
                            onChange={(e) => setLiftAndCoastAggression(Number(e.target.value))}
                            className="w-full h-1.5 bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
                        />
                    </div>
                </div>

                {/* Outputs & Chart */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-[#16191E] p-6 rounded-2xl border border-[#262B33] shadow-md">
                            <span className="text-xs text-[#94A3B8] font-mono uppercase tracking-wider block">Predicted Lap Delta</span>
                            <div className="text-4xl font-black font-mono text-[#F8FAFC] mt-2">
                                {sandboxResults.predictedLapDelta < 0 ? '' : '+'}{sandboxResults.predictedLapDelta}<span className="text-lg font-sans text-[#64748B] ml-1">s</span>
                            </div>
                        </div>

                        <div className="bg-[#16191E] p-6 rounded-2xl border border-[#262B33] shadow-md">
                            <span className="text-xs text-[#94A3B8] font-mono uppercase tracking-wider block">Thermal Longevity</span>
                            <div className="text-4xl font-black font-mono text-[#10B981] mt-2">
                                {sandboxResults.thermalHealthScore}<span className="text-lg font-sans text-[#64748B] ml-1">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#16191E] border border-[#262B33] p-8 rounded-2xl shadow-md">
                        <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] mb-6">Simulated Stint Degradation</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sandboxResults.stintDegradationCurve}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                                    <XAxis dataKey="lap" stroke="#64748B" tickLine={false} axisLine={false} tickMargin={10} />
                                    <YAxis stroke="#10B981" domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0F1115', borderColor: '#262B33', borderRadius: '12px', color: '#F8FAFC' }} />
                                    <Line type="monotone" dataKey="soc" stroke="#10B981" strokeWidth={2.5} dot={false} name="SoC (%)" />
                                    <Line type="monotone" dataKey="temp" stroke="#F59E0B" strokeWidth={2} dot={false} name="Temp (°C)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
