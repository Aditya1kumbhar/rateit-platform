import React from 'react';
import { Truck, BatteryCharging, Zap, ShieldCheck } from 'lucide-react';

export default function FleetTransfer() {
    return (
        <div className="bg-f1-panel p-6 rounded-xl border border-gray-800 shadow-lg mt-6">
            <div className="flex items-center gap-3 mb-4">
                <Truck className="w-6 h-6 text-f1-green" />
                <h2 className="text-xl font-bold text-gray-100">Cross-Domain Transfer: Commercial Indian EV Fleets (Pune)</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6">
                Applying F1 2026 ERS degradation algorithms to commercial 2W/3W electric delivery fleets operating in high-heat Indian urban environments.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800">
                    <BatteryCharging className="w-5 h-5 text-yellow-500 mb-2" />
                    <h3 className="font-semibold text-gray-200">Adaptive Derating</h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Prevents thermal runaway during steep Pune gradient climbs by limiting continuous discharge based on thermal piecewise caps.
                    </p>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800">
                    <Zap className="w-5 h-5 text-f1-green mb-2" />
                    <h3 className="font-semibold text-gray-200">Smart Regen Profile</h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Uses lift-and-coast harvest mapping (Art. 5.4.10 adapted) to increase brake life by 35% in dense stop-and-go traffic.
                    </p>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800">
                    <ShieldCheck className="w-5 h-5 text-blue-400 mb-2" />
                    <h3 className="font-semibold text-gray-200">Lifecycle Savings</h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Reduces overall fleet TCO (Total Cost of Ownership) by extending battery pack health by 18-22 months.
                    </p>
                </div>
            </div>
        </div>
    );
}
