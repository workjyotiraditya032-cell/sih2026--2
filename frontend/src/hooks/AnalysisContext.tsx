import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { AnalysisForm, RecommendationResponse } from "../types";

const STORAGE_KEY = "packintel.analysis.v1";

interface StoredAnalysis {
  form: AnalysisForm | null;
  result: RecommendationResponse | null;
}

interface AnalysisContextValue extends StoredAnalysis {
  saveAnalysis: (form: AnalysisForm, result: RecommendationResponse) => void;
  clearResult: () => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

function load(): StoredAnalysis {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAnalysis) : { form: null, result: null };
  } catch {
    return { form: null, result: null };
  }
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredAnalysis>(load);

  const persist = useCallback((next: StoredAnalysis) => {
    setState(next);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const saveAnalysis = useCallback(
    (form: AnalysisForm, result: RecommendationResponse) => persist({ form, result }),
    [persist],
  );
  const clearResult = useCallback(() => persist({ form: state.form, result: null }), [persist, state.form]);

  const value = useMemo(() => ({ ...state, saveAnalysis, clearResult }), [state, saveAnalysis, clearResult]);
  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
