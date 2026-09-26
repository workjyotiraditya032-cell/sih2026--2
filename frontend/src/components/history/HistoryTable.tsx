import { ReactNode } from "react";
import { Download, FolderOpen, Loader2 } from "lucide-react";
import type { AnalysisSummary } from "../../types";
import { cx, titleCase } from "../../utils/format";
import { Badge } from "../common/Card";

interface Props {
  analyses: AnalysisSummary[];
  selected: number[];
  busyId: string | null;
  onToggle: (id: number) => void;
  onOpen: (id: number) => void;
  onDownload: (id: number) => void;
}

const ActionButton = ({ busy, onClick, icon, label, testId }: { busy: boolean; onClick: () => void; icon: ReactNode; label: string; testId: string }) => (
  <button
    onClick={onClick}
    disabled={busy}
    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60"
    data-testid={testId}
  >
    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon} {label}
  </button>
);

export const HistoryTable = ({ analyses, selected, busyId, onToggle, onOpen, onDownload }: Props) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm" data-testid="history-table">
    <table className="w-full min-w-[880px] text-left text-sm">
      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <tr>
          <th className="w-10 px-4 py-3" />
          <th className="px-4 py-3">Run</th>
          <th className="px-4 py-3">Commodity</th>
          <th className="px-4 py-3">Conditions</th>
          <th className="px-4 py-3">Recommended</th>
          <th className="px-4 py-3 text-right">Score</th>
          <th className="px-4 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {analyses.map((a) => {
          const checked = selected.includes(a.id);
          return (
            <tr key={a.id} className={cx("transition-colors", checked ? "bg-emerald-50/50" : "hover:bg-slate-50")} data-testid={`history-row-${a.id}`}>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(a.id)}
                  className="h-4 w-4 cursor-pointer accent-emerald-600"
                  aria-label={`Select run ${a.id} for comparison`}
                  data-testid={`history-select-${a.id}`}
                />
              </td>
              <td className="px-4 py-3">
                <p className="font-mono-tech text-xs font-semibold text-slate-900">#{a.id}</p>
                <p className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</p>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{a.commodity}</p>
                <p className="text-xs text-slate-500">{a.food_category}</p>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {a.storage_type ? titleCase(a.storage_type) : "—"} · {a.temperature ?? "—"} °C · {a.relative_humidity ?? "—"}% RH
                <br />
                {a.shelf_life_days ?? "—"}-day target
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{a.recommended_material}</p>
                {!a.has_snapshot && <Badge tone="amber" className="mt-1" title="Created before snapshots were stored; recomputed with current data on open">Legacy run</Badge>}
              </td>
              <td className="px-4 py-3 text-right font-mono-tech text-base font-bold text-slate-900">{a.suitability_score.toFixed(1)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <ActionButton busy={busyId === `open-${a.id}`} onClick={() => onOpen(a.id)} icon={<FolderOpen className="h-3.5 w-3.5" />} label="Open" testId={`history-open-${a.id}`} />
                  <ActionButton busy={busyId === `pdf-${a.id}`} onClick={() => onDownload(a.id)} icon={<Download className="h-3.5 w-3.5" />} label="PDF" testId={`history-pdf-${a.id}`} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
