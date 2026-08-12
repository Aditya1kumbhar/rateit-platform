import { useEffect, useState } from 'react';
import {
  Activity,
  BatteryCharging,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDot,
  Flag,
  Gauge,
  GitBranch,
  Info,
  LoaderCircle,
  Play,
  RefreshCw,
  ShieldCheck,
  Thermometer,
  TimerReset,
  Wind,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildLocalFallback, DEFAULT_RACE_STATE, optimizeStrategy } from './lib/strategyApi';

const SCENARIOS = {
  COUNTER_HARVEST: {
    label: 'Counter-harvest trap',
    description: 'Rival appears slow with low-drag aero still active.',
    state: {
      circuitId: 'BAKU',
      circuitName: 'Baku City Circuit',
      lap: 17,
      totalLaps: 51,
      ownSocMj: 2.72,
      batteryTempC: 46.8,
      tyreState: 'MEDIUM',
      tyreAge: 12,
      gapAheadSec: 0.74,
      gapBehindSec: 1.31,
      trackCondition: 'DRY',
      raceRegime: 'TRAFFIC',
      safetyCar: false,
      opponentSignals: { speedTrapDeltaKph: -4.8, sectorDeltaSec: 0.18, brakePointDeltaM: 8, speedVariance: 0.22, straightAeroActive: true, throttleModulation: 0.09 },
    },
  },
  TRUE_DERATE: {
    label: 'True rival derate',
    description: 'Rival loses pace with aero closed and high throttle demand.',
    state: {
      circuitId: 'BAKU',
      circuitName: 'Baku City Circuit',
      lap: 31,
      totalLaps: 51,
      ownSocMj: 2.18,
      batteryTempC: 45.4,
      tyreState: 'MEDIUM',
      tyreAge: 22,
      gapAheadSec: 0.58,
      gapBehindSec: 2.17,
      trackCondition: 'DRY',
      raceRegime: 'TRAFFIC',
      safetyCar: false,
      opponentSignals: { speedTrapDeltaKph: -6.7, sectorDeltaSec: 0.42, brakePointDeltaM: -4, speedVariance: 1.1, straightAeroActive: false, throttleModulation: 0.71 },
    },
  },
  WET_DEFENCE: {
    label: 'Wet-race defence',
    description: 'Low grip, ageing intermediates and a close rear threat.',
    state: {
      circuitId: 'SHANGHAI',
      circuitName: 'Shanghai International Circuit',
      lap: 43,
      totalLaps: 56,
      ownSocMj: 2.02,
      batteryTempC: 44.2,
      tyreState: 'INTERMEDIATE',
      tyreAge: 19,
      gapAheadSec: 2.2,
      gapBehindSec: 0.56,
      trackCondition: 'WET',
      raceRegime: 'TRAFFIC',
      safetyCar: false,
      opponentSignals: { speedTrapDeltaKph: 1.1, sectorDeltaSec: -0.12, brakePointDeltaM: -10, speedVariance: 1.3, straightAeroActive: false, throttleModulation: 0.57 },
    },
  },
  SAFETY_CAR: {
    label: 'Safety-car recovery',
    description: 'Neutralised race: restore energy before the restart window.',
    state: {
      circuitId: 'BAKU',
      circuitName: 'Baku City Circuit',
      lap: 39,
      totalLaps: 51,
      ownSocMj: 1.25,
      batteryTempC: 51.8,
      tyreState: 'HARD',
      tyreAge: 17,
      gapAheadSec: 0.35,
      gapBehindSec: 0.42,
      trackCondition: 'DRY',
      raceRegime: 'SAFETY_CAR',
      safetyCar: true,
      opponentSignals: { speedTrapDeltaKph: 0, sectorDeltaSec: 0, brakePointDeltaM: 0, speedVariance: 0.12, straightAeroActive: false, throttleModulation: 0.25 },
    },
  },
};

const CIRCUITS = {
  BAKU: { name: 'Baku City Circuit', laps: 51 },
  MONZA: { name: 'Autodromo Nazionale Monza', laps: 53 },
  SHANGHAI: { name: 'Shanghai International Circuit', laps: 56 },
};

