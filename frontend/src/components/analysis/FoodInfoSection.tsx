import type { AnalysisForm, FormErrors } from "../../types";
import { COMMODITY_OPTIONS } from "../../utils/constants";
import { Field, inputClass } from "../common/FormControls";
import { FormSection } from "./FormSection";

export type UpdateField = <K extends keyof AnalysisForm>(key: K, value: AnalysisForm[K]) => void;

interface Props {
  form: AnalysisForm;
  errors: FormErrors;
  onCommodityChange: (name: string) => void;
}

export const FoodInfoSection = ({ form, errors, onCommodityChange }: Props) => (
  <FormSection index="A" title="What food are you packaging?" subtitle="Just the food name. We handle the technical profile." testId="section-food-information">
    <div className="sm:col-span-2">
      <Field label="Food / Commodity" htmlFor="commodity" error={errors.commodity} hint="Be specific for prepared foods: dry rice and cooked rice need different packaging.">
        <input id="commodity" data-testid="commodity-input" list="food-suggestions" value={form.commodity} maxLength={60}
          placeholder="Search or type a food, e.g. Tomato or Curd" onChange={(e) => onCommodityChange(e.target.value)} className={inputClass(errors.commodity)} autoComplete="off" />
        <datalist id="food-suggestions">{COMMODITY_OPTIONS.map((food) => <option key={food} value={food} />)}</datalist>
      </Field>
      <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800" data-testid="food-intelligence-hint">
        AI + a food-property knowledge base build a typical profile. You don't need to know pH, moisture or respiration. No laboratory measurements are inferred from your input.
      </p>
    </div>
  </FormSection>
);
