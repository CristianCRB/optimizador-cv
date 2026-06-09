"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowUp,
  ArrowDown,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Target,
  ListChecks,
  RefreshCw,
} from "lucide-react"
import type { OptimizationResult } from "@/lib/types"

function ScoreBar({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-[#22D66E]"
    if (s >= 60) return "bg-[#1E88FF]"
    return "bg-[#EF4444]"
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-bold tabular-nums">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function ComparisonCard({
  initialScore,
  finalScore,
}: {
  initialScore: number
  finalScore: number
}) {
  const improvement = finalScore - initialScore
  const isPositive = improvement >= 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="size-4" aria-hidden="true" />
          Comparativa de Score ATS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScoreBar score={initialScore} label="Score inicial" />
        <ScoreBar score={finalScore} label="Score final" />
        <div className="flex items-center justify-center gap-1.5 text-sm pt-1">
          {isPositive ? (
            <>
              <ArrowUp className="size-4 text-green-500" aria-hidden="true" />
              <span className="font-medium text-green-500">
                +{improvement} puntos de mejora
              </span>
            </>
          ) : (
            <>
              <ArrowDown className="size-4 text-red-500" aria-hidden="true" />
              <span className="font-medium text-red-500">
                {improvement} puntos
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function KeywordList({
  keywords,
  title,
  icon,
  variant,
}: {
  keywords: string[]
  title: string
  icon: typeof Target
  variant: "destructive" | "default"
}) {
  const Icon = icon
  if (keywords.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw, i) => (
            <Badge key={i} variant={variant} className="text-[11px]">
              {kw}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RedFlagList({
  flags,
  title,
}: {
  flags: string[]
  title: string
}) {
  if (flags.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {flags.map((flag, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <XCircle className="size-3.5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
            <span>{flag}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ImprovementList({ items }: { items: string[] }) {
  if (items.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <ListChecks className="size-4 text-green-500" aria-hidden="true" />
          Mejoras Realizadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <CheckCircle2 className="size-3.5 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

interface ResultsScreenProps {
  result: OptimizationResult
  fileName: string
  onDownload: () => void
  onReset: () => void
  downloading: boolean
}

export function ResultsScreen({
  result,
  fileName,
  onDownload,
  onReset,
  downloading,
}: ResultsScreenProps) {
  const { initial_analysis, final_analysis, final_audit } = result

  const improvement = final_analysis.compatibility_score - initial_analysis.compatibility_score
  const keywordsAdded = initial_analysis.missing_keywords.filter(
    (kw) => !final_analysis.missing_keywords.includes(kw)
  ).length
  const redFlagsCorrected = initial_analysis.red_flags.filter(
    (rf) => !final_analysis.red_flags.includes(rf)
  ).length

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="size-5 text-green-500" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold">Optimización Completa</h2>
        <p className="text-xs text-muted-foreground">{fileName}</p>
      </div>

      <ComparisonCard
        initialScore={initial_analysis.compatibility_score}
        finalScore={final_analysis.compatibility_score}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <KeywordList
          keywords={initial_analysis.missing_keywords}
          title="Keywords faltantes (inicial)"
          icon={Target}
          variant="destructive"
        />
        <KeywordList
          keywords={final_analysis.missing_keywords}
          title="Keywords aún faltantes"
          icon={Target}
          variant="default"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <RedFlagList flags={initial_analysis.red_flags} title="Red flags detectadas" />
        {final_audit.improvements.length > 0 && (
          <ImprovementList items={final_audit.improvements} />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <RefreshCw className="size-4" aria-hidden="true" />
            Resumen
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-secondary">
              <p className="text-[10px] text-muted-foreground/60">Mejora</p>
              <p className="text-sm font-bold font-mono tabular-nums text-green-500">
                +{improvement} pts
              </p>
            </div>
            <div className="p-2 rounded bg-secondary">
              <p className="text-[10px] text-muted-foreground/60">Keywords</p>
              <p className="text-sm font-bold font-mono tabular-nums">{keywordsAdded}</p>
            </div>
            <div className="p-2 rounded bg-secondary">
              <p className="text-[10px] text-muted-foreground/60">Red flags</p>
              <p className="text-sm font-bold font-mono tabular-nums">{redFlagsCorrected}</p>
            </div>
          </div>
          <p>{initial_analysis.summary}</p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={onDownload} disabled={downloading}>
          <Download className="size-4" aria-hidden="true" />
          {downloading ? "Generando\u2026" : "Descargar CV Optimizado"}
        </Button>
        <Button onClick={onReset} variant="outline">
          Analizar otro CV
        </Button>
      </div>
    </div>
  )
}
