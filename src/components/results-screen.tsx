"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoreRing } from "@/components/score-ring"
import {
  Trash2,
  Lightbulb,
  User,
  Briefcase,
  GraduationCap,
  Zap,
  AlertTriangle,
  Target,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  FileText,
  Calendar,
  ListChecks,
  MapPin,
  ClipboardList,
} from "lucide-react"
import type {
  CVEvaluation,
  PersonalInfo,
  WorkExperience,
  Education,
  DimensionScores,
  SectionAnalysis,
  SectionStatus,
  GeminiUsage,
  UsageSessionSummary,
} from "@/lib/types"
import { UsagePanel } from "@/components/usage-panel"

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const dimensionExplanations: Record<string, string> = {
  skills: "Valora la cantidad, relevancia y profundidad técnica de las habilidades presentadas, así como su alineación con los requisitos del puesto.",
  experience: "Evalúa la relevancia de los roles anteriores, logros cuantificables, duración y progresión profesional demostrada en el documento.",
  education: "Analiza los títulos académicos, instituciones, pertinencia del campo de estudio y certificaciones adicionales.",
  structure: "Mide la organización del documento, claridad de secciones, formato consistente y facilidad de lectura para sistemas ATS.",
}

function PersonalInfoCard({ info }: { info: PersonalInfo }) {
  const fields: { label: string; value: string; icon: typeof User }[] = [
    { label: "Nombre completo", value: info.full_name, icon: User },
    { label: "Email", value: info.email, icon: User },
    { label: "Teléfono", value: info.phone, icon: User },
    { label: "Ubicación", value: info.location, icon: User },
    { label: "LinkedIn", value: info.linkedin, icon: User },
  ]

  return (
    <div className="space-y-2">
      {fields.map((f) => (
        <div key={f.label} className="flex items-start gap-2 text-xs">
          <span className="text-muted-foreground shrink-0 min-w-20">{f.label}:</span>
          {f.value ? (
            <span className="font-medium">{f.value}</span>
          ) : (
            <span className="text-muted-foreground/40 italic">No detectado</span>
          )}
        </div>
      ))}
      {info.other && (
        <div className="flex items-start gap-2 text-xs">
          <span className="text-muted-foreground shrink-0 min-w-20">Otros:</span>
          <span className="font-medium">{info.other}</span>
        </div>
      )}
    </div>
  )
}

