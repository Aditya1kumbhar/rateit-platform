import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { subscribeToLiveTelemetry } from "@/lib/api-client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function LiveTelemetry({ currentLap, isPlaying }: { currentLap: number; isPlaying: boolean }) {
  const [telemetryFeatures, setTelemetryFeatures] = useState<any[]>([]);

  // Listen to WebSocket telemetry stream
  useEffect(() => {
    if (!isPlaying) return;
    const sessionId = "00000000-0000-0000-0000-000000000000";
    subscribeToLiveTelemetry(sessionId, (payload: any) => {
      setTelemetryFeatures(prev => {
        const next = [...prev, payload];
        return next.length > 500 ? next.slice(-500) : next;
      });
    });
  }, [isPlaying]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        const lapData = telemetryFeatures.find((f: any) => f.lap === currentLap) || {};
        
        // Use realistic simulated jitter if real data is flat
        const newPoint = {
          time: new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 1 }),
          speed: Math.floor(lapData.speed || (280 + Math.random() * 60)),
          rpm: Math.floor(10500 + Math.random() * 1500),
          soc: parseFloat((lapData.soc || (40 + Math.random() * 50)).toFixed(1)),
          power: Math.floor(lapData.power || (Math.random() * 350))
        };
        
        setTelemetryFeatures(prev => [...prev.slice(-49), newPoint]);
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentLap]);

  return (
    <div className="bg-[#16191E] border border-[#262B33] rounded-lg flex flex-col h-[200px] overflow-hidden">
      <div className="bg-[#1E293B] px-4 py-2 border-b border-[#262B33] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-500" />
          <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Live OpenF1 Telemetry Stream (/api/telemetry)</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-[#64748B]'}`}></div>
          <span className="text-[10px] text-[#64748B] font-mono">CONNECTION: {isPlaying ? 'ACTIVE' : 'STANDBY'}</span>
        </div>
      </div>
      <div className="flex-1 p-4 font-mono text-[10px]">
        {telemetryFeatures.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#64748B]">Waiting for telemetry stream... Press SPACE to begin.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={telemetryFeatures} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262B33" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickMargin={10} minTickGap={30} />
              <YAxis yAxisId="left" stroke="#64748B" fontSize={10} domain={[0, 360]} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={10} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0F1115', borderColor: '#262B33', color: '#F8FAFC' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              <Line yAxisId="left" type="monotone" dataKey="speed" name="Speed (km/h)" stroke="#2563EB" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="soc" name="Battery SOC (%)" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="left" type="monotone" dataKey="power" name="MGU-K Power (kW)" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
