"use client";

import { useId } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import { AD_FIELD_LIMITS, type AdBriefInput, type AdTextField } from "@/contracts/ad";
import { describedBy, Field, Input, Textarea } from "@/shared/ui";

import { FIELD_COPY } from "../model/briefCopy";

/** One of the brief's text fields, with its label, hint, error and character count from one home. */
export function BriefTextField({
  form,
  name,
  multiline = false,
  optional = false,
}: {
  form: UseFormReturn<AdBriefInput>;
  name: AdTextField;
  multiline?: boolean;
  optional?: boolean;
}) {
  const id = useId();
  const value = useWatch({ control: form.control, name });
  const hasError = Boolean(form.formState.errors[name]);
  const copy = FIELD_COPY[name];
  const { max } = AD_FIELD_LIMITS[name];
  const control = {
    id,
    ...form.register(name),
    placeholder: copy.placeholder,
    maxLength: max,
    "aria-invalid": hasError || undefined,
    "aria-describedby": describedBy(id, hasError),
  };

  return (
    <Field
      id={id}
      label={copy.label}
      hint={copy.hint}
      error={hasError ? copy.error : undefined}
      optional={optional}
      count={{ value: value.length, max }}
    >
      {multiline ? <Textarea rows={3} {...control} /> : <Input {...control} />}
    </Field>
  );
}
