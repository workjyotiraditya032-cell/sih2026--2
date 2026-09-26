import { ReactNode } from "react";
import { Check, Minus } from "lucide-react";
import type { Material } from "../../types";
import { costLabel, cx, formatRange, gasLabel, ratingLabel } from "../../utils/format";
import { Badge } from "../common/Card";
import { RatingBar } from "../common/Indicators";

interface Row {
  label: string;
  render: (m: Material) => ReactNode;
}

const Bool = ({ value }: { value: boolean }) =>
  value ? (
    <span className="inline-flex items-center gap-1 font-medium text-emerald-700"><Check className="h-4 w-4" /> Yes</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-slate-400"><Minus className="h-4 w-4" /> No</span>
  );

const Rating = ({ value, label }: { value: number; label: string }) => (
  <div className="space-y-1">
    <span className="text-sm text-slate-800">{label}</span>
    <RatingBar value={value} />
  </div>
);

const ROWS: Row[] = [
  { label: "OTR (cm³/m²·day)", render: (m) => <span className="font-mono-tech">{formatRange(m.otr_min, m.otr_max)}</span> },
  { label: "WVTR (g/m²·day)", render: (m) => <span className="font-mono-tech">{formatRange(m.wvtr_min, m.wvtr_max)}</span> },
  { label: "Thickness (µm)", render: (m) => <span className="font-mono-tech">{formatRange(m.min_thickness, m.max_thickness)}</span> },
  { label: "Sealability", render: (m) => <Rating value={m.sealability} label={ratingLabel(m.sealability)} /> },
  { label: "Mechanical Strength", render: (m) => <Rating value={m.mechanical_strength} label={ratingLabel(m.mechanical_strength)} /> },
  { label: "Gas Permeability", render: (m) => <Rating value={m.gas_permeability} label={gasLabel(m.gas_permeability)} /> },
  { label: "Moisture Barrier", render: (m) => <Rating value={m.moisture_barrier} label={ratingLabel(m.moisture_barrier)} /> },
  { label: "Oxygen Barrier", render: (m) => <Rating value={m.oxygen_barrier} label={ratingLabel(m.oxygen_barrier)} /> },
  { label: "MAP Suitability", render: (m) => <Rating value={m.map_suitability} label={ratingLabel(m.map_suitability)} /> },
  { label: "Cost", render: (m) => <span>{costLabel(m.relative_cost)}</span> },
  { label: "Recyclability", render: (m) => <Bool value={m.recyclable} /> },
  { label: "Biodegradability", render: (m) => <Bool value={m.biodegradable} /> },
  { label: "Storage", render: (m) => <span className="capitalize">{m.suitable_storage_types.join(", ")}</span> },
];

interface Props {
  materials: Material[];
  recommendedId?: number;
  scores: Record<number, number>;
}

export const ComparisonTable = ({ materials, recommendedId, scores }: Props) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm" data-testid="comparison-table">
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="w-48 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Property</th>
          {materials.map((m, i) => (
            <th key={m.id} className={cx("px-5 py-4 align-top", m.id === recommendedId && "bg-emerald-50/70")} data-testid={`comparison-column-${i}`}>
              {m.id === recommendedId && <Badge tone="emerald" className="mb-2">Recommended</Badge>}
              <p className="text-base font-semibold text-slate-900">{m.material_name}</p>
              <p className="text-xs font-normal text-slate-500">{m.material_category}</p>
              {scores[m.id] !== undefined && (
                <p className="mt-2 font-mono-tech text-lg font-bold text-emerald-700" data-testid={`comparison-score-${i}`}>
                  {scores[m.id].toFixed(1)} <span className="text-xs font-medium text-slate-500">suitability</span>
                </p>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row) => (
          <tr key={row.label} className="border-b border-slate-100 last:border-0">
            <th className="bg-slate-50 px-5 py-3 text-sm font-medium text-slate-600">{row.label}</th>
            {materials.map((m) => (
              <td key={m.id} className={cx("px-5 py-3 text-slate-800", m.id === recommendedId && "bg-emerald-50/40")}>
                {row.render(m)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
