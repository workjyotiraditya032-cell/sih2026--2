import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cx } from "../../utils/format";
import type { Option } from "../../utils/constants";

export const inputClass = (error?: string) =>
  cx(
    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2",
    error
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
      : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20",
  );

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const Field = ({ label, htmlFor, error, hint, children }: FieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
      {label}
    </label>
    {children}
    {error ? (
      <p className="flex items-center gap-1 text-xs font-medium text-red-600" data-testid={`${htmlFor}-error`}>
        <AlertCircle className="h-3.5 w-3.5" /> {error}
      </p>
    ) : (
      hint && <p className="text-xs text-slate-500">{hint}</p>
    )}
  </div>
);

interface SelectInputProps<T extends string> {
  id: string;
  value: T | "";
  options: Option<T>[] | T[];
  onChange: (value: T) => void;
  error?: string;
  placeholder?: string;
}

export function SelectInput<T extends string>({ id, value, options, onChange, error, placeholder }: SelectInputProps<T>) {
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <select
      id={id}
      data-testid={`${id}-select`}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cx(inputClass(error), "cursor-pointer pr-8")}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {normalized.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

interface NumberInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  error?: string;
  step?: string;
  placeholder?: string;
}

export const NumberInput = ({ id, value, onChange, unit, error, step = "any", placeholder }: NumberInputProps) => (
  <div className="relative">
    <input
      id={id}
      data-testid={`${id}-input`}
      type="number"
      inputMode="decimal"
      step={step}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cx(inputClass(error), unit && "pr-12", "font-mono-tech")}
    />
    {unit && (
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
        {unit}
      </span>
    )}
  </div>
);

interface SegmentedProps<T extends string> {
  id: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ id, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div id={id} role="radiogroup" className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-testid={`${id}-option-${o.value}`}
            onClick={() => onChange(o.value)}
            className={cx(
              "rounded-md px-2 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
              active ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200" : "text-slate-500 hover:text-slate-800",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
