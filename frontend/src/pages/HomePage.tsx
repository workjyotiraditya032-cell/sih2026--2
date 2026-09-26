import { ArrowRight, BrainCircuit, ClipboardList, Layers, Leaf, ListOrdered, Microscope, Ruler, ScanSearch } from "lucide-react";
import { ButtonLink } from "../components/common/Button";
import { Card, Eyebrow } from "../components/common/Card";
import { useMaterials } from "../hooks/useApiData";
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

const FLOW = [
  { icon: ClipboardList, title: "Simple Food Input", text: "Food name, optional photo and practical requirements" },
  { icon: ScanSearch, title: "Food Intelligence", text: "AI identification + grounded typical food profiles" },
  { icon: Layers, title: "Compatibility Analysis", text: "Packaging knowledge + multi-parameter comparison" },
  { icon: ListOrdered, title: "Ranked Recommendation", text: "Top 3 with specifications and reasons" },
];

const FEATURES = [
  { icon: BrainCircuit, title: "Intelligent Recommendation", text: "Groq reasons over reference food profiles and technically compatible materials—not an ungrounded AI guess." },
  { icon: Microscope, title: "Material Compatibility", text: "Hard filters remove unsafe matches, such as hermetic films for high-respiration produce." },
  { icon: Ruler, title: "Technical Specifications", text: "OTR and WVTR checked against derived targets, with suggested thickness, sealability and format." },
  { icon: Leaf, title: "Sustainability & Cost", text: "Your priorities change the scoring weights, and you can see the trade-offs in the result." },
];

const HeroFlow = () => (
  <Card className="relative overflow-hidden p-6 sm:p-8" data-testid="hero-flow-visual">
    <div className="absolute inset-0 bg-grid opacity-60" />
    <div className="relative space-y-3">
      {FLOW.map((step, i) => (
        <div key={step.title}>
          <div className="fade-up flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" style={{ animationDelay: `${i * 120}ms` }}>
            <span className={i === FLOW.length - 1 ? "flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white" : "flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"}>
              <step.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">{step.title}</p>
              <p className="text-xs text-slate-500">{step.text}</p>
            </div>
            <span className="ml-auto font-mono-tech text-xs text-slate-300">0{i + 1}</span>
          </div>
          {i < FLOW.length - 1 && <div className="ml-9 h-3 border-l-2 border-dashed border-emerald-200" />}
        </div>
      ))}
    </div>
  </Card>
);

export default function HomePage() {
  const { data: materials } = useMaterials();
  const { data: commodities } = useQuery({queryKey: ['food-profiles'], queryFn: api.foodProfiles});
  const stats = [
    { value: materials?.count ?? "—", label: "Packaging materials in knowledge base" },
    { value: commodities?.count ?? "—", label: "Reference commodities" },
    { value: 7, label: "Scoring criteria" },
    { value: 5, label: "Engine stages" },
  ];

  return (
    <div>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="fade-up">
            <Eyebrow>SIH260236 · Food packaging decision support</Eyebrow>
            <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl" data-testid="hero-title">
              AI-Powered Food Packaging Intelligence
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg" data-testid="hero-subtitle">
              Describe your food and packaging needs in simple terms. We build the food-property profile and recommend suitable materials—no technical expertise required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/analysis" size="lg" data-testid="hero-start-analysis-button">
                Start Packaging Analysis <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink to="/materials" size="lg" variant="secondary" data-testid="hero-explore-materials-button">
                Explore Materials
              </ButtonLink>
            </div>
            <p className="mt-6 text-xs text-slate-500">
              Groq AI + grounded food knowledge + multi-parameter analysis. Clearly labelled knowledge-base fallback when AI is unavailable.
            </p>
          </div>
          <HeroFlow />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Eyebrow>Capabilities</Eyebrow>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">From product properties to a defensible packaging choice</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Card key={f.title} className="p-6 transition-shadow duration-200 hover:shadow-md" data-testid={`feature-card-${i}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8" data-testid="knowledge-base-stats">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-mono-tech text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="grid grid-cols-1 overflow-hidden md:grid-cols-2">
          <img
            src="https://images.unsplash.com/photo-1651525670054-279c154bc3b6?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200"
            alt="Food processing line"
            className="h-64 w-full object-cover md:h-full"
          />
          <div className="p-8 lg:p-12">
            <Eyebrow>Built for</Eyebrow>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Food processors, packaging suppliers, MSMEs and researchers</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Run a demo scenario in under a minute: load the tomato example, analyze it, then review the specifications, reasons, alternatives and side-by-side comparison.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to="/analysis" data-testid="cta-start-analysis-button">Start Packaging Analysis</ButtonLink>
              <ButtonLink to="/methodology" variant="secondary" data-testid="cta-methodology-button">View Methodology</ButtonLink>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
