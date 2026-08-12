import React, { useState } from 'react';
import { Play, Pause, Wind, Zap, Gauge, Eye, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { cockpitAudio } from '../utils/audioEffects';

export default function LiveTelemetry({
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    currentLap,
    setCurrentLap,
    telemetryData,
    deceptionRisk,
    activeAeroState,
    isDeratingActive
}) {
    const [viewMode, setViewMode] = useState('PITWALL'); // 'PITWALL' | 'COCKPIT_HUD'

    const currentTelemetry = telemetryData[currentLap - 1] || { speed: 310, power: 350, soc: 75, temp: 42.0 };
    const handlePlayPause = () => {
        cockpitAudio.playClick();
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="space-y-6">
            {/* Minimal Control & Scrubber Bar */}
            <div className="bg-[#16191E] border border-[#262B33] p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePlayPause}
                        className={`px-6 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-xs transition-all shadow-md ${isPlaying ? 'bg-[#F59E0B] text-black hover:bg-[#D97706]' : 'bg-[#E10600] text-white hover:bg-[#B91C1C]'}`}>
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                        {isPlaying ? 'Pause' : 'Play Live'}
                    </button>

                    <div className="flex bg-[#0F1115] border border-[#262B33] rounded-xl p-1">
                        {[1, 2, 5].map(spd => (
                            <button
                                key={spd}
                                onClick={() => { cockpitAudio.playClick(); setPlaybackSpeed(spd); }}
                                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition ${playbackSpeed === spd ? 'bg-[#1E293B] text-white font-bold' : 'text-[#64748B] hover:text-[#CBD5E1]'}`}>
                                {spd}x
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-[#0F1115] border border-[#262B33] rounded-xl p-1">
                        <button
                            onClick={() => { cockpitAudio.playClick(); setViewMode('PITWALL'); }}
                            className={`px-4 py-1.5 text-xs font-medium rounded-lg flex items-center gap-2 transition ${viewMode === 'PITWALL' ? 'bg-[#1E293B] text-white font-bold' : 'text-[#64748B] hover:text-[#CBD5E1]'}`}>
                            <Gauge className="w-3.5 h-3.5" /> Pit Wall
                        </button>
                        <button
                            onClick={() => { cockpitAudio.playClick(); setViewMode('COCKPIT_HUD'); }}
                            className={`px-4 py-1.5 text-xs font-medium rounded-lg flex items-center gap-2 transition ${viewMode === 'COCKPIT_HUD' ? 'bg-[#10B981]/20 text-[#10B981] font-bold border border-[#10B981]/30' : 'text-[#64748B] hover:text-[#CBD5E1]'}`}>
                            <Eye className="w-3.5 h-3.5" /> HUD View
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-1/3">
                    <span className="text-xs font-mono text-[#94A3B8] min-w-20">Lap {currentLap} / 50</span>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={currentLap}
                        onChange={(e) => { cockpitAudio.playClick(); setCurrentLap(Number(e.target.value)); }}
                        className="w-full h-1.5 bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#E10600]"
                    />
                </div>
            </div>

            {/* Subtle Alert Notification */}
            {deceptionRisk && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 p-4 rounded-xl flex items-center gap-3 text-xs text-[#FCA5A5]">
                    <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                    <span><strong>Counter-Harvest Detected:</strong> Rival throttle &lt; 15% under Straight Aero. Exercise caution.</span>
                </div>
            )}

            {/* Main Display: Cockpit HUD or Telemetry Canvas */}
            {viewMode === 'COCKPIT_HUD' ? (
                <div className="bg-[#16191E] border border-[#262B33] p-10 rounded-2xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        {/* Speed */}
                        <div className="bg-[#0F1115] p-8 rounded-xl border border-[#262B33]">
                            <span className="text-xs uppercase font-mono tracking-wider text-[#64748B]">Velocity</span>
                            <div className="text-5xl font-black font-mono text-white mt-3">
                                {currentTelemetry.speed} <span className="text-sm font-normal text-[#94A3B8]">km/h</span>
                            </div>
                        </div>

                        {/* SoC */}
                        <div className="bg-[#0F1115] p-8 rounded-xl border border-[#262B33]">
                            <span className="text-xs uppercase font-mono tracking-wider text-[#64748B]">Battery Buffer</span>
                            <div className={`text-5xl font-black font-mono mt-3 ${currentTelemetry.soc > 60 ? 'text-[#10B981]' : currentTelemetry.soc > 30 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>
                                {currentTelemetry.soc}%
                            </div>
                        </div>

                        {/* MGU-K */}
                        <div className="bg-[#0F1115] p-8 rounded-xl border border-[#262B33]">
                            <span className="text-xs uppercase font-mono tracking-wider text-[#64748B]">MGU-K Output</span>
                            <div className="text-5xl font-black font-mono text-[#EF4444] mt-3">
                                {currentTelemetry.power} <span className="text-sm font-normal text-[#94A3B8]">kW</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Minimal Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#16191E] p-5 rounded-xl border border-[#262B33] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Wind className="w-5 h-5 text-[#3B82F6]" />
                                <div>
                                    <span className="text-[11px] uppercase font-mono text-[#94A3B8] block">Aero Mode</span>
                                    <h4 className="text-sm font-semibold text-[#F8FAFC] mt-0.5">{activeAeroState === 'STRAIGHT' ? 'Straight (Low Drag)' : 'Corner (High Drag)'}</h4>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#16191E] p-5 rounded-xl border border-[#262B33] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Zap className={`w-5 h-5 ${isDeratingActive ? 'text-[#F59E0B]' : 'text-[#10B981]'}`} />
                                <div>
                                    <span className="text-[11px] uppercase font-mono text-[#94A3B8] block">Derating Engine</span>
                                    <h4 className="text-sm font-semibold text-[#F8FAFC] mt-0.5">{isDeratingActive ? 'Active Derate (-20kW/kmh)' : 'Full Power (350 kW)'}</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hero Telemetry Chart Canvas */}
                    <div className="bg-[#16191E] border border-[#262B33] p-8 rounded-2xl shadow-xl">
                        <h3 className="text-sm font-semibold text-[#E2E8F0] mb-8">Telemetry Traces</h3>
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={telemetryData.slice(0, currentLap)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                                    <XAxis dataKey="lap" stroke="#64748B" tickLine={false} axisLine={false} tickMargin={10} />
                                    <YAxis yAxisId="left" stroke="#10B981" domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={10} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#EF4444" domain={[0, 360]} tickLine={false} axisLine={false} tickMargin={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0F1115', borderColor: '#262B33', borderRadius: '12px', color: '#F8FAFC' }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="soc" stroke="#10B981" name="SoC (%)" strokeWidth={2.5} dot={false} />
                                    <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#F59E0B" name="Temp (°C)" strokeWidth={1.5} dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="speed" stroke="#3B82F6" name="Speed (km/h)" strokeWidth={2.5} dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="power" stroke="#EF4444" name="Power (kW)" strokeWidth={2.5} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
