"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Gauge,
  ChevronDown,
  ChevronUp,
  Trash2,
  Trophy,
  Flame,
  Coins,
  Cpu,
  Zap,
} from "lucide-react"
import type {
  AnalysisUsage,
  GeminiUsage,
  UsageSessionSummary,
} from "@/lib/types"
import { clearUsageHistory } from "@/lib/local-usage-store"
import { cn } from "@/lib/utils"

interface UsagePanelProps {
  lastUsage: {
    usage: GeminiUsage | null
    countedPromptTokens: number
    charCount: number
  } | null
  usageSummary: UsageSessionSummary
}

function formatNumber(n: number): string {
  return n.toLocaleString("es-ES")
}

export function UsagePanel({ lastUsage, usageSummary }: UsagePanelProps) {
  const [open, setOpen] = useState(false)

  const handleClear = () => {
    clearUsageHistory()
    window.location.reload()
  }

  return (
    <Card className="border-muted/40">
      <CardContent className="py-3 space-y-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Gauge className="size-4 text-primary" aria-hidden="true" />
            <p className="text-xs font-medium">Consumo de esta consulta y de mi sesión</p>
          </div>
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/40 rounded-md p-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Cpu className="size-3" aria-hidden="true" /> Entrada
            </p>
            <p className="text-sm font-semibold">
              {formatNumber(lastUsage?.usage?.promptTokenCount ?? lastUsage?.countedPromptTokens ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground/60">tokens</p>
          </div>
          <div className="bg-muted/40 rounded-md p-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Zap className="size-3" aria-hidden="true" /> Salida
            </p>
            <p className="text-sm font-semibold">
              {formatNumber(lastUsage?.usage?.candidatesTokenCount ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground/60">tokens</p>
          </div>
          <div className="bg-muted/40 rounded-md p-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Coins className="size-3" aria-hidden="true" /> Total
            </p>
            <p className="text-sm font-semibold">
              {formatNumber(lastUsage?.usage?.totalTokenCount ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground/60">tokens</p>
          </div>
        </div>

        {lastUsage?.usage?.modelVersion && (
          <p className="text-[10px] text-muted-foreground">
            Modelo: <span className="font-medium">{lastUsage.usage.modelVersion}</span> · CV:{" "}
            {formatNumber(lastUsage.charCount)} caracteres · {formatNumber(lastUsage.countedPromptTokens)}{" "}
            tokens de prompt estimados
          </p>
        )}

        {open && (
          <div className="border-t pt-3 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium">Resumen de mi historial ({usageSummary.totalAnalyses} análisis)</p>
                <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 gap-1 text-[11px] text-destructive">
                  <Trash2 className="size-3" aria-hidden="true" />
                  Limpiar
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/40 rounded-md p-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total tokens</p>
                  <p className="text-sm font-semibold">{formatNumber(usageSummary.totalTokens)}</p>
                </div>
                <div className="bg-muted/40 rounded-md p-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Promedio por CV</p>
                  <p className="text-sm font-semibold">{formatNumber(usageSummary.avgTokensPerCv)}</p>
                </div>
                {usageSummary.heaviest && (
                  <div className="bg-destructive/5 rounded-md p-2">
                    <p className="text-[10px] text-destructive uppercase tracking-wide flex items-center gap-1">
                      <Flame className="size-3" aria-hidden="true" /> Más pesado
                    </p>
                    <p className="text-xs font-medium truncate">{usageSummary.heaviest.fileName}</p>
                    <p className="text-[10px] text-muted-foreground/60">{formatNumber(usageSummary.heaviest.totalTokenCount)} tokens</p>
                  </div>
                )}
                {usageSummary.lightest && (
                  <div className="bg-[#22D66E]/5 rounded-md p-2">
                    <p className="text-[10px] text-[#22D66E] uppercase tracking-wide flex items-center gap-1">
                      <Trophy className="size-3" aria-hidden="true" /> Más óptimo
                    </p>
                    <p className="text-xs font-medium truncate">{usageSummary.lightest.fileName}</p>
                    <p className="text-[10px] text-muted-foreground/60">{formatNumber(usageSummary.lightest.totalTokenCount)} tokens</p>
                  </div>
                )}
              </div>
            </div>

            {usageSummary.records.length > 0 && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {[...usageSummary.records]
                  .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                  .map((r) => (
                    <SessionRow key={r.id} record={r} />
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SessionRow({ record }: { record: AnalysisUsage }) {
  const date = new Date(record.timestamp).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2 py-1.5">
      <div className="min-w-0">
        <p className="text-[11px] font-medium truncate">{record.fileName}</p>
        <p className="text-[10px] text-muted-foreground">{date} · {record.model}</p>
      </div>
      <div className="text-right shrink-0">
        <Badge variant="outline" className="text-[10px]">
          {record.totalTokenCount.toLocaleString("es-ES")} tok
        </Badge>
        <p className={cn("text-[10px]", record.overallScore >= 70 ? "text-[#22D66E]" : "text-amber-500")}>
          score {record.overallScore}
        </p>
      </div>
    </div>
  )
}
