'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, FileIcon, Loader2 } from 'lucide-react'

const ACCEPTED_TYPES: Record<string, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/gif': 'GIF',
  'image/svg+xml': 'SVG',
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
}

const ACCEPT_STRING = Object.keys(ACCEPTED_TYPES).join(',')
const MAX_SIZE_BYTES = 10 * 1024 * 1024

interface FileUploadProps {
  onUpload: (result: { file_url: string; file_name: string; file_size: number; file_type: string }) => void
  uploading?: boolean
  disabled?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({ onUpload, uploading = false, disabled = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES[file.type]) {
      return `Unsupported file type. Accepted: PNG, JPG, GIF, SVG, PDF, DOCX, XLSX`
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File too large (${formatFileSize(file.size)}). Maximum: 10 MB`
    }
    return null
  }, [])

  const handleFile = useCallback((file: File) => {
    setError(null)
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setSelectedFile(file)
  }, [validateFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleUpload = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch('/api/affiliate/assets/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }

      const data = await res.json()
      onUpload({
        file_url: data.file_url,
        file_name: data.file_name,
        file_size: data.file_size,
        file_type: data.file_type,
      })
      setSelectedFile(null)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const busy = uploading || isUploading

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 border-dashed rounded-[var(--card-radius,0.75rem)] p-6 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        } ${disabled || busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        data-testid="dropzone-file-upload"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          data-testid="input-file-upload"
        />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Drag & drop a file here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG, GIF, SVG, PDF, DOCX, XLSX — max 10 MB
        </p>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between p-3 rounded-[var(--card-radius,0.75rem)] border bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)} · {ACCEPTED_TYPES[selectedFile.type] || selectedFile.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleUpload() }}
              disabled={busy}
              data-testid="button-upload-file"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
              Upload
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setError(null) }}
              disabled={busy}
              data-testid="button-remove-file"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive" data-testid="text-file-upload-error">{error}</p>
      )}
    </div>
  )
}
