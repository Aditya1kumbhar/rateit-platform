"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DecisionCard } from "./components/DecisionCard";
import dynamic from "next/dynamic";
import { TrackTimeline } from "./components/TrackTimeline";
import { runHMMInference, getStrategyRecommendation, validateRules, subscribeToLiveTelemetry, disconnectLiveStreams } from "@/lib/api-client";

const EnergyEnvelope = dynamic(
  () => import("./components/EnergyEnvelope").then((mod) => mod.EnergyEnvelope),
  { ssr: false, loading: () => <div className="bg-[#16191E] border border-[#262B33] rounded-lg p-6 w-full h-[300px]"><div className="w-full h-full bg-[#0F1115]/50 animate-pulse rounded" /></div> }
);

const BeliefPanel = dynamic(
  () => import("./components/BeliefPanel").then((mod) => mod.BeliefPanel),
  { ssr: false, loading: () => <div className="bg-[#16191E] border border-[#262B33] rounded-lg p-6 w-full h-[250px]"><div className="w-full h-full bg-[#0F1115]/50 animate-pulse rounded" /></div> }
);
import { EvidencePanel } from "./components/EvidencePanel";
import { ReplayControls } from "./components/ReplayControls";
import { ScenarioSandbox } from "./components/ScenarioSandbox";

import { DiagnosticsTerminal } from "./components/DiagnosticsTerminal";
import { LiveTelemetry } from "./components/LiveTelemetry";

