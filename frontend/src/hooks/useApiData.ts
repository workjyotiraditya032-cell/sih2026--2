import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { MaterialFilters } from "../types";

export const useHealth = () =>
  useQuery({ queryKey: ["health"], queryFn: api.health, refetchInterval: 30_000, staleTime: 10_000 });

export const useMaterials = (filters: MaterialFilters = {}) =>
  useQuery({ queryKey: ["materials", filters], queryFn: () => api.materials(filters), placeholderData: (prev) => prev });

export const useMaterial = (id: number | null) =>
  useQuery({ queryKey: ["material", id], queryFn: () => api.material(id as number), enabled: id !== null });

export const useCommodities = () => useQuery({ queryKey: ["commodities"], queryFn: api.commodities });

export const useEngineConfig = () => useQuery({ queryKey: ["engine-config"], queryFn: api.engineConfig });

export const useAnalyses = (search: string) =>
  useQuery({ queryKey: ["analyses", search], queryFn: () => api.analyses(search || undefined), placeholderData: (prev) => prev, staleTime: 0 });

export const analysisQuery = (id: number) => ({ queryKey: ["analysis", id], queryFn: () => api.analysis(id), staleTime: 5 * 60_000 });
