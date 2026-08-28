import { VerbosityLevel } from "pdf-parse"

export interface StructuredResume {
  markdown: string
  isScannedHint: boolean
  charCount: number
}

const SECTION_KEYWORDS: { title: string; keywords: string[] }[] = [
  {
    title: "Datos de Contacto",
    keywords: ["contacto", "contact", "datos personales", "información personal", "personal info"],
  },
  {
    title: "Resumen Profesional",
    keywords: [
      "resumen profesional",
      "professional summary",
      "perfil profesional",
      "about me",
      "profile",
      "objective",
      "objetivo",
      "resumen ejecutivo",
    ],
  },
  {
    title: "Experiencia Laboral",
    keywords: [
      "experiencia laboral",
      "work experience",
      "experiencia profesional",
      "professional experience",
      "employment history",
      "experience",
      "historial laboral",
    ],
  },
  {
    title: "Educación",
    keywords: [
      "educación",
      "education",
      "formación académica",
      "academic background",
      "estudios",
      "formación",
    ],
  },
  {
    title: "Habilidades",
    keywords: [
      "habilidades",
      "skills",
      "competencias",
      "technical skills",
      "tecnologías",
      "technologies",
      "herramientas",
      "tools",
      "software",
    ],
  },
  {
    title: "Certificaciones",
    keywords: [
      "certificaciones",
      "certifications",
      "cursos",
      "courses",
      "licencias",
      "licenses",
    ],
  },
  {
    title: "Idiomas",
    keywords: ["idiomas", "languages"],
  },
]

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse")
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    verbosity: VerbosityLevel.ERRORS,
  })
  const result = await parser.getText()
  return cleanText(result.text)
}

export async function extractStructuredMarkdown(
  buffer: Buffer
): Promise<StructuredResume> {
  const text = await extractTextFromPDF(buffer)

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const charCount = text.length

  // Simple heuristic: a scanned (image-only) PDF yields very little text relative to size.
  // We rely on pdf-parse metadata plus a per-megabyte threshold if available.
  const isScannedHint = charCount < 50

  const markdown = buildMarkdown(lines)

  return { markdown, isScannedHint, charCount }
}

function buildMarkdown(lines: string[]): string {
  const sections: string[] = []
  let current: string[] = []
  let currentTitle = "Encabezado"

  const flush = () => {
    const body = current.map((l) => normalizeLine(l)).filter(Boolean)
    if (body.length > 0) {
      sections.push(
        currentTitle === "Encabezado"
          ? body.join("\n")
          : `## ${currentTitle}\n\n${body.join("\n")}`
      )
    }
    current = []
  }

  for (const line of lines) {
    const match = matchSection(line)
    if (match) {
      flush()
      currentTitle = match.title
      // Skip the header line itself from the section body
      continue
    }
    current.push(line)
  }
  flush()

  return sections.join("\n\n")
}

function matchSection(
  line: string
): { title: string } | null {
  const clean = line.toLowerCase().replace(/[:\s#*\-–—]/g, "")

  // Only treat as header if it's short enough to be a heading
  if (clean.length > 40) return null

  for (const section of SECTION_KEYWORDS) {
    for (const kw of section.keywords) {
      const kwClean = kw.toLowerCase().replace(/[:\s]/g, "")
      if (clean === kwClean) {
        return { title: section.title }
      }
    }
  }
  return null
}

function normalizeLine(line: string): string {
  // Normalize bullets so markdown lists are recognizable
  if (/^[•·▪▪●]\s?/.test(line)) {
    return `- ${line.replace(/^[•·▪●]\s?/, "").trim()}`
  }
  if (/^\d+[.)]\s?/.test(line)) {
    return `- ${line.trim()}`.replace("- ", "- ")
  }
  return line
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
}
