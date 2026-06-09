// Generates a minimal valid PDF with resume text for testing
const fs = require("fs")
const path = require("path")

// Build a minimal PDF with extracted text (no font needed for text extraction)
function buildMinimalPDF(text) {
  const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
  const content = `BT
/F1 10 Tf
10 750 Td
${text.split("\n").filter(Boolean).map((line, i) => {
  const y = 750 - i * 14
  return `(${esc(line)}) Tj
0 -14 Td`
}).join("\n")}
ET`

  const contentLen = Buffer.byteLength(content, "latin1")
  const objects = [
    { n: "1 0", v: "<< /Type /Catalog /Pages 2 0 R >>" },
    { n: "2 0", v: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    { n: "3 0", v: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>` },
    { n: "4 0", v: `<< /Length ${contentLen} >>\nstream\n${content}\nendstream` },
    { n: "5 0", v: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" },
  ]

  let pdf = "%PDF-1.4\n"
  const offsets = []
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "latin1"))
    pdf += `${obj.n} obj\n${obj.v}\nendobj\n`
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1")
  pdf += "xref\n"
  pdf += `0 ${objects.length + 1}\n`
  pdf += "0000000000 65535 f \n"
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`
  }

  pdf += "trailer\n"
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += "startxref\n"
  pdf += `${xrefOffset}\n`
  pdf += "%%EOF\n"

  return Buffer.from(pdf, "latin1")
}

const resumeText = `CARLOS MENDOZA
carlos.mendoza@email.com | +52 55 1234 5678

RESUMEN PROFESIONAL
Ingeniero de Software con 5 años de experiencia en desarrollo web y aplicaciones cloud.
Especializado en JavaScript, TypeScript, React y Node.js.

EXPERIENCIA LABORAL
TechSolutions SA | 2021 - Presente
- Desarrollé aplicaciones web con React y Node.js
- Implementé APIs RESTful con Express
- Trabajé con bases de datos PostgreSQL
- Colaboré en equipo ágil con 8 desarrolladores

WebStudio MX | 2019 - 2021
- Creé sitios web responsivos con HTML, CSS y JavaScript
- Integré APIs de terceros
- Mantuve sistemas legacy

EDUCACIÓN
Ingeniería en Sistemas Computacionales
Universidad Nacional | 2015 - 2019

HABILIDADES
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, Git, Docker, AWS, HTML, CSS

CERTIFICACIONES
AWS Certified Cloud Practitioner - 2022`

const outputPath = path.join(__dirname, "..", "public", "test-resume.pdf")
const pdfBuf = buildMinimalPDF(resumeText)
fs.writeFileSync(outputPath, pdfBuf)
console.log(`Test PDF generated: ${outputPath} (${pdfBuf.length} bytes)`)
