export type Level = "low" | "medium" | "high";
export type FoodCategory =
  | "Fresh Produce"
  | "Grains"
  | "Bakery"
  | "Snacks"
  | "Dairy"
  | "Powdered Food"
  | "Processed Food";
export type StorageType = "ambient" | "chilled" | "frozen";
export type Transportation = "normal" | "refrigerated" | "frozen" | "long_distance" | "high_humidity";
export type Priority = "cost" | "shelf_life" | "sustainability" | "balanced";

export interface SimpleRecommendationRequest {
  food_name: string;
  shelf_life_days: number;
  temperature: number;
  storage_type: StorageType;
  transportation: Exclude<Transportation, 'frozen'>;
  priority: Priority;
  image_id?: string | null;
  image_confirmed?: boolean;
}

export interface ImageIdentification {
  image_id: string;
  food_name: string | null;
  confidence: Level;
  unclear: boolean;
  explanation: string;
  mode: 'ai' | 'unavailable';
  requires_confirmation: boolean;
  error_code?: string | null;
  model?: string | null;
}

export interface FoodProfile {
  food: string;
  food_category: FoodCategory;
  provenance: 'reference' | 'ai_estimated';
  properties: Record<string, {value: string; source: 'reference' | 'ai_estimated' | 'unavailable'; basis: string}>;
  temperature_range: [number, number] | null;
  storage_notes: string;
  packaging_considerations: string[];
  sources: string[];
}

export interface FoodIntelligence {
  mode: 'ai' | 'knowledge_base';
  provider: string | null;
  model: string | null;
  message: string;
  food_profile: FoodProfile;
  user_requirements: SimpleRecommendationRequest;
  packaging_structure: string;
  cost_level: Level;
  sustainability_level: Level;
  confidence: Level;
  confidence_basis: string;
  warnings: string[];
  assumptions: string[];
  image_identification: ImageIdentification | null;
}
export type CostPriority = "low_cost" | "balanced" | "performance_first";
export type MapChoice = "yes" | "no" | "not_sure";
export type ShelfUnit = "days" | "weeks" | "months";
export type DataSource = "mongodb" | "postgresql" | "fallback_reference_data";