const formatSigned = (value, digits = 2) => {
  const numericValue = Number(value || 0);
  return `${numericValue > 0 ? '+' : ''}${numericValue.toFixed(digits)}`;
};

function Panel({ children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-800 bg-[#121721] shadow-[0_18px_50px_rgba(0,0,0,0.16)] ${className}`}>{children}</section>;
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'blue' }) {
  const toneClasses = {
    blue: 'bg-blue-500/10 text-blue-300 border-blue-400/20',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-400/20',
    red: 'bg-rose-500/10 text-rose-300 border-rose-400/20',
  };
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#121721] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-100">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <div className={`rounded-xl border p-2.5 ${toneClasses[tone]}`}><Icon className="h-4 w-4" /></div>
      </div>
    </div>
  );
}

function StatusPill({ children, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-700 bg-slate-800/70 text-slate-300',
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
    red: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
    blue: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${tones[tone]}`}>{children}</span>;
}

function Field({ label, value, onChange, min, max, step = 1, suffix, helper }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span className="font-mono text-xs font-bold text-blue-300">{value}{suffix}</span>
      </div>
      <input className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-blue-500" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      {helper && <p className="mt-2 text-[11px] text-slate-500">{helper}</p>}
    </label>
  );
}

function StrategyChoice({ strategy, active, onClick }) {
  const riskTone = strategy.risk === 'HIGH' ? 'red' : strategy.risk === 'MEDIUM' ? 'amber' : 'emerald';
  return (
    <button type="button" onClick={onClick} className={`group w-full rounded-xl border p-4 text-left transition ${active ? 'border-blue-400/50 bg-blue-500/10 shadow-[0_0_24px_rgba(59,130,246,0.09)]' : 'border-slate-800 bg-[#0d121a] hover:border-slate-700 hover:bg-slate-800/40'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-100">{strategy.label}</span>{active && <span className="rounded bg-blue-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Selected</span>}</div>
          <p className="mt-1 text-xs text-slate-500">{formatSigned(strategy.expectedTimeDeltaSec)}s multi-lap delta · {Number(strategy.energyReserveMj).toFixed(2)} MJ terminal reserve</p>
        </div>
        <div className="text-right"><p className="font-mono text-xl font-bold text-slate-100">{strategy.score}</p><StatusPill tone={riskTone}>{strategy.risk} risk</StatusPill></div>
      </div>
    </button>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('command');
  const [raceState, setRaceState] = useState(DEFAULT_RACE_STATE);
  const [strategy, setStrategy] = useState(() => buildLocalFallback(DEFAULT_RACE_STATE));
  const [selectedScenario, setSelectedScenario] = useState('COUNTER_HARVEST');
  const [selectedAction, setSelectedAction] = useState('HOLD_AND_HARVEST');
  const [isRunning, setIsRunning] = useState(false);
  const [engineMode, setEngineMode] = useState('offline');
  const [errorMessage, setErrorMessage] = useState('');

  const runStrategy = async (nextState = raceState) => {
    setIsRunning(true);
    setErrorMessage('');
    try {
      const result = await optimizeStrategy(nextState);
      setStrategy(result);
      setSelectedAction(result.recommendation.action);
      setEngineMode('connected');
    } catch (error) {
      setStrategy(buildLocalFallback(nextState));
      setSelectedAction('HOLD_AND_HARVEST');
      setEngineMode('offline');
      setErrorMessage(error.message);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runStrategy(DEFAULT_RACE_STATE);
  }, []);

  const applyScenario = (scenarioId) => {
    const nextState = { ...SCENARIOS[scenarioId].state };
    setSelectedScenario(scenarioId);
    setRaceState(nextState);
    runStrategy(nextState);
  };

  const setRaceValue = (key, value) => setRaceState((current) => ({ ...current, [key]: value }));
  const setSignal = (key, value) => setRaceState((current) => ({ ...current, opponentSignals: { ...current.opponentSignals, [key]: value } }));

  const recommendation = strategy.recommendation;
  const forecast = strategy.forecast || [];
  const rankedStrategies = strategy.rankedStrategies || [];
  const opponentBelief = strategy.opponentBelief || {};
  const beliefData = [
    { label: 'High', value: Number(opponentBelief.high || 0) * 100, color: '#34d399' },
    { label: 'Medium', value: Number(opponentBelief.medium || 0) * 100, color: '#60a5fa' },
    { label: 'Covert harvest', value: Number(opponentBelief.covertHarvest || 0) * 100, color: '#fb7185' },
    { label: 'True derate', value: Number(opponentBelief.trueDerate || 0) * 100, color: '#fbbf24' },
  ];
  const activeStrategy = rankedStrategies.find((item) => item.action === selectedAction) || recommendation;
  const recommendationTone = recommendation.risk === 'HIGH' ? 'red' : recommendation.risk === 'MEDIUM' ? 'amber' : 'emerald';
  return (
    <div className="min-h-screen bg-[#080c12] text-slate-100 selection:bg-blue-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(37,99,235,0.14),transparent_28%),radial-gradient(circle_at_90%_4%,rgba(16,185,129,0.08),transparent_22%)]" />
      <div className="relative mx-auto max-w-[1500px] px-4 py-5 md:px-8 md:py-8">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 font-black tracking-tighter text-white shadow-lg shadow-red-950/40">AV</div>
            <div><p className="text-lg font-bold tracking-tight text-white">AeroVolt <span className="font-mono text-xs font-medium text-slate-500">RACE CONTROL</span></p><p className="text-xs text-slate-500">Adaptive multi-lap energy strategy digital twin</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={engineMode === 'connected' ? 'emerald' : 'amber'}><span className={`h-1.5 w-1.5 rounded-full ${engineMode === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />{engineMode === 'connected' ? 'Strategy API connected' : 'Offline demo mode'}</StatusPill>
            <StatusPill tone="blue"><ShieldCheck className="h-3 w-3" />Rule-safe forecast</StatusPill>
            <StatusPill>Seeded scenario</StatusPill>
          </div>
        </header>

        <nav className="mt-5 flex flex-wrap gap-2" aria-label="AeroVolt views">
          {[
            { id: 'command', label: 'Race control', icon: Gauge },
            { id: 'lab', label: 'Strategy lab', icon: GitBranch },
            { id: 'model', label: 'Model evidence', icon: BrainCircuit },
          ].map(({ id, label, icon: Icon }) => (
            <button type="button" key={id} onClick={() => setActiveView(id)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${activeView === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'border border-slate-800 bg-[#121721] text-slate-400 hover:border-slate-700 hover:text-slate-100'}`}><Icon className="h-3.5 w-3.5" />{label}</button>
          ))}
        </nav>

        {errorMessage && <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100"><Info className="mt-0.5 h-4 w-4 shrink-0" /><span>The browser is using its deterministic offline fallback because the API is unavailable: {errorMessage}</span></div>}

        {activeView === 'command' && (
          <main className="mt-6 space-y-6">
            <Panel className="overflow-hidden border-blue-500/20 bg-[linear-gradient(110deg,rgba(18,30,52,0.95),rgba(18,23,33,0.98))] p-5 md:p-7">
              <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr] xl:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><StatusPill tone={recommendationTone}><Activity className="h-3 w-3" />{recommendation.risk || 'MEDIUM'} risk decision</StatusPill><span className="text-xs text-slate-500">Lap {raceState.lap} of {raceState.totalLaps} · {raceState.circuitName}</span></div>
                  <h1 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">{recommendation.label}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{recommendation.rationale}</p>
                  <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => runStrategy()} disabled={isRunning} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-70">{isRunning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{isRunning ? 'Evaluating strategy' : 'Recalculate strategy'}</button><button type="button" onClick={() => setActiveView('lab')} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0d121a] px-4 py-3 text-xs font-bold text-slate-200 transition hover:border-slate-600">Adjust conditions <ChevronRight className="h-4 w-4" /></button></div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
                  <MetricCard icon={BatteryCharging} label="Terminal reserve" value={`${Number(recommendation.energyReserveMj || 0).toFixed(2)} MJ`} detail="After forecast horizon" tone="emerald" />
                  <MetricCard icon={TimerReset} label="Pace outcome" value={`${formatSigned(recommendation.expectedTimeDeltaSec)}s`} detail="Projected cumulative delta" tone="blue" />
                  <MetricCard icon={Thermometer} label="Thermal headroom" value={`${Number(strategy.metrics?.thermalHeadroomC || 0).toFixed(1)}C`} detail="To 55C caution point" tone="amber" />
                  <MetricCard icon={CircleDot} label="Attack success" value={`${Math.round(Number(strategy.metrics?.attackSuccessProbability || 0) * 100)}%`} detail="If an attack is selected" tone="red" />
                </div>
              </div>
            </Panel>

            <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
              <Panel className="p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">Multi-lap forecast</p><h2 className="mt-1 text-lg font-bold text-white">Energy and thermal envelope</h2></div><StatusPill tone="slate">{forecast.length} lap horizon</StatusPill></div><div className="mt-6 h-[330px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={forecast} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="lap" stroke="#64748b" tickLine={false} axisLine={false} tickMargin={10} /><YAxis yAxisId="energy" stroke="#64748b" domain={[0, 4]} tickLine={false} axisLine={false} tickMargin={8} /><YAxis yAxisId="thermal" orientation="right" stroke="#64748b" domain={[35, 62]} tickLine={false} axisLine={false} tickMargin={8} /><Tooltip contentStyle={{ background: '#0d121a', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }} labelStyle={{ color: '#94a3b8' }} formatter={(value, name) => [name === 'Energy store' ? `${Number(value).toFixed(2)} MJ` : `${Number(value).toFixed(1)}C`, name]} /><Line yAxisId="energy" type="monotone" dataKey="socMj" name="Energy store" stroke="#34d399" strokeWidth={2.5} dot={false} /><Line yAxisId="thermal" type="monotone" dataKey="temperatureC" name="Battery temperature" stroke="#fbbf24" strokeWidth={2.2} dot={false} /></LineChart></ResponsiveContainer></div><p className="mt-3 text-xs text-slate-500">The model automatically changes to recovery when the forecast approaches the thermal or energy reserve boundary.</p></Panel>

              <Panel className="p-5 md:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-300">Opponent belief</p><h2 className="mt-1 text-lg font-bold text-white">What the rival is likely doing</h2></div><StatusPill tone="blue">{Math.round(Number(opponentBelief.confidence || 0) * 100)}% confidence</StatusPill></div><div className="mt-5 h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={beliefData} margin={{ top: 4, right: 15, left: 24, bottom: 0 }}><CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 100]} stroke="#64748b" tickLine={false} axisLine={false} unit="%" /><YAxis type="category" dataKey="label" width={96} stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: '#0d121a', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }} formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Probability']} /><Bar dataKey="value" radius={[0, 7, 7, 0]}>{beliefData.map((item) => <Cell key={item.label} fill={item.color} />)}</Bar></BarChart></ResponsiveContainer></div><div className="rounded-xl border border-slate-800 bg-[#0d121a] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Most likely classification</p><p className="mt-1 text-sm font-semibold text-slate-100">{String(opponentBelief.classification || 'INSUFFICIENT_SIGNAL').replaceAll('_', ' ')}</p></div></Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <Panel className="p-5 md:p-6"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-300" /><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">Engineering guardrails</p><h2 className="mt-1 text-lg font-bold text-white">Decision compliance</h2></div></div><div className="mt-5 space-y-3">{(recommendation.guardrails || []).map((guardrail) => <div className="rounded-xl border border-slate-800 bg-[#0d121a] p-3" key={guardrail.id}><div className="flex items-center gap-2"><span className={`grid h-5 w-5 place-items-center rounded-full ${guardrail.passed ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}>{guardrail.passed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}</span><span className="text-xs font-semibold text-slate-200">{guardrail.label}</span></div><p className="mt-2 pl-7 text-[11px] leading-5 text-slate-500">{guardrail.detail}</p></div>)}</div></Panel>
              <Panel className="p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">Counterfactual policy search</p><h2 className="mt-1 text-lg font-bold text-white">Why this action wins</h2></div><StatusPill tone={recommendationTone}>{recommendation.score}/100 strategy score</StatusPill></div><div className="mt-5 grid gap-3">{rankedStrategies.map((item) => <StrategyChoice key={item.action} strategy={item} active={selectedAction === item.action} onClick={() => setSelectedAction(item.action)} />)}</div>{activeStrategy && <div className="mt-4 rounded-xl border border-blue-400/15 bg-blue-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">Selected policy readout</p><p className="mt-2 text-sm leading-6 text-slate-300">{selectedAction === recommendation.action ? recommendation.radio : `${activeStrategy.label} is retained as a counterfactual. It scores ${activeStrategy.score}/100 with ${activeStrategy.risk.toLowerCase()} execution risk.`}</p></div>}</Panel>
            </div>

            <Panel className="p-5 md:p-6"><div className="flex items-center gap-3"><BrainCircuit className="h-5 w-5 text-blue-300" /><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">Evidence trace</p><h2 className="mt-1 text-lg font-bold text-white">Recommendation inputs</h2></div></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(recommendation.evidence || []).map((item) => <div key={item} className="flex gap-3 rounded-xl border border-slate-800 bg-[#0d121a] p-3"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" /><p className="text-xs leading-5 text-slate-400">{item}</p></div>)}</div></Panel>
          </main>
        )}

        {activeView === 'lab' && (
          <main className="mt-6 grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
            <div className="space-y-6"><Panel className="p-5 md:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">Deterministic demo scenarios</p><h1 className="mt-1 text-xl font-bold text-white">Change race conditions</h1><p className="mt-2 text-sm leading-6 text-slate-500">Each preset updates one shared race state and re-runs the policy search. It is designed to be repeatable in a judge demo.</p><div className="mt-5 space-y-3">{Object.entries(SCENARIOS).map(([id, scenario]) => <button type="button" key={id} onClick={() => applyScenario(id)} className={`w-full rounded-xl border p-4 text-left transition ${selectedScenario === id ? 'border-blue-400/45 bg-blue-500/10' : 'border-slate-800 bg-[#0d121a] hover:border-slate-700'}`}><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-slate-100">{scenario.label}</p><p className="mt-1 text-xs text-slate-500">{scenario.description}</p></div><ChevronRight className={`h-4 w-4 ${selectedScenario === id ? 'text-blue-300' : 'text-slate-600'}`} /></div></button>)}</div></Panel><Panel className="p-5 md:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Simulation control</p><h2 className="mt-1 text-lg font-bold text-white">Run the full forecast</h2></div><Play className="h-5 w-5 text-emerald-300" /></div><button type="button" onClick={() => runStrategy()} disabled={isRunning} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-70">{isRunning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}{isRunning ? 'Simulating policies' : 'Run adaptive strategy search'}</button><p className="mt-3 text-center text-[11px] text-slate-500">No generative AI or network data is required for the seeded scenario.</p></Panel></div>

            <div className="space-y-6"><Panel className="p-5 md:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">Race state</p><h2 className="mt-1 text-lg font-bold text-white">Car, track and traffic inputs</h2></div><StatusPill tone={raceState.trackCondition === 'DRY' ? 'emerald' : 'blue'}>{raceState.trackCondition}</StatusPill></div><div className="mt-6 grid gap-6 md:grid-cols-2"><div className="space-y-6"><label className="block"><span className="text-xs font-medium text-slate-300">Circuit</span><select value={raceState.circuitId} onChange={(event) => { const circuit = CIRCUITS[event.target.value]; setRaceState((current) => ({ ...current, circuitId: event.target.value, circuitName: circuit.name, totalLaps: circuit.laps, lap: Math.min(current.lap, circuit.laps) })); }} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#0d121a] px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-blue-400"><option value="BAKU">Baku City Circuit</option><option value="MONZA">Monza</option><option value="SHANGHAI">Shanghai</option></select></label><Field label="Current lap" value={raceState.lap} onChange={(value) => setRaceValue('lap', value)} min={1} max={raceState.totalLaps} suffix={` / ${raceState.totalLaps}`} /><Field label="Energy store" value={raceState.ownSocMj} onChange={(value) => setRaceValue('ownSocMj', value)} min={0} max={4} step={0.05} suffix=" MJ" helper="Usable model range: 0.00 - 4.00 MJ" /><Field label="Battery temperature" value={raceState.batteryTempC} onChange={(value) => setRaceValue('batteryTempC', value)} min={35} max={60} step={0.1} suffix=" C" /></div><div className="space-y-6"><Field label="Gap to car ahead" value={raceState.gapAheadSec} onChange={(value) => setRaceValue('gapAheadSec', value)} min={0.1} max={5} step={0.01} suffix=" s" /><Field label="Gap to car behind" value={raceState.gapBehindSec} onChange={(value) => setRaceValue('gapBehindSec', value)} min={0.1} max={5} step={0.01} suffix=" s" /><Field label="Tyre age" value={raceState.tyreAge} onChange={(value) => setRaceValue('tyreAge', value)} min={0} max={45} suffix=" laps" /><label className="block"><span className="text-xs font-medium text-slate-300">Track condition</span><div className="mt-2 grid grid-cols-3 gap-2">{['DRY', 'DAMP', 'WET'].map((condition) => <button type="button" key={condition} onClick={() => setRaceValue('trackCondition', condition)} className={`rounded-xl border px-2 py-2 text-[11px] font-semibold transition ${raceState.trackCondition === condition ? 'border-blue-400/50 bg-blue-500/15 text-blue-200' : 'border-slate-800 bg-[#0d121a] text-slate-500 hover:text-slate-300'}`}>{condition}</button>)}</div></label><label className="mt-6 flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-[#0d121a] p-3"><span className="flex items-center gap-2 text-xs font-medium text-slate-300"><Flag className="h-4 w-4 text-amber-300" />Safety car deployed</span><input type="checkbox" checked={raceState.safetyCar} onChange={(event) => { setRaceValue('safetyCar', event.target.checked); setRaceValue('raceRegime', event.target.checked ? 'SAFETY_CAR' : 'TRAFFIC'); }} className="h-4 w-4 accent-blue-500" /></label></div></div></Panel>
              <Panel className="p-5 md:p-6"><div className="flex items-center gap-3"><Wind className="h-5 w-5 text-rose-300" /><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-300">Opponent observation model</p><h2 className="mt-1 text-lg font-bold text-white">Signals available to the inference engine</h2></div></div><div className="mt-6 grid gap-6 md:grid-cols-2"><Field label="Speed-trap delta" value={raceState.opponentSignals.speedTrapDeltaKph} onChange={(value) => setSignal('speedTrapDeltaKph', value)} min={-12} max={12} step={0.1} suffix=" km/h" /><Field label="Sector delta" value={raceState.opponentSignals.sectorDeltaSec} onChange={(value) => setSignal('sectorDeltaSec', value)} min={-1} max={1} step={0.01} suffix=" s" /><Field label="Brake-point delta" value={raceState.opponentSignals.brakePointDeltaM} onChange={(value) => setSignal('brakePointDeltaM', value)} min={-30} max={30} suffix=" m" /><Field label="Throttle modulation" value={raceState.opponentSignals.throttleModulation} onChange={(value) => setSignal('throttleModulation', value)} min={0} max={1} step={0.01} suffix="" helper="0 = strongly modulated; 1 = sustained demand" /><label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-[#0d121a] p-3"><span className="text-xs font-medium text-slate-300">Straight aero observed</span><input type="checkbox" checked={raceState.opponentSignals.straightAeroActive} onChange={(event) => setSignal('straightAeroActive', event.target.checked)} className="h-4 w-4 accent-blue-500" /></label></div></Panel></div>
          </main>
        )}

        {activeView === 'model' && (
          <main className="mt-6 space-y-6"><Panel className="p-5 md:p-7"><div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"><div><StatusPill tone="blue"><BrainCircuit className="h-3 w-3" />Explainable decision model</StatusPill><h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Model evidence, not a black box.</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">AeroVolt uses a deterministic, physics-informed opponent belief model and rolls each candidate deployment policy forward across a shared race state. The result is a traceable recommendation rather than a generic AI message.</p></div><div className="rounded-2xl border border-slate-800 bg-[#0d121a] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Current execution</p><div className="mt-4 space-y-3"><div className="flex items-center justify-between text-sm"><span className="text-slate-400">Data provenance</span><span className="font-medium text-slate-100">{strategy.source}</span></div><div className="flex items-center justify-between text-sm"><span className="text-slate-400">Ruleset</span><span className="font-mono text-xs text-slate-100">{strategy.ruleset?.version || 'demo-rule-set'}</span></div><div className="flex items-center justify-between text-sm"><span className="text-slate-400">Run type</span><span className="font-medium text-emerald-300">Deterministic replay</span></div></div></div></div></Panel>
            <div className="grid gap-6 lg:grid-cols-3"><Panel className="p-5"><Activity className="h-5 w-5 text-blue-300" /><h2 className="mt-4 text-base font-bold text-white">1. Infer rival state</h2><p className="mt-2 text-sm leading-6 text-slate-500">Speed trap, sector time, braking, aero and throttle signals produce transparent probabilities for high energy, medium energy, covert harvest and true derate.</p></Panel><Panel className="p-5"><GitBranch className="h-5 w-5 text-emerald-300" /><h2 className="mt-4 text-base font-bold text-white">2. Search policies</h2><p className="mt-2 text-sm leading-6 text-slate-500">Attack, balanced pressure, harvest and defence are simulated through the upcoming stint under tyre, traffic, weather and safety-car conditions.</p></Panel><Panel className="p-5"><ShieldCheck className="h-5 w-5 text-amber-300" /><h2 className="mt-4 text-base font-bold text-white">3. Apply guardrails</h2><p className="mt-2 text-sm leading-6 text-slate-500">Energy-store, recovery, power and thermal checks remain visible with each forecast, including automatic recovery actions at caution limits.</p></Panel></div>
            <Panel className="p-5 md:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">Judge-ready integrity</p><h2 className="mt-1 text-lg font-bold text-white">What this prototype does and does not claim</h2></div><StatusPill tone="emerald"><Check className="h-3 w-3" />Reproducible demo</StatusPill></div><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4"><p className="text-sm font-semibold text-emerald-200">It does</p><ul className="mt-3 space-y-2 text-xs leading-5 text-slate-400"><li>Evaluate multi-lap energy deployment policies.</li><li>Respond to changes in gaps, tyres, weather, battery temperature and safety car.</li><li>Expose every recommendation's evidence and engineering constraints.</li><li>Run without an LLM, external data source or paid service.</li></ul></div><div className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-4"><p className="text-sm font-semibold text-amber-200">It does not claim</p><ul className="mt-3 space-y-2 text-xs leading-5 text-slate-400"><li>Access to private team battery SoC or control-unit telemetry.</li><li>Official Formula 1 or team affiliation.</li><li>Unvalidated accuracy numbers for opponent-state prediction.</li><li>A replacement for a certified race engineer or vehicle controller.</li></ul></div></div></Panel>
          </main>
        )}

        <footer className="mt-8 border-t border-slate-800 pt-5 text-xs text-slate-600"><span className="font-semibold text-slate-500">AeroVolt Race Control</span> · AI Motorsport Intelligence · {strategy.provenance?.disclaimer || 'Educational strategy prototype using a deterministic digital-twin model.'}</footer>
      </div>
    </div>
  );
}
