"use client";

import type { ReactNode } from "react";

interface SectionLabelProps {
  label: string;
  icon?: ReactNode;
}

export function SectionLabel({ label, icon }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-4 pt-12 pb-6">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-brand-500">{icon}</span>}
        <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase whitespace-nowrap">
          {label}
        </h3>
      </div>
      <div className="flex-1 h-px bg-secondary" />
    </div>
  );
}

interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  required?: boolean;
  hint?: string;
}

export function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  hint,
}: InputFieldProps) {
  return (
    <div className="space-y-2.5">
      <label htmlFor={id} className="label-uppercase ml-1">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="input-base"
      />
      {hint && <p className="text-muted font-medium ml-1">{hint}</p>}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: SelectFieldProps) {
  return (
    <div className="space-y-2.5">
      <label htmlFor={id} className="label-uppercase ml-1">
        {label}
      </label>
      <div className="relative group">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="select-base"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface TextareaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}

export function TextareaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
}: TextareaFieldProps) {
  return (
    <div className="space-y-2.5">
      <label htmlFor={id} className="label-uppercase ml-1">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="textarea-base"
      />
      {hint && <p className="text-muted font-medium ml-1">{hint}</p>}
    </div>
  );
}
