'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ParsedRow {
  content: string
  platform: string
  scheduled_at: string
  error?: string
  rowIndex: number
}

const VALID_PLATFORMS = ['twitter', 'linkedin', 'facebook']

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  const firstLine = lines[0].toLowerCase()
  const startIdx = (firstLine.includes('content') && firstLine.includes('platform')) ? 1 : 0

  const rows: ParsedRow[] = []

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]
    const parts: string[] = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (ch === '"') {
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          current += '"'
          j++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        parts.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    parts.push(current.trim())

    const content = parts[0] || ''
    const platform = (parts[1] || '').toLowerCase()
    const scheduled_at = parts[2] || ''

    let error: string | undefined

    if (!content) {
      error = 'Content is empty'
    } else if (!VALID_PLATFORMS.includes(platform)) {
      error = `Invalid platform: "${parts[1] || ''}"`
    } else if (!scheduled_at) {
      error = 'Missing scheduled date'
    } else {
      const d = new Date(scheduled_at)
      if (isNaN(d.getTime())) {
        error = `Invalid date: "${scheduled_at}"`
      }
    }

    rows.push({ content, platform, scheduled_at, error, rowIndex: i })
  }

  return rows
}

export function BulkImport({ onImported }: { onImported?: () => void }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validRows = rows.filter(r => !r.error)
  const errorRows = rows.filter(r => !!r.error)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (validRows.length === 0) return
    setImporting(true)
    setResult(null)

    try {
      const res = await fetch('/api/social/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts: validRows.map(r => ({
            content: r.content,
            platform: r.platform,
            scheduled_at: new Date(r.scheduled_at).toISOString(),
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult({ imported: data.imported || 0, errors: data.errors || [] })
      toast({
        title: 'Import Complete',
        description: `${data.imported || 0} posts imported successfully`,
      })
      onImported?.()
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setRows([])
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) {
      handleReset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-bulk-import">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col" data-testid="dialog-bulk-import">
        <DialogHeader>
          <DialogTitle data-testid="text-bulk-import-title">Bulk Import Posts</DialogTitle>
          <DialogDescription data-testid="text-bulk-import-description">
            Upload a CSV file with columns: content, platform, scheduled_at
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary-600 dark:file:bg-primary-400 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white dark:file:text-black"
              data-testid="input-csv-file"
            />
            {rows.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleReset} data-testid="button-reset-csv">
                Clear
              </Button>
            )}
          </div>

          {rows.length > 0 && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" data-testid="badge-total-rows">{rows.length} rows</Badge>
                <Badge variant="default" data-testid="badge-valid-rows">{validRows.length} valid</Badge>
                {errorRows.length > 0 && (
                  <Badge variant="destructive" data-testid="badge-error-rows">{errorRows.length} errors</Badge>
                )}
              </div>

              <div className="overflow-auto flex-1 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead className="w-24">Platform</TableHead>
                      <TableHead className="w-40">Scheduled At</TableHead>
                      <TableHead className="w-28">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={idx} data-testid={`row-import-${idx}`}>
                        <TableCell className="text-xs text-muted-foreground">{row.rowIndex}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{row.content}</TableCell>
                        <TableCell className="text-sm">{row.platform}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.scheduled_at}</TableCell>
                        <TableCell>
                          {row.error ? (
                            <span className="flex items-center gap-1 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3 flex-shrink-0" />
                              {row.error}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                              Valid
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {result && (
                <div className="flex items-center gap-2 text-sm" data-testid="text-import-result">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  {result.imported} posts imported.
                  {result.errors.length > 0 && (
                    <span className="text-destructive">{result.errors.length} failed.</span>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleOpenChange(false)} data-testid="button-cancel-import">
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  data-testid="button-import-all"
                >
                  {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Import All ({validRows.length})
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
