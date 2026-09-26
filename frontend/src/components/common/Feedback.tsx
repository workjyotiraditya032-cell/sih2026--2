import { ReactNode } from "react";
import { AlertTriangle, Database, DatabaseZap } from "lucide-react";
import { Badge } from "./Card";
import type { DataSource } from "../../types";

export const DataSourceBadge = ({ source }: { source?: DataSource }) => {
  if (!source) return null;
  const isConnected = source === "mongodb" || source === "postgresql";
  const label = source === "mongodb" ? "Source: MongoDB Atlas" : source === "postgresql" ? "Source: PostgreSQL" : "Fallback reference data";
  return isConnected ? (
    <Badge tone="emerald" data-testid="data-source-badge">
      <Database className="h-3 w-3" /> {label}
    </Badge>
  ) : (
    <Badge tone="amber" data-testid="data-source-badge" title="Database unavailable; built-in reference data used">
      <DatabaseZap className="h-3 w-3" /> Fallback reference data
    </Badge>
  );
};

interface ErrorBannerProps {
  title?: string;
  message: string;
  children?: ReactNode;
  onRetry?: () => void;
  testId?: string;
}

export const ErrorBanner = ({ title = "Something went wrong", message, children, onRetry, testId = "error-banner" }: ErrorBannerProps) => (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert" data-testid={testId}>
    <div className="flex items-start gap-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1 space-y-1">
        <p className="font-semibold">{title}</p>
        <p>{message}</p>
        {children}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline underline-offset-2" data-testid={`${testId}-retry`}>
          Retry
        </button>
      )}
    </div>
  </div>
);

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ eyebrow, title, subtitle, actions }: PageHeaderProps) => (
  <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-2xl space-y-2">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{eyebrow}</p>}
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl" data-testid="page-title">
        {title}
      </h1>
      {subtitle && <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </div>
);
