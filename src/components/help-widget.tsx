'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface HelpWidgetProps {
  position?: 'bottom-right' | 'bottom-left'
  color?: string
  welcomeMessage?: string
  fallbackEmail?: string
}

export function HelpWidget({
  position = 'bottom-right',
  color,
  welcomeMessage,
  fallbackEmail,
}: HelpWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0 && welcomeMessage) {
      setMessages([{ role: 'assistant', content: welcomeMessage }])
    }
  }, [isOpen, messages.length, welcomeMessage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!inputValue.trim() || loading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    const updatedHistory = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(updatedHistory)
    setLoading(true)

    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages }),
      })

      if (!response.ok) throw new Error('Failed to get response')
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again or reach out via email.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-50 rounded-full p-3 shadow-lg text-white"
        style={{
          backgroundColor: color || '#6366f1',
          bottom: '1.5rem',
          right: position === 'bottom-left' ? undefined : '1.5rem',
          left: position === 'bottom-left' ? '1.5rem' : undefined,
        }}
        data-testid="button-help-widget"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="fixed z-50 rounded-lg border bg-card shadow-xl flex flex-col"
          style={{
            bottom: '5rem',
            right: position === 'bottom-left' ? undefined : '1.5rem',
            left: position === 'bottom-left' ? '1.5rem' : undefined,
            width: '380px',
            height: '500px',
          }}
          data-testid="container-help-chat"
        >
          <div className="flex items-center justify-between gap-2 border-b p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Support</span>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} data-testid="button-close-help-chat">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                  data-testid={`text-message-${i}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm" data-testid="text-loading">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {fallbackEmail && (
            <div className="px-4 pb-1">
              <p className="text-xs text-muted-foreground">
                Can&apos;t find what you need? Email <a href={`mailto:${fallbackEmail}`} className="underline" data-testid="link-fallback-email">{fallbackEmail}</a>
              </p>
            </div>
          )}

          <div className="border-t p-3">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                disabled={loading}
                data-testid="input-help-message"
              />
              <Button type="submit" size="icon" disabled={loading || !inputValue.trim()} data-testid="button-send-help-message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
