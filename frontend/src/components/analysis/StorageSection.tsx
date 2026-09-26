import type { AnalysisForm, FormErrors, StorageType } from "../../types";
import { SHELF_UNITS, STORAGE_OPTIONS, TRANSPORT_OPTIONS } from "../../utils/constants";
import { Field, NumberInput, Segmented, SelectInput } from "../common/FormControls";
import { FormSection } from "./FormSection";
import type { UpdateField } from "./FoodInfoSection";

interface Props {
  form: AnalysisForm;
  errors: FormErrors;
  update: UpdateField;
  onStorageChange: (value: StorageType) => void;
}

export const StorageSection = ({ form, errors, update, onStorageChange }: Props) => (
  <FormSection index="B" title="Storage Requirements" subtitle="Shelf-life target and distribution conditions" testId="section-storage-requirements">
    <Field label="Desired Shelf Life" htmlFor="shelf_life_value" error={errors.shelf_life_value}>
      <div className="grid grid-cols-[1fr_120px] gap-2">
        <NumberInput id="shelf_life_value" value={form.shelf_life_value} onChange={(v) => update("shelf_life_value", v)} error={errors.shelf_life_value} step="1" placeholder="e.g. 10" />
        <SelectInput id="shelf_life_unit" value={form.shelf_life_unit} options={SHELF_UNITS} onChange={(v) => update("shelf_life_unit", v)} />
      </div>
    </Field>
    <Field label="Storage Type" htmlFor="storage_type" hint="Changing the type sets a typical temperature">
      <Segmented id="storage_type" value={form.storage_type} options={STORAGE_OPTIONS} onChange={onStorageChange} />
    </Field>
    <Field label="Storage Temperature" htmlFor="temperature" error={errors.temperature}>
      <NumberInput id="temperature" value={form.temperature} onChange={(v) => update("temperature", v)} unit="°C" error={errors.temperature} step="0.5" />
    </Field>
    <div className="sm:col-span-2">
      <Field label="Transportation Condition" htmlFor="transportation">
        <SelectInput id="transportation" value={form.transportation} options={TRANSPORT_OPTIONS} onChange={(v) => update("transportation", v)} />
      </Field>
    </div>
  </FormSection>
);
