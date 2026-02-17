'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, ImageIcon, User } from 'lucide-react'

interface ImageUploadProps {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  bucket?: string
  folder?: string
  aspectRatio?: string
  maxWidth?: number
  variant?: 'default' | 'avatar'
  testId: string
}

const DEFAULT_MAX_WIDTHS: Record<string, number> = {
  '1/1': 120,
  '3/1': 280,
  '3/4': 160,
  '4/3': 280,
  '16/9': 320,
  '21/9': 360,
}

export function ImageUpload({
  label,
  value,
  onChange,
  bucket = 'branding',
  folder = 'images',
  aspectRatio = '16/9',
  maxWidth,
  variant = 'default',
  testId,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAvatar = variant === 'avatar'
  const resolvedMaxWidth = maxWidth ?? (isAvatar ? 96 : (DEFAULT_MAX_WIDTHS[aspectRatio] ?? 280))

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}.${fileExt}`

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        setError(uploadError.message)
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      onChange(publicUrl)
    } catch (err) {
      setError('Upload failed. Please try again.')
    }

    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleRemove() {
    onChange(null)
  }

  if (isAvatar) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-3">
          <div
            className="relative shrink-0"
            style={{ width: resolvedMaxWidth, height: resolvedMaxWidth }}
          >
            {value ? (
              <div className="relative w-full h-full">
                <img
                  src={value}
                  alt={label}
                  className="w-full h-full object-cover rounded-full border"
                  data-testid={`${testId}-preview`}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                  onClick={handleRemove}
                  data-testid={`${testId}-remove`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                className="w-full h-full rounded-full border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer flex items-center justify-center bg-muted"
                onClick={() => fileInputRef.current?.click()}
                data-testid={`${testId}-dropzone`}
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex gap-2">
              <Input
                placeholder="Or paste image URL"
                value={value || ''}
                onChange={e => onChange(e.target.value || null)}
                className="flex-1 text-sm"
                data-testid={`${testId}-url`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                data-testid={`${testId}-upload-button`}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
          </div>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
          data-testid={`${testId}-input`}
        />
        {error && (
          <p className="text-sm text-destructive" data-testid={`${testId}-error`}>
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div style={{ maxWidth: resolvedMaxWidth }}>
        {value ? (
          <div className="relative group">
            <div
              className="relative rounded-lg border overflow-hidden bg-muted"
              style={{ aspectRatio }}
            >
              <img
                src={value}
                alt={label}
                className="w-full h-full object-cover"
                data-testid={`${testId}-preview`}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={handleRemove}
              data-testid={`${testId}-remove`}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div
            className="relative rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer"
            style={{ aspectRatio }}
            onClick={() => fileInputRef.current?.click()}
            data-testid={`${testId}-dropzone`}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-xs">Click to upload</span>
                  <span className="text-[10px]">PNG, JPG up to 5MB</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
        data-testid={`${testId}-input`}
      />

      {error && (
        <p className="text-sm text-destructive" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}

      <div className="flex gap-2" style={{ maxWidth: resolvedMaxWidth }}>
        <Input
          placeholder="Or paste image URL"
          value={value || ''}
          onChange={e => onChange(e.target.value || null)}
          className="flex-1 text-sm"
          data-testid={`${testId}-url`}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          data-testid={`${testId}-upload-button`}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