export interface Material {
  id: number;
  material_name: string;
  material_category: string;
  description: string;
  min_thickness: number;
  max_thickness: number;
  otr_min: number;
  otr_max: number;
  wvtr_min: number;
  wvtr_max: number;
  sealability: number;
  mechanical_strength: number;
  gas_permeability: number;
  moisture_barrier: number;
  oxygen_barrier: number;
  map_suitability: number;
  recyclable: boolean;
  biodegradable: boolean;
  relative_cost: number;
  suitable_food_categories: string[];
  suitable_storage_types: string[];
  packaging_structure?: string | null;
  transparency?: string;
  food_contact_suitability?: string;
  product_forms?: string[];
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Commodity {
  id: number;
  commodity_name: string;
  category: FoodCategory;
  typical_moisture: number;
  typical_oil_content: number;
  typical_ph: number;
  respiration_level: Level;
  moisture_sensitivity: Level;
  oxygen_sensitivity: Level;
  notes: string | null;
}

export interface MaterialListResponse {
  data_source: DataSource;
  count: number;
  materials: Material[];
}

export interface MaterialDetailResponse {
  data_source: DataSource;
  material: Material;
}

export interface CommodityListResponse {
  data_source: DataSource;
  count: number;
  commodities: Commodity[];
}

export interface HealthResponse {
  status: string;
  api: string;
  version: string;
  database: { engine: string; connected: boolean; detail: string };
  data_source: DataSource;
}

export interface EngineConfig {
  engine_version: string;
  ranker: string;
  top_n: number;
  base_weights: Record<string, number>;
  criterion_labels: Record<string, string>;
  priority_multipliers: Record<string, Record<string, number>>;
  note: string;
}

export interface EnvironmentConditions {
  location: string;
  latitude: number;
  longitude: number;
  temperature: number;
  relative_humidity: number;
  observed_at: string | null;
  source: string;
}

export interface RecommendationRequest {
  commodity: string;
  food_category: FoodCategory;
  moisture_content: number;
  oil_content: number;
  ph: number;
  respiration_rate: Level;
  moisture_sensitivity: Level;
  oxygen_sensitivity: Level;
  shelf_life_days: number;
  storage_type: StorageType;
  temperature: number;
  relative_humidity: number;
  transportation: Transportation;
  cost_priority: CostPriority;
  sustainability_priority: Level;
  map_required: boolean | null;
  priority?: Priority;
  profile_source?: 'reference' | 'ai_estimated';
}

export interface RatingSpec {
  rating: number;
  label: string;
}

export interface BarrierSpec {
  min: number;
  max: number;
  unit: string;
  target: string;
  status: "meets" | "partial" | "outside" | "not_critical";
}

export interface Specifications {
  otr: BarrierSpec;
  wvtr: BarrierSpec;
  thickness: { recommended: number; min: number; max: number; unit: string };
  sealability: RatingSpec;
  gas_permeability: RatingSpec;
  mechanical_strength: RatingSpec;
  map_suitability: RatingSpec;
  package_format: string;
  test_conditions: string;
}

export interface ScoreComponent {
  criterion: string;
  label: string;
  weight: number;
  score: number;
  contribution: number;
}

export interface DecisionFactor {
  factor: string;
  value: string;
  impact: string;
  influence: "high" | "medium" | "low";
}

export interface Alternative {
  rank: number;
  material: Material;
  suitability_score: number;
  main_advantage: string;
  main_tradeoff: string;
  score_breakdown: ScoreComponent[];
}

export interface RankingEntry {
  rank: number;
  material_id: number;
  material_name: string;
  suitability_score: number;
}

export interface ExcludedMaterial {
  material_id: number;
  material_name: string;
  reasons: string[];
}

export interface DerivedRequirements {
  moisture_barrier: number;
  oxygen_barrier: number;
  gas_exchange: number;
  mechanical_strength: number;
  protection_level: number;
  shelf_life_class: string;
  map_mode: string;
  required_storage_types: string[];
  otr_target: string;
  wvtr_target: string;
}

export interface RecommendationResponse {
  analysis_id: number | null;
  recommended_material: Material;
  suitability_score: number;
  summary: string;
  specifications: Specifications;
  reasons: string[];
  key_factors: DecisionFactor[];
  score_breakdown: ScoreComponent[];
  alternatives: Alternative[];
  tradeoffs: string[];
  ranking: RankingEntry[];
  excluded_materials: ExcludedMaterial[];
  requirements: DerivedRequirements;
  weights: Record<string, number>;
  data_source: DataSource;
  engine_version: string;
  disclaimer: string;
  input: RecommendationRequest;
  generated_at: string;
  intelligence?: FoodIntelligence | null;
  history_source?: "stored_snapshot" | "recomputed" | null;
}

export interface AnalysisSummary {
  id: number;
  commodity: string;
  food_category: string;
  recommended_material: string;
  suitability_score: number;
  data_source: DataSource;
  storage_type: StorageType | null;
  temperature: number | null;
  relative_humidity: number | null;
  shelf_life_days: number | null;
  has_snapshot: boolean;
  created_at: string;
}

export interface AnalysisListResponse {
  count: number;
  analyses: AnalysisSummary[];
}

export interface AnalysisForm {
  priority?: Priority;
  image_id?: string | null;
  image_confirmed?: boolean;
  commodity: string;
  customCommodity: string;
  food_category: FoodCategory | "";
  moisture_content: string;
  oil_content: string;
  ph: string;
  respiration_rate: Level;
  moisture_sensitivity: Level;
  oxygen_sensitivity: Level;
  shelf_life_value: string;
  shelf_life_unit: ShelfUnit;
  storage_type: StorageType;
  temperature: string;
  relative_humidity: string;
  transportation: Transportation;
  cost_priority: CostPriority;
  sustainability_priority: Level;
  map_required: MapChoice;
}

export type FormErrors = Partial<Record<keyof AnalysisForm, string>>;

export interface MaterialFilters {
  search?: string;
  category?: string;
  food_category?: string;
  storage_type?: string;
  map_suitable?: boolean;
  recyclable?: boolean;
  biodegradable?: boolean;
  max_cost?: number;
}
