"use client"

import { useState, useCallback, useRef } from "react"
import { HeroSection } from "@/components/hero-section"
import { UploadArea } from "@/components/upload-area"
import { JobDescriptionInput } from "@/components/job-description-input"
import { ProcessingScreen } from "@/components/processing-screen"
import { ResultsScreen } from "@/components/results-screen"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, ArrowRight } from "lucide-react"
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
  const abortRef = useRef<AbortController | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!file || !jobDescription.trim()) return

    setState("processing")
    setProcessingStatus({
      stage: "extracting",
      progress: 0,
      message: "Iniciando...",
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
              message: "¡Optimización completada!",
            })
            setState("results")
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
        return
      }
      setProcessingStatus({
        stage: "error",
        progress: 0,
        message: (err as Error).message || "Error de conexión",
      })
    }
  }, [file, jobDescription])

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
    abortRef.current?.abort()
  }, [])

  const isValid = file !== null && jobDescription.trim().length > 0

  return (
    <main className="flex-1 flex flex-col">
      <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-8">
        <HeroSection />

        {state === "input" && (
          <Card>
            <CardContent className="space-y-6 pt-6">
              <UploadArea
                onFileSelect={setFile}
                file={file}
                disabled={false}
              />

              <JobDescriptionInput
                value={jobDescription}
                onChange={setJobDescription}
                disabled={false}
              />

              <Button
                onClick={handleSubmit}
                disabled={!isValid}
                size="lg"
                className="w-full"
              >
                <Sparkles className="size-4" />
                Analizar CV
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {state === "processing" && processingStatus && (
          <Card>
            <CardContent>
              <ProcessingScreen status={processingStatus} />
            </CardContent>
          </Card>
        )}

        {state === "results" && result && (
          <ResultsScreen
            result={result}
            fileName={file?.name || "CV"}
            onDownload={handleDownload}
            onReset={handleReset}
            downloading={downloading}
          />
        )}
      </div>
    </main>
  )
}
