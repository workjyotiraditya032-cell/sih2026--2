import { FormEvent, ReactNode } from "react";
import { RotateCcw, Search } from "lucide-react";
import type { MaterialFilters as Filters } from "../../types";
import { FOOD_CATEGORIES, STORAGE_OPTIONS } from "../../utils/constants";
import { Button } from "../common/Button";
import { inputClass } from "../common/FormControls";
import { cx } from "../../utils/format";

interface Props {
  searchText: string;
  onSearchText: (v: string) => void;
  onSearch: () => void;
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
  categories: string[];
}

const Select = ({ id, value, onChange, children }: { id: string; value: string; onChange: (v: string) => void; children: ReactNode }) => (
  <select id={id} data-testid={`${id}-select`} value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputClass(), "cursor-pointer")}>
    {children}
  </select>
);

const boolValue = (v?: boolean) => (v === undefined ? "" : String(v));
const toBool = (v: string) => (v === "" ? undefined : v === "true");

export const MaterialFilters = ({ searchText, onSearchText, onSearch, filters, onChange, onReset, categories }: Props) => {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="material-filters">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchText}
            onChange={(e) => onSearchText(e.target.value)}
            placeholder="Search materials, e.g. laminate, breathable, EVOH"
            className={cx(inputClass(), "pl-9")}
            maxLength={60}
            data-testid="material-search-input"
          />
        </div>
        <Button type="submit" data-testid="material-search-button"><Search className="h-4 w-4" /> Search</Button>
        <Button variant="secondary" onClick={onReset} data-testid="material-filters-reset-button"><RotateCcw className="h-4 w-4" /> Reset</Button>
      </form>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Select id="filter-category" value={filters.category ?? ""} onChange={(v) => set({ category: v || undefined })}>
          <option value="">All material types</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select id="filter-food-category" value={filters.food_category ?? ""} onChange={(v) => set({ food_category: v || undefined })}>
          <option value="">Any food category</option>
          {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select id="filter-storage" value={filters.storage_type ?? ""} onChange={(v) => set({ storage_type: v || undefined })}>
          <option value="">Any storage</option>
          {STORAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select id="filter-map" value={boolValue(filters.map_suitable)} onChange={(v) => set({ map_suitable: toBool(v) })}>
          <option value="">Any MAP suitability</option>
          <option value="true">MAP suitable (≥ 4/5)</option>
          <option value="false">Limited MAP use</option>
        </Select>
        <Select id="filter-sustainability" value={filters.biodegradable ? "biodegradable" : filters.recyclable ? "recyclable" : ""} onChange={(v) => set({ recyclable: v === "recyclable" ? true : undefined, biodegradable: v === "biodegradable" ? true : undefined })}>
          <option value="">Any end-of-life</option>
          <option value="recyclable">Recyclable</option>
          <option value="biodegradable">Biodegradable</option>
        </Select>
        <Select id="filter-cost" value={filters.max_cost ? String(filters.max_cost) : ""} onChange={(v) => set({ max_cost: v ? Number(v) : undefined })}>
          <option value="">Any cost level</option>
          <option value="2">Low cost (≤ 2/5)</option>
          <option value="3">Up to medium (≤ 3/5)</option>
          <option value="4">Up to high (≤ 4/5)</option>
        </Select>
      </div>
    </div>
  );
};
