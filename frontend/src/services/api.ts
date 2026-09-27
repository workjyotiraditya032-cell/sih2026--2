import axios from "axios";
import type {
  AnalysisListResponse,
  CommodityListResponse,
  EngineConfig,
  EnvironmentConditions,
  ExcludedMaterial,
  HealthResponse,
  MaterialDetailResponse,
  MaterialFilters,
  MaterialListResponse,
  SimpleRecommendationRequest,
  ImageIdentification,
  RecommendationResponse,
} from "../types";

const rawBase = (
  process.env.VITE_API_BASE_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "https://sih2026-2-j71x.onrender.com"
).replace(/\/+$/, "");
const apiBase = rawBase.replace(/\/api$/, "");
const client = axios.create({
  baseURL: apiBase ? `${apiBase}/api` : "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export interface FieldError {
  field: string | null;
  message: string;
}

interface ErrorBody {
  detail?: unknown;
  code?: string;
  errors?: FieldError[];
  excluded_materials?: ExcludedMaterial[];
}

export class ApiError extends Error {
  code?: string;
  fieldErrors: FieldError[];
  excluded: ExcludedMaterial[];

  constructor(message: string, code?: string, fieldErrors: FieldError[] = [], excluded: ExcludedMaterial[] = []) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.excluded = excluded;
  }
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (axios.isAxiosError<ErrorBody>(err)) {
    if (!err.response) {
      return new ApiError("Unable to reach the analysis server. Check your connection and try again.", "network_error");
    }
    const body = err.response.data ?? {};
    const detail = typeof body.detail === "string" ? body.detail : "The request could not be completed.";
    return new ApiError(detail, body.code, body.errors ?? [], body.excluded_materials ?? []);
  }
  return new ApiError("Something went wrong. Please try again.");
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (err) {
    throw toApiError(err);
  }
}

function cleanParams(filters: MaterialFilters | Record<string, string | number | boolean | undefined>): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "" && v !== null),
  ) as Record<string, string | number | boolean>;
}

export const api = {
  foodProfiles: () => call(client.get<{count: number; foods: {food: string; food_category: string}[]}>('/food-profiles')),
  health: () => call(client.get<HealthResponse>("/health")),
  engineConfig: () => call(client.get<EngineConfig>("/engine/config")),
  materials: (filters: MaterialFilters = {}) =>
    call(client.get<MaterialListResponse>("/materials", { params: cleanParams(filters) })),
  material: (id: number) => call(client.get<MaterialDetailResponse>(`/materials/${id}`)),
  commodities: () => call(client.get<CommodityListResponse>("/commodities")),
  recommend: (payload: SimpleRecommendationRequest) => call(client.post<RecommendationResponse>("/recommend", payload, { timeout: 100000 })),
  analyses: (search?: string) =>
    call(client.get<AnalysisListResponse>("/analyses", { params: cleanParams({ search, limit: 200 }) })),
  analysis: (id: number) => call(client.get<RecommendationResponse>(`/analyses/${id}`)),
  environment: (location: string) =>
    call(client.get<EnvironmentConditions>("/environment", { params: { location } })),
};


export async function uploadFoodImage(file: File, onProgress: (percent: number, phase: string) => void): Promise<ImageIdentification> {
  onProgress(0, 'Preparing secure image upload...');
  const session = await call(client.post<{image_id: string; chunk_size: number}>('/food-images', {filename: file.name, size: file.size}));
  for (let offset = 0; offset < file.size; offset += session.chunk_size) {
    const chunk = file.slice(offset, offset + session.chunk_size);
    await call(client.post(`/food-images/${session.image_id}/chunks`, chunk, {
      params: {offset}, headers: {'Content-Type': 'application/octet-stream'}, timeout: 30000,
    }));
    onProgress(Math.round(Math.min(offset + chunk.size, file.size) / file.size * 100), 'Uploading food image...');
  }
  onProgress(100, 'Saving image securely and identifying food...');
  return call(client.post<ImageIdentification>(`/food-images/${session.image_id}/complete`, {}, {timeout: 110000}));
}

