import { NextRequest } from "next/server"
import { extractTextFromPDF, parseResumeText } from "@/lib/pdf-utils"
import { atsAnalysisSkill } from "@/lib/skills/ats-analysis"
import { resumeRewriterSkill } from "@/lib/skills/resume-rewriter"
import { finalATSAuditSkill } from "@/lib/skills/final-ats-audit"
import { generatePDF } from "@/lib/pdf-generator"
import type {
  ProcessingStage,
  OptimizationResult,
} from "@/lib/types"

export const runtime = "nodejs"
export const maxDuration = 180

function statusEvent(stage: ProcessingStage, progress: number, message: string) {
  return `data: ${JSON.stringify({ stage, progress, message })}\n\n`
}

function errorEvent(error: string) {
  return `data: ${JSON.stringify({ stage: "error", progress: 0, error })}\n\n`
}

function completeEvent(payload: Record<string, unknown>) {
  return `data: ${JSON.stringify({ stage: "done", progress: 100, ...payload })}\n\n`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const jobDescription = formData.get("jobDescription") as string | null

    if (!file || !jobDescription) {
      return new Response(
        errorEvent("Faltan el archivo PDF o la descripción del puesto"),
        {
          status: 400,
          headers: { "Content-Type": "text/event-stream" },
        }
      )
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start: async (controller) => {
        try {
          // Step 1: Extract PDF text
          controller.enqueue(
            encoder.encode(
              statusEvent("extracting", 5, "Leyendo archivo PDF...")
            )
          )

          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const rawText = await extractTextFromPDF(buffer)
          const resume = parseResumeText(rawText)

          controller.enqueue(
            encoder.encode(
              statusEvent("extracting", 10, "Texto extraído correctamente")
            )
          )

          // Step 2: Initial ATS Analysis (Skill 1)
          controller.enqueue(
            encoder.encode(
              statusEvent("analyzing", 20, "Comparando CV vs vacante...")
            )
          )

          const initialAnalysis = await atsAnalysisSkill(rawText, jobDescription)

          controller.enqueue(
            encoder.encode(
              statusEvent(
                "analyzing",
                30,
                `Score inicial: ${initialAnalysis.compatibility_score}%`
              )
            )
          )

          // Step 3: Resume Rewriter (Skill 2)
          controller.enqueue(
            encoder.encode(
              statusEvent("rewriting", 40, "Reescribiendo con fórmula XYZ...")
            )
          )

          const optimizedResumeText = await resumeRewriterSkill(
            rawText,
            initialAnalysis.missing_keywords,
            initialAnalysis.red_flags,
            initialAnalysis.compatibility_score
          )

          controller.enqueue(
            encoder.encode(
              statusEvent("rewriting", 50, "Experiencia optimizada")
            )
          )

          // Step 4: Final ATS Audit (Skill 3)
          controller.enqueue(
            encoder.encode(
              statusEvent("auditing", 60, "Ejecutando auditoría final...")
            )
          )

          const auditResult = await finalATSAuditSkill(
            optimizedResumeText,
            initialAnalysis.compatibility_score,
            initialAnalysis.missing_keywords
          )

          controller.enqueue(
            encoder.encode(
              statusEvent("auditing", 70, "Auditoría completada")
            )
          )

          const finalText = auditResult.final_resume || optimizedResumeText

          // Step 5: Evaluate final score
          controller.enqueue(
            encoder.encode(
              statusEvent("calculating", 75, "Evaluando score ATS final...")
            )
          )

          let finalAnalysis = await atsAnalysisSkill(finalText, jobDescription)

          // Feedloop: if score dropped, do a corrective pass
          if (finalAnalysis.compatibility_score < initialAnalysis.compatibility_score) {
            controller.enqueue(
              encoder.encode(
                statusEvent(
                  "auditing",
                  80,
                  `Score bajó (${finalAnalysis.compatibility_score}% vs ${initialAnalysis.compatibility_score}%). Reincorporando keywords...`
                )
              )
            )

            const correctedResume = await resumeRewriterSkill(
              finalText,
              initialAnalysis.missing_keywords,
              [],
              initialAnalysis.compatibility_score
            )

            const reAudit = await finalATSAuditSkill(
              correctedResume,
              initialAnalysis.compatibility_score,
              initialAnalysis.missing_keywords
            )

            const correctedFinalText =
              reAudit.final_resume || correctedResume

            // Re-evaluate one more time
            const correctedScore = await atsAnalysisSkill(
              correctedFinalText,
              jobDescription
            )

            // Use whichever text gives the higher score
            if (correctedScore.compatibility_score > finalAnalysis.compatibility_score) {
              finalAnalysis = correctedScore
              auditResult.final_resume = correctedFinalText
            }
          }

          controller.enqueue(
            encoder.encode(
              statusEvent(
                "calculating",
                85,
                `Score final: ${finalAnalysis.compatibility_score}%`
              )
            )
          )

          const finalResumeText =
            auditResult.final_resume || finalText

          // Step 6: Generate PDF
          controller.enqueue(
            encoder.encode(
              statusEvent("generating", 90, "Generando PDF optimizado...")
            )
          )

          const pdfBuffer = await generatePDF(resume, finalResumeText)

          controller.enqueue(
            encoder.encode(
              statusEvent("generating", 95, "PDF generado correctamente")
            )
          )

          // Step 7: Send complete result
          const result: OptimizationResult = {
            initial_analysis: initialAnalysis,
            optimized_resume: optimizedResumeText,
            final_audit: auditResult,
            final_analysis: finalAnalysis,
          }

          const pdfBase64 = pdfBuffer.toString("base64")

          controller.enqueue(
            encoder.encode(completeEvent({ result, pdfBase64 }))
          )

          controller.close()
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Error desconocido"
          controller.enqueue(encoder.encode(errorEvent(message)))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido"
    return new Response(errorEvent(message), {
      status: 500,
      headers: { "Content-Type": "text/event-stream" },
    })
  }
}
