import type { GeminiUsage } from "./types"

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite"

// Maximum context tokens for the default model. Used for pre-validation.
// gemini-3.x flash-lite models support a 1M token context window.
const MAX_CONTEXT_TOKENS = 1_000_000
const BLOCK_CONTEXT_RATIO = 0.95

// Rough heuristic: ~4 characters per token. Used to avoid an extra countTokens
// call unless the prompt is large enough to be worth measuring precisely.
const CHARS_PER_TOKEN = 4
const COUNT_TOKENS_CHAR_THRESHOLD = 100_000

export interface GeminiResult {
  text: string
  usage: GeminiUsage | null
}

function getApiKeys(): string[] {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter((k): k is string => Boolean(k))
}

async function callGeminiWithKey(
  key: string,
  systemPrompt: string,
  userMessage: string,
  temperature: number
): Promise<GeminiResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userMessage}` }],
        },
      ],
      generationConfig: {
        temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    }),
  })

  if (response.ok) {
    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error("Gemini: no se recibió texto en la respuesta")

    const usage: GeminiUsage = {
      promptTokenCount: data?.usageMetadata?.promptTokenCount ?? 0,
      candidatesTokenCount: data?.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokenCount: data?.usageMetadata?.totalTokenCount ?? 0,
      modelVersion: data?.modelVersion ?? GEMINI_MODEL,
      responseId: data?.responseId ?? "",
    }

    return { text: extractJson(text), usage }
  }

  const errorBody = await response.text()
  const shortMsg = errorBody.slice(0, 500)

  if (response.status === 429 || response.status === 503) {
    throw new RateLimitError(shortMsg)
  }

  throw new Error(`Gemini API error (${response.status}): ${shortMsg}`)
}

async function countTokensWithKey(
  key: string,
  prompt: string
): Promise<number> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:countTokens?key=${key}`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })

  if (response.ok) {
    const data = await response.json()
    return data?.totalTokens ?? 0
  }

  const errorBody = await response.text()
  const shortMsg = errorBody.slice(0, 500)
  if (response.status === 429 || response.status === 503) {
    throw new RateLimitError(shortMsg)
  }
  throw new Error(`Gemini countTokens error (${response.status}): ${shortMsg}`)
}

async function countTokens(prompt: string): Promise<number> {
  const keys = getApiKeys()
  if (keys.length === 0) {
    throw new Error(
      "No hay API keys de Gemini configuradas. Define GEMINI_API_KEY, GEMINI_API_KEY_2 y/o GEMINI_API_KEY_3 en .env.local"
    )
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    for (let i = 0; i < keys.length; i++) {
      try {
        return await countTokensWithKey(keys[i], prompt)
      } catch (err) {
        if (err instanceof RateLimitError) continue
        throw err
      }
    }
    await sleep(baseDelay(attempt))
  }

  // Fall back to heuristic if countTokens keeps failing.
  return Math.ceil(prompt.length / CHARS_PER_TOKEN)
}

function validatePromptSize(prompt: string): void {
  const heuristicTokens = Math.ceil(prompt.length / CHARS_PER_TOKEN)

  // Only call countTokens for precision when the prompt is large enough.
  if (heuristicTokens > BLOCK_CONTEXT_RATIO * MAX_CONTEXT_TOKENS) {
    throw new Error(
      `El texto del CV + descripción supera ampliamente la capacidad del modelo (${MAX_CONTEXT_TOKENS.toLocaleString()} tokens de contexto). Reduce la descripción del puesto o simplifica el CV.`
    )
  }

  if (heuristicTokens > COUNT_TOKENS_CHAR_THRESHOLD) {
    // Precise measurement, but we're still below the hard block.
    // countTokens is invoked and reported back to the caller via warn.
    console.warn(
      `[Gemini] Prompt grande detectado (~${heuristicTokens.toLocaleString()} tokens estimados).`
    )
  }
}

async function countPromptTokens(prompt: string): Promise<number> {
  const heuristicTokens = Math.ceil(prompt.length / CHARS_PER_TOKEN)
  if (heuristicTokens < COUNT_TOKENS_CHAR_THRESHOLD) {
    return heuristicTokens
  }
  try {
    return await countTokens(prompt)
  } catch {
    return heuristicTokens
  }
}

class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RateLimitError"
  }
}

export interface CallGeminiOutput {
  text: string
  usage: GeminiUsage | null
  countedPromptTokens: number
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  temperature = 0.2
): Promise<CallGeminiOutput> {
  const fullPrompt = `${systemPrompt}\n\n${userMessage}`

  validatePromptSize(fullPrompt)

  const countedPromptTokens = await countPromptTokens(fullPrompt)

  const keys = getApiKeys()
  const maxRetries = 5

  if (keys.length === 0) {
    throw new Error(
      "No hay API keys de Gemini configuradas. Define GEMINI_API_KEY, GEMINI_API_KEY_2 y/o GEMINI_API_KEY_3 en .env.local"
    )
  }

  let used = 0

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const errors: string[] = []

    for (let i = 0; i < keys.length; i++) {
      try {
        const result = await callGeminiWithKey(
          keys[i],
          systemPrompt,
          userMessage,
          temperature
        )
        if (i > 0) {
          console.warn(`[Gemini] Key ${i + 1} usada (key anterior agotada)`)
        }
        return {
          text: result.text,
          usage: result.usage,
          countedPromptTokens,
        }
      } catch (err) {
        if (err instanceof RateLimitError) {
          used++
          errors.push(
            `Key ${i + 1}: cuota agotada (intento ${attempt + 1}/${maxRetries})`
          )
          continue
        }
        throw err
      }
    }

    if (attempt < maxRetries - 1) {
      const delay = baseDelay(attempt)
      console.warn(
        `[Gemini] Intento ${attempt + 1}/${maxRetries} falló (${errors.length} keys agotadas). Reintentando en ${(delay / 1000).toFixed(1)}s...`
      )
      await sleep(delay)
    }
  }

  throw new Error(
    `Las ${used} clave(s) de Gemini se agotaron tras ${maxRetries} intentos.\nVerifica que las keys sean válidas o genera nuevas.`
  )
}

function baseDelay(attempt: number): number {
  return 2000 * Math.pow(2, attempt) + Math.random() * 1000
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function extractJson(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }

  const braceMatch = text.match(/{[\s\S]*}/)
  if (braceMatch) {
    return braceMatch[0].trim()
  }

  return text.trim()
}
