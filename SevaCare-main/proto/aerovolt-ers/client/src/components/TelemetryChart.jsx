import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function TelemetryChart({ data }) {
    return (
        <div className="bg-f1-panel p-4 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Live ERS Energy Telemetry (SoC % vs. Recovery MJ)</h2>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                        <XAxis dataKey="lap" stroke="#a0aec0" label={{ value: 'Lap', position: 'insideBottom', offset: -5 }} />
                        <YAxis yAxisId="left" stroke="#00d2be" label={{ value: 'SoC (%)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#e10600" label={{ value: 'Recovery (MJ)', angle: 90, position: 'insideRight' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a202c', borderColor: '#4a5568' }} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="soc" stroke="#00d2be" name="Battery SoC (%)" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="recovery" stroke="#e10600" name="MGU-K Recovery (MJ)" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
