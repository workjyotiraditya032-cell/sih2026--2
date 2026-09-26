import { AlertTriangle, CheckCircle2, Lightbulb, SlidersHorizontal } from "lucide-react";
import type { ScoreComponent } from "../../types";
import { pct } from "../../utils/format";
import { Card, CardHeader } from "../common/Card";
import { ProgressBar } from "../common/Indicators";

export const WhyThisMaterial = ({ reasons, tradeoffs }: { reasons: string[]; tradeoffs: string[] }) => (
  <Card data-testid="why-this-material">
    <CardHeader title="Why This Material?" subtitle="Generated from the factors that contributed most to the score" icon={<Lightbulb className="h-5 w-5" />} />
    <ul className="space-y-3 p-5 sm:p-6">
      {reasons.map((r, i) => (
        <li key={r} className="flex items-start gap-3 text-sm text-slate-700" data-testid={`reason-item-${i}`}>
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {r}
        </li>
      ))}
    </ul>
    {tradeoffs.length > 0 && (
      <div className="border-t border-slate-100 px-5 py-4 sm:px-6" data-testid="tradeoffs-list">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Trade-offs to consider</p>
        <ul className="space-y-2">
          {tradeoffs.map((t) => (
            <li key={t} className="flex items-start gap-2 text-sm text-slate-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /> {t}
            </li>
          ))}
        </ul>
      </div>
    )}
  </Card>
);

export const ScoreBreakdown = ({ components }: { components: ScoreComponent[] }) => (
  <Card data-testid="score-breakdown">
    <CardHeader title="Score Breakdown" subtitle="Criterion score × effective weight = contribution" icon={<SlidersHorizontal className="h-5 w-5" />} />
    <div className="space-y-4 p-5 sm:p-6">
      {components.map((c) => (
        <div key={c.criterion} data-testid={`score-component-${c.criterion}`}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{c.label}</span>
            <span className="font-mono-tech text-xs text-slate-500">
              {pct(c.score)} × {pct(c.weight, 1)} = <span className="font-semibold text-slate-900">{c.contribution.toFixed(1)}</span>
            </span>
          </div>
          <ProgressBar value={c.score} />
        </div>
      ))}
      <p className="pt-1 text-xs text-slate-500">
        Weights are configurable engine parameters, adjusted by your cost, sustainability and MAP preferences.
      </p>
    </div>
  </Card>
);
