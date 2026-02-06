'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  link: string | null
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {}
  }, [user])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAll: true }) })
    fetchNotifications()
  }

  async function markRead(id: string, link: string | null) {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (link) window.location.href = link
    fetchNotifications()
  }

  if (!user) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center" data-testid="badge-unread-count">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between gap-2 border-b p-3">
          <h4 className="font-semibold text-sm" data-testid="text-notifications-title">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} data-testid="button-mark-all-read">
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto" data-testid="list-notifications">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground" data-testid="text-no-notifications">
              No notifications yet
            </div>
          ) : (
            notifications.map(n => {
              const TypeIcon = typeIcons[n.type] || Info
              return (
                <button
                  key={n.id}
                  className={`w-full text-left p-3 border-b last:border-b-0 hover-elevate flex gap-3 ${!n.read ? 'bg-muted/50' : ''}`}
                  onClick={() => markRead(n.id, n.link)}
                  data-testid={`notification-item-${n.id}`}
                >
                  <TypeIcon className={`h-5 w-5 shrink-0 mt-0.5 ${n.type === 'error' ? 'text-destructive' : n.type === 'warning' ? 'text-yellow-500' : n.type === 'success' ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-medium' : ''}`} data-testid={`text-notification-title-${n.id}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate" data-testid={`text-notification-message-${n.id}`}>{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1" data-testid={`text-notification-time-${n.id}`}>{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" data-testid={`indicator-unread-${n.id}`} />}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
