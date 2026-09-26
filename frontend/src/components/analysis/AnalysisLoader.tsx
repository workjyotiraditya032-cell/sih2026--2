import { CheckCircle2, Loader2 } from "lucide-react";
import { cx } from "../../utils/format";

export const ANALYSIS_STAGES = [
  "Identifying food...",
  "Building food profile...",
  "Analyzing packaging compatibility...",
  "Generating recommendation...",
];

export const AnalysisLoader = ({ stage }: { stage: number }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm" data-testid="analysis-loader">
    <div className="fade-up w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Recommendation engine</p>
      <h3 className="mt-1 text-xl font-semibold text-slate-900">Processing your analysis</h3>
      <ol className="mt-6 space-y-4">
        {ANALYSIS_STAGES.map((label, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <li key={label} className="flex items-center gap-3" data-testid={`analysis-stage-${i}`}>
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : active ? (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              ) : (
                <span className="h-5 w-5 rounded-full border-2 border-slate-200" />
              )}
              <span className={cx("text-sm", done ? "text-slate-500" : active ? "font-semibold text-slate-900" : "text-slate-400")}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${((stage + 1) / ANALYSIS_STAGES.length) * 100}%` }} />
      </div>
    </div>
  </div>
);