function ExperienceCard({ experiences }: { experiences: WorkExperience[] }) {
  if (experiences.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No se detectó experiencia laboral en el documento.</p>
  }

  return (
    <div className="space-y-3">
      {experiences.map((exp, i) => (
        <div key={i} className="border-l-2 border-primary/20 pl-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium">{exp.position}</p>
              <p className="text-[11px] text-muted-foreground">{exp.company}</p>
            </div>
            <span className="text-[10px] text-muted-foreground/60 shrink-0">{exp.duration}</span>
          </div>
          {exp.description && (
            <p className="text-[11px] text-muted-foreground">{exp.description}</p>
          )}
          {exp.achievements.length > 0 && (
            <ul className="space-y-0.5">
              {exp.achievements.map((ach, j) => (
                <li key={j} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  {ach}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function EducationCard({ education }: { education: Education[] }) {
  if (education.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No se detectó educación en el documento.</p>
  }

  return (
    <div className="space-y-3">
      {education.map((edu, i) => (
        <div key={i} className="border-l-2 border-primary/20 pl-3 space-y-0.5">
          <p className="text-xs font-medium">{edu.degree} en {edu.field}</p>
          <p className="text-[11px] text-muted-foreground">{edu.institution}</p>
          {edu.year && (
            <p className="text-[10px] text-muted-foreground/60">{edu.year}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function SuggestionItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <Lightbulb className="size-3.5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
}

function ATSOptimizationCard({ opt, index }: {
  opt: { section: string; original: string; suggestion: string; explanation: string }
  index: number
}) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{index + 1}</span>
        <span className="text-xs font-medium">{opt.section}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="bg-destructive/5 rounded p-2 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-destructive font-medium">
            <span className="size-1.5 rounded-full bg-destructive" />
            Original
          </div>
          <p className="text-[11px] text-muted-foreground">{opt.original}</p>
        </div>
        <div className="bg-green-500/5 rounded p-2 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
            <span className="size-1.5 rounded-full bg-green-500" />
            Sugerido
          </div>
          <p className="text-[11px] text-muted-foreground">{opt.suggestion}</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground/70 italic">{opt.explanation}</p>
    </div>
  )
}

function RadarChart({ scores }: { scores: DimensionScores }) {
  const size = 180
  const center = size / 2
  const radius = 72

  const axes = [
    { key: "skills" as const, label: "Habilidades", angle: -Math.PI / 2 },
    { key: "experience" as const, label: "Experiencia", angle: 0 },
    { key: "education" as const, label: "Educación", angle: Math.PI / 2 },
    { key: "structure" as const, label: "Estructura", angle: Math.PI },
  ]

  const levels = [25, 50, 75, 100]

  function polar(angle: number, value: number) {
    const r = (value / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  function polygonPath(pts: { x: number; y: number }[]) {
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"
  }

  const dataPoints = axes.map((a) => polar(a.angle, scores[a.key]))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {levels.map((level) => {
        const pts = axes.map((a) => polar(a.angle, level))
        return (
          <path
            key={level}
            d={polygonPath(pts)}
            fill="none"
            className="stroke-foreground/10"
            strokeWidth={1}
          />
        )
      })}
      {axes.map((a) => {
        const p = polar(a.angle, 100)
        return (
          <line
            key={a.key}
            x1={center} y1={center} x2={p.x} y2={p.y}
            className="stroke-foreground/10"
            strokeWidth={1}
          />
        )
      })}
      <path
        d={polygonPath(dataPoints)}
        fill="rgba(30, 136, 255, 0.12)"
        className="stroke-[#1E88FF]"
        strokeWidth={2}
      />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#1E88FF" />
      ))}
      {axes.map((a) => {
        const p = polar(a.angle, 118)
        return (
          <text
            key={a.key}
            x={p.x} y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="currentColor"
            className="text-[9px] fill-muted-foreground font-medium"
          >
            {a.label}
          </text>
        )
      })}
      {dataPoints.map((p, i) => (
        <text
          key={i}
          x={p.x} y={p.y - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[8px] font-mono fill-[#1E88FF] font-bold"
        >
          {scores[axes[i].key]}
        </text>
      ))}
    </svg>
  )
}

function CVChecklist({ result }: { result: CVEvaluation }) {
  const items: { label: string; check: boolean }[] = [
    { label: "Información personal completa", check: result.personal_info.full_name !== "" && result.personal_info.email !== "" },
    { label: "Experiencia laboral documentada", check: result.work_experience.length > 0 },
    { label: "Formación académica registrada", check: result.education.length > 0 },
    { label: "Habilidades y tecnologías listadas", check: result.skills.length > 0 },
    { label: "Logros cuantificables en experiencia", check: result.work_experience.some((e) => e.achievements.length > 0) },
    { label: "Puntaje ATS óptimo (≥70)", check: result.ats_analysis.compatibility_score >= 70 },
    { label: "Sin alertas críticas", check: result.ats_analysis.red_flags.length === 0 },
  ]

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          {item.check ? (
            <CheckCircle2 className="size-3.5 text-[#22D66E] shrink-0" />
          ) : (
            <XCircle className="size-3.5 text-muted-foreground/30 shrink-0" />
          )}
          <span className={item.check ? "text-foreground" : "text-muted-foreground/40"}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

interface ResultsScreenProps {
  result: CVEvaluation
  fileName: string
  uploadDate: Date
  onDelete: () => void
  lastUsage?: {
    usage: GeminiUsage | null
    countedPromptTokens: number
    charCount: number
  } | null
  usageSummary?: UsageSessionSummary
}

const sectionMeta: Record<string, { icon: typeof User; label: string }> = {
  encabezado: { icon: User, label: "Encabezado" },
  resumen: { icon: ClipboardList, label: "Resumen" },
  habilidades: { icon: Zap, label: "Habilidades" },
  experiencia: { icon: Briefcase, label: "Experiencia" },
  educacion: { icon: GraduationCap, label: "Educación" },
  certificaciones: { icon: FileText, label: "Certificaciones" },
  formato: { icon: ListChecks, label: "Formato" },
}

const statusStyles: Record<
  SectionStatus,
  { ring: string; badge: string; label: string; text: string }
> = {
  ok: {
    ring: "ring-[#22D66E]/30",
    badge: "bg-[#22D66E]/10 text-[#22D66E]",
    label: "En orden",
    text: "text-[#22D66E]",
  },
  improve: {
    ring: "ring-amber-500/30",
    badge: "bg-amber-500/10 text-amber-500",
    label: "A mejorar",
    text: "text-amber-500",
  },
  critical: {
    ring: "ring-destructive/30",
    badge: "bg-destructive/10 text-destructive",
    label: "Corregir",
    text: "text-destructive",
  },
}

function SectionReview({ section }: { section: SectionAnalysis }) {
  const meta = sectionMeta[section.id] || {
    icon: ListChecks,
    label: section.title,
  }
  const Icon = meta.icon
  const style = statusStyles[section.status] || statusStyles.improve

  return (
    <Card className={`ring-1 ${style.ring}`}>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium">{meta.label}</p>
              <p className="text-[10px] text-muted-foreground">{section.detected}</p>
            </div>
          </div>
          <Badge className={`${style.badge} shrink-0`}>{style.label}</Badge>
        </div>

        {section.strengths.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-[#22D66E] uppercase tracking-wide">
              Lo que está bien
            </p>
            <ul className="space-y-0.5">
              {section.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <CheckCircle2 className="size-3 text-[#22D66E] shrink-0 mt-0.5" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {section.issues.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-destructive uppercase tracking-wide">
              Problemas detectados
            </p>
            <ul className="space-y-0.5">
              {section.issues.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <XCircle className="size-3 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {section.instructions.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-[10px] font-medium text-primary uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <MapPin className="size-3" aria-hidden="true" />
              Dónde y qué corregir
            </p>
            <ul className="space-y-1.5">
              {section.instructions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[11px] text-foreground bg-muted/40 rounded-md p-2"
                >
                  <span className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0 mt-px">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ResultsScreen({
  result,
  fileName,
  uploadDate,
  onDelete,
  lastUsage,
  usageSummary,
}: ResultsScreenProps) {
  const { overall_score, dimension_scores, personal_info, skills, work_experience, education, suggestions, ats_analysis, ats_optimizations, sections } = result

  return (
    <div className="space-y-5">
      {/* Container 1: File info */}
      <Card>
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium">{fileName}</p>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="size-3" aria-hidden="true" />
                {formatDate(uploadDate)}
              </div>
            </div>
          </div>
          <Button
            onClick={onDelete}
            variant="destructive"
            size="sm"
            className="gap-1.5"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Eliminar
          </Button>
        </CardContent>
      </Card>

      {/* Container 1.5: Usage info */}
      {lastUsage && (
        <UsagePanel
          lastUsage={lastUsage}
          usageSummary={
            usageSummary ?? {
              totalAnalyses: 0,
              totalTokens: 0,
              totalPromptTokens: 0,
              totalCandidateTokens: 0,
              avgTokensPerCv: 0,
              heaviest: null,
              lightest: null,
              records: [],
            }
          }
        />
      )}

      {/* Container 2: Overall score */}
      <Card>
        <CardContent className="flex items-start gap-4 py-4">
          <ScoreRing score={overall_score} size={90} strokeWidth={7} animated={false} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-1">Puntaje General</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Evaluación integral que combina el análisis de habilidades técnicas, experiencia laboral,
              formación académica y estructura del documento, junto con la compatibilidad ATS frente al puesto solicitado.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Container 3: Dimension scores grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "skills", label: "Habilidades", score: dimension_scores.skills },
          { key: "experience", label: "Experiencia Laboral", score: dimension_scores.experience },
          { key: "education", label: "Educación", score: dimension_scores.education },
          { key: "structure", label: "Estructura", score: dimension_scores.structure },
        ].map((dim) => (
          <Card key={dim.key}>
            <CardContent className="flex items-center gap-3 py-3">
              <ScoreRing score={dim.score} size={70} strokeWidth={5} animated={false} />
              <div className="min-w-0">
                <p className="text-xs font-medium mb-0.5">{dim.label}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {dimensionExplanations[dim.key]}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Container 4: Personal Info + Skills */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="size-4" aria-hidden="true" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PersonalInfoCard info={personal_info} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="size-4" aria-hidden="true" />
              Habilidades Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-[11px]">{skill}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No se detectaron habilidades en el documento.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Container 5: Work Experience + Education */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Briefcase className="size-4" aria-hidden="true" />
              Experiencia Laboral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExperienceCard experiences={work_experience} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <GraduationCap className="size-4" aria-hidden="true" />
              Educación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EducationCard education={education} />
          </CardContent>
        </Card>
      </div>

      {/* Container 6: Suggestions + ATS optimizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lightbulb className="size-4 text-amber-500" aria-hidden="true" />
            Sugerencias de Mejora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Recomendaciones generales</p>
              <div className="space-y-1.5">
                {suggestions.map((s, i) => (
                  <SuggestionItem key={i} text={s} />
                ))}
              </div>
            </div>
          )}

          {ats_optimizations.length > 0 && (
            <div className="space-y-3">
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRight className="size-4 text-primary" aria-hidden="true" />
                  <p className="text-xs font-medium text-muted-foreground">Optimizaciones ATS (Antes / Después)</p>
                </div>
                <div className="space-y-3">
                  {ats_optimizations.map((opt, i) => (
                    <ATSOptimizationCard key={i} opt={opt} index={i} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {ats_analysis.red_flags.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-xs font-medium text-destructive flex items-center gap-1.5 mb-2">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                Alertas detectadas
              </p>
              <div className="space-y-1">
                {ats_analysis.red_flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-destructive mt-0.5">•</span>
                    <span className="text-muted-foreground">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ats_analysis.missing_keywords.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                <Target className="size-3.5" aria-hidden="true" />
                Keywords faltantes para el puesto
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ats_analysis.missing_keywords.map((kw, i) => (
                  <Badge key={i} variant="destructive" className="text-[11px]">{kw}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Container 7: Radar chart + Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="size-4 text-primary" aria-hidden="true" />
            Perfil del CV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <RadarChart scores={dimension_scores} />
            <div className="flex-1 w-full">
              <p className="text-xs font-medium text-muted-foreground mb-2">Checklist de elementos clave</p>
              <CVChecklist result={result} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Container 7.5: Per-apartado review & instructions */}
      {sections.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ListChecks className="size-4 text-primary" aria-hidden="true" />
              Apartados de tu CV: qué corregir y dónde
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Desglosamos tu CV por secciones. Revisa el estado de cada apartado y sigue
              las instrucciones para alinearlo mejor con el puesto y los filtros ATS.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {sections.map((section) => (
              <SectionReview key={section.id || section.title} section={section} />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center pt-2">
        <Button onClick={onDelete} variant="outline" size="sm">
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Analizar otro CV
        </Button>
      </div>
    </div>
  )
}
