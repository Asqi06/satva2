import { useId } from "react";
import type { AddressInput } from "@/schemas/checkout";

export function AddressFields({ initial = {}, errors = {} }: { initial?: Partial<AddressInput>; errors?: Record<string, string> }) {
  const id = useId();
  const fields = [
    { name: "fullName", label: "Full name", autoComplete: "name", maxLength: 120 },
    { name: "phone", label: "Mobile number", autoComplete: "tel-national", maxLength: 10, type: "tel", pattern: "[6-9][0-9]{9}", hint: "10 digits, without +91" },
    { name: "addressLine1", label: "Street address", autoComplete: "address-line1", maxLength: 256, wide: true },
    { name: "addressLine2", label: "Apartment, floor or building (optional)", autoComplete: "address-line2", maxLength: 256, optional: true, wide: true },
    { name: "city", label: "City", autoComplete: "address-level2", maxLength: 120 },
    { name: "state", label: "State", autoComplete: "address-level1", maxLength: 120 },
    { name: "pincode", label: "PIN code", autoComplete: "postal-code", maxLength: 6, pattern: "[1-9][0-9]{5}", hint: "6-digit Indian PIN code" },
  ];
  return <div className="grid gap-5 sm:grid-cols-2">{fields.map(field => <div key={field.name} className={field.wide ? "sm:col-span-2" : ""}><label htmlFor={`${id}-${field.name}-input`} className="field-label">{field.label}</label><input id={`${id}-${field.name}-input`} name={field.name} type={field.type ?? "text"} inputMode={field.name === "pincode" ? "numeric" : field.type === "tel" ? "tel" : "text"} autoComplete={field.autoComplete} required={!field.optional} maxLength={field.maxLength} pattern={field.pattern} defaultValue={String(initial[field.name as keyof AddressInput] ?? "")} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] || field.hint ? `${id}-${field.name}` : undefined} className="field" />{(errors[field.name] || field.hint) && <span id={`${id}-${field.name}`} className={`mt-1 block text-xs ${errors[field.name] ? "text-primary" : "text-muted"}`}>{errors[field.name] || field.hint}</span>}</div>)}</div>;
}
