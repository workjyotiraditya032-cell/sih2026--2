import { useNavigate } from "react-router-dom";
import { ArrowLeft, Columns3, FileDown, FlaskConical, History, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { downloadRecommendationReport } from "../utils/report";
import { PageContainer } from "../components/layout/Layout";
import { DataSourceBadge, PageHeader } from "../components/common/Feedback";
import { Button, ButtonLink } from "../components/common/Button";
import { Badge, Card } from "../components/common/Card";
import { RecommendationHero } from "../components/results/RecommendationHero";
import { SpecificationGrid } from "../components/results/SpecificationGrid";
import { ScoreBreakdown, WhyThisMaterial } from "../components/results/Explainability";
import { DecisionFactors, RequirementsPanel } from "../components/results/DecisionFactors";
import { AlternativesSection, RankingPanel } from "../components/results/Alternatives";
import { useAnalysis } from "../hooks/AnalysisContext";
import { IntelligenceStatus, FoodIntelligenceCard, IntelligenceCautions } from '../components/results/FoodIntelligence';
import { DEFAULT_FORM } from "../utils/constants";

const EmptyState = () => (
  <PageContainer>
    <Card className="mx-auto max-w-xl p-10 text-center" data-testid="results-empty-state">
      <FlaskConical className="mx-auto h-10 w-10 text-emerald-600" />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">No analysis yet</h1>
      <p className="mt-2 text-sm text-slate-600">Run a packaging analysis to see a ranked, explainable recommendation.</p>
      <ButtonLink to="/analysis" className="mt-6" data-testid="results-start-analysis-button">Start Packaging Analysis</ButtonLink>
    </Card>
  </PageContainer>
);

export default function ResultsPage() {
  const { result, saveAnalysis } = useAnalysis();
  const navigate = useNavigate();
  if (!result) return <EmptyState />;

  const tryAnother = () => {
    saveAnalysis(DEFAULT_FORM, result);
    navigate("/analysis");
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow={`Step 2 · Result · ${result.input.commodity}`}
        title="Packaging Recommendation"
        subtitle={`${result.input.food_category} · ${result.input.storage_type} at ${result.input.temperature} °C · ${result.input.shelf_life_days}-day target (not a prediction)`}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate("/analysis")} data-testid="back-to-analysis-button">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                downloadRecommendationReport(result);
                toast.success("PDF report downloaded");
              }}
              data-testid="download-pdf-report-button"
            >
              <FileDown className="h-4 w-4" /> Download PDF
            </Button>
            <Button variant="secondary" onClick={tryAnother} data-testid="try-another-analysis-button">
              <RefreshCw className="h-4 w-4" /> Try Another Analysis
            </Button>
            <ButtonLink to="/compare" data-testid="compare-materials-button">
              <Columns3 className="h-4 w-4" /> Compare Materials
            </ButtonLink>
          </>
        }
      />
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <DataSourceBadge source={result.data_source} />
        {result.history_source && (
          <Badge tone="blue" data-testid="history-source-badge">
            <History className="h-3 w-3" /> Reopened from history
            {result.history_source === "recomputed" ? " · recomputed with current data" : " · stored snapshot"}
          </Badge>
        )}
        <span>Engine {result.engine_version}</span>
        {result.analysis_id && <span data-testid="analysis-id">Analysis #{result.analysis_id}</span>}
        <span>{new Date(result.generated_at).toLocaleString()}</span>
      </div>

      <div className="mt-8 space-y-8">
        {result.intelligence && <IntelligenceStatus intelligence={result.intelligence} />}
        <RecommendationHero result={result} />
        {result.intelligence && <FoodIntelligenceCard intelligence={result.intelligence} />}
        <SpecificationGrid specs={result.specifications} />
        {result.intelligence && <IntelligenceCautions intelligence={result.intelligence} />}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <WhyThisMaterial reasons={result.reasons} tradeoffs={result.tradeoffs} />
          <ScoreBreakdown components={result.score_breakdown} />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DecisionFactors factors={result.key_factors} />
          </div>
          <RequirementsPanel req={result.requirements} />
        </div>
        <AlternativesSection alternatives={result.alternatives} />
        <RankingPanel ranking={result.ranking} excluded={result.excluded_materials} />
        <p className="border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500" data-testid="results-disclaimer">
          {result.disclaimer} Material properties are reference / prototype values.
        </p>
      </div>
    </PageContainer>
  );
}
