import { jsPDF } from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import type { RecommendationResponse } from "../types";
import { costLabel, formatRange, MAP_MODE_LABELS, titleCase } from "./format";

type RGB = [number, number, number];
const EMERALD: RGB = [5, 150, 105];
const SLATE_900: RGB = [15, 23, 42];
const SLATE_500: RGB = [100, 116, 139];
const MARGIN = 14;

// Built-in PDF fonts only cover Latin-1; map the few other symbols used in engine text.
const clean = (s: string) =>
  s
    .replace(/[–—]/g, "-")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/₂/g, "2")
    .replace(/→/g, "->")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...");

const STATUS_LABEL: Record<string, string> = {
  meets: "Meets target",
  partial: "Partially meets",
  outside: "Outside target",
  not_critical: "Not critical",
};

class ReportWriter {
  doc = new jsPDF({ unit: "mm", format: "a4" });
  y = 0;
  width = this.doc.internal.pageSize.getWidth();
  height = this.doc.internal.pageSize.getHeight();

  ensure(space: number) {
    if (this.y + space > this.height - 18) {
      this.doc.addPage();
      this.y = 18;
    }
  }

  section(title: string) {
    this.ensure(18);
    this.doc.setFillColor(...EMERALD);
    this.doc.rect(MARGIN, this.y - 3.5, 1.2, 5, "F");
    this.doc.setFont("helvetica", "bold").setFontSize(11.5).setTextColor(...SLATE_900);
    this.doc.text(title, MARGIN + 3.5, this.y + 0.5);
    this.y += 5;
  }

  table(head: string[], body: RowInput[], columnStyles: Record<number, object> = {}) {
    autoTable(this.doc, {
      startY: this.y,
      head: [head],
      body,
      theme: "grid",
      margin: { left: MARGIN, right: MARGIN },
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2, textColor: SLATE_900, lineColor: [226, 232, 240], lineWidth: 0.2 },
      headStyles: { fillColor: EMERALD, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles,
    });
    this.y = (this.doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;
  }

  bullets(items: string[], marker = "-") {
    this.doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...SLATE_900);
    items.forEach((item) => {
      const lines = this.doc.splitTextToSize(clean(item), this.width - MARGIN * 2 - 6) as string[];
      this.ensure(lines.length * 4.4 + 1.5);
      this.doc.text(marker, MARGIN + 1, this.y);
      this.doc.text(lines, MARGIN + 6, this.y);
      this.y += lines.length * 4.4 + 1.5;
    });
    this.y += 5;
  }
}

function drawHeader(w: ReportWriter, r: RecommendationResponse) {
  const { doc } = w;
  doc.setFillColor(...SLATE_900);
  doc.rect(0, 0, w.width, 26, "F");
  doc.setTextColor(255).setFont("helvetica", "bold").setFontSize(15).text("PackIntel", MARGIN, 12);
  doc.setFont("helvetica", "normal").setFontSize(9).text("Packaging Recommendation Report · SIH260236", MARGIN, 18.5);
  const source = r.data_source === "mongodb" ? "MongoDB Atlas" : r.data_source === "postgresql" ? "PostgreSQL" : "Fallback reference data";
  doc.text(`Analysis #${r.analysis_id ?? "-"}  |  ${new Date(r.generated_at).toLocaleString()}`, w.width - MARGIN, 12, { align: "right" });
  doc.text(`Data source: ${source}  |  Engine ${r.engine_version}`, w.width - MARGIN, 18.5, { align: "right" });
  w.y = 38;
}

