import { ReactNode } from "react";
import { Droplets, Gauge, Layers, Package, ShieldCheck, Wind, Wrench, Flame } from "lucide-react";
import type { BarrierSpec, RatingSpec, Specifications } from "../../types";
import { cx, formatRange } from "../../utils/format";
import { Card, CardHeader } from "../common/Card";
import { RatingBar } from "../common/Indicators";

const STATUS: Record<BarrierSpec["status"], { label: string; className: string }> = {
  meets: { label: "Meets target", className: "bg-emerald-50 text-emerald-700" },
  partial: { label: "Partially meets", className: "bg-amber-50 text-amber-700" },
  outside: { label: "Outside target", className: "bg-red-50 text-red-700" },
  not_critical: { label: "Not critical", className: "bg-slate-100 text-slate-600" },
};

const SpecTile = ({ icon, label, children, testId }: { icon: ReactNode; label: string; children: ReactNode; testId: string }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4" data-testid={testId}>
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
      <span className="text-emerald-600">{icon}</span> {label}
    </div>
    <div className="mt-3">{children}</div>
  </div>
);

const BarrierTile = ({ label, spec, icon, testId }: { label: string; spec: BarrierSpec; icon: ReactNode; testId: string }) => (
  <SpecTile icon={icon} label={label} testId={testId}>
    <p className="font-mono-tech text-lg font-bold text-slate-900">{formatRange(spec.min, spec.max)}</p>
    <p className="text-xs text-slate-500">{spec.unit}</p>
    <p className="mt-2 text-xs text-slate-600">Target: {spec.target}</p>
    <span className={cx("mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS[spec.status].className)}>
      {STATUS[spec.status].label}
    </span>
  </SpecTile>
);

const RatingTile = ({ label, spec, icon, testId }: { label: string; spec: RatingSpec; icon: ReactNode; testId: string }) => (
  <SpecTile icon={icon} label={label} testId={testId}>
    <p className="text-base font-semibold text-slate-900">{spec.label}</p>
    <div className="mt-2 flex items-center gap-2">
      <RatingBar value={spec.rating} />
      <span className="font-mono-tech text-xs text-slate-500">{spec.rating}/5</span>
    </div>
  </SpecTile>
);

export const SpecificationGrid = ({ specs }: { specs: Specifications }) => (
  <Card data-testid="packaging-specifications">
    <CardHeader title="Packaging Specifications" subtitle={specs.test_conditions} icon={<Layers className="h-5 w-5" />} />
    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
      <BarrierTile label="OTR" spec={specs.otr} icon={<Wind className="h-4 w-4" />} testId="spec-otr" />
      <BarrierTile label="WVTR" spec={specs.wvtr} icon={<Droplets className="h-4 w-4" />} testId="spec-wvtr" />
      <SpecTile icon={<Gauge className="h-4 w-4" />} label="Recommended Thickness" testId="spec-thickness">
        <p className="font-mono-tech text-2xl font-bold text-slate-900">
          {specs.thickness.recommended} <span className="text-sm font-medium text-slate-500">{specs.thickness.unit}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Material range {formatRange(specs.thickness.min, specs.thickness.max, specs.thickness.unit)}
        </p>
      </SpecTile>
      <SpecTile icon={<Package className="h-4 w-4" />} label="Suggested Format" testId="spec-package-format">
        <p className="text-sm font-medium leading-relaxed text-slate-800">{specs.package_format}</p>
      </SpecTile>
      <RatingTile label="Sealability" spec={specs.sealability} icon={<Flame className="h-4 w-4" />} testId="spec-sealability" />
      <RatingTile label="Gas Permeability" spec={specs.gas_permeability} icon={<Wind className="h-4 w-4" />} testId="spec-gas-permeability" />
      <RatingTile label="Mechanical Strength" spec={specs.mechanical_strength} icon={<Wrench className="h-4 w-4" />} testId="spec-mechanical-strength" />
      <RatingTile label="MAP Suitability" spec={specs.map_suitability} icon={<ShieldCheck className="h-4 w-4" />} testId="spec-map-suitability" />
    </div>
  </Card>
);
