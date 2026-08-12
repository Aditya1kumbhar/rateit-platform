import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DeceptionAlert({ isRisk }) {
    if (!isRisk) return null;

    return (
        <div className="bg-red-900/40 border-2 border-red-600 animate-pulse text-red-200 p-4 rounded-xl flex items-center gap-3 shadow-xl mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
                <h4 className="font-bold text-lg text-red-400">COUNTER-HARVEST TRAP DETECTED</h4>
                <p className="text-sm">Rival is covertly storing L<sub>harvest</sub> energy under Straight Aero state. Immediate defensive deploy recommended.</p>
            </div>
        </div>
    );
}
