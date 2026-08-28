import { callGemini } from "../gemini"
import type { CVEvaluation, SectionStatus } from "../types"

export interface EvaluationResult {
  evaluation: CVEvaluation
  usage: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
    modelVersion: string
  } | null
  countedPromptTokens: number
}

const SYSTEM_PROMPT = `You are an expert CV/resume analyst and ATS compatibility specialist. Analyze the resume and job description, then return a comprehensive JSON evaluation.

The RESUME is provided in Markdown. Use the "##" headings to clearly identify each section (e.g. "Experiencia Laboral", "Educación", "Habilidades") and locate the corresponding apartado for the "sections" analysis.

RESUME:
{{resume}}

JOB DESCRIPTION:
{{job_description}}

Return ONLY valid JSON (no markdown, no explanations) with this exact structure:

{
  "overall_score": 85,
  "dimension_scores": {
    "skills": 80,
    "experience": 90,
    "education": 75,
    "structure": 70
  },
  "personal_info": {
    "full_name": "John Doe",
    "email": "john@email.com",
    "phone": "+1 555-0000",
    "location": "New York, USA",
    "linkedin": "linkedin.com/in/johndoe",
    "other": "Portfolio: johndoe.com"
  },
  "skills": ["JavaScript", "Python", "Project Management"],
  "work_experience": [
    {
      "company": "Tech Corp",
      "position": "Senior Developer",
      "duration": "Jan 2020 - Present",
      "description": "Led development of cloud-native applications",
      "achievements": ["Increased deployment speed by 40%", "Mentored 5 junior developers"]
    }
  ],
  "education": [
    {
      "institution": "MIT",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "year": "2018"
    }
  ],
  "suggestions": ["Texto en español 1", "Texto en español 2"],
  "professional_summary": "Texto del resumen profesional en español",
  "ats_analysis": {
    "compatibility_score": 80,
    "missing_keywords": ["keyword1", "keyword2"],
    "red_flags": ["Flag 1", "Flag 2"],
    "summary": "Texto del resumen ATS en español"
  },
  "ats_optimizations": [
    {
      "section": "Professional Summary",
      "original": "Original text from resume",
      "suggestion": "Improved version with keywords",
      "explanation": "Explicación del cambio en español"
    }
  ],
  "sections": [
    {
      "id": "encabezado",
      "title": "Encabezado y datos de contacto",
      "status": "improve",
      "score": 70,
      "detected": "Qué se detectó en este apartado del CV",
      "strengths": ["Punto fuerte 1"],
      "issues": ["Problema detectado 1"],
      "instructions": [
        "Instrucción concreta: qué debe colocar el usuario aquí",
        "Ejemplo de redacción sugerido"
      ]
    }
  ]
}

SCORING GUIDELINES:
- overall_score: Weighted综合评价 based on all dimensions and ATS compatibility
- dimension_scores.skills: Evaluate quantity, relevance to the job, technical depth, and presentation
- dimension_scores.experience: Evaluate relevance, achievements, impact descriptions, duration, career progression
- dimension_scores.education: Evaluate degrees, institutions, field relevance, certifications
- dimension_scores.structure: Evaluate formatting, section organization, readability, consistency, ATS-friendliness

SECTIONS GUIDELINES:
- Evaluate these CV sections: "encabezado" (datos de contacto), "resumen" (resumen/objetivo profesional), "habilidades", "experiencia", "educacion", "certificaciones", "formato" (estructura general del documento)
- For each section, set status: "ok" (está bien, solo reaffirmar), "improve" (necesita mejoras), or "critical" (hay que corregirlo sí o sí)
- score: 0-100 measure of how well that section is prepared for ATS
- strengths/issues: concise bullet points in Spanish (Latin American)
- instructions: CONCRETE, actionable steps telling the user WHERE to edit and WHAT to write. Include rewording with the missing ATS keywords when possible. These are the core value of the product.

IMPORTANT RULES:
1. All scores must be integers between 0 and 100
2. Maximum 5 missing_keywords, maximum 3 red_flags
3. For ats_optimizations, show original text and a concrete improved version
4. TEXT FIELDS IN SPANISH: suggestions, professional_summary, ats_analysis.summary, and ats_optimizations[].explanation MUST be written in Spanish (Latin American)
5. Field values (company names, skill names, degree names, etc.) should be extracted exactly as they appear in the resume
6. If personal_info fields are not found, leave as empty string
7. Be honest, specific, and constructive with scores and suggestions
8. If no work experience or education is found, return empty arrays`

