"use client"

import { Textarea } from "@/components/ui/textarea"

interface JobDescriptionInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function JobDescriptionInput({
  value,
  onChange,
  disabled,
}: JobDescriptionInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="job-description" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Descripción del Puesto
      </label>
      <Textarea
        id="job-description"
        placeholder="Pega aquí la descripción de la vacante"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-h-[180px] resize-y text-sm"
        name="job-description"
        autoComplete="off"
      />
      <p className="text-[10px] text-muted-foreground/40 text-right">
        {value.length} caracteres
      </p>
    </div>
  )
}
