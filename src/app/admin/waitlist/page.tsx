'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Mail, Download, Users } from 'lucide-react'

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

  function exportCSV() {
    const headers = ['Email', 'Name', 'Referral Source', 'Date']
    const rows = entries.map(e => [
      e.email,
      e.name || '',
      e.referral_source || '',
      new Date(e.created_at).toLocaleDateString(),
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'waitlist.csv'
    a.click()
    URL.revokeObjectURL(url)
    
    toast({ title: 'Exported!', description: `${entries.length} entries exported to CSV` })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Signups ({entries.length})
          </CardTitle>
          <CardDescription>
            People who signed up for early access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No waitlist signups yet. Enable waitlist mode to start collecting emails.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-4 py-2 px-4 bg-muted rounded-t-lg font-medium text-sm">
                <span>Email</span>
                <span>Name</span>
                <span>Source</span>
                <span>Date</span>
              </div>
              {entries.map((entry) => (
                <div 
                  key={entry.id} 
                  className="grid grid-cols-4 gap-4 py-3 px-4 border-b last:border-0"
                  data-testid={`waitlist-entry-${entry.id}`}
                >
                  <span className="truncate">{entry.email}</span>
                  <span className="text-muted-foreground">{entry.name || '-'}</span>
                  <span className="text-muted-foreground">{entry.referral_source || '-'}</span>
                  <span className="text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