export async function cvEvaluationSkill(
  resumeMarkdown: string,
  jobDescription: string
): Promise<EvaluationResult> {
  const userMessage = SYSTEM_PROMPT
    .replace("{{resume}}", resumeMarkdown)
    .replace("{{job_description}}", jobDescription)

  const output = await callGemini(
    "Eres un analista experto en CV y compatibilidad ATS. Devuelve ÚNICAMENTE un objeto JSON válido sin markdown ni explicaciones.",
    userMessage,
    0.2
  )

  const raw = output.text

  try {
    const parsed = JSON.parse(raw)
    const evaluation: CVEvaluation = {
      overall_score: clampScore(parsed.overall_score),
      dimension_scores: {
        skills: clampScore(parsed.dimension_scores?.skills),
        experience: clampScore(parsed.dimension_scores?.experience),
        education: clampScore(parsed.dimension_scores?.education),
        structure: clampScore(parsed.dimension_scores?.structure),
      },
      personal_info: {
        full_name: parsed.personal_info?.full_name || "",
        email: parsed.personal_info?.email || "",
        phone: parsed.personal_info?.phone || "",
        location: parsed.personal_info?.location || "",
        linkedin: parsed.personal_info?.linkedin || "",
        other: parsed.personal_info?.other || "",
      },
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      work_experience: Array.isArray(parsed.work_experience)
        ? parsed.work_experience.map((exp: Record<string, unknown>) => ({
            company: String(exp.company || ""),
            position: String(exp.position || ""),
            duration: String(exp.duration || ""),
            description: String(exp.description || ""),
            achievements: Array.isArray(exp.achievements)
              ? exp.achievements.map(String)
              : [],
          }))
        : [],
      education: Array.isArray(parsed.education)
        ? parsed.education.map((edu: Record<string, unknown>) => ({
            institution: String(edu.institution || ""),
            degree: String(edu.degree || ""),
            field: String(edu.field || ""),
            year: String(edu.year || ""),
          }))
        : [],
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.map(String)
        : [],
      professional_summary: parsed.professional_summary || "",
      ats_analysis: {
        compatibility_score: clampScore(parsed.ats_analysis?.compatibility_score),
        missing_keywords: Array.isArray(parsed.ats_analysis?.missing_keywords)
          ? parsed.ats_analysis.missing_keywords.slice(0, 5)
          : [],
        red_flags: Array.isArray(parsed.ats_analysis?.red_flags)
          ? parsed.ats_analysis.red_flags.slice(0, 3)
          : [],
        summary: parsed.ats_analysis?.summary || "",
      },
      ats_optimizations: Array.isArray(parsed.ats_optimizations)
        ? parsed.ats_optimizations.map((opt: Record<string, unknown>) => ({
            section: String(opt.section || ""),
            original: String(opt.original || ""),
            suggestion: String(opt.suggestion || ""),
            explanation: String(opt.explanation || ""),
          }))
        : [],
      sections: Array.isArray(parsed.sections)
        ? parsed.sections.map((sec: Record<string, unknown>) => ({
            id: String(sec.id || ""),
            title: String(sec.title || ""),
            status: (sec.status as SectionStatus) || "improve",
            score: clampScore(Number(sec.score)),
            detected: String(sec.detected || ""),
            strengths: Array.isArray(sec.strengths)
              ? sec.strengths.map(String)
              : [],
            issues: Array.isArray(sec.issues) ? sec.issues.map(String) : [],
            instructions: Array.isArray(sec.instructions)
              ? sec.instructions.map(String)
              : [],
          }))
        : [],
    }

    return {
      evaluation,
      usage: output.usage
        ? {
            promptTokenCount: output.usage.promptTokenCount,
            candidatesTokenCount: output.usage.candidatesTokenCount,
            totalTokenCount: output.usage.totalTokenCount,
            modelVersion: output.usage.modelVersion,
          }
        : null,
      countedPromptTokens: output.countedPromptTokens,
    }
  } catch {
    throw new Error("Error al analizar la respuesta de Gemini para la evaluación del CV")
  }
}

function clampScore(score: number): number {
  const n = Number(score)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}
