import { ButtonLink } from "../components/common/Button";
import { PageContainer } from "../components/layout/Layout";

export default function NotFoundPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-md py-16 text-center" data-testid="not-found-page">
        <p className="font-mono-tech text-sm font-semibold text-emerald-700">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The page you requested does not exist.</p>
        <ButtonLink to="/" className="mt-6" data-testid="not-found-home-button">Back to Home</ButtonLink>
      </div>
    </PageContainer>
  );
}
