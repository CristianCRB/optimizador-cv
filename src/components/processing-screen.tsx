"use client"

import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Search,
  PenLine,
  ClipboardCheck,
  FileDown,
  BarChart3,
  Loader2,
} from "lucide-react"
import type { ProcessingStatus } from "@/lib/types"

const stageConfig: Record<
  string,
  { label: string; icon: typeof Loader2 }
> = {
  extracting: { label: "Extrayendo texto del PDF", icon: FileText },
  analyzing: { label: "Analizando compatibilidad ATS", icon: Search },
  rewriting: { label: "Reescribiendo experiencia profesional", icon: PenLine },
  auditing: { label: "Ejecutando auditoría ATS", icon: ClipboardCheck },
  generating: { label: "Generando PDF optimizado", icon: FileDown },
  calculating: { label: "Calculando score final", icon: BarChart3 },
}

interface ProcessingScreenProps {
  status: ProcessingStatus
}

export function ProcessingScreen({ status }: ProcessingScreenProps) {
  const config = stageConfig[status.stage]
  const Icon = config?.icon || Loader2

  return (
    <div className="max-w-lg mx-auto text-center space-y-8 py-16">
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-24 rounded-full bg-primary/5 animate-ping" />
        </div>
        <div className="relative flex items-center justify-center">
          <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="size-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-lg font-medium">
          {config?.label || "Procesando..."}
        </p>
        <p className="text-sm text-muted-foreground">
          {status.message}
        </p>
      </div>

      <Progress value={status.progress} className="w-full" />
      <p className="text-sm text-muted-foreground tabular-nums">
        {status.progress}%
      </p>

      <div className="space-y-2">
        {Object.entries(stageConfig).map(([key, s]) => {
          const StageIcon = s.icon
          const isActive = key === status.stage
          const isDone =
            Object.keys(stageConfig).indexOf(key) <
            Object.keys(stageConfig).indexOf(status.stage)

          return (
            <div
              key={key}
              className={`flex items-center gap-3 text-sm px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : isDone
                  ? "text-muted-foreground/60"
                  : "text-muted-foreground/40"
              }`}
            >
              <StageIcon className="size-4 shrink-0" />
              <span>{s.label}</span>
              {isDone && <span className="ml-auto text-xs">✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
