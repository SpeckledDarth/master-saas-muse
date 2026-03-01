'use client'

import { useState } from 'react'
import { DSCard, DSCardContent, DSCardHeader } from '@/components/ui/ds-card'
import { Button } from '@/components/ui/button'
import { Loader2, Pencil } from 'lucide-react'

interface EditableSettingsGroupProps {
  title: string
  description?: string
  children: React.ReactNode
  onSave: () => Promise<void>
  isSaving?: boolean
}

export function EditableSettingsGroup({
  title,
  description,
  children,
  onSave,
  isSaving = false,
}: EditableSettingsGroupProps) {
  const [isEditing, setIsEditing] = useState(false)

  async function handleSave() {
    await onSave()
    setIsEditing(false)
  }

  function handleCancel() {
    setIsEditing(false)
  }

  return (
    <DSCard data-testid={`settings-group-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <DSCardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3
              className="text-base font-semibold text-foreground"
              style={{ fontSize: 'var(--h3-size, 1.125rem)', fontWeight: 'var(--h3-weight, 600)' }}
            >
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              data-testid={`button-edit-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                data-testid={`button-cancel-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                data-testid={`button-save-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Save
              </Button>
            </div>
          )}
        </div>
      </DSCardHeader>
      <DSCardContent>
        <fieldset disabled={!isEditing} className={!isEditing ? 'opacity-60' : ''}>
          {children}
        </fieldset>
      </DSCardContent>
    </DSCard>
  )
}