function drawRecommendation(w: ReportWriter, r: RecommendationResponse) {
  const { doc } = w;
  const m = r.recommended_material;
  const boxW = 42;
  doc.setTextColor(...SLATE_500).setFont("helvetica", "bold").setFontSize(8).text("RECOMMENDED MATERIAL · RANK #1", MARGIN, w.y);
  doc.setTextColor(...SLATE_900).setFontSize(20).text(m.material_name, MARGIN, w.y + 9);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...SLATE_500);
  const tags = [m.material_category, m.recyclable ? "Recyclable" : "Not readily recyclable", m.biodegradable ? "Biodegradable" : "Not biodegradable", `Relative cost: ${costLabel(m.relative_cost)}`];
  doc.text(tags.join("  ·  "), MARGIN, w.y + 15);

  const boxX = w.width - MARGIN - boxW;
  doc.setDrawColor(...EMERALD).setLineWidth(0.6).roundedRect(boxX, w.y - 5, boxW, 25, 2, 2, "S");
  doc.setTextColor(...EMERALD).setFont("helvetica", "bold").setFontSize(22).text(r.suitability_score.toFixed(1), boxX + boxW / 2, w.y + 7, { align: "center" });
  doc.setFontSize(7.5).setTextColor(...SLATE_500).text("SUITABILITY SCORE / 100", boxX + boxW / 2, w.y + 14, { align: "center" });

  w.y += 24;
  doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...SLATE_900);
  const lines = doc.splitTextToSize(clean(r.summary), w.width - MARGIN * 2) as string[];
  doc.text(lines, MARGIN, w.y);
  w.y += lines.length * 4.6 + 3;
  doc.setFontSize(7.5).setTextColor(...SLATE_500).text("Suitability score = weighted rule-based compatibility score; not a model accuracy figure.", MARGIN, w.y);
  w.y += 10;
}

function inputRows(r: RecommendationResponse): RowInput[] {
  if (r.intelligence) {
    const u = r.intelligence.user_requirements;
    return [
      ['Food', r.intelligence.food_profile.food, 'Category', r.intelligence.food_profile.food_category],
      ['Desired shelf life', `${u.shelf_life_days} days (target only)`, 'Storage', `${u.storage_type} at ${u.temperature} °C`],
      ['Transportation', titleCase(u.transportation), 'Priority', titleCase(u.priority)],
      ['Recommendation mode', r.intelligence.mode === 'ai' ? `Groq: ${r.intelligence.model}` : 'Knowledge-base fallback', 'Confidence', titleCase(r.intelligence.confidence)],
    ];
  }
  const i = r.input;
  const pairs: [string, string][] = [
    ["Commodity", i.commodity], ["Food category", i.food_category],
    ["Moisture content", `${i.moisture_content}%`], ["Oil / fat content", `${i.oil_content}%`],
    ["pH", String(i.ph)], ["Respiration rate", titleCase(i.respiration_rate)],
    ["Moisture sensitivity", titleCase(i.moisture_sensitivity)], ["Oxygen sensitivity", titleCase(i.oxygen_sensitivity)],
    ["Desired shelf life", `${i.shelf_life_days} days`], ["Storage", `${titleCase(i.storage_type)} at ${i.temperature} °C`],
    ["Relative humidity", `${i.relative_humidity}%`], ["Transportation", titleCase(i.transportation)],
    ["Cost priority", titleCase(i.cost_priority)], ["Sustainability priority", titleCase(i.sustainability_priority)],
    ["MAP required", i.map_required === null ? "Not sure" : i.map_required ? "Yes" : "No"], ["Engine MAP mode", MAP_MODE_LABELS[r.requirements.map_mode] ?? r.requirements.map_mode],
  ];
  const rows: RowInput[] = [];
  for (let k = 0; k < pairs.length; k += 2) rows.push([pairs[k][0], pairs[k][1], pairs[k + 1][0], pairs[k + 1][1]]);
  return rows;
}

function specRows(r: RecommendationResponse): RowInput[] {
  const s = r.specifications;
  return [
    ["OTR", formatRange(s.otr.min, s.otr.max, s.otr.unit), `${clean(s.otr.target)} - ${STATUS_LABEL[s.otr.status]}`],
    ["WVTR", formatRange(s.wvtr.min, s.wvtr.max, s.wvtr.unit), `${clean(s.wvtr.target)} - ${STATUS_LABEL[s.wvtr.status]}`],
    ["Recommended thickness", `${s.thickness.recommended} ${s.thickness.unit}`, `Material range ${formatRange(s.thickness.min, s.thickness.max, s.thickness.unit)}`],
    ["Sealability", `${s.sealability.label} (${s.sealability.rating}/5)`, ""],
    ["Gas permeability", `${s.gas_permeability.label} (${s.gas_permeability.rating}/5)`, ""],
    ["Mechanical strength", `${s.mechanical_strength.label} (${s.mechanical_strength.rating}/5)`, ""],
    ["MAP suitability", `${s.map_suitability.label} (${s.map_suitability.rating}/5)`, ""],
    ["Suggested format", clean(s.package_format), ""],
  ];
}

