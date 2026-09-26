import { useEffect, useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { PageContainer } from "../components/layout/Layout";
import { DataSourceBadge, ErrorBanner, PageHeader } from "../components/common/Feedback";
import { MaterialCard } from "../components/materials/MaterialCard";
import { MaterialFilters } from "../components/materials/MaterialFilters";
import { MaterialDetailDrawer } from "../components/materials/MaterialDetailDrawer";
import { useMaterials } from "../hooks/useApiData";
import type { MaterialFilters as Filters } from "../types";

export default function MaterialsPage() {
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data, isLoading, isFetching, error, refetch } = useMaterials(filters);
  const { data: all } = useMaterials();

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: searchText.trim() || undefined })), 350);
    return () => clearTimeout(t);
  }, [searchText]);

  const categories = useMemo(
    () => Array.from(new Set((all?.materials ?? []).map((m) => m.material_category))).sort(),
    [all],
  );

  const reset = () => {
    setSearchText("");
    setFilters({});
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Knowledge base"
        title="Packaging Material Library"
        subtitle="Structured packaging-material data used by the recommendation engine. Values are reference / prototype ranges, not laboratory-validated results."
        actions={<DataSourceBadge source={data?.data_source} />}
      />
      <div className="mt-8">
        <MaterialFilters
          searchText={searchText}
          onSearchText={setSearchText}
          onSearch={() => setFilters((f) => ({ ...f, search: searchText.trim() || undefined }))}
          filters={filters}
          onChange={setFilters}
          onReset={reset}
          categories={categories}
        />
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
        <span data-testid="material-results-count">
          {data ? `${data.count} of ${all?.count ?? data.count} materials` : "Loading materials…"}
          {isFetching && data ? " · updating" : ""}
        </span>
      </div>

      {error && <div className="mt-4"><ErrorBanner message={(error as Error).message} onRetry={() => refetch()} /></div>}

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" data-testid="material-grid">
        {isLoading && Array.from({ length: 6 }, (_, i) => <div key={i} className="h-80 animate-pulse rounded-xl bg-slate-100" />)}
        {data?.materials.map((m) => <MaterialCard key={m.id} material={m} onView={() => setSelectedId(m.id)} />)}
      </div>

      {data && data.count === 0 && (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center" data-testid="material-empty-state">
          <SearchX className="h-8 w-8 text-slate-400" />
          <p className="mt-3 font-medium text-slate-800">No materials match these filters</p>
          <button onClick={reset} className="mt-2 text-sm font-semibold text-emerald-700" data-testid="material-empty-reset-button">Clear filters</button>
        </div>
      )}

      <MaterialDetailDrawer materialId={selectedId} onClose={() => setSelectedId(null)} />
    </PageContainer>
  );
}
