import { cx } from "../../utils/format";

export const RatingBar = ({ value, max = 5, testId }: { value: number; max?: number; testId?: string }) => (
  <div className="flex items-center gap-1" data-testid={testId} aria-label={`${value} of ${max}`}>
    {Array.from({ length: max }, (_, i) => (
      <span key={i} className={cx("h-1.5 w-5 rounded-full", i < value ? "bg-emerald-500" : "bg-slate-200")} />
    ))}
  </div>
);

export const ScoreRing = ({ score, size = 148 }: { score: number; size?: number }) => {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#059669"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono-tech text-4xl font-bold text-slate-900" data-testid="suitability-score-value">
          {score.toFixed(1)}
        </span>
        <span className="text-xs font-medium text-slate-500">out of 100</span>
      </div>
    </div>
  );
};

export const ProgressBar = ({ value, tone = "emerald" }: { value: number; tone?: "emerald" | "blue" }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
    <div
      className={cx("h-full rounded-full transition-[width] duration-700", tone === "emerald" ? "bg-emerald-500" : "bg-blue-500")}
      style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
    />
  </div>
);
