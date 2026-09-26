import type { AnalysisForm } from "../../types";
import { PRIORITY_OPTIONS } from "../../utils/constants";
import { Field, SelectInput } from "../common/FormControls";
import { FormSection } from "./FormSection";
import type { UpdateField } from "./FoodInfoSection";

export const PreferencesSection = ({ form, update }: { form: AnalysisForm; update: UpdateField }) => (
  <FormSection index="C" title="What matters most?" subtitle="Your priority changes how suitable packaging options are compared" testId="section-packaging-preferences">
    <div className="sm:col-span-2">
      <Field label="Packaging Priority" htmlFor="priority" hint="Technical compatibility always comes first—even when cost or sustainability is your priority.">
        <SelectInput id="priority" value={form.priority ?? 'balanced'} options={PRIORITY_OPTIONS} onChange={(v) => update('priority', v)} />
      </Field>
    </div>
  </FormSection>
);
