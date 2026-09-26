import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Beaker } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "../components/layout/Layout";
import { ErrorBanner, PageHeader } from "../components/common/Feedback";
import { Button } from "../components/common/Button";
import { FoodInfoSection } from "../components/analysis/FoodInfoSection";
import { StorageSection } from "../components/analysis/StorageSection";
import { PreferencesSection } from "../components/analysis/PreferencesSection";
import { AnalysisSummaryPanel } from "../components/analysis/AnalysisSummaryPanel";
import { AnalysisLoader, ANALYSIS_STAGES } from "../components/analysis/AnalysisLoader";
import { useAnalysis } from "../hooks/AnalysisContext";
import { FoodImageUpload } from "../components/analysis/FoodImageUpload";
import { api, ApiError, toApiError } from "../services/api";
import type { AnalysisForm, FormErrors, StorageType } from "../types";
import { DEFAULT_FORM, FOOD_DEMOS, DemoScenario, STORAGE_DEFAULT_TEMP } from "../utils/constants";
import { mapBackendField, toRequest, validateForm } from "../utils/validation";

const STAGE_MS = 650;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function AnalysisPage() {
  const { form: savedForm, saveAnalysis } = useAnalysis();
  const [form, setForm] = useState<AnalysisForm>({ ...DEFAULT_FORM, ...savedForm, commodity: savedForm?.commodity === 'Other' ? savedForm.customCommodity : savedForm?.commodity ?? '', image_id: null, image_confirmed: false });
  const [imageBusy, setImageBusy] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [stage, setStage] = useState<number | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const update = <K extends keyof AnalysisForm>(key: K, value: AnalysisForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onCommodityChange = (name: string) => {
    setForm((f) => ({ ...f, commodity: name, image_confirmed: false }));
    setErrors((e) => ({ ...e, commodity: undefined }));
  };

  const onStorageChange = (value: StorageType) => {
    setForm((f) => ({ ...f, storage_type: value, temperature: String(STORAGE_DEFAULT_TEMP[value]) }));
    setErrors((e) => ({ ...e, temperature: undefined }));
  };

  const loadScenario = (scenario: DemoScenario) => {
    setForm(scenario.form);
    setImageKey((k) => k + 1);
    setErrors({});
    setApiError(null);
    toast.success(`Demo loaded: ${scenario.description}`);
  };

  const reset = () => {
    setForm(DEFAULT_FORM);
    setImageKey((k) => k + 1);
    setErrors({});
    setApiError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (imageBusy || stage !== null) return;
    const found = validateForm(form);
    if (Object.keys(found).length) {
      setErrors(found);
      toast.error("Please correct the highlighted fields");
      document.getElementById(Object.keys(found)[0])?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setApiError(null);
    setStage(0);
    const timer = window.setInterval(
      () => setStage((s) => (s === null ? s : Math.min(s + 1, ANALYSIS_STAGES.length - 1))),
      STAGE_MS,
    );
    try {
      const [result] = await Promise.all([api.recommend(toRequest(form)), wait(STAGE_MS * ANALYSIS_STAGES.length)]);
      saveAnalysis(form, result);
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      navigate("/results");
    } catch (err) {
      const apiErr = toApiError(err);
      setApiError(apiErr);
      const fieldErrors: FormErrors = {};
      apiErr.fieldErrors.forEach((fe) => {
        const key = mapBackendField(fe.field);
        if (key) fieldErrors[key] = fe.message;
      });
      setErrors(fieldErrors);
      toast.error(apiErr.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      window.clearInterval(timer);
      setStage(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Step 1 · Input"
        title="Packaging Analysis"
        subtitle="Tell us what food you have and the outcome you want. AI builds a typical food profile, then evaluates packaging against your practical requirements."
        actions={
          <Button variant="secondary" disabled={imageBusy} onClick={() => loadScenario(FOOD_DEMOS[0])} data-testid="load-demo-button">
            <Beaker className="h-4 w-4 text-emerald-600" /> Load Demo Example
          </Button>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm" data-testid="demo-scenarios">
        <span className="mr-1 text-slate-500">Demo examples:</span>
        {FOOD_DEMOS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => loadScenario(s)}
            disabled={imageBusy}
            title={s.description}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-700"
            data-testid={`demo-scenario-${s.id}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {apiError && (
        <div className="mt-6">
          <ErrorBanner
            title={apiError.code === "no_compatible_material" ? "No compatible material" : "Analysis could not be completed"}
            message={apiError.message}
            testId="analysis-error-banner"
          >
            {apiError.fieldErrors.filter((f) => !f.field).map((f) => (
              <p key={f.message}>• {f.message}</p>
            ))}
            {apiError.excluded.map((ex) => (
              <p key={ex.material_id} className="text-xs">
                • <span className="font-semibold">{ex.material_name}</span>: {ex.reasons.join("; ")}
              </p>
            ))}
          </ErrorBanner>
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3" data-testid="analysis-form">
        <div className="space-y-6 lg:col-span-2">
          <FoodInfoSection form={form} errors={errors} onCommodityChange={onCommodityChange} />
          <FoodImageUpload key={imageKey} foodName={form.commodity} confirmed={form.image_confirmed ?? false}
            onConfirm={(confirmed) => { update('image_confirmed', confirmed); setErrors((e) => ({...e, commodity: undefined})); }} onBusy={setImageBusy}
            onIdentification={(image) => setForm((f) => ({...f, image_id: image?.image_id ?? null, image_confirmed: false, commodity: image?.food_name ?? f.commodity}))} />
          <StorageSection form={form} errors={errors} update={update} onStorageChange={onStorageChange} />
          <PreferencesSection form={form} update={update} />
        </div>
        <div>
          <AnalysisSummaryPanel form={form} submitting={stage !== null || imageBusy} onReset={reset} />
        </div>
      </form>

      {stage !== null && <AnalysisLoader stage={stage} />}
    </PageContainer>
  );
}
