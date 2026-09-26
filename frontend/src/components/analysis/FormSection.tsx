import { ReactNode } from "react";
import { Card } from "../common/Card";

interface FormSectionProps {
  index: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  testId: string;
}

export const FormSection = ({ index, title, subtitle, children, testId }: FormSectionProps) => (
  <Card className="overflow-hidden" data-testid={testId}>
    <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 font-mono-tech text-xs font-bold text-white">
        {index}
      </span>
      <div>
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">{children}</div>
  </Card>
);
