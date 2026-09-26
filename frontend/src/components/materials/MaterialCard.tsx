import { ArrowRight, Leaf, Recycle, Snowflake } from "lucide-react";
import type { Material } from "../../types";
import { costLabel, formatRange } from "../../utils/format";
import { Badge, Card } from "../common/Card";
import { RatingBar } from "../common/Indicators";

export const MaterialCard = ({ material: m, onView }: { material: Material; onView: () => void }) => (
  <Card className="flex flex-col p-5 transition-shadow duration-200 hover:shadow-md" data-testid={`material-card-${m.id}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{m.material_category}</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-900">{m.material_name}</h3>
      </div>
      <Badge tone="blue">Cost: {costLabel(m.relative_cost)}</Badge>
    </div>
    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{m.description}</p>

    <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
      <div>
        <dt className="text-slate-500">OTR (cm³/m²·day)</dt>
        <dd className="font-mono-tech font-semibold text-slate-900">{formatRange(m.otr_min, m.otr_max)}</dd>
      </div>
      <div>
        <dt className="text-slate-500">WVTR (g/m²·day)</dt>
        <dd className="font-mono-tech font-semibold text-slate-900">{formatRange(m.wvtr_min, m.wvtr_max)}</dd>
      </div>
      <div>
        <dt className="mb-1 text-slate-500">MAP suitability</dt>
        <dd><RatingBar value={m.map_suitability} /></dd>
      </div>
      <div>
        <dt className="mb-1 text-slate-500">Moisture barrier</dt>
        <dd><RatingBar value={m.moisture_barrier} /></dd>
      </div>
    </dl>

    <div className="mt-4 flex flex-wrap gap-1.5">
      {m.recyclable && <Badge tone="emerald"><Recycle className="h-3 w-3" /> Recyclable</Badge>}
      {m.biodegradable && <Badge tone="emerald"><Leaf className="h-3 w-3" /> Biodegradable</Badge>}
      {m.suitable_storage_types.includes("frozen") && <Badge tone="slate"><Snowflake className="h-3 w-3" /> Frozen-rated</Badge>}
    </div>
    <p className="mt-3 text-xs text-slate-500">
      <span className="font-medium text-slate-700">Foods:</span> {m.suitable_food_categories.join(", ")}
    </p>

    <button
      onClick={onView}
      className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-emerald-700 hover:text-emerald-800"
      data-testid={`material-view-details-${m.id}`}
    >
      View Details <ArrowRight className="h-4 w-4" />
    </button>
  </Card>
);
