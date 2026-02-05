'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Mail, Download, Users, Trash2, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface WaitlistEntry {
  id: number
  email: string
  name: string | null
  referral_source: string | null
  created_at: string
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchEntries()
  }, [])

  async function fetchEntries() {
    try {
      const res = await fetch('/api/waitlist')
      const data = await res.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Error fetching waitlist:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(entryId: number, email: string) {
    if (!confirm(`Remove "${email}" from the waitlist?`)) return

    setDeleting(entryId)
    try {
      const res = await fetch(`/api/waitlist?id=${entryId}`, { method: 'DELETE' })
      
      if (res.ok) {
        toast({ title: 'Entry removed' })
        fetchEntries()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete entry', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  function exportCSV() {
    const headers = ['Email', 'Name', 'Referral Source', 'Date']
    const rows = entries.map(e => [
      e.email,
      e.name || '',
      e.referral_source || '',
      new Date(e.created_at).toLocaleDateString(),
    ])
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({ title: 'Exported!', description: `${entries.length} entries exported to CSV` })
  }

  const filteredEntries = entries.filter(entry => 
    entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.name && entry.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Waitlist
          </h1>
          <p className="text-muted-foreground">
            {entries.length} people waiting for launch
          </p>
        </div>
        {entries.length > 0 && (
          <Button onClick={exportCSV} variant="outline" data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Signups
                <Badge variant="secondary">{entries.length}</Badge>
              </CardTitle>
              <CardDescription>
                People who signed up for early access
              </CardDescription>
            </div>
            {entries.length > 0 && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-waitlist"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">No waitlist signups yet</p>
              <p className="text-muted-foreground">Enable waitlist mode in settings to start collecting emails.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 py-2 px-4 bg-muted rounded-t-lg font-medium text-sm">
                <span>Email</span>
                <span>Name</span>
                <span>Source</span>
                <span>Date</span>
                <span className="text-right">Actions</span>
              </div>
              {filteredEntries.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No entries match your search
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="grid grid-cols-5 gap-4 py-3 px-4 border-b last:border-0 items-center"
                    data-testid={`waitlist-entry-${entry.id}`}
                  >
                    <span className="truncate font-medium">{entry.email}</span>
                    <span className="text-muted-foreground">{entry.name || '-'}</span>
                    <span className="text-muted-foreground">{entry.referral_source || '-'}</span>
                    <span className="text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(entry.id, entry.email)}
                        disabled={deleting === entry.id}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${entry.id}`}
                      >
                        {deleting === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
