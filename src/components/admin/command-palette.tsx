'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { Users, FileText, CreditCard, MessageSquare, Clock, Search } from 'lucide-react'

interface SearchResult {
  type: 'user' | 'invoice' | 'subscription' | 'ticket'
  title: string
  subtitle: string
  href: string
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  user: Users,
  invoice: FileText,
  subscription: CreditCard,
  ticket: MessageSquare,
}

const TYPE_LABELS: Record<string, string> = {
  user: 'Users',
  invoice: 'Invoices',
  subscription: 'Subscriptions',
  ticket: 'Tickets',
}

const RECENT_KEY = 'admin-cmd-k-recent'
const MAX_RECENT = 5

function getRecentSearches(): { query: string; href: string; title: string }[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

function addRecentSearch(entry: { query: string; href: string; title: string }) {
  try {
    const recent = getRecentSearches().filter(r => r.href !== entry.href)
    recent.unshift(entry)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
  } catch {}
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<{ query: string; href: string; title: string }[]>([])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches())
      setQuery('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        if (res.ok) {
          const data = await res.json()
          setResults(data.results || [])
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const handleSelect = useCallback((href: string, title: string) => {
    addRecentSearch({ query, href, title })
    setOpen(false)
    router.push(href)
  }, [router, query])

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-open-search"
        aria-label="Search (Cmd+K)"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search users, invoices, subscriptions, tickets..."
          value={query}
          onValueChange={setQuery}
          data-testid="input-command-search"
        />
        <CommandList>
          {query.length < 2 && recentSearches.length > 0 && (
            <CommandGroup heading="Recent">
              {recentSearches.map((item, i) => (
                <CommandItem
                  key={`recent-${i}`}
                  onSelect={() => handleSelect(item.href, item.title)}
                  data-testid={`item-recent-${i}`}
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.query}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {query.length >= 2 && !loading && results.length === 0 && (
            <CommandEmpty data-testid="text-no-results">No results found for &quot;{query}&quot;</CommandEmpty>
          )}

          {query.length >= 2 && loading && results.length === 0 && (
            <CommandEmpty>Searching...</CommandEmpty>
          )}

          {Object.entries(grouped).map(([type, items]) => {
            const Icon = TYPE_ICONS[type] || Search
            return (
              <CommandGroup key={type} heading={TYPE_LABELS[type] || type}>
                {items.map((item, i) => (
                  <CommandItem
                    key={`${type}-${i}`}
                    onSelect={() => handleSelect(item.href, item.title)}
                    data-testid={`item-result-${type}-${i}`}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm truncate">{item.title}</span>
                      <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
      </CommandDialog>
    </>
  )
}
