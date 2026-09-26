import { ClipboardList, Target } from "lucide-react";
import type { DecisionFactor, DerivedRequirements } from "../../types";
import { cx, MAP_MODE_LABELS, titleCase } from "../../utils/format";
import { Card, CardHeader } from "../common/Card";

const INFLUENCE: Record<DecisionFactor["influence"], string> = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-slate-50 text-slate-500 border-slate-200",
};

export const DecisionFactors = ({ factors }: { factors: DecisionFactor[] }) => (
  <Card className="overflow-hidden" data-testid="key-decision-factors">
    <CardHeader title="Key Decision Factors" subtitle="How each input was translated into a packaging requirement" icon={<ClipboardList className="h-5 w-5" />} />
    <div className="divide-y divide-slate-100">
      {factors.map((f, i) => (
        <div key={f.factor} className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[180px_1fr_auto] sm:items-center sm:gap-4 sm:px-6" data-testid={`decision-factor-${i}`}>
          <div>
            <p className="text-sm font-medium text-slate-900">{f.factor}</p>
            <p className="font-mono-tech text-xs text-slate-500">{f.value}</p>
          </div>
          <p className="text-sm text-slate-600">{f.impact}</p>
          <span className={cx("w-fit rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase", INFLUENCE[f.influence])}>
            {f.influence}
          </span>
        </div>
      ))}
    </div>
  </Card>
);

export const RequirementsPanel = ({ req }: { req: DerivedRequirements }) => {
  const rows: [string, string][] = [
    ["Moisture barrier", `${req.moisture_barrier.toFixed(1)} / 5`],
    ["Oxygen barrier", `${req.oxygen_barrier.toFixed(1)} / 5`],
    ["Gas exchange", req.gas_exchange > 0 ? `${req.gas_exchange} / 5` : "Not required"],
    ["Mechanical strength", `≥ ${req.mechanical_strength} / 5`],
    ["Protection level", `${req.protection_level} / 5 (${req.shelf_life_class} shelf life)`],
    ["MAP mode", MAP_MODE_LABELS[req.map_mode] ?? titleCase(req.map_mode)],
    ["Storage rating", req.required_storage_types.map(titleCase).join(" + ")],
  ];
  return (
    <Card data-testid="derived-requirements">
      <CardHeader title="Derived Requirements" subtitle="Output of the requirement-extraction stage" icon={<Target className="h-5 w-5" />} />
      <dl className="divide-y divide-slate-100 px-5 sm:px-6">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-right font-mono-tech text-xs font-semibold text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-600 sm:px-6">
        <p><span className="font-semibold text-slate-800">OTR target:</span> {req.otr_target}</p>
        <p><span className="font-semibold text-slate-800">WVTR target:</span> {req.wvtr_target}</p>
      </div>
    </Card>
  );
};
