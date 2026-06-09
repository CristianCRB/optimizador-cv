"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Upload, File, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadAreaProps {
  onFileSelect: (file: File | null) => void
  file: File | null
  disabled?: boolean
}

export function UploadArea({ onFileSelect, file, disabled }: UploadAreaProps) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const isValidPDF = useCallback((f: File) => {
    const isPDF =
      f.type === "application/pdf" ||
      f.name.toLowerCase().endsWith(".pdf")
    if (!isPDF) {
      setError("Solo se aceptan archivos PDF")
      return false
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("El archivo no debe superar los 10MB")
      return false
    }
    setError(null)
    return true
  }, [])

  const processFile = useCallback(
    (f: File) => {
      if (isValidPDF(f)) {
        onFileSelect(f)
      }
    },
    [isValidPDF, onFileSelect]
  )

  useEffect(() => {
    const el = dropRef.current
    if (!el || disabled) return

    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(true)
    }

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
    }

    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      const f = e.dataTransfer?.files?.[0]
      if (f) processFile(f)
    }

    el.addEventListener("dragover", onDragOver)
    el.addEventListener("dragleave", onDragLeave)
    el.addEventListener("drop", onDrop)

    return () => {
      el.removeEventListener("dragover", onDragOver)
      el.removeEventListener("dragleave", onDragLeave)
      el.removeEventListener("drop", onDrop)
    }
  }, [disabled, processFile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      processFile(f)
    }
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="space-y-2">
      <label htmlFor="cv-upload" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Curriculum Vitae
      </label>
      {file ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <File className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setError(null); onFileSelect(null) }}
            className="size-6 flex items-center justify-center rounded hover:bg-muted transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            disabled={disabled}
            aria-label="Eliminar archivo"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          ref={dropRef}
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-dashed transition-all cursor-pointer select-none",
            "border-[#1F2937] hover:border-[#1E88FF]/40 hover:bg-[#1E88FF]/[0.02]",
            dragOver && "border-[#1E88FF] bg-[#1E88FF]/[0.03] scale-[1.01]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ touchAction: "manipulation" }}
        >
          <div className="size-10 rounded-xl bg-[#1E88FF]/10 flex items-center justify-center">
            <Upload className="size-5 text-[#1E88FF]" aria-hidden="true" />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Arrastra o{" "}
            <span className="text-[#1E88FF] font-medium">selecciona</span> tu PDF
          </p>
          <p className="text-[10px] text-muted-foreground/40">PDF hasta 10MB</p>
          <input
            ref={inputRef}
            id="cv-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={disabled}
            name="cv-file"
            autoComplete="off"
          />
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle className="size-3.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
