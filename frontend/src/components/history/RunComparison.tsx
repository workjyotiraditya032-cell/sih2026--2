import { useQueries } from "@tanstack/react-query";
import { GitCompareArrows, X } from "lucide-react";
import { analysisQuery } from "../../hooks/useApiData";
import type { RecommendationResponse } from "../../types";
import { cx, titleCase } from "../../utils/format";
import { Card } from "../common/Card";

type Row = { label: string; value: (r: RecommendationResponse) => string; group: "Inputs" | "Outcome" };

const ROWS: Row[] = [
  { group: "Inputs", label: "Commodity", value: (r) => r.input.commodity },
  { group: "Inputs", label: "Food category", value: (r) => r.input.food_category },
  { group: "Inputs", label: "Moisture / oil (reference)", value: (r) => r.intelligence ? `${r.intelligence.food_profile.properties.moisture.value} / ${r.intelligence.food_profile.properties.fat.value}` : `${r.input.moisture_content}% / ${r.input.oil_content}% (legacy input)` },
  { group: "Inputs", label: "pH (reference range)", value: (r) => r.intelligence?.food_profile.properties.ph.value ?? `${r.input.ph} (legacy input)` },
  { group: "Inputs", label: "Respiration", value: (r) => titleCase(r.input.respiration_rate) },
  { group: "Inputs", label: "Moisture sensitivity", value: (r) => titleCase(r.input.moisture_sensitivity) },
  { group: "Inputs", label: "Oxygen sensitivity", value: (r) => titleCase(r.input.oxygen_sensitivity) },
  { group: "Inputs", label: "Shelf life", value: (r) => `${r.input.shelf_life_days} days` },
  { group: "Inputs", label: "Storage", value: (r) => `${titleCase(r.input.storage_type)} · ${r.input.temperature} °C` },
  { group: "Inputs", label: "Relative humidity", value: (r) => `${r.input.relative_humidity}%${r.intelligence ? ' (scenario assumption)' : ' (legacy input)'}` },
  { group: "Inputs", label: "Transport", value: (r) => titleCase(r.input.transportation) },
  { group: "Inputs", label: "Cost priority", value: (r) => titleCase(r.input.cost_priority) },
  { group: "Inputs", label: "Sustainability", value: (r) => titleCase(r.input.sustainability_priority) },
  { group: "Inputs", label: "MAP required", value: (r) => (r.input.map_required === null ? "Not sure" : r.input.map_required ? "Yes" : "No") },
  { group: "Outcome", label: "AI / fallback mode", value: (r) => r.intelligence?.mode === 'ai' ? 'Groq AI + knowledge base' : r.intelligence ? 'Knowledge-base fallback' : 'Legacy weighted engine' },
  { group: "Outcome", label: "Food data source", value: (r) => r.intelligence ? titleCase(r.intelligence.food_profile.provenance) : 'Legacy user inputs' },
  { group: "Outcome", label: "Recommended material", value: (r) => r.recommended_material.material_name },
  { group: "Outcome", label: "Suitability score", value: (r) => r.suitability_score.toFixed(1) },
  { group: "Outcome", label: "Alternative 1", value: (r) => (r.alternatives[0] ? `${r.alternatives[0].material.material_name} (${r.alternatives[0].suitability_score.toFixed(1)})` : "—") },
  { group: "Outcome", label: "Alternative 2", value: (r) => (r.alternatives[1] ? `${r.alternatives[1].material.material_name} (${r.alternatives[1].suitability_score.toFixed(1)})` : "—") },
  { group: "Outcome", label: "Materials filtered out", value: (r) => String(r.excluded_materials.length) },
];

export const RunComparison = ({ ids, onClose, onOpen }: { ids: number[]; onClose: () => void; onOpen: (id: number) => void }) => {
  const queries = useQueries({ queries: ids.map((id) => analysisQuery(id)) });
  const runs = queries.map((q) => q.data).filter((r): r is RecommendationResponse => Boolean(r));
  const loading = queries.some((q) => q.isLoading);
  const failed = queries.find((q) => q.error);

  return (
    <Card className="overflow-hidden" data-testid="run-comparison">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <GitCompareArrows className="h-5 w-5 text-emerald-600" />
          <div>
            <h3 className="font-semibold text-slate-900">Run Comparison</h3>
            <p className="text-sm text-slate-500">Rows where the runs differ are highlighted</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close comparison" data-testid="run-comparison-close-button">
          <X className="h-5 w-5" />
        </button>
      </div>
      {loading && <div className="m-6 h-40 animate-pulse rounded-lg bg-slate-100" />}
      {failed && <p className="p-6 text-sm text-red-600">{(failed.error as Error).message}</p>}
      {!loading && runs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="w-48 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Parameter</th>
                {runs.map((r) => (
                  <th key={r.analysis_id} className="px-5 py-3 align-top" data-testid={`run-comparison-column-${r.analysis_id}`}>
                    <p className="font-mono-tech text-sm font-bold text-slate-900">Run #{r.analysis_id}</p>
                    <p className="text-xs font-normal text-slate-500">{new Date(r.generated_at).toLocaleString()}</p>
                    <button onClick={() => onOpen(r.analysis_id as number)} className="mt-1 text-xs font-semibold text-emerald-700 hover:underline" data-testid={`run-comparison-open-${r.analysis_id}`}>
                      Open result
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, idx) => {
                const values = runs.map(row.value);
                const differs = new Set(values).size > 1;
                const groupStart = idx === 0 || ROWS[idx - 1].group !== row.group;
                return (
                  <tr key={row.label} className={cx("border-b border-slate-100", groupStart && idx > 0 && "border-t-2 border-t-slate-200")} data-testid={`run-comparison-row-${idx}`}>
                    <th className={cx("px-5 py-2.5 text-sm font-medium", differs ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-600")}>
                      {groupStart && <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">{row.group}</span>}
                      {row.label}
                    </th>
                    {values.map((v, i) => (
                      <td key={i} className={cx("px-5 py-2.5", differs ? "font-semibold text-slate-900" : "text-slate-700", row.group === "Outcome" && "font-mono-tech")}>
                        {v}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
