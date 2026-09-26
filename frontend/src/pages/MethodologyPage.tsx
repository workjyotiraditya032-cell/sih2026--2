import { ArrowDown, BrainCircuit, Database, FileCheck2, Filter, Gauge, ListOrdered, MessageSquareText, Ruler, ScanSearch, UserRound } from "lucide-react";
import { PageContainer } from "../components/layout/Layout";
import { PageHeader } from "../components/common/Feedback";
import { Card, CardHeader } from "../components/common/Card";
import { ProgressBar } from "../components/common/Indicators";
import { useEngineConfig } from "../hooks/useApiData";
import { pct, titleCase } from "../utils/format";

const PIPELINE = [
  { icon: UserRound, title: "Simple User Input", text: "Food name, optional photo, shelf-life target, storage, transport and priority—no technical food properties" },
  { icon: Database, title: "Food Intelligence Engine", text: "Reference food profiles supply typical ranges; Groq classifies unfamiliar foods and labels estimated or unavailable properties" },
  { icon: ScanSearch, title: "Requirement Extraction", text: "Domain rules convert inputs into barrier, gas-exchange, strength and protection targets" },
  { icon: Filter, title: "Packaging Material Filtering", text: "Hard constraints remove incompatible materials (e.g. frozen rating, anaerobic risk)" },
  { icon: FileCheck2, title: "Compatibility Analysis", text: "Each material is scored 0–1 on seven criteria, using structured material data" },
  { icon: Gauge, title: "Weighted Scoring", text: "Configurable weights, adjusted by cost, sustainability and MAP priorities" },
  { icon: ListOrdered, title: "Grounded Groq Reasoning", text: "Groq compares a technically filtered shortlist against the food profile and your requirements; material IDs and structured JSON are validated on the backend" },
  { icon: MessageSquareText, title: "Explainable Recommendation", text: "Concise AI reasoning explains suitability and uncertainty; if AI fails, the local knowledge-base engine takes over with an explicit fallback label" },
  { icon: Ruler, title: "Technical Specifications", text: "OTR/WVTR checked against targets; thickness and format suggested" },
];

const ROADMAP = [
  "Shelf-life prediction (regression) trained on validated storage trials",
  "ML-based ranking model, added once labelled packaging outcomes are available",
  "Commodity-specific reference data reviewed against laboratory measurements",
  "Integration of laboratory OTR/WVTR test datasets",
  "QR traceability, IoT storage sensors and a mobile app (future scalability)",
];

export default function MethodologyPage() {
  const { data: config } = useEngineConfig();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="How it works"
        title="Methodology"
        subtitle="Simple food input → food intelligence → knowledge-grounded compatibility → explainable recommendations. Real Groq reasoning runs behind the scenes; no validated shelf-life prediction is claimed."
      />

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3" data-testid="methodology-pipeline">
          <ol className="space-y-0">
            {PIPELINE.map((step, i) => (
              <li key={step.title}>
                <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" data-testid={`pipeline-step-${i}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-mono-tech text-[11px] font-semibold text-slate-400">STAGE {String(i + 1).padStart(2, "0")}</p>
                    <p className="font-semibold text-slate-900">{step.title}</p>
                    <p className="text-sm text-slate-600">{step.text}</p>
                  </div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className="flex justify-center py-1.5 text-slate-300"><ArrowDown className="h-4 w-4" /></div>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card data-testid="engine-weights-card">
            <CardHeader title="Scoring Weights" subtitle={config ? `Live from /api/engine/config · ${config.engine_version}` : "Loading engine configuration…"} icon={<Gauge className="h-5 w-5" />} />
            <div className="space-y-4 p-5 sm:p-6">
              {config &&
                Object.entries(config.base_weights).map(([k, v]) => (
                  <div key={k} data-testid={`weight-${k}`}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-700">{config.criterion_labels[k]}</span>
                      <span className="font-mono-tech font-semibold text-slate-900">{pct(v)}</span>
                    </div>
                    <ProgressBar value={v / 0.25} tone="blue" />
                  </div>
                ))}
              <p className="text-xs text-slate-500">These are engine weighting parameters, not model accuracy percentages. They can be changed through configuration.</p>
            </div>
          </Card>

          {config && (
            <Card className="p-5 sm:p-6" data-testid="priority-multipliers-card">
              <p className="text-sm font-semibold text-slate-900">Preference multipliers</p>
              <div className="mt-3 space-y-3 text-sm">
                {Object.entries(config.priority_multipliers).map(([criterion, map]) => (
                  <div key={criterion}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{config.criterion_labels[criterion]}</p>
                    <p className="font-mono-tech text-xs text-slate-700">
                      {Object.entries(map).map(([k, v]) => `${titleCase(k)} ×${v}`).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5 sm:p-6" data-testid="ml-roadmap-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BrainCircuit className="h-4 w-4 text-blue-600" /> Future ML roadmap
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {ROADMAP.map((r) => <li key={r}>• {r}</li>)}
            </ul>
            <p className="mt-3 text-xs text-slate-500">The engine exposes a pluggable ranker interface, so validated models can replace the rule-based ranker.</p>
          </Card>

          <Card className="p-5 sm:p-6">
            <p className="text-sm font-semibold text-slate-900">Knowledge base</p>
            <p className="mt-2 text-sm text-slate-600">
              Database collections: <span className="font-mono-tech text-xs">packaging_materials</span>, <span className="font-mono-tech text-xs">food_commodities</span>, <span className="font-mono-tech text-xs">recommendations</span>. Material values are reference / prototype ranges from general literature, with ordinal ratings (1–5) for barrier and processing properties.
            </p>
          </Card>
        </div>
      </div>

      <p className="mt-12 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500" data-testid="scientific-disclaimer">
        Recommendations are intended as a decision-support aid and should be validated against applicable food-contact regulations, material specifications, and laboratory/industry requirements before commercial deployment.
      </p>
    </PageContainer>
  );
}
