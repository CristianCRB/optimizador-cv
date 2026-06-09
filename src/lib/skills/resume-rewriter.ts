import { callGemini } from "../gemini"
import { readFileSync } from "fs"
import path from "path"

function getSkillPrompt(): string {
  const skillPath = path.join(
    process.cwd(),
    "skills",
    "resume-rewriter-skill.md"
  )
  return readFileSync(skillPath, "utf-8")
}

export async function resumeRewriterSkill(
  resumeText: string,
  missingKeywords: string[],
  redFlags: string[],
  initialScore: number
): Promise<string> {
  const skillTemplate = getSkillPrompt()

  const systemPrompt =
    "Eres un redactor profesional de currículums con experiencia en optimización ATS. Reescribe la experiencia laboral usando la fórmula XYZ. No inventes métricas ni logros. DEBES incorporar las keywords faltantes sin eliminar las existentes. Devuelve únicamente el CV optimizado en Markdown."

  const userMessage = skillTemplate
    .replace("{{resume}}", resumeText)
    .replace("{{missing_keywords}}", missingKeywords.join(", "))
    .replace("{{red_flags}}", redFlags.join(", "))
    .replace("{{initial_score}}", String(initialScore))

  return callGemini(systemPrompt, userMessage, 0.15)
}
