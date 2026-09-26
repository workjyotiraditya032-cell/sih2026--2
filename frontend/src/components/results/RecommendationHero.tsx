import { Leaf, Recycle, ShieldCheck } from "lucide-react";
import type { RecommendationResponse } from "../../types";
import { costLabel } from "../../utils/format";
import { Badge, Card } from "../common/Card";
import { ScoreRing } from "../common/Indicators";

export const RecommendationHero = ({ result }: { result: RecommendationResponse }) => {
  const m = result.recommended_material;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card className="p-6 lg:col-span-8 lg:p-8" data-testid="recommended-material-card">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="emerald">
            <ShieldCheck className="h-3 w-3" /> Recommended Material · Rank #1
          </Badge>
          <Badge tone="slate">{m.material_category}</Badge>
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl" data-testid="recommended-material-name">
          {result.intelligence?.packaging_structure ?? m.material_name}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{m.description}</p>
        <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recommendation Summary</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700" data-testid="recommendation-summary">
            {result.summary}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <Badge tone={m.recyclable ? "emerald" : "slate"}>
            <Recycle className="h-3 w-3" /> {m.recyclable ? "Recyclable" : "Not readily recyclable"}
          </Badge>
          <Badge tone={m.biodegradable ? "emerald" : "slate"}>
            <Leaf className="h-3 w-3" /> {m.biodegradable ? "Biodegradable" : "Not biodegradable"}
          </Badge>
          <Badge tone="blue">Relative cost: {costLabel(m.relative_cost)}</Badge>
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center p-6 text-center lg:col-span-4" data-testid="suitability-score-card">
        <p className="text-sm font-semibold text-slate-900">Suitability Score</p>
        <div className="mt-4">
          <ScoreRing score={result.suitability_score} />
        </div>
        {result.intelligence && <div className="mt-5 grid w-full grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs" data-testid="recommendation-indicators">
          {(['cost_level', 'sustainability_level', 'confidence'] as const).map((key) => <div key={key} data-testid={`recommendation-${key.replace('_level', '')}`}>
            <p className="text-slate-500">{key.replace('_level', '').replace(/^./, (v) => v.toUpperCase())}</p>
            <p className="mt-1 font-semibold capitalize text-slate-900">{result.intelligence?.[key]}</p>
          </div>)}
        </div>}
        <p className="mt-4 max-w-[260px] text-xs leading-relaxed text-slate-500" data-testid="score-confidence-disclaimer">
          Weighted compatibility score, not AI accuracy. {result.intelligence ? result.intelligence.confidence_basis : 'Calculated across seven criteria.'}
          {result.intelligence?.mode === 'ai' && ' AI preference order can differ from numerical score order.'}
        </p>
      </Card>
    </div>
  );
};
