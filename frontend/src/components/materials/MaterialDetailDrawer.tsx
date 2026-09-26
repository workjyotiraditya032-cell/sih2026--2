import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useMaterial } from "../../hooks/useApiData";
import { costLabel, formatRange, gasLabel, ratingLabel } from "../../utils/format";
import { Badge } from "../common/Card";
import { Drawer } from "../common/Drawer";
import { DataSourceBadge, ErrorBanner } from "../common/Feedback";
import { RatingBar } from "../common/Indicators";

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
    <dt className="text-slate-500">{label}</dt>
    <dd className="text-right font-medium text-slate-900">{children}</dd>
  </div>
);

const Rated = ({ value, label }: { value: number; label: string }) => (
  <span className="inline-flex items-center gap-2">
    <span className="text-xs text-slate-600">{label}</span>
    <RatingBar value={value} />
  </span>
);

export const MaterialDetailDrawer = ({ materialId, onClose }: { materialId: number | null; onClose: () => void }) => {
  const { data, isLoading, error } = useMaterial(materialId);
  const m = data?.material;

  return (
    <Drawer open={materialId !== null} onClose={onClose} title={m?.material_name ?? "Material details"} testId="material-detail-drawer">
      {isLoading && <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />}
      {error && <ErrorBanner message={(error as Error).message} />}
      {m && (
        <div className="space-y-6" data-testid="material-detail-content">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="slate">{m.material_category}</Badge>
              <DataSourceBadge source={data?.data_source} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{m.description}</p>
          </div>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Barrier & Physical Properties</h3>
            <dl className="mt-2 divide-y divide-slate-100">
              <Row label="OTR"><span className="font-mono-tech">{formatRange(m.otr_min, m.otr_max, "cm³/m²·day")}</span></Row>
              <Row label="WVTR"><span className="font-mono-tech">{formatRange(m.wvtr_min, m.wvtr_max, "g/m²·day")}</span></Row>
              <Row label="Thickness"><span className="font-mono-tech">{formatRange(m.min_thickness, m.max_thickness, "µm")}</span></Row>
              <Row label="Moisture barrier"><Rated value={m.moisture_barrier} label={ratingLabel(m.moisture_barrier)} /></Row>
              <Row label="Oxygen barrier"><Rated value={m.oxygen_barrier} label={ratingLabel(m.oxygen_barrier)} /></Row>
              <Row label="Gas permeability"><Rated value={m.gas_permeability} label={gasLabel(m.gas_permeability)} /></Row>
              <Row label="Sealability"><Rated value={m.sealability} label={ratingLabel(m.sealability)} /></Row>
              <Row label="Mechanical strength"><Rated value={m.mechanical_strength} label={ratingLabel(m.mechanical_strength)} /></Row>
              <Row label="MAP suitability"><Rated value={m.map_suitability} label={ratingLabel(m.map_suitability)} /></Row>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Compatibility & Sustainability</h3>
            <dl className="mt-2 divide-y divide-slate-100">
              <Row label="Food categories">{m.suitable_food_categories.join(", ")}</Row>
              <Row label="Storage types"><span className="capitalize">{m.suitable_storage_types.join(", ")}</span></Row>
              <Row label="Transparency">{m.transparency ?? 'Grade-dependent'}</Row>
              <Row label="Food forms">{m.product_forms?.join(', ')}</Row>
              <Row label="Packaging structure">{m.packaging_structure}</Row>
              <Row label="Recyclable">{m.recyclable ? "Yes" : "No"}</Row>
              <Row label="Biodegradable">{m.biodegradable ? "Yes" : "No"}</Row>
              <Row label="Relative cost">{costLabel(m.relative_cost)} ({m.relative_cost}/5)</Row>
            </dl>
          </section>

          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900" data-testid="material-food-contact-note">{m.food_contact_suitability}</p>
          {m.notes && (
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</p>
              {m.notes}
            </section>
          )}
          <p className="text-xs text-slate-500">
            Reference / prototype property data using indicative ranges. OTR at 23 °C, 0% RH; WVTR at 38 °C, 90% RH.
          </p>
        </div>
      )}
    </Drawer>
  );
};
