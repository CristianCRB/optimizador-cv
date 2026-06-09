import { callGemini } from "../gemini"
import type { ATSAnalysis } from "../types"
import { readFileSync } from "fs"
import path from "path"

function getSkillPrompt(): string {
  const skillPath = path.join(
    process.cwd(),
    "skills",
    "ats-analysis-skill.md"
  )
  return readFileSync(skillPath, "utf-8")
}

export async function atsAnalysisSkill(
  resumeText: string,
  jobDescription: string
): Promise<ATSAnalysis> {
  const skillTemplate = getSkillPrompt()

  const systemPrompt =
    "Eres un analista experto en compatibilidad ATS. Devuelve ÚNICAMENTE un objeto JSON válido sin markdown ni explicaciones."

  const userMessage = skillTemplate
    .replace("{{resume}}", resumeText)
    .replace("{{job_description}}", jobDescription)

  const raw = await callGemini(systemPrompt, userMessage, 0.15)

  try {
    const parsed = JSON.parse(raw)
    return {
      compatibility_score: clampScore(parsed.compatibility_score),
      missing_keywords: (parsed.missing_keywords || []).slice(0, 5),
      red_flags: (parsed.red_flags || []).slice(0, 3),
      summary: parsed.summary || "",
    }
  } catch {
    throw new Error("Error al analizar la respuesta del Skill de análisis ATS")
  }
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}
