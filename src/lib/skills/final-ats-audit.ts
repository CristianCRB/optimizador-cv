import { callGemini } from "../gemini"
import type { FinalATSAudit } from "../types"
import { readFileSync } from "fs"
import path from "path"

function getSkillPrompt(): string {
  const skillPath = path.join(
    process.cwd(),
    "skills",
    "final-ats-audit-skill.md"
  )
  return readFileSync(skillPath, "utf-8")
}

export async function finalATSAuditSkill(
  optimizedResume: string,
  initialScore: number,
  missingKeywords: string[]
): Promise<FinalATSAudit> {
  const skillTemplate = getSkillPrompt()

  const systemPrompt =
    "Eres un ATS, reclutador senior y hiring manager. Audita el CV optimizado. Tu prioridad es mantener o aumentar el score ATS. Preserva absolutamente todas las keywords existentes. No elimines tecnologías, habilidades o términos técnicos. Devuelve ÚNICAMENTE un objeto JSON válido sin markdown ni explicaciones."

  const userMessage = skillTemplate
    .replace("{{optimized_resume}}", optimizedResume)
    .replace("{{initial_score}}", String(initialScore))
    .replace("{{missing_keywords}}", missingKeywords.join(", "))

  const raw = await callGemini(systemPrompt, userMessage, 0.15)

  try {
    const parsed = JSON.parse(raw)
    return {
      ignored_sections: parsed.ignored_sections || [],
      improvements: parsed.improvements || [],
      final_resume: parsed.final_resume || optimizedResume,
    }
  } catch {
    throw new Error("Error al analizar la respuesta del Skill de auditoría ATS")
  }
}
