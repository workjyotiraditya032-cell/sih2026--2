import { FormEvent, useState } from "react";
import { CloudSun, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, toApiError } from "../../services/api";
import type { EnvironmentConditions } from "../../types";
import { inputClass } from "../common/FormControls";
import { Button } from "../common/Button";

interface Props {
  enabled: boolean;
  onApply: (temperature: number, humidity: number) => void;
}

export const EnvironmentLookup = ({ enabled, onApply }: Props) => {
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnvironmentConditions | null>(null);

  const lookup = async (e?: FormEvent) => {
    e?.preventDefault();
    if (location.trim().length < 2) {
      toast.error("Enter a city or location name");
      return;
    }
    setLoading(true);
    try {
      const data = await api.environment(location.trim());
      setResult(data);
      onApply(data.temperature, data.relative_humidity);
      toast.success(`Applied current conditions for ${data.location}`);
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/50 p-4" data-testid="environment-lookup">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
        <CloudSun className="h-4 w-4 text-blue-600" /> Optional: fetch ambient conditions (Open-Meteo)
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup(e)}
          disabled={!enabled}
          maxLength={80}
          placeholder={enabled ? "City, e.g. Nashik" : "Available for ambient storage"}
          className={inputClass()}
          data-testid="environment-location-input"
        />
        <Button variant="secondary" onClick={() => lookup()} disabled={!enabled || loading} data-testid="environment-fetch-button">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudSun className="h-4 w-4" />} Fetch conditions
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-500" data-testid="environment-lookup-status">
        {result
          ? `${result.location}: ${result.temperature} °C, ${result.relative_humidity}% RH (${result.source}). Values can still be edited.`
          : "Manual entry always works. Weather data is only a convenience and does not drive the recommendation logic."}
      </p>
    </div>
  );
};