function drawFooters(w: ReportWriter) {
  const pages = w.doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    w.doc.setPage(p);
    w.doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...SLATE_500);
    w.doc.text("PackIntel decision-support prototype · material values are reference / prototype data, not laboratory-validated", MARGIN, w.height - 8);
    w.doc.text(`Page ${p} of ${pages}`, w.width - MARGIN, w.height - 8, { align: "right" });
  }
}

export function buildRecommendationReport(r: RecommendationResponse): jsPDF {
  const w = new ReportWriter();
  drawHeader(w, r);
  drawRecommendation(w, r);

  w.section("Input Parameters");
  w.table(["Parameter", "Value", "Parameter", "Value"], inputRows(r), { 0: { fontStyle: "bold" }, 2: { fontStyle: "bold" } });

  if (r.intelligence) {
    w.section('Food Intelligence - Typical / Estimated Profile');
    w.bullets([r.intelligence.message, r.intelligence.confidence_basis]);
    w.table(['Property', 'Typical value', 'Provenance'], Object.entries(r.intelligence.food_profile.properties).map(([key, p]) => [titleCase(key), clean(p.value), p.source === 'reference' ? 'Prototype reference range/profile' : p.source === 'ai_estimated' ? 'AI-estimated - requires validation' : 'Reference data unavailable']));
    w.section('Storage Warnings and Data Assumptions');
    w.bullets([...r.intelligence.warnings, ...r.intelligence.assumptions]);
  }
  w.section("Packaging Specifications");
  w.table(["Property", "Value", "Target / note"], specRows(r), { 0: { fontStyle: "bold", cellWidth: 42 } });
  w.doc.setFontSize(7.5).setTextColor(...SLATE_500);
  const conditionLines = w.doc.splitTextToSize(clean(r.specifications.test_conditions), w.width - MARGIN * 2) as string[];
  w.ensure(conditionLines.length * 4 + 3);
  w.doc.text(conditionLines, MARGIN, w.y - 5);
  w.y += conditionLines.length * 4 + 2;

  w.section("Why This Material?");
  w.bullets(r.reasons, "+");

  w.section("Score Breakdown");
  w.table(
    ["Criterion", "Criterion score", "Effective weight", "Contribution"],
    r.score_breakdown.map((c) => [c.label, `${(c.score * 100).toFixed(0)}%`, `${(c.weight * 100).toFixed(1)}%`, c.contribution.toFixed(1)]),
  );

  w.section("Key Decision Factors");
  w.table(["Factor", "Input", "Derived requirement", "Influence"], r.key_factors.map((f) => [f.factor, clean(f.value), clean(f.impact), titleCase(f.influence)]), { 2: { cellWidth: 90 } });

  w.section("Alternative Materials");
  w.table(
    ["Rank", "Material", "Score", "Main advantage", "Main trade-off"],
    r.alternatives.map((a) => [`#${a.rank}`, a.material.material_name, a.suitability_score.toFixed(1), clean(a.main_advantage), clean(a.main_tradeoff)]),
    { 0: { cellWidth: 12 }, 2: { cellWidth: 14 } },
  );

  if (r.tradeoffs.length) {
    w.section("Trade-offs to Consider");
    w.bullets(r.tradeoffs);
  }

  w.section("Full Ranking and Filtered-out Materials");
  w.table(["Rank", "Material", "Suitability score"], r.ranking.map((x) => [`#${x.rank}`, x.material_name, x.suitability_score.toFixed(1)]));
  if (r.excluded_materials.length) {
    w.table(["Excluded material", "Reason(s)"], r.excluded_materials.map((e) => [e.material_name, clean(e.reasons.join("; "))]), { 0: { cellWidth: 45, fontStyle: "bold" } });
  }

  w.section("Disclaimer");
  w.bullets([r.disclaimer], "");
  drawFooters(w);
  return w.doc;
}

export function reportFileName(r: RecommendationResponse): string {
  const commodity = r.input.commodity.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const suffix = r.analysis_id ? `analysis-${r.analysis_id}` : new Date(r.generated_at).toISOString().slice(0, 10);
  return `PackIntel_${commodity}_${suffix}.pdf`;
}

export function downloadRecommendationReport(r: RecommendationResponse): void {
  buildRecommendationReport(r).save(reportFileName(r));
}
