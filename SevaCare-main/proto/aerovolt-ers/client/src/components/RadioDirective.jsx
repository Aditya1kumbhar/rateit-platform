import React from 'react';
import { Radio } from 'lucide-react';

export default function RadioDirective({ directive, confidence }) {
    return (
        <div className="bg-f1-panel p-4 rounded-xl border border-gray-800 shadow-lg mb-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-f1-green">
                    <Radio className="w-5 h-5 animate-pulse" />
                    <span className="font-bold tracking-wide uppercase text-sm">Pit Wall Radio Directive</span>
                </div>
                {confidence && (
                    <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full border border-gray-700">
                        Confidence: {(confidence * 100).toFixed(0)}%
                    </span>
                )}
            </div>
            <p className="text-gray-100 italic text-lg bg-gray-900/60 p-3 rounded-lg border-l-4 border-f1-green">
                "{directive || 'Awaiting telemetry analysis from Gemini Strategic Advisor...'}"
            </p>
        </div>
    );
}
