import type { AnalysisForm, FormErrors, RecommendationRequest, SimpleRecommendationRequest, ShelfUnit } from "../types";
import { SHELF_UNIT_DAYS } from "./constants";

const SAFE_TEXT = /^[A-Za-z0-9 .,&()'/+-]+$/;

function parseNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function checkRange(errors: FormErrors, key: keyof AnalysisForm, raw: string, min: number, max: number, label: string) {
  const n = parseNumber(raw);
  if (raw.trim() === "") errors[key] = `${label} is required`;
  else if (n === null) errors[key] = `${label} must be a number`;
  else if (n < min || n > max) errors[key] = `${label} must be between ${min} and ${max}`;
}

export function commodityName(form: AnalysisForm): string {
  return form.commodity === "Other" ? form.customCommodity.trim() : form.commodity;
}

export function shelfLifeDays(form: AnalysisForm): number {
  return Math.round(Number(form.shelf_life_value) * SHELF_UNIT_DAYS[form.shelf_life_unit]);
}

export function validateForm(form: AnalysisForm): FormErrors {
  const errors: FormErrors = {};
  const name = form.commodity.trim();
  if (!name) errors.commodity = 'Enter a food name';
  else if (name.length > 60 || !SAFE_TEXT.test(name)) errors.commodity = 'Use letters, numbers and basic punctuation only';
  if (form.image_id && !form.image_confirmed) errors.commodity = 'Confirm or correct the food identified from your image';
  checkRange(errors, "temperature", form.temperature, -40, 50, "Temperature");

  const shelf = parseNumber(form.shelf_life_value);
  if (shelf === null || shelf <= 0) errors.shelf_life_value = "Enter a shelf life greater than zero";
  else if (shelf * SHELF_UNIT_DAYS[form.shelf_life_unit] > 1825) errors.shelf_life_value = "Shelf life cannot exceed 5 years";

  const temp = parseNumber(form.temperature);
  if (!errors.temperature && temp !== null) {
    if (form.storage_type === "frozen" && temp > -5) errors.temperature = "Frozen storage requires -5 °C or below";
    if (form.storage_type === "chilled" && (temp < -5 || temp > 15)) errors.temperature = "Chilled storage should be -5 to 15 °C";
    if (form.storage_type === "ambient" && temp < 5) errors.temperature = "Ambient storage should be 5 °C or above";
  }
  return errors;
}

export function toRequest(form: AnalysisForm): SimpleRecommendationRequest {
  return {
    food_name: form.commodity.trim(),
    shelf_life_days: shelfLifeDays(form),
    storage_type: form.storage_type,
    temperature: Number(form.temperature),
    transportation: form.transportation === 'frozen' ? 'refrigerated' : form.transportation,
    priority: form.priority ?? 'balanced',
    image_id: form.image_id ?? null,
    image_confirmed: form.image_confirmed ?? false,
  };
}

const BACKEND_FIELD_MAP: Record<string, keyof AnalysisForm> = {
  shelf_life_days: "shelf_life_value",
  food_name: "commodity",
};

export function mapBackendField(field: string | null): keyof AnalysisForm | null {
  if (!field) return null;
  return BACKEND_FIELD_MAP[field] ?? (field as keyof AnalysisForm);
}

function shelfLifeParts(days: number): [number, ShelfUnit] {
  if (days >= 30 && days % 30 === 0) return [days / 30, "months"];
  if (days >= 14 && days % 7 === 0) return [days / 7, "weeks"];
  return [days, "days"];
}

export function formFromRequest(r: RecommendationRequest): AnalysisForm {
  const [shelfValue, shelfUnit] = shelfLifeParts(r.shelf_life_days);
  return {
    commodity: r.commodity,
    customCommodity: "",
    priority: r.priority ?? (r.sustainability_priority === 'high' ? 'sustainability' : r.cost_priority === 'low_cost' ? 'cost' : r.cost_priority === 'performance_first' ? 'shelf_life' : 'balanced'),
    food_category: r.food_category,
    moisture_content: String(r.moisture_content),
    oil_content: String(r.oil_content),
    ph: String(r.ph),
    respiration_rate: r.respiration_rate,
    moisture_sensitivity: r.moisture_sensitivity,
    oxygen_sensitivity: r.oxygen_sensitivity,
    shelf_life_value: String(shelfValue),
    shelf_life_unit: shelfUnit,
    storage_type: r.storage_type,
    temperature: String(r.temperature),
    relative_humidity: String(r.relative_humidity),
    transportation: r.transportation,
    cost_priority: r.cost_priority,
    sustainability_priority: r.sustainability_priority,
    map_required: r.map_required === null ? "not_sure" : r.map_required ? "yes" : "no",
  };
}
