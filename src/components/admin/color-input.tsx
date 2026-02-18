'use client'

import { useState, useCallback, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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

function isValidHex(val: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(val)
}

function normalizeHex(val: string): string {
  const cleaned = val.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(cleaned)) return cleaned
  if (/^[0-9a-f]{6}$/.test(cleaned)) return `#${cleaned}`
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
  const currentValue = value || ''
  const resolvedColor = normalizeHex(currentValue) || normalizeHex(defaultValue) || '#000000'

  const [draft, setDraft] = useState(currentValue)

  useEffect(() => {
    setDraft(currentValue)
  }, [currentValue])

  const handlePickerChange = useCallback((color: string) => {
    setDraft(color)
    onChange(color)
  }, [onChange])

  const handleTextInput = useCallback((raw: string) => {
    const v = raw.startsWith('#') || raw === '' ? raw : `#${raw}`
    setDraft(v)
    if (isValidHex(v)) {
      onChange(v)
    }
  }, [onChange])

  const handleTextBlur = useCallback(() => {
    const normalized = normalizeHex(draft)
    if (normalized) {
      setDraft(normalized)
      onChange(normalized)
    } else if (draft === '') {
      onChange('')
    } else {
      setDraft(currentValue)
    }
  }, [draft, currentValue, onChange])

  return (
    <div className="space-y-1.5">
      {label && <Label className="text-sm">{label}</Label>}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-9 min-h-9 flex-shrink-0 rounded-md border border-input cursor-pointer transition-shadow hover:ring-2 hover:ring-ring/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ backgroundColor: resolvedColor }}
              data-testid={`${testId}-picker`}
              aria-label={label ? `Pick ${label}` : 'Pick color'}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start" sideOffset={8}>
            <HexColorPicker
              color={resolvedColor}
              onChange={handlePickerChange}
              style={{ width: '200px', height: '160px' }}
            />
            <Input
              value={draft}
              onChange={e => handleTextInput(e.target.value)}
              onBlur={handleTextBlur}
              placeholder={placeholder}
              className="mt-2 font-mono text-sm"
              data-testid={`${testId}-popover-hex`}
              maxLength={7}
            />
          </PopoverContent>
        </Popover>
        <Input
          value={draft}
          onChange={e => handleTextInput(e.target.value)}
          onBlur={handleTextBlur}
          placeholder={placeholder}
          className="flex-1 font-mono text-sm"
          data-testid={`${testId}-hex`}
          maxLength={7}
        />
        {onClear && currentValue && (
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
