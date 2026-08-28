import { NextRequest } from "next/server"
import { extractStructuredMarkdown } from "@/lib/pdf-utils"
import { cvEvaluationSkill } from "@/lib/skills/cv-evaluation"
import type { ProcessingStage } from "@/lib/types"

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
              statusEvent("extracting", 10, "Leyendo archivo PDF...")
            )
          )

          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const structured = await extractStructuredMarkdown(buffer)

          if (structured.isScannedHint) {
            throw new Error(
              "Este PDF parece estar escaneado (no contiene texto seleccionable). Asegúrate de usar un CV con texto real para poder analizarlo."
            )
          }

          controller.enqueue(
            encoder.encode(
              statusEvent("extracting", 30, "Texto extraído correctamente")
            )
          )

          // Step 2: Evaluate with Gemini (single call)
          controller.enqueue(
            encoder.encode(
              statusEvent("evaluating", 40, "Analizando CV con IA...")
            )
          )

          const result = await cvEvaluationSkill(
            structured.markdown,
            jobDescription
          )

          controller.enqueue(
            encoder.encode(
              statusEvent("evaluating", 80, "Análisis completado")
            )
          )

          // Step 3: Send complete result
          controller.enqueue(
            encoder.encode(
              statusEvent("evaluating", 90, "Preparando resultados...")
            )
          )

          controller.enqueue(
            encoder.encode(
              completeEvent({
                result: result.evaluation,
                usage: result.usage,
                countedPromptTokens: result.countedPromptTokens,
                charCount: structured.charCount,
              })
            )
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
