import React from "react"
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"
import type { ParsedResume } from "./types"

const AZUL = "#1e3a5f"
const GRIS_CLARO = "#efefef"
const TEXT_OSCURO = "#1a1a1a"
const TEXT_MEDIO = "#444"
const TEXT_CLARO = "#888"

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: TEXT_OSCURO,
    lineHeight: 1.35,
  },
  header: {
    backgroundColor: AZUL,
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  headerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerRole: {
    fontSize: 9,
    color: "#b8cfe0",
  },
  bodyRow: {
    flexDirection: "row",
    minHeight: 720,
  },
  leftCol: {
    width: "35%",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  rightCol: {
    width: "65%",
    backgroundColor: GRIS_CLARO,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: AZUL,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: AZUL,
    paddingBottom: 3,
  },
  section: {
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 8.5,
    lineHeight: 1.45,
    color: TEXT_MEDIO,
    marginBottom: 3,
  },
  contactItem: {
    fontSize: 8,
    color: TEXT_MEDIO,
    marginBottom: 2,
  },
  expBlock: {
    marginBottom: 10,
  },
  expCompany: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: TEXT_OSCURO,
    marginBottom: 1,
  },
  expDate: {
    fontSize: 7.5,
    color: TEXT_CLARO,
    marginBottom: 3,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 8,
    color: AZUL,
    width: 8,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 8,
    lineHeight: 1.4,
    color: TEXT_MEDIO,
    flex: 1,
  },
  skillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillBadge: {
    fontSize: 7.5,
    backgroundColor: "#ffffff",
    color: AZUL,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  eduItem: {
    marginBottom: 6,
  },
  eduTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: TEXT_OSCURO,
  },
  eduSub: {
    fontSize: 8,
    color: TEXT_MEDIO,
    marginTop: 1,
  },
  eduDate: {
    fontSize: 7.5,
    color: TEXT_CLARO,
    marginTop: 1,
  },
  aspirationBox: {
    padding: 8,
    backgroundColor: "#f5f5f5",
  },
  aspirationText: {
    fontSize: 8,
    lineHeight: 1.4,
    color: TEXT_MEDIO,
    fontStyle: "italic",
  },
})

