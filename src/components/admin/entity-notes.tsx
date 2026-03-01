'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Trash2, MessageSquare, Send } from 'lucide-react'

interface Note {
  id: string
  entity_type: string
  entity_id: string
  author_id: string
  author_name: string
  body: string
  created_at: string
}

interface EntityNotesProps {
  entityType: string
  entityId: string
}

export function EntityNotes({ entityType, entityId }: EntityNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/entity-notes?entity_type=${entityType}&entity_id=${entityId}`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes || [])
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  async function handleSubmit() {
    if (!newNote.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/entity-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId, body: newNote.trim() }),
      })
      if (res.ok) {
        setNewNote('')
        fetchNotes()
      }
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(noteId: string) {
    setDeletingId(noteId)
    try {
      const res = await fetch(`/api/admin/entity-notes?id=${noteId}`, { method: 'DELETE' })
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId))
      }
    } catch {
    } finally {
      setDeletingId(null)
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="loading-notes">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="entity-notes">
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[80px] resize-none"
          data-testid="input-new-note"
        />
        <Button
          onClick={handleSubmit}
          disabled={submitting || !newNote.trim()}
          size="icon"
          className="h-10 w-10 shrink-0 self-end"
          data-testid="button-submit-note"
          aria-label="Submit note"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground" data-testid="empty-notes">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="group rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]" data-testid={`note-${note.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground" data-testid={`text-note-author-${note.id}`}>
                      {note.author_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap" data-testid={`text-note-body-${note.id}`}>
                    {note.body}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(note.id)}
                  disabled={deletingId === note.id}
                  data-testid={`button-delete-note-${note.id}`}
                  aria-label="Delete note"
                >
                  {deletingId === note.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
