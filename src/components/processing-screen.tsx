"use client"

import { Progress } from "@/components/ui/progress"
import { FileText, Brain, Loader2 } from "lucide-react"
import type { ProcessingStatus } from "@/lib/types"

const stageConfig: Record<string, { label: string; icon: typeof Loader2 }> = {
  extracting: { label: "Extrayendo texto del PDF", icon: FileText },
  evaluating: { label: "Analizando CV con IA", icon: Brain },
}

interface ProcessingScreenProps {
  status: ProcessingStatus
}

export function ProcessingScreen({ status }: ProcessingScreenProps) {
  const config = stageConfig[status.stage]
  const Icon = config?.icon || Loader2

  const stageKeys = Object.keys(stageConfig)
  const currentIdx = stageKeys.indexOf(status.stage)

  return (
    <div className="space-y-8 py-8">
      <div className="text-center space-y-3">
        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Icon className="size-6 text-primary animate-pulse" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-medium">
            {config?.label || "Procesando..."}
          </p>
          <p className="text-xs text-muted-foreground">{status.message}</p>
        </div>
      </div>

      <Progress value={status.progress} className="w-full h-1.5" />
      <p className="text-center text-xs text-muted-foreground tabular-nums">
        {status.progress}%
      </p>

      <div className="space-y-1">
        {stageKeys.map((key, idx) => {
          const StageIcon = stageConfig[key].icon
          const isActive = key === status.stage
          const isDone = idx < currentIdx

          return (
            <div
              key={key}
              role="status"
              aria-current={isActive ? "step" : undefined}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs
                ${isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : isDone
                  ? "text-muted-foreground/50"
                  : "text-muted-foreground/20"
                }
              `}
            >
              <StageIcon className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{stageConfig[key].label}</span>
              <span className="ml-auto">
                {isDone && <span className="text-green-500/60 text-[10px]" aria-label="Completado">✓</span>}
                {isActive && (
                  <span className="flex size-1.5 rounded-full bg-primary animate-ping" aria-hidden="true" />
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
