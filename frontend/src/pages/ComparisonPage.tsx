import { useMemo, useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { PageContainer } from "../components/layout/Layout";
import { DataSourceBadge, ErrorBanner, PageHeader } from "../components/common/Feedback";
import { ButtonLink } from "../components/common/Button";
import { SelectInput } from "../components/common/FormControls";
import { ComparisonTable } from "../components/comparison/ComparisonTable";
import { useAnalysis } from "../hooks/AnalysisContext";
import { useMaterials } from "../hooks/useApiData";
import type { Material } from "../types";

export default function ComparisonPage() {
  const { result } = useAnalysis();
  const { data, isLoading, error, refetch } = useMaterials();
  const [picked, setPicked] = useState<number[] | null>(null);

  const defaults = useMemo(() => {
    if (result) return [result.recommended_material.id, ...result.alternatives.map((a) => a.material.id)];
    return (data?.materials ?? []).slice(0, 3).map((m) => m.id);
  }, [result, data]);

  const ids = picked ?? defaults;
  const byId = new Map<number, Material>((data?.materials ?? []).map((m) => [m.id, m]));
  if (result) {
    [result.recommended_material, ...result.alternatives.map((a) => a.material)].forEach((m) => byId.has(m.id) || byId.set(m.id, m));
  }
  const selected = ids.map((id) => byId.get(id)).filter((m): m is Material => Boolean(m));
  const scores: Record<number, number> = Object.fromEntries((result?.ranking ?? []).map((r) => [r.material_id, r.suitability_score]));
  const options = Array.from(byId.values()).map((m) => ({ value: String(m.id), label: m.material_name }));

  const change = (slot: number, value: string) => {
    const next = [...ids];
    next[slot] = Number(value);
    setPicked(next);
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Step 3 · Compare"
        title="Material Comparison"
        subtitle={result ? `Top 3 ranked materials for ${result.input.commodity}. Swap any column to compare other materials.` : "Select up to three materials to compare side by side."}
        actions={
          result ? (
            <ButtonLink to="/results" variant="secondary" data-testid="comparison-back-button">
              <ArrowLeft className="h-4 w-4" /> Back to Results
            </ButtonLink>
          ) : (
            <ButtonLink to="/analysis" data-testid="comparison-start-analysis-button">Run an Analysis</ButtonLink>
          )
        }
      />

      {!result && (
        <p className="mt-6 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800" data-testid="comparison-no-result-note">
          <Info className="h-4 w-4" /> No analysis yet, so suitability scores are hidden. Run an analysis to compare your top 3 recommendations.
        </p>
      )}
      {error && <div className="mt-6"><ErrorBanner message={(error as Error).message} onRetry={() => refetch()} /></div>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3" data-testid="comparison-pickers">
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor={`compare-slot-${slot}`}>
              Material {String.fromCharCode(65 + slot)}
            </label>
            <SelectInput id={`compare-slot-${slot}`} value={ids[slot] ? String(ids[slot]) : ""} options={options} onChange={(v) => change(slot, v)} placeholder="Select material" />
          </div>
        ))}
      </div>

      <div className="mt-6">
        {isLoading && !selected.length ? (
          <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <ComparisonTable materials={selected} recommendedId={result?.recommended_material.id} scores={scores} />
        )}
      </div>
      <div className="mt-4"><DataSourceBadge source={data?.data_source} /></div>
    </PageContainer>
  );
}
