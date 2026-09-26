import { ButtonHTMLAttributes } from "react";
import { Link, LinkProps } from "react-router-dom";
import { cx } from "../../utils/format";

type Variant = "primary" | "secondary" | "ghost" | "dark";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  dark: "bg-slate-900 text-white hover:bg-slate-800",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cx(BASE, VARIANTS[variant], SIZES[size], className);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = ({ variant, size, className, type = "button", ...props }: ButtonProps) => (
  <button type={type} className={buttonClass(variant, size, className)} {...props} />
);

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
}

export const ButtonLink = ({ variant, size, className, ...props }: ButtonLinkProps) => (
  <Link className={buttonClass(variant, size, className as string | undefined)} {...props} />
);