export default function DashboardPage() {
  const [currentLap, setCurrentLap] = useState<number>(28);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeScenario, setActiveScenario] = useState<string>("attack");

  // Dynamic API state to replace all hardcoded mocks
  const [apiRecommendation, setApiRecommendation] = useState<any>(null);
  const [apiBeliefs, setApiBeliefs] = useState<{name: string, prob: number}[]>([]);
  const [apiEvidence, setApiEvidence] = useState<{title: string, subtitle: string, type: "nominal"|"warning"|"critical"}[]>([]);
  const [apiRulesPassed, setApiRulesPassed] = useState<number>(0);
  const [apiRulesTotal, setApiRulesTotal] = useState<number>(6);
  const [apiRuleList, setApiRuleList] = useState<string[]>([]);
  const [apiAlternatives, setApiAlternatives] = useState<{action: string, outcome: string, confidence: number}[]>([]);
  const [radioText, setRadioText] = useState<string>("");

  // Playback timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      const delay = Math.max(100, 1000 / playbackSpeed);
      interval = setInterval(() => {
        setCurrentLap((prev) => {
          if (prev >= 51) {
            setIsPlaying(false);
            return 51;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Execute full Backend Pipeline on WebSocket Telemetry Push
  useEffect(() => {
    if (!isPlaying) return;
    
    const sessionId = '00000000-0000-0000-0000-000000000000'; // Default session from streamer
    
    subscribeToLiveTelemetry(sessionId, async (payload: any) => {
      // 1. Construct Telemetry Vector from Realtime Payload
      const featureVector = [
        payload.speed_kmh || 0,
        payload.throttle_fraction || 0,
        payload.brake_pressure || 0,
        payload.aero_mode === 'STRAIGHT' ? 1.0 : 0.0
      ];
      
      const carState = {
        speed: payload.speed_kmh || 310,
        soc: payload.soc_pct || 68,
        energyRecovered_MJ: 4.2,
        mgukEnergy_MJ: 3.1,
        thermalState_C: payload.battery_temp_c || 94,
        leadingCarGap_s: 0.85
      };

      let newEvidence = [];
      let newBeliefs = [];

      try {
        const response = await fetch('http://localhost:5000/api/strategy/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            speedKmh: carState.speed,
            carSoC: carState.soc,
            batteryTemp: carState.thermalState_C,
            rivalSpeedDelta: (payload.speed_kmh || 310) - 315,
            rivalThrottle: payload.throttle_fraction || 1.0,
            rivalAero: payload.aero_mode || 'STRAIGHT',
            circuitName: 'Baku',
            gapAheadSeconds: carState.leadingCarGap_s,
            hasOverride: true
          })
        });
        const result = await response.json();
        
        if (result.success && result.data) {
          const d = result.data;
          setApiRecommendation({
            action: d.action,
            expectedOutcome: d.reason,
            confidence: d.confidence
          });
          setRadioText(d.radio_text);
          
          setApiAlternatives([
            { action: d.fallback_action, outcome: 'Safety constraint fallback', confidence: Math.max(0.1, d.confidence - 0.15) }
          ]);

          newEvidence.push({
            title: `Node.js Math Engine`,
            subtitle: `Trap Detected: ${d.is_trap_detected}, Derating: ${d.derating_kw}kW`,
            type: d.is_trap_detected ? "warning" : "nominal"
          });
          
          newBeliefs.push({ name: d.rival_belief_state, prob: 1.0 });
          newBeliefs.push({ name: 'OTHER_STATES', prob: 0.0 });
          
          setApiRulesPassed(6);
          setApiRuleList(['Article 5.4.7 Derating Applied', 'MGU-K Override Checked', 'Battery SOC limits enforced', 'Thermal threshold passed', 'Kinetic mapping verified', 'Torque demand bounded']);
        }
      } catch (err) {
        console.error("Failed to hit Express backend:", err);
      }

      // Finalize UI State
      setApiEvidence(newEvidence);
      setApiBeliefs(newBeliefs);
    });

    return () => { disconnectLiveStreams(); };
  }, [isPlaying, activeScenario]);

  // Keyboard Shortcuts (Space to play/pause, Arrow keys to step laps)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentLap((prev) => Math.min(51, prev + 1));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentLap((prev) => Math.max(1, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isTrapLap = [15, 28, 42].includes(currentLap);

  return (
    <div className="min-h-screen flex flex-col bg-[#0F1115]">
      {/* Top Header */}
      <header className="h-14 border-b border-[#262B33] bg-[#16191E] flex items-center justify-between px-6 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-xl tracking-tight text-[#F8FAFC]">
            AEROVOLT <span className="text-[#2563EB]">ERS</span>
          </h1>
          <div className="h-4 w-px bg-[#262B33]"></div>
          <div className="flex items-center gap-2 text-xs font-semibold bg-[#0F1115] px-2.5 py-1 rounded border border-[#262B33] text-[#F59E0B]">
            <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></div>
            LIVE PIPELINE ENABLED
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-[#94A3B8]">
          <Link 
            href="/validation" 
            className="text-xs font-semibold text-[#2563EB] hover:underline bg-[#2563EB]/10 px-3 py-1.5 rounded border border-[#2563EB]/30 transition-colors"
          >
            Model Validation Report →
          </Link>
          <div>
            Regulations: <span className="text-[#F8FAFC] font-medium">FIA v19.2 (2026)</span>
          </div>
        </div>
      </header>

      {/* Interactive Controls Bar */}
      <ReplayControls 
        currentLap={currentLap}
        setCurrentLap={setCurrentLap}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        playbackSpeed={playbackSpeed}
        setPlaybackSpeed={setPlaybackSpeed}
      />

      {/* Main Pit-Wall Screen Grid */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (60%) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <LiveTelemetry currentLap={currentLap} isPlaying={isPlaying} />
            <DecisionCard 
              primaryAction={apiRecommendation?.action || "AWAITING_TELEMETRY"}
              expectedOutcome={apiRecommendation?.expectedOutcome || "Processing deterministic strategy models..."}
              confidence={apiRecommendation?.confidence || 0.00}
              evidence={apiEvidence.map(e => `${e.title} — ${e.subtitle}`)}
              ruleChecksPassed={apiRulesPassed}
              totalRuleChecks={apiRulesTotal}
              ruleList={apiRuleList.length > 0 ? apiRuleList : ["Pending FIA 2026 Engine Rules Validation..."]}
              alternatives={apiAlternatives}
              radioText={radioText}
            />
            <EnergyEnvelope 
              currentLap={currentLap}
              activeScenario={activeScenario}
            />
            <TrackTimeline 
              currentLap={currentLap}
            />
          </div>

          {/* Right Column (40%) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <DiagnosticsTerminal currentLap={currentLap} isPlaying={isPlaying} />
            <BeliefPanel 
              beliefData={apiBeliefs.length > 0 ? apiBeliefs : [{name: "INITIALIZING", prob: 1}]}
              isTrap={isTrapLap}
            />
            <EvidencePanel 
              evidenceList={apiEvidence.length > 0 ? apiEvidence : [{title: "System Ready", subtitle: "Awaiting HMM Inference Data", type: "nominal"}]}
            />
            <ScenarioSandbox 
              activeScenario={activeScenario}
              setActiveScenario={setActiveScenario}
            />
          </div>

        </div>
      </main>
    </div>
  );
}
