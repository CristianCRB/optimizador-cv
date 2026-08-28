"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { HeroSection } from "@/components/hero-section"
import { UploadArea } from "@/components/upload-area"
import { JobDescriptionInput } from "@/components/job-description-input"
import { ProcessingScreen } from "@/components/processing-screen"
import { ResultsScreen } from "@/components/results-screen"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import {
  appendUsage,
  buildSessionSummary,
  loadUsageHistory,
  makeUsageId,
} from "@/lib/local-usage-store"
import type {
  ProcessingStatus,
  CVEvaluation,
  ProcessingStage,
  GeminiUsage,
  AnalysisUsage,
  UsageSessionSummary,
} from "@/lib/types"

type AppState = "input" | "processing" | "results"

interface LastUsage {
  usage: GeminiUsage | null
  countedPromptTokens: number
  charCount: number
}

export default function Home() {
  const [state, setState] = useState<AppState>("input")
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [processingStatus, setProcessingStatus] =
    useState<ProcessingStatus | null>(null)
  const [result, setResult] = useState<CVEvaluation | null>(null)
  const [lastUsage, setLastUsage] = useState<LastUsage | null>(null)
  const [sessionSummary, setSessionSummary] =
    useState<UsageSessionSummary | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const [uploadDate] = useState(() => new Date())
  const startTimeRef = useRef<number>(0)

  const handleSubmit = useCallback(async () => {
    if (!file || !jobDescription.trim() || submitting) return

    startTimeRef.current = performance.now()
    setSubmitting(true)
    setState("processing")
    setProcessingStatus({
      stage: "extracting",
      progress: 0,
      message: "Iniciando\u2026",
    })

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("jobDescription", jobDescription)

      const response = await fetch("/api/optimize", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No se pudo leer la respuesta")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        let boundary
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const event = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          for (const line of event.split("\n")) {
            if (!line.startsWith("data: ")) continue
            const data = JSON.parse(line.slice(6))

          if (data.stage === "error") {
            throw new Error(data.error || "Error desconocido")
          }

          if (data.stage === "done") {
            const usage = data.usage ?? null
            const countedPromptTokens = data.countedPromptTokens ?? 0
            const charCount = data.charCount ?? 0

            setResult(data.result)
            setLastUsage({
              usage,
              countedPromptTokens,
              charCount,
            })

            const record: AnalysisUsage = {
              id: makeUsageId(),
              fileName: file?.name || "CV",
              timestamp: new Date().toISOString(),
              promptTokenCount: usage?.promptTokenCount ?? 0,
              candidatesTokenCount: usage?.candidatesTokenCount ?? 0,
              totalTokenCount: usage?.totalTokenCount ?? 0,
              countedPromptTokens,
              model: usage?.modelVersion ?? "desconocido",
              charCount,
              durationMs: Math.round(
                performance.now() - startTimeRef.current
              ),
              overallScore: data.result?.overall_score ?? 0,
            }

            const updated = appendUsage(record)
            setSessionSummary(buildSessionSummary(updated))

            setProcessingStatus({
              stage: "done",
              progress: 100,
              message: "\u00a1An\u00e1lisis completado!",
            })
            setState("results")
            setSubmitting(false)
            return
          }

          setProcessingStatus({
            stage: data.stage as ProcessingStage,
            progress: data.progress,
            message: data.message,
          })
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setState("input")
        setSubmitting(false)
        return
      }
      setProcessingStatus({
        stage: "error",
        progress: 0,
        message: (err as Error).message || "Error de conexi\u00f3n",
      })
      setSubmitting(false)
    }
  }, [file, jobDescription, submitting])

  const handleDelete = useCallback(() => {
    setFile(null)
    setJobDescription("")
    setProcessingStatus(null)
    setResult(null)
    setState("input")
    setSubmitting(false)
    abortRef.current?.abort()
  }, [])

  const initialSessionSummary = useMemo(
    () => buildSessionSummary(loadUsageHistory()),
    []
  )

  const usageSummary = sessionSummary ?? initialSessionSummary

  const isValid = file !== null && jobDescription.trim().length > 0

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {state === "input" && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg space-y-6">
            <HeroSection />

            <UploadArea
              onFileSelect={setFile}
              file={file}
              disabled={submitting}
            />

            <JobDescriptionInput
              value={jobDescription}
              onChange={setJobDescription}
              disabled={submitting}
            />

            <Button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              size="lg"
              className="w-full bg-gradient-to-r from-[#1E88FF] to-[#22C1FF] hover:from-[#1E88FF]/90 hover:to-[#22C1FF]/90 border-none text-white shadow-lg shadow-[#1E88FF]/20"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {submitting ? "Optimizando\u2026" : "Optimizar CV para esta vacante"}
            </Button>
          </div>
        </div>
      )}

      {state === "processing" && processingStatus && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <ProcessingScreen status={processingStatus} />
          </div>
        </div>
      )}

      {state === "results" && result && (
        <div className="flex-1 flex items-start justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            <ResultsScreen
              result={result}
              fileName={file?.name || "CV"}
              uploadDate={uploadDate}
              onDelete={handleDelete}
              lastUsage={lastUsage}
              usageSummary={usageSummary}
            />
          </div>
        </div>
      )}
    </main>
  )
}
