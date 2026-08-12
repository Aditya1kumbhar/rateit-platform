"use client";

import { MapPin } from "lucide-react";

interface TrackTimelineProps {
  currentLap: number;
}

export function TrackTimeline({ currentLap }: TrackTimelineProps) {
  // Baku 16 segments layout
  const segments = [
    { id: 1, name: "Turn 1 (90° Right)", type: "CORNER" },
    { id: 2, name: "Turn 2 (90° Left)", type: "CORNER" },
    { id: 3, name: "Short Straight to T3", type: "STRAIGHT" },
    { id: 4, name: "Castle Section Entry", type: "CORNER" },
    { id: 5, name: "Castle Climb", type: "CORNER" },
    { id: 6, name: "Castle Exit", type: "CORNER" },
    { id: 7, name: "Descent to Inner City", type: "STRAIGHT" },
    { id: 8, name: "Turns 8-11 Complex", type: "CORNER" },
    { id: 9, name: "Turn 12 (Tight Left)", type: "CORNER" },
    { id: 10, name: "Boulevard Run", type: "STRAIGHT" },
    { id: 11, name: "Turn 15 (Hairpin)", type: "CORNER" },
    { id: 12, name: "Turn 16 (90° Right)", type: "CORNER" },
    { id: 13, name: "Acceleration Zone", type: "STRAIGHT" },
    { id: 14, name: "Turn 18-19 Chicane", type: "CORNER" },
    { id: 15, name: "Main Straight (T20 to T1)", type: "TRAP" },
    { id: 16, name: "DRS Detection Zone", type: "STRAIGHT" },
  ];

  // Derive current position on track from lap
  const currentSegIndex = (currentLap * 3) % segments.length;
  const currentSeg = segments[currentSegIndex];

  return (
    <div className="bg-[#16191E] border border-[#262B33] rounded-lg p-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Track Timeline — Baku City Circuit</h2>
        <span className="text-xs text-[#2563EB] font-medium font-mono">{currentSeg.name}</span>
      </div>

      <div className="relative h-12 w-full flex items-center">
        {/* Track Line */}
        <div className="absolute top-1/2 left-0 right-0 h-3.5 -translate-y-1/2 flex rounded-full overflow-hidden border border-[#262B33] bg-[#0F1115]">
          {segments.map((seg, i) => (
            <div 
              key={seg.id} 
              className={`h-full flex-1 transition-colors ${
                seg.type === 'STRAIGHT' ? 'bg-[#2563EB]/80' : seg.type === 'TRAP' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]/80'
              } ${i === currentSegIndex ? 'ring-2 ring-white z-10 brightness-125' : ''}`}
              title={`${seg.name} (${seg.type})`}
            />
          ))}
        </div>
        
        {/* Current Position Marker */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 text-[#F8FAFC] flex flex-col items-center transition-all duration-300 pointer-events-none"
          style={{ left: `${((currentSegIndex + 0.5) / segments.length) * 100}%` }}
        >
          <MapPin className="w-5 h-5 text-[#2563EB] fill-[#F8FAFC] drop-shadow-md" />
          <span className="text-[10px] font-bold bg-[#0F1115] px-1.5 py-0.5 rounded border border-[#2563EB] shadow text-white font-mono">
            CAR #1
          </span>
        </div>
      </div>

      <div className="flex justify-between mt-4 text-xs text-[#64748B]">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#2563EB] rounded-sm"></div> Straight</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#F59E0B] rounded-sm"></div> Technical Sector</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#EF4444] rounded-sm"></div> Main Straight (Trap Zone)</div>
      </div>
    </div>
  );
}
