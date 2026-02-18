'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ColorInputProps {
  label?: string
  value: string | undefined
  onChange: (hex: string) => void
  onClear?: () => void
  defaultValue?: string
  placeholder?: string
  testId?: string
}

function normalizeHex(val: string): string {
  const cleaned = val.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) return cleaned
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) return `#${cleaned}`
  return ''
}

export function ColorInput({
  label,
  value,
  onChange,
  onClear,
  defaultValue = '#000000',
  placeholder = '#000000',
  testId = 'color-input',
}: ColorInputProps) {
  const displayValue = value || ''
  const pickerValue = normalizeHex(displayValue) || normalizeHex(defaultValue) || '#000000'

  return (
    <div className="space-y-1.5">
      {label && <Label className="text-sm">{label}</Label>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={e => onChange(e.target.value)}
          className="w-9 min-h-9 cursor-pointer flex-shrink-0 rounded-md border border-input bg-transparent"
          data-testid={`${testId}-picker`}
        />
        <Input
          value={displayValue}
          onChange={e => {
            const v = e.target.value
            onChange(v.startsWith('#') || v === '' ? v : `#${v}`)
          }}
          placeholder={placeholder}
          className="flex-1 font-mono text-sm"
          data-testid={`${testId}-hex`}
        />
        {onClear && displayValue && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            title="Clear"
            data-testid={`${testId}-clear`}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
