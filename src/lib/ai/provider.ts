import OpenAI from 'openai'
import type { AIProvider, AISettings } from '@/types/settings'

const MAX_MESSAGES = 50
const MAX_MESSAGE_LENGTH = 32000
const MAX_TOKENS_LIMIT = 16384
const TEMPERATURE_MIN = 0
const TEMPERATURE_MAX = 2

interface ProviderConfig {
  baseURL: string
  envKey: string
  compatible: boolean
  models: { id: string; name: string }[]
}

const PROVIDER_CONFIG: Record<AIProvider, ProviderConfig> = {
  xai: {
    baseURL: 'https://api.x.ai/v1',
    envKey: 'XAI_API_KEY',
    compatible: true,
    models: [
      { id: 'grok-3-mini-fast', name: 'Grok 3 Mini Fast' },
      { id: 'grok-3-mini', name: 'Grok 3 Mini' },
      { id: 'grok-3-fast', name: 'Grok 3 Fast' },
      { id: 'grok-3', name: 'Grok 3' },
    ],
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    envKey: 'OPENAI_API_KEY',
    compatible: true,
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ],
  },
  anthropic: {
    baseURL: 'https://api.anthropic.com/v1',
    envKey: 'ANTHROPIC_API_KEY',
    compatible: false,
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
    ],
  },
}

export function getProviderConfig(provider: AIProvider) {
  return PROVIDER_CONFIG[provider]
}

export function getAvailableModels(provider: AIProvider) {
  return PROVIDER_CONFIG[provider]?.models || []
}

export function getAllProviders() {
  return Object.entries(PROVIDER_CONFIG).map(([id, config]) => ({
    id: id as AIProvider,
    name: id === 'xai' ? 'xAI (Grok)' : id === 'openai' ? 'OpenAI' : 'Anthropic (coming soon)',
    envKey: config.envKey,
    compatible: config.compatible,
    models: config.models,
  }))
}

export function isValidModel(provider: AIProvider, model: string): boolean {
  const config = PROVIDER_CONFIG[provider]
  if (!config) return false
  return config.models.some(m => m.id === model)
}

export function createAIClient(provider: AIProvider): OpenAI | null {
  const config = PROVIDER_CONFIG[provider]
  if (!config || !config.compatible) return null

  const apiKey = process.env[config.envKey]
  if (!apiKey) return null

  return new OpenAI({
    apiKey,
    baseURL: config.baseURL,
  })
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{type: string; text?: string; image_url?: {url: string}}>
}

export function validateMessages(messages: unknown): { valid: boolean; error?: string; messages?: ChatMessage[] } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' }
  }
  if (messages.length === 0) {
    return { valid: false, error: 'At least one message is required' }
  }
  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Too many messages (max ${MAX_MESSAGES})` }
  }
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: 'Invalid message object' }
    }
    if (!['system', 'user', 'assistant'].includes(msg.role)) {
      return { valid: false, error: `Invalid role: ${msg.role}` }
    }
    if (typeof msg.content === 'string') {
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return { valid: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` }
      }
    } else if (Array.isArray(msg.content)) {
      for (const contentItem of msg.content) {
        if (!contentItem || typeof contentItem !== 'object') {
          return { valid: false, error: 'Invalid content item' }
        }
        if (contentItem.type === 'text' && typeof contentItem.text === 'string') {
          if (contentItem.text.length > MAX_MESSAGE_LENGTH) {
            return { valid: false, error: `Message text too long (max ${MAX_MESSAGE_LENGTH} chars)` }
          }
        } else if (contentItem.type === 'image_url' && contentItem.image_url?.url) {
          continue
        } else {
          return { valid: false, error: 'Invalid content item format' }
        }
      }
    } else {
      return { valid: false, error: 'Message content must be a string or array' }
    }
  }
  return { valid: true, messages: messages as ChatMessage[] }
}

export function sanitizeSettings(settings: AISettings): AISettings {
  return {
    ...settings,
    maxTokens: Math.min(Math.max(1, settings.maxTokens), MAX_TOKENS_LIMIT),
    temperature: Math.min(Math.max(TEMPERATURE_MIN, settings.temperature), TEMPERATURE_MAX),
  }
}

export async function chatCompletion(
  rawSettings: AISettings,
  messages: ChatMessage[]
): Promise<{ content: string; usage?: { promptTokens: number; completionTokens: number } }> {
  const settings = sanitizeSettings(rawSettings)

  if (!PROVIDER_CONFIG[settings.provider]?.compatible) {
    throw new Error(`Provider "${settings.provider}" is not yet supported for chat completions.`)
  }

  const client = createAIClient(settings.provider)
  if (!client) {
    throw new Error(`AI provider "${settings.provider}" is not configured. Set the ${PROVIDER_CONFIG[settings.provider]?.envKey} environment variable.`)
  }

  const allMessages: ChatMessage[] = settings.systemPrompt
    ? [{ role: 'system', content: settings.systemPrompt }, ...messages]
    : messages

  const response = await client.chat.completions.create({
    model: settings.model,
    messages: allMessages as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    max_tokens: settings.maxTokens,
    temperature: settings.temperature,
  })

  const choice = response.choices[0]
  return {
    content: choice?.message?.content || '',
    usage: response.usage ? {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
    } : undefined,
  }
}

export async function chatCompletionStream(
  rawSettings: AISettings,
  messages: ChatMessage[]
): Promise<AsyncIterable<string>> {
  const settings = sanitizeSettings(rawSettings)

  if (!PROVIDER_CONFIG[settings.provider]?.compatible) {
    throw new Error(`Provider "${settings.provider}" is not yet supported for chat completions.`)
  }

  const client = createAIClient(settings.provider)
  if (!client) {
    throw new Error(`AI provider "${settings.provider}" is not configured. Set the ${PROVIDER_CONFIG[settings.provider]?.envKey} environment variable.`)
  }

  const allMessages: ChatMessage[] = settings.systemPrompt
    ? [{ role: 'system', content: settings.systemPrompt }, ...messages]
    : messages

  const stream = await client.chat.completions.create({
    model: settings.model,
    messages: allMessages as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    max_tokens: settings.maxTokens,
    temperature: settings.temperature,
    stream: true,
  })

  return {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield content
        }
      }
    },
  }
}
