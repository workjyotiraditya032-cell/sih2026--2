import { ArrowDownRight, ArrowUpRight, Ban, ListOrdered } from "lucide-react";
import type { Alternative, ExcludedMaterial, RankingEntry } from "../../types";
import { cx, costLabel } from "../../utils/format";
import { Badge, Card, CardHeader } from "../common/Card";

export const AlternativesSection = ({ alternatives }: { alternatives: Alternative[] }) => (
  <div data-testid="alternatives-section">
    <div className="mb-4">
      <h2 className="text-xl font-semibold text-slate-900">Alternative Materials</h2>
      <p className="text-sm text-slate-500">Next-ranked options from the same scoring run</p>
    </div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {alternatives.map((alt, i) => (
        <Card key={alt.material.id} className="p-6" data-testid={`alternative-card-${i + 1}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alternative {i + 1} · Rank #{alt.rank}</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900" data-testid={`alternative-name-${i + 1}`}>{alt.material.material_name}</h3>
              <p className="text-xs text-slate-500">{alt.material.material_category} · Cost {costLabel(alt.material.relative_cost).toLowerCase()}</p>
            </div>
            <div className="text-right">
              <p className="font-mono-tech text-2xl font-bold text-slate-900" data-testid={`alternative-score-${i + 1}`}>{alt.suitability_score.toFixed(1)}</p>
              <p className="text-[11px] text-slate-500">Suitability</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-start gap-2 rounded-lg bg-emerald-50/70 p-3">
              <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p><span className="font-semibold text-slate-900">Main advantage: </span><span className="text-slate-700">{alt.main_advantage}</span></p>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-amber-50/70 p-3">
              <ArrowDownRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p><span className="font-semibold text-slate-900">Main trade-off: </span><span className="text-slate-700">{alt.main_tradeoff}</span></p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export const RankingPanel = ({ ranking, excluded }: { ranking: RankingEntry[]; excluded: ExcludedMaterial[] }) => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <Card data-testid="full-ranking">
      <CardHeader title="Full Ranking" subtitle={`${ranking.length} compatible materials scored`} icon={<ListOrdered className="h-5 w-5" />} />
      <ol className="divide-y divide-slate-100 px-5 sm:px-6">
        {ranking.map((r) => (
          <li key={r.material_id} className="flex items-center justify-between py-2.5 text-sm" data-testid={`ranking-row-${r.rank}`}>
            <span className="flex items-center gap-3">
              <span className={cx("flex h-6 w-6 items-center justify-center rounded-md font-mono-tech text-xs font-bold", r.rank === 1 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600")}>
                {r.rank}
              </span>
              <span className="font-medium text-slate-800">{r.material_name}</span>
            </span>
            <span className="font-mono-tech text-sm font-semibold text-slate-900">{r.suitability_score.toFixed(1)}</span>
          </li>
        ))}
      </ol>
    </Card>
    <Card data-testid="excluded-materials">
      <CardHeader title="Filtered Out" subtitle="Removed at the compatibility-filtering stage" icon={<Ban className="h-5 w-5" />} />
      <div className="space-y-3 p-5 sm:p-6">
        {excluded.length === 0 && <p className="text-sm text-slate-500">No materials were excluded for these inputs.</p>}
        {excluded.map((e) => (
          <div key={e.material_id} className="rounded-lg border border-slate-100 bg-slate-50 p-3" data-testid={`excluded-material-${e.material_id}`}>
            <Badge tone="red">{e.material_name}</Badge>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {e.reasons.map((r) => <li key={r}>• {r}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  </div>
);
