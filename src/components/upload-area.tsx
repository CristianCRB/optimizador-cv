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
      <label className="text-sm font-medium">Curriculum Vitae (PDF)</label>
      {file ? (
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
          <File className="size-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setError(null); onFileSelect(null) }}
            className="size-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
            disabled={disabled}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div
          ref={dropRef}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed transition-colors cursor-pointer hover:border-primary/50",
            dragOver && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Arrastra tu PDF aquí o{" "}
            <span className="text-primary font-medium">
              selecciona un archivo
            </span>
          </p>
          <p className="text-xs text-muted-foreground">PDF hasta 10MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={disabled}
          />
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
