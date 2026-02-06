import { NextRequest, NextResponse } from 'next/server'
import { defaultSettings } from '@/types/settings'
import type { AISettings } from '@/types/settings'
import { chatCompletion, validateMessages } from '@/lib/ai/provider'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'

interface SupportChatRequest {
  message: string
  history?: { role: 'user' | 'assistant'; content: string }[]
}

async function getSettings() {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('organization_settings')
    .select('settings')
    .eq('app_id', 'default')
    .single()

  const settings = data?.settings || defaultSettings
  return settings
}

function getSupportSystemPrompt(settings: any): string {
  const supportSettings = settings.support || defaultSettings.support
  const brandingSettings = settings.branding || defaultSettings.branding
  
  let prompt = supportSettings.systemPrompt || 'You are a helpful support assistant for our company.'
  
  // Replace {appName} placeholder with actual app name
  prompt = prompt.replace('{appName}', brandingSettings.appName || 'our company')
  
  return prompt
}

const SUPPORT_RATE_LIMIT = {
  limit: 30, // 30 requests per window
  windowMs: 60000, // 1 minute window
}

const FALLBACK_REPLY = "I'm sorry, our AI assistant is not available at the moment. Please reach out to our support team via email for help."

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request)
    if (!clientIp) {
      return NextResponse.json(
        { error: 'Unable to determine client IP' },
        { status: 400 }
      )
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(clientIp, SUPPORT_RATE_LIMIT)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': SUPPORT_RATE_LIMIT.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Parse request body
    let body: SupportChatRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate message
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    if (body.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    // Get settings from Supabase
    const settings = await getSettings()
    const aiSettings = settings.ai || defaultSettings.ai
    const supportSettings = settings.support || defaultSettings.support

    // Check if support widget is enabled
    if (!supportSettings.enabled) {
      return NextResponse.json(
        { reply: FALLBACK_REPLY },
        { status: 200 }
      )
    }

    // Prepare messages for AI
    const messages = []

    // Add conversation history if provided
    if (Array.isArray(body.history) && body.history.length > 0) {
      for (const historyItem of body.history) {
        if (
          historyItem &&
          typeof historyItem === 'object' &&
          (historyItem.role === 'user' || historyItem.role === 'assistant') &&
          typeof historyItem.content === 'string'
        ) {
          messages.push({
            role: historyItem.role as 'user' | 'assistant',
            content: historyItem.content,
          })
        }
      }
    }

    // Add current user message
    messages.push({
      role: 'user' as const,
      content: body.message,
    })

    // Validate all messages
    const validation = validateMessages(messages)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid messages' },
        { status: 400 }
      )
    }

    // Get the support system prompt with app name replacement
    const supportSystemPrompt = getSupportSystemPrompt(settings)

    // Create AI settings with support system prompt
    const supportAISettings: AISettings = {
      ...aiSettings,
      systemPrompt: supportSystemPrompt,
    }

    try {
      // Call AI provider for non-streaming response
      const result = await chatCompletion(supportAISettings, validation.messages!)
      
      return NextResponse.json({
        reply: result.content,
      })
    } catch (err) {
      const errorMessage = (err as Error).message || 'AI request failed'
      
      // Check if it's a configuration error (missing API key)
      if (
        errorMessage.includes('is not configured') ||
        errorMessage.includes('environment variable')
      ) {
        return NextResponse.json({
          reply: FALLBACK_REPLY,
        })
      }

      // Log the error but return fallback message to avoid exposing internal errors
      console.error('[Support Chat] AI error:', errorMessage)
      return NextResponse.json({
        reply: FALLBACK_REPLY,
      })
    }
  } catch (err) {
    console.error('[Support Chat] Unexpected error:', (err as Error).message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
