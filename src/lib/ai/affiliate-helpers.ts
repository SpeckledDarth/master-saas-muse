import type { AISettings } from '@/types/settings'

export function getDefaultAISettings(maxTokens = 1024, temperature = 0.7): AISettings {
  const settings: AISettings = {
    provider: 'xai',
    model: 'grok-3-mini-fast',
    maxTokens,
    temperature,
    systemPrompt: '',
  }

  const xaiKey = process.env.XAI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  if (!xaiKey && openaiKey) {
    settings.provider = 'openai'
    settings.model = 'gpt-4o-mini'
  }

  return settings
}

export function parseJsonResponse<T>(content: string, fallback: T): T {
  try {
    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(cleaned)
  } catch {
    return fallback
  }
}

export function handleAIError(error: any): { error: string; status: number } {
  if (error.message?.includes('not configured') || error.message?.includes('environment variable')) {
    return { error: 'AI provider is not configured. Please contact the admin to set up an AI API key.', status: 503 }
  }
  return { error: 'Failed to generate content. Please try again.', status: 500 }
}
