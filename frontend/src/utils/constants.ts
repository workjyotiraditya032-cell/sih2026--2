import type {
  AnalysisForm,
  CostPriority,
  FoodCategory,
  Level,
  MapChoice,
  ShelfUnit,
  StorageType,
  Transportation,
} from "../types";

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const COMMODITY_OPTIONS = [
  "Tomato", "Potato", "Onion", "Apple", "Banana", "Mango", "Orange", "Carrot", "Cucumber", "Leafy vegetables",
  "Milk", "Curd", "Paneer", "Cheese", "Biscuits", "Chips", "Bread", "Pickle", "Jam", "Spices", "Rice", "Flour", "Pulses", "Milk Powder",
];

export const FOOD_CATEGORIES: FoodCategory[] = [
  "Fresh Produce", "Grains", "Bakery", "Snacks", "Dairy", "Powdered Food", "Processed Food",
];

export const LEVEL_OPTIONS: Option<Level>[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const STORAGE_OPTIONS: Option<StorageType>[] = [
  { value: "ambient", label: "Ambient" },
  { value: "chilled", label: "Chilled" },
  { value: "frozen", label: "Frozen" },
];

export const TRANSPORT_OPTIONS: Option<Transportation>[] = [
  { value: "normal", label: "Normal" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "high_humidity", label: "High-humidity" },
  { value: "long_distance", label: "Long-distance" },
];

export const COST_OPTIONS: Option<CostPriority>[] = [
  { value: "low_cost", label: "Low Cost" },
  { value: "balanced", label: "Balanced" },
  { value: "performance_first", label: "Performance First" },
];

export const MAP_OPTIONS: Option<MapChoice>[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "Not Sure" },
];

export const SHELF_UNITS: Option<ShelfUnit>[] = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
];

export const SHELF_UNIT_DAYS: Record<ShelfUnit, number> = { days: 1, weeks: 7, months: 30 };

export const STORAGE_DEFAULT_TEMP: Record<StorageType, number> = { ambient: 25, chilled: 4, frozen: -18 };

export const DEFAULT_FORM: AnalysisForm = {
  commodity: "",
  customCommodity: "",
  food_category: "",
  moisture_content: "",
  oil_content: "",
  ph: "",
  respiration_rate: "low",
  moisture_sensitivity: "medium",
  oxygen_sensitivity: "medium",
  shelf_life_value: "",
  shelf_life_unit: "days",
  storage_type: "ambient",
  temperature: "25",
  relative_humidity: "",
  transportation: "normal",
  cost_priority: "balanced",
  sustainability_priority: "medium",
  map_required: "not_sure",
};

export interface DemoScenario {
  id: string;
  label: string;
  description: string;
  form: AnalysisForm;
}

export const DEMO_EXAMPLE: AnalysisForm = {
  commodity: "Tomato",
  customCommodity: "",
  food_category: "Fresh Produce",
  moisture_content: "94",
  oil_content: "0.2",
  ph: "4.3",
  respiration_rate: "high",
  moisture_sensitivity: "high",
  oxygen_sensitivity: "medium",
  shelf_life_value: "10",
  shelf_life_unit: "days",
  storage_type: "chilled",
  temperature: "8",
  relative_humidity: "85",
  transportation: "refrigerated",
  cost_priority: "balanced",
  sustainability_priority: "medium",
  map_required: "yes",
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  { id: "tomato", label: "Fresh produce", description: "Tomato · chilled · MAP", form: DEMO_EXAMPLE },
  {
    id: "chips",
    label: "Dry snack",
    description: "Chips · 4 months · high fat",
    form: {
      ...DEMO_EXAMPLE,
      commodity: "Chips",
      food_category: "Snacks",
      moisture_content: "2",
      oil_content: "35",
      ph: "6.5",
      respiration_rate: "low",
      moisture_sensitivity: "high",
      oxygen_sensitivity: "high",
      shelf_life_value: "4",
      shelf_life_unit: "months",
      storage_type: "ambient",
      temperature: "25",
      relative_humidity: "65",
      transportation: "long_distance",
      map_required: "not_sure",
    },
  },
  {
    id: "rice",
    label: "Grain",
    description: "Rice · 12 months · humid",
    form: {
      ...DEMO_EXAMPLE,
      commodity: "Rice",
      food_category: "Grains",
      moisture_content: "12",
      oil_content: "0.7",
      ph: "6.5",
      respiration_rate: "low",
      moisture_sensitivity: "high",
      oxygen_sensitivity: "low",
      shelf_life_value: "12",
      shelf_life_unit: "months",
      storage_type: "ambient",
      temperature: "30",
      relative_humidity: "75",
      transportation: "long_distance",
      map_required: "no",
    },
  },
  {
    id: "milk-powder",
    label: "Powder",
    description: "Milk powder · 12 months",
    form: {
      ...DEMO_EXAMPLE,
      commodity: "Milk Powder",
      food_category: "Powdered Food",
      moisture_content: "3",
      oil_content: "26",
      ph: "6.7",
      respiration_rate: "low",
      moisture_sensitivity: "high",
      oxygen_sensitivity: "high",
      shelf_life_value: "12",
      shelf_life_unit: "months",
      storage_type: "ambient",
      temperature: "28",
      relative_humidity: "70",
      transportation: "normal",
      map_required: "no",
    },
  },
];

export const PRIORITY_OPTIONS: Option<import('../types').Priority>[] = [
  { value: 'cost', label: 'Lowest Cost' },
  { value: 'shelf_life', label: 'Maximum Shelf Life' },
  { value: 'sustainability', label: 'Sustainability' },
  { value: 'balanced', label: 'Balanced' },
];

export const FOOD_DEMOS: DemoScenario[] = [
  { id: 'tomato', label: 'Tomato', description: '10 days · 8 °C · refrigerated', form: { ...DEFAULT_FORM, commodity: 'Tomato', shelf_life_value: '10', storage_type: 'chilled', temperature: '8', transportation: 'refrigerated', priority: 'shelf_life' } },
  { id: 'curd', label: 'Curd', description: '15 days · 4 °C · refrigerated', form: { ...DEFAULT_FORM, commodity: 'Curd', shelf_life_value: '15', storage_type: 'chilled', temperature: '4', transportation: 'refrigerated', priority: 'shelf_life' } },
  { id: 'potato', label: 'Potato', description: '20 days · 12 °C · normal transport', form: { ...DEFAULT_FORM, commodity: 'Potato', shelf_life_value: '20', storage_type: 'chilled', temperature: '12', priority: 'balanced' } },
  { id: 'milk', label: 'Milk', description: '7 days · 4 °C · refrigerated', form: { ...DEFAULT_FORM, commodity: 'Milk', shelf_life_value: '7', storage_type: 'chilled', temperature: '4', transportation: 'refrigerated', priority: 'shelf_life' } },
  { id: 'biscuits', label: 'Biscuits', description: '90 days · 25 °C · long-distance', form: { ...DEFAULT_FORM, commodity: 'Biscuits', shelf_life_value: '90', temperature: '25', transportation: 'long_distance', priority: 'balanced' } },
];

