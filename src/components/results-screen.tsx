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
    if (s >= 80) return "bg-green-500"
    if (s >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-bold tabular-nums">{score}%</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${getColor(score)}`}
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
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4" />
          Comparativa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Score Inicial</p>
            <p className="text-2xl font-bold">{initialScore}%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Score Final</p>
            <p className="text-2xl font-bold text-green-600">{finalScore}%</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm">
          {isPositive ? (
            <>
              <ArrowUp className="size-4 text-green-500" />
              <span className="font-semibold text-green-600">
                Mejora de +{improvement} puntos
              </span>
            </>
          ) : (
            <>
              <ArrowDown className="size-4 text-red-500" />
              <span className="font-semibold text-red-600">
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
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, i) => (
            <Badge key={i} variant={variant}>
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
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {flags.map((flag, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
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
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-4 text-green-500" />
          Mejoras Realizadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />
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
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center size-14 rounded-full bg-green-100 dark:bg-green-900/20 mb-2">
          <CheckCircle2 className="size-7 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Optimización Completa</h2>
        <p className="text-muted-foreground">
          Tu CV ha sido analizado y optimizado para: {fileName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ScoreBar
          score={initial_analysis.compatibility_score}
          label="Score ATS Inicial"
        />
        <ScoreBar
          score={final_analysis.compatibility_score}
          label="Score ATS Final"
        />
      </div>

      <ComparisonCard
        initialScore={initial_analysis.compatibility_score}
        finalScore={final_analysis.compatibility_score}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <KeywordList
          keywords={initial_analysis.missing_keywords}
          title="Keywords Faltantes (Inicial)"
          icon={Target}
          variant="destructive"
        />
        <KeywordList
          keywords={final_analysis.missing_keywords}
          title="Keywords Aún Faltantes"
          icon={Target}
          variant="default"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RedFlagList flags={initial_analysis.red_flags} title="Red Flags Detectadas" />
        {final_audit.improvements.length > 0 && (
          <ImprovementList items={final_audit.improvements} />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="size-4" />
            Resumen Ejecutivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Mejora</p>
              <p className="text-lg font-bold text-green-600">
                +{improvement} pts
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Keywords Agregadas</p>
              <p className="text-lg font-bold">{keywordsAdded}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Red Flags Corregidas</p>
              <p className="text-lg font-bold">{redFlagsCorrected}</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            {initial_analysis.summary}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onDownload} disabled={downloading} size="lg">
          <Download className="size-4" />
          {downloading ? "Generando..." : "Descargar CV Optimizado"}
        </Button>
        <Button onClick={onReset} variant="outline" size="lg">
          Analizar otro CV
        </Button>
      </div>
    </div>
  )
}
