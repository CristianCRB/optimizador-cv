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
      <label className="text-sm font-medium">
        Descripción del Puesto
      </label>
      <Textarea
        placeholder="Pega aquí la descripción del puesto de trabajo..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-h-[300px] resize-y"
      />
      <p className="text-xs text-muted-foreground text-right">
        {value.length} caracteres
      </p>
    </div>
  )
}
