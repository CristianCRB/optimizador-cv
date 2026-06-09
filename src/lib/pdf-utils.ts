import type { ParsedResume } from "./types"
import { VerbosityLevel } from "pdf-parse"

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse")
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    verbosity: VerbosityLevel.ERRORS,
  })
  const result = await parser.getText()
  return cleanText(result.text)
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
}

export function parseResumeText(text: string): ParsedResume {
  const lines = text.split("\n").filter((l) => l.trim())

  const name = extractSection(lines, ["nombre", "name"], 0) || lines[0] || ""

  const contact = extractContactInfo(text)

  const summary = extractSection(lines, [
    "resumen profesional",
    "professional summary",
    "perfil profesional",
    "about me",
    "profile",
    "objective",
    "objetivo",
  ])

  const experience = extractSection(lines, [
    "experiencia laboral",
    "work experience",
    "experiencia profesional",
    "professional experience",
    "employment history",
    "experience",
    "historial laboral",
  ])

  const education = extractSection(lines, [
    "educación",
    "education",
    "formación académica",
    "academic background",
    "estudios",
  ])

  const certifications = extractSection(lines, [
    "certificaciones",
    "certifications",
    "cursos",
    "courses",
    "licencias",
    "licenses",
  ])

  const skills = extractSection(lines, [
    "habilidades",
    "skills",
    "competencias",
    "technical skills",
    "tecnologías",
    "technologies",
    "herramientas",
    "tools",
  ])

  return {
    name,
    contact,
    summary,
    experience,
    education,
    certifications,
    skills,
    raw_text: text,
  }
}

function extractSection(
  lines: string[],
  keywords: string[],
  fallbackIndex?: number
): string {
  const sectionStart = lines.findIndex((line) => {
    const clean = line.toLowerCase().replace(/[:\s#]/g, "")
    return keywords.some((kw) => clean === kw.toLowerCase().replace(/[:\s]/g, ""))
  })

  if (sectionStart === -1) {
    if (fallbackIndex !== undefined && lines[fallbackIndex]) {
      return lines[fallbackIndex]
    }
    return ""
  }

  const sectionLines: string[] = []
  const nextHeaders = keywords.map((k) => k.toLowerCase())

  for (let i = sectionStart + 1; i < lines.length; i++) {
    const cleanLine = lines[i].toLowerCase().replace(/[:\s#]/g, "")
    if (
      cleanLine.length < 30 &&
      nextHeaders.some((h) => cleanLine.includes(h))
    ) {
      break
    }
    if (lines[i].trim()) {
      sectionLines.push(lines[i].trim())
    }
  }

  return sectionLines.join("\n")
}

function extractContactInfo(text: string): string {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[-\s]?)?\(?\d{2,4}\)?[-\s]?\d{3,4}[-\s]?\d{3,4}/
  )
  const parts: string[] = []
  if (emailMatch) parts.push(emailMatch[0])
  if (phoneMatch) parts.push(phoneMatch[0])
  return parts.join(" | ")
}
