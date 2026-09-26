import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { GitCompareArrows, History, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "../components/layout/Layout";
import { ErrorBanner, PageHeader } from "../components/common/Feedback";
import { Button, ButtonLink } from "../components/common/Button";
import { inputClass } from "../components/common/FormControls";
import { HistoryTable } from "../components/history/HistoryTable";
import { RunComparison } from "../components/history/RunComparison";
import { useAnalysis } from "../hooks/AnalysisContext";
import { analysisQuery, useAnalyses } from "../hooks/useApiData";
import { toApiError } from "../services/api";
import { cx } from "../utils/format";
import { downloadRecommendationReport } from "../utils/report";
import { formFromRequest } from "../utils/validation";
import type { RecommendationResponse } from "../types";

const MAX_COMPARE = 3;

export default function HistoryPage() {
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, isLoading, isFetching, error, refetch } = useAnalyses(search);
  const { saveAnalysis } = useAnalysis();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText.trim()), 350);
    return () => clearTimeout(t);
  }, [searchText]);

  const toggle = (id: number) =>
    setSelected((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= MAX_COMPARE) {
        toast.error(`Select up to ${MAX_COMPARE} runs to compare`);
        return s;
      }
      return [...s, id];
    });

  const withAnalysis = async (key: string, id: number, action: (r: RecommendationResponse) => void) => {
    setBusyId(key);
    try {
      action(await queryClient.fetchQuery(analysisQuery(id)));
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const open = (id: number) =>
    withAnalysis(`open-${id}`, id, (r) => {
      saveAnalysis(formFromRequest(r.input), r);
      navigate("/results");
    });

  const download = (id: number) =>
    withAnalysis(`pdf-${id}`, id, (r) => {
      downloadRecommendationReport(r);
      toast.success(`PDF report for run #${id} downloaded`);
    });

  const startCompare = () => {
    setCompareIds([...selected].sort((a, b) => a - b));
    setTimeout(() => document.getElementById("run-comparison-anchor")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Saved History"
        title="Analysis History"
        subtitle="Every analysis is stored with its full result. Reopen earlier runs, download their reports, or compare up to three runs side by side."
        actions={<ButtonLink to="/analysis" data-testid="history-new-analysis-button">New Analysis</ButtonLink>}
      />

      <div className="mt-8 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Filter by commodity, category or material"
            maxLength={60}
            className={cx(inputClass(), "pl-9")}
            data-testid="history-search-input"
          />
        </div>
        <Button variant="secondary" onClick={() => refetch()} data-testid="history-refresh-button">
          <RefreshCw className={cx("h-4 w-4", isFetching && "animate-spin")} /> Refresh
        </Button>
        <Button onClick={startCompare} disabled={selected.length < 2} data-testid="history-compare-button">
          <GitCompareArrows className="h-4 w-4" /> Compare selected ({selected.length})
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-500" data-testid="history-count">
        {data ? `${data.count} run(s) shown` : ""}
        {selected.length > 0 && (
          <button onClick={() => setSelected([])} className="ml-3 font-semibold text-emerald-700" data-testid="history-clear-selection-button">
            Clear selection
          </button>
        )}
      </p>

      {error && (
        <div className="mt-6">
          <ErrorBanner title="History unavailable" message={toApiError(error).message} onRetry={() => refetch()} testId="history-error-banner" />
        </div>
      )}

      <div className="mt-4">
        {isLoading && <div className="h-64 animate-pulse rounded-xl bg-slate-100" />}
        {data && data.count > 0 && (
          <HistoryTable analyses={data.analyses} selected={selected} busyId={busyId} onToggle={toggle} onOpen={open} onDownload={download} />
        )}
        {data && data.count === 0 && (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center" data-testid="history-empty-state">
            <History className="h-8 w-8 text-slate-400" />
            <p className="mt-3 font-medium text-slate-800">{search ? "No runs match this filter" : "No analyses yet"}</p>
            <ButtonLink to="/analysis" variant="secondary" className="mt-4" data-testid="history-empty-start-button">Start Packaging Analysis</ButtonLink>
          </div>
        )}
      </div>

      <div id="run-comparison-anchor" className="mt-8 scroll-mt-24">
        {compareIds.length >= 2 && <RunComparison ids={compareIds} onClose={() => setCompareIds([])} onOpen={open} />}
      </div>
    </PageContainer>
  );
}
