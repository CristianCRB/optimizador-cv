"use client"

import { useState, useCallback, useRef } from "react"
import { HeroSection } from "@/components/hero-section"
import { UploadArea } from "@/components/upload-area"
import { JobDescriptionInput } from "@/components/job-description-input"
import { ProcessingScreen } from "@/components/processing-screen"
import { ResultsScreen } from "@/components/results-screen"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import type {
  ProcessingStatus,
  OptimizationResult,
  ProcessingStage,
} from "@/lib/types"

type AppState = "input" | "processing" | "results"

export default function Home() {
  const [state, setState] = useState<AppState>("input")
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [processingStatus, setProcessingStatus] =
    useState<ProcessingStatus | null>(null)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!file || !jobDescription.trim() || submitting) return

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

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = JSON.parse(line.slice(6))

          if (data.stage === "error") {
            throw new Error(data.error || "Error desconocido")
          }

          if (data.stage === "done") {
            setResult(data.result)
            setPdfBase64(data.pdfBase64)
            setProcessingStatus({
              stage: "done",
              progress: 100,
              message: "\u00a1Optimizaci\u00f3n completada!",
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

  const handleDownload = useCallback(async () => {
    if (!pdfBase64) return
    setDownloading(true)
    try {
      const byteCharacters = atob(pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "CV_Optimizado.pdf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }, [pdfBase64])

  const handleReset = useCallback(() => {
    setFile(null)
    setJobDescription("")
    setProcessingStatus(null)
    setResult(null)
    setPdfBase64(null)
    setState("input")
    setSubmitting(false)
    abortRef.current?.abort()
  }, [])

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
              onDownload={handleDownload}
              onReset={handleReset}
              downloading={downloading}
            />
          </div>
        </div>
      )}
    </main>
  )
}
