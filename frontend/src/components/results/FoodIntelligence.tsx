import { BrainCircuit, Database, AlertTriangle } from 'lucide-react';
import type { FoodIntelligence } from '../../types';
import { Card, Badge } from '../common/Card';
import { PRIORITY_OPTIONS } from '../../utils/constants';

const labels: Record<string, string> = {moisture: 'Typical moisture', ph: 'Typical pH range', fat: 'Typical fat / oil', respiration: 'Respiration', acidity: 'Acidity', oxygen_sensitivity: 'Oxygen sensitivity', moisture_sensitivity: 'Moisture sensitivity', co2_sensitivity: 'CO₂ relevance'};
const sourceLabel = {reference: 'Reference range / profile', ai_estimated: 'AI-estimated — requires validation', unavailable: 'Reference data unavailable'};

export const IntelligenceStatus = ({ intelligence: i }: { intelligence: FoodIntelligence }) => (
  <div role="status" data-testid="intelligence-status" className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${i.mode === 'ai' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
    {i.mode === 'ai' ? <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
    <div><p className="font-semibold" data-testid="intelligence-mode">{i.mode === 'ai' ? 'AI + Knowledge Base + Compatibility Engine' : 'Knowledge-base fallback'}</p>
      <p data-testid="intelligence-message">{i.message}</p>
      {i.model && <p className="mt-1 text-xs" data-testid="intelligence-model">{i.provider} · {i.model} · Backend-validated structured output</p>}
    </div>
  </div>
);

export const FoodIntelligenceCard = ({ intelligence: i }: { intelligence: FoodIntelligence }) => (
  <Card data-testid="food-intelligence-card">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
      <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700"><Database className="h-4 w-4" />Food intelligence</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900" data-testid="identified-food-name">{i.food_profile.food} <span className="text-sm font-normal text-slate-500">· {i.food_profile.food_category}</span></h2></div>
      <Badge tone={i.food_profile.provenance === 'reference' ? 'blue' : 'slate'} data-testid="food-profile-provenance">{i.food_profile.provenance === 'reference' ? 'Typical reference profile' : 'AI-estimated profile'}</Badge>
    </div>
    <dl className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
      {Object.entries(i.food_profile.properties).map(([key, property]) => <div key={key} data-testid={`food-property-${key.replace(/_/g, '-')}`}>
        <dt className="text-xs text-slate-500">{labels[key] ?? key}</dt>
        <dd className="mt-1 text-sm font-semibold text-slate-800">{property.value}</dd>
        <dd className={`mt-1 text-[11px] ${property.source === 'ai_estimated' ? 'text-amber-700' : 'text-slate-500'}`}>{sourceLabel[property.source]}</dd>
      </div>)}
    </dl>
    <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-600 sm:px-6" data-testid="profile-practical-requirements">
      {i.user_requirements.shelf_life_days}-day target · {i.user_requirements.temperature} °C · {i.user_requirements.storage_type} · {i.user_requirements.transportation.replace(/_/g,' ')}
      <span className="ml-2 font-semibold text-emerald-800">Priority: {PRIORITY_OPTIONS.find((x) => x.value === i.user_requirements.priority)?.label}</span>
      <p className="mt-2">No measured food properties were supplied. Ranges vary by variety, formulation, maturity and processing.</p>
    </div>
  </Card>
);

export const IntelligenceCautions = ({ intelligence: i }: { intelligence: FoodIntelligence }) => (
  <Card className="p-5 sm:p-6" data-testid="intelligence-cautions">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800"><AlertTriangle className="h-4 w-4" />Storage &amp; validation notes</h3>
    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">{i.warnings.map((warning, n) => <li key={n} data-testid={`intelligence-warning-${n}`}>{warning}</li>)}</ul>
    <details className="mt-4 border-t border-slate-100 pt-4" data-testid="profile-assumptions-details">
      <summary className="cursor-pointer text-xs font-semibold text-emerald-700" data-testid="profile-assumptions-toggle">Data provenance &amp; scoring assumptions</summary>
      <ul className="mt-3 space-y-2 text-xs text-slate-500">{i.assumptions.map((a, n) => <li key={n}>{a}</li>)}</ul>
      <p className="mt-3 text-xs text-slate-500">Reference reading (not a claim that each prototype band is experimentally validated):</p>
      {i.food_profile.sources.map((source, n) => <a key={source} href={source} target="_blank" rel="noreferrer" className="mt-1 block break-all text-xs text-emerald-700 hover:underline" data-testid={`profile-source-${n}`}>{source}</a>)}
    </details>
  </Card>
);
