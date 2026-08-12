"use client";

import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface ReplayControlsProps {
  currentLap: number;
  setCurrentLap: (lap: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
}

export function ReplayControls({
  currentLap,
  setCurrentLap,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed
}: ReplayControlsProps) {
  return (
    <div className="bg-[#16191E] border-b border-[#262B33] p-4 flex items-center justify-between w-full select-none">
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button 
          onClick={() => setIsPlaying(prev => !prev)} 
          className="p-2.5 rounded-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-95 transition-all shadow-md shadow-blue-900/30"
          title={isPlaying ? "Pause Simulation (Space)" : "Play Simulation (Space)"}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-[#0F1115] rounded-lg border border-[#262B33] p-1">
          {[1, 5, 10].map(s => (
            <button 
              key={s} 
              onClick={() => setPlaybackSpeed(s)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${playbackSpeed === s ? 'bg-[#2563EB] text-white shadow' : 'text-[#64748B] hover:text-[#F8FAFC]'}`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Lap Indicator */}
        <div className="text-sm text-[#F8FAFC] font-semibold font-mono border-l border-[#262B33] pl-4">
          Lap <span className="text-[#2563EB]">{currentLap}</span> / 51
        </div>
      </div>

      {/* Interactive Lap Scrubber */}
      <div className="flex-1 max-w-2xl mx-8 relative flex items-center">
        <input 
          type="range"
          min={1}
          max={51}
          value={currentLap}
          onChange={(e) => {
            setCurrentLap(Number(e.target.value));
          }}
          className="w-full h-2 bg-[#0F1115] rounded-lg appearance-none cursor-pointer border border-[#262B33] accent-[#2563EB]"
        />
        {/* Trap Lap Event Markers (Laps 15, 28, 42) */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[28%] w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B] pointer-events-none" title="Trap Event Lap 15"></div>
        <div className="absolute top-1/2 -translate-y-1/2 left-[54%] w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B] pointer-events-none" title="Trap Event Lap 28"></div>
        <div className="absolute top-1/2 -translate-y-1/2 left-[82%] w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B] pointer-events-none" title="Trap Event Lap 42"></div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setCurrentLap(1)} 
          className="p-2 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#262B33] rounded transition-colors"
          title="Jump to Lap 1"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setCurrentLap(51)} 
          className="p-2 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#262B33] rounded transition-colors"
          title="Jump to Lap 51"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
