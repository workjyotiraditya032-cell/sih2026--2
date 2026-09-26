import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "./components/layout/Layout";
import { AnalysisProvider } from "./hooks/AnalysisContext";
import HomePage from "./pages/HomePage";
import AnalysisPage from "./pages/AnalysisPage";
import ResultsPage from "./pages/ResultsPage";
import ComparisonPage from "./pages/ComparisonPage";
import MaterialsPage from "./pages/MaterialsPage";
import MethodologyPage from "./pages/MethodologyPage";
import NotFoundPage from "./pages/NotFoundPage";
import HistoryPage from "./pages/HistoryPage";

export default function App() {
  return (
    <AnalysisProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="analysis" element={<AnalysisPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="compare" element={<ComparisonPage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="methodology" element={<MethodologyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </AnalysisProvider>
  );
}
