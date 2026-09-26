import { FlaskConical, RotateCcw, Sparkles } from "lucide-react";
import type { AnalysisForm } from "../../types";
import { commodityName } from "../../utils/validation";
import { PRIORITY_OPTIONS, SHELF_UNITS, STORAGE_OPTIONS, TRANSPORT_OPTIONS } from "../../utils/constants";
import { Button } from "../common/Button";
import { Card } from "../common/Card";

const label = <T extends string>(opts: { value: T; label: string }[], v: T) => opts.find((o) => o.value === v)?.label ?? v;

interface Props {
  form: AnalysisForm;
  submitting: boolean;
  onReset: () => void;
}

export const AnalysisSummaryPanel = ({ form, submitting, onReset }: Props) => {
  const rows: [string, string][] = [
    ["Commodity", commodityName(form) || "—"],
    ["Food profile", "Built automatically"],
    ["Shelf life", form.shelf_life_value ? `${form.shelf_life_value} ${label(SHELF_UNITS, form.shelf_life_unit).toLowerCase()}` : "—"],
    ["Storage", `${label(STORAGE_OPTIONS, form.storage_type)} · ${form.temperature || "—"} °C`],
    ["Transport", label(TRANSPORT_OPTIONS, form.transportation)],
    ["Priority", label(PRIORITY_OPTIONS, form.priority ?? 'balanced')],
  ];
  return (
    <Card className="p-5 sm:p-6 lg:sticky lg:top-24" data-testid="analysis-summary-panel">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <FlaskConical className="h-4 w-4 text-emerald-600" /> Analysis Summary
      </div>
      <dl className="mt-4 divide-y divide-slate-100 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 py-2">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-right font-medium capitalize text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 grid gap-2">
        <Button type="submit" size="lg" disabled={submitting} data-testid="analyze-packaging-button">
          <Sparkles className="h-4 w-4" /> Analyze &amp; Recommend
        </Button>
        <Button variant="ghost" onClick={onReset} disabled={submitting} data-testid="reset-form-button">
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Groq reasoning + reference food knowledge + multi-parameter compatibility. If AI is unavailable, a clearly labelled knowledge-base result keeps your analysis working.
      </p>
    </Card>
  );
};
