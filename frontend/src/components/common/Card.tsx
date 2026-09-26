import { HTMLAttributes, ReactNode } from "react";
import { cx } from "../../utils/format";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cx("rounded-xl border border-slate-200 bg-white shadow-sm", className)} {...props} />
);

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export const CardHeader = ({ title, subtitle, icon, action }: CardHeaderProps) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
    <div className="flex items-start gap-3">
      {icon && <div className="mt-0.5 text-emerald-600">{icon}</div>}
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

type Tone = "emerald" | "blue" | "slate" | "amber" | "red";

const TONES: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
};

export const Badge = ({ tone = "slate", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) => (
  <span
    className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", TONES[tone], className)}
    {...props}
  />
);

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{children}</p>
);