interface ParsedBlock {
  title: string
  lines: string[]
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function detectSections(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  const rawLines = text.split("\n")
  let current: ParsedBlock = { title: "", lines: [] }

  for (const rawLine of rawLines) {
    const line = rawLine.trim()
    if (!line) {
      current.lines.push("")
      continue
    }

    const hMatch = line.match(/^#{1,3}\s+(.+)/)
    if (hMatch) {
      if (current.title || current.lines.some((l) => l)) {
        blocks.push(current)
      }
      current = { title: hMatch[1].trim(), lines: [] }
    } else {
      current.lines.push(line)
    }
  }

  if (current.title || current.lines.some((l) => l)) {
    blocks.push(current)
  }

  return blocks
}

function categorize(title: string): "left" | "right" {
  const n = normalize(title)

  const leftKeywords = [
    "perfil", "profile", "resumen", "summary",
    "acerca", "about", "objetivo", "objective",
    "contacto", "contact", "informacion", "information",
    "educacion", "education", "formacion", "academic", "estudios",
    "aspiracion", "aspiration", "salario", "salary", "expectativa",
    "personal", "datos",
  ]

  const rightKeywords = [
    "experiencia", "experience", "historial", "trayectoria",
    "competencia", "skill", "habilidad", "tecnologia", "technology",
    "herramienta", "tool", "conocimiento", "knowledge",
    "pasatiempo", "hobby", "proyecto", "project", "interes", "interest",
    "logro", "achievement", "certificacion", "certification",
    "curso", "course", "lenguaje", "language", "idioma",
  ]

  for (const kw of leftKeywords) {
    if (n.includes(kw)) return "left"
  }
  for (const kw of rightKeywords) {
    if (n.includes(kw)) return "right"
  }
  return "right"
}

function renderLines(lines: string[], isRight = false) {
  return lines.map((line, i) => {
    const t = line.trim()
    if (!t) return null

    if (t.startsWith("-") || t.startsWith("*")) {
      const text = t.replace(/^[-*\s]+/, "")
      return (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>{"\u2022"}</Text>
          <Text style={styles.bulletText}>{text}</Text>
        </View>
      )
    }

    return (
      <Text key={i} style={styles.bodyText}>
        {t}
      </Text>
    )
  })
}

function renderExperience(lines: string[]): React.ReactNode {
  const blocks: React.ReactNode[] = []
  let idx = 0

  while (idx < lines.length) {
    const line = lines[idx].trim()
    if (!line) { idx++; continue }

    if (line.includes("|")) {
      const parts = line.split("|").map((p) => p.trim())
      const company = parts[0]
      const datePart = parts.slice(1).join(" | ").trim()

      idx++
      const bullets: string[] = []
      while (idx < lines.length) {
        const l = lines[idx].trim()
        if (!l) { idx++; break }
        if (l.includes("|") && !l.startsWith("-") && !l.startsWith("*")) {
          break
        }
        if (l.startsWith("-") || l.startsWith("*")) {
          bullets.push(l.replace(/^[-*\s]+/, ""))
        }
        idx++
      }

      blocks.push(
        <View key={`exp-${idx}`} style={styles.expBlock}>
          <Text style={styles.expCompany}>{company}</Text>
          {datePart ? <Text style={styles.expDate}>{datePart}</Text> : null}
          {bullets.map((b, bi) => (
            <View key={bi} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>{"\u2022"}</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      )
    } else {
      blocks.push(
        <Text key={`txt-${idx}`} style={styles.bodyText}>
          {line}
        </Text>
      )
      idx++
    }
  }

  return blocks
}

function renderSkillsText(text: string): React.ReactNode {
  const skills = text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24)

  if (skills.length === 0) return null

  return (
    <View style={styles.skillRow}>
      {skills.map((skill, i) => (
        <Text key={i} style={styles.skillBadge}>
          {skill}
        </Text>
      ))}
    </View>
  )
}

function ResumeDocument({
  resume,
  optimizedText,
}: {
  resume: ParsedResume
  optimizedText: string
}) {
  const blocks = detectSections(optimizedText)

  const leftBlocks = blocks.filter((b) => categorize(b.title) === "left")
  const rightBlocks = blocks.filter((b) => categorize(b.title) === "right")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerName}>
            {(resume.name || "Candidate").toUpperCase()}
          </Text>
        </View>

        <View style={styles.bodyRow}>
          {/* LEFT COLUMN */}
          <View style={styles.leftCol}>
            {leftBlocks.map((block, bi) => {
              const titleUpper = block.title.toUpperCase()
              const nTitle = normalize(block.title)

              if (
                nTitle.includes("perfil") ||
                nTitle.includes("profile") ||
                nTitle.includes("resumen") ||
                nTitle.includes("summary") ||
                nTitle.includes("acerca") ||
                nTitle.includes("about") ||
                nTitle.includes("objetivo") ||
                nTitle.includes("objective")
              ) {
                const text = block.lines.filter((l) => l.trim()).join("\n")
                return (
                  <View key={bi} style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{titleUpper}</Text>
                    <Text style={styles.bodyText}>{text || resume.summary}</Text>
                  </View>
                )
              }

              if (
                nTitle.includes("contacto") ||
                nTitle.includes("contact") ||
                nTitle.includes("informacion") ||
                nTitle.includes("information") ||
                nTitle.includes("datos")
              ) {
                const items = block.lines
                  .filter((l) => l.trim())
                  .map((l) => l.replace(/^[-*\s]+/, "").trim())
                return (
                  <View key={bi} style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{titleUpper}</Text>
                    {(items.length > 0 ? items : [resume.contact]).map(
                      (item, ii) => (
                        <Text key={ii} style={styles.contactItem}>
                          {item}
                        </Text>
                      )
                    )}
                  </View>
                )
              }

              if (
                nTitle.includes("educacion") ||
                nTitle.includes("education") ||
                nTitle.includes("formacion") ||
                nTitle.includes("academic") ||
                nTitle.includes("estudios")
              ) {
                const items = block.lines.filter((l) => l.trim())
                return (
                  <View key={bi} style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{titleUpper}</Text>
                    {(items.length > 0
                      ? renderLines(block.lines)
                      : <Text style={styles.bodyText}>{resume.education}</Text>
                    )}
                  </View>
                )
              }

              if (
                nTitle.includes("aspiracion") ||
                nTitle.includes("aspiration") ||
                nTitle.includes("salario") ||
                nTitle.includes("salary") ||
                nTitle.includes("expectativa")
              ) {
                return (
                  <View key={bi} style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{titleUpper}</Text>
                    <View style={styles.aspirationBox}>
                      <Text style={styles.aspirationText}>
                        {block.lines.filter((l) => l.trim()).join("\n")}
                      </Text>
                    </View>
                  </View>
                )
              }

              return (
                <View key={bi} style={styles.section} wrap={false}>
                  <Text style={styles.sectionTitle}>{titleUpper}</Text>
                  {renderLines(block.lines)}
                </View>
              )
            })}

            {/* Fallback perfil if no block matched */}
            {!leftBlocks.some((b) => {
              const n = normalize(b.title)
              return n.includes("perfil") || n.includes("profile") || n.includes("resumen") || n.includes("summary")
            }) && resume.summary ? (
              <View style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>PERFIL PERSONAL</Text>
                <Text style={styles.bodyText}>{resume.summary}</Text>
              </View>
            ) : null}

            {/* Fallback contacto */}
            {!leftBlocks.some((b) => {
              const n = normalize(b.title)
              return n.includes("contacto") || n.includes("contact") || n.includes("informacion") || n.includes("datos")
            }) && resume.contact ? (
              <View style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>CONTACTO</Text>
                {resume.contact.split("|").map((c, i) => (
                  <Text key={i} style={styles.contactItem}>
                    {c.trim()}
                  </Text>
                ))}
              </View>
            ) : null}

            {/* Fallback educacion */}
            {!leftBlocks.some((b) => {
              const n = normalize(b.title)
              return n.includes("educacion") || n.includes("education") || n.includes("formacion") || n.includes("estudios")
            }) && resume.education ? (
              <View style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>EDUCACION</Text>
                <Text style={styles.bodyText}>{resume.education}</Text>
              </View>
            ) : null}
          </View>

          {/* RIGHT COLUMN */}
          <View style={styles.rightCol}>
            {rightBlocks.map((block, bi) => {
              const titleUpper = block.title.toUpperCase()
              const nTitle = normalize(block.title)

              if (
                nTitle.includes("experiencia") ||
                nTitle.includes("experience") ||
                nTitle.includes("historial") ||
                nTitle.includes("trayectoria")
              ) {
                return (
                  <View key={bi} style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{titleUpper}</Text>
                    {block.lines.some((l) => l.includes("|"))
                      ? renderExperience(block.lines)
                      : renderLines(block.lines)}
                  </View>
                )
              }

              if (
                nTitle.includes("competencia") ||
                nTitle.includes("skill") ||
                nTitle.includes("habilidad") ||
                nTitle.includes("tecnologia") ||
                nTitle.includes("technology") ||
                nTitle.includes("herramienta") ||
                nTitle.includes("tool") ||
                nTitle.includes("conocimiento") ||
                nTitle.includes("knowledge")
              ) {
                const allText = block.lines.filter((l) => l.trim()).join("\n")
                const badges = renderSkillsText(allText || resume.skills)
                return (
                  <View key={bi} style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{titleUpper}</Text>
                    {badges || (
                      <Text style={styles.bodyText}>{allText}</Text>
                    )}
                  </View>
                )
              }

              if (
                nTitle.includes("pasatiempo") ||
                nTitle.includes("hobby") ||
                nTitle.includes("proyecto") ||
                nTitle.includes("project") ||
                nTitle.includes("interes") ||
                nTitle.includes("interest") ||
                nTitle.includes("personal")
              ) {
                return (
                  <View key={bi} style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{titleUpper}</Text>
                    {renderLines(block.lines)}
                  </View>
                )
              }

              if (
                nTitle.includes("logro") ||
                nTitle.includes("achievement")
              ) {
                return (
                  <View key={bi} style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{titleUpper}</Text>
                    {renderLines(block.lines)}
                  </View>
                )
              }

              if (
                nTitle.includes("certificacion") ||
                nTitle.includes("certification") ||
                nTitle.includes("curso") ||
                nTitle.includes("course")
              ) {
                return (
                  <View key={bi} style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{titleUpper}</Text>
                    {renderLines(block.lines)}
                  </View>
                )
              }

              return (
                <View key={bi} style={styles.section} wrap={false}>
                  <Text style={styles.sectionTitle}>{titleUpper}</Text>
                  {renderLines(block.lines)}
                </View>
              )
            })}

            {/* Fallback skills */}
            {!rightBlocks.some((b) => {
              const n = normalize(b.title)
              return n.includes("competencia") || n.includes("skill") || n.includes("habilidad") || n.includes("tecnologia") || n.includes("conocimiento")
            }) && resume.skills ? (
              <View style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>COMPETENCIAS</Text>
                {renderSkillsText(resume.skills)}
              </View>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function generatePDF(
  resume: ParsedResume,
  optimizedText: string
): Promise<Buffer> {
  const doc = <ResumeDocument resume={resume} optimizedText={optimizedText} />
  const blob = await pdf(doc).toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
