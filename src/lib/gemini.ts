const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-pro"

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
): Promise<string> {
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
    return extractJson(text)
  }

  const errorBody = await response.text()
  const shortMsg = errorBody.slice(0, 500)

  if (response.status === 429) {
    throw new RateLimitError(shortMsg)
  }

  throw new Error(`Gemini API error (${response.status}): ${shortMsg}`)
}

class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RateLimitError"
  }
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  temperature = 0.2
): Promise<string> {
  const keys = getApiKeys()

  if (keys.length === 0) {
    throw new Error(
      "No hay API keys de Gemini configuradas. Define GEMINI_API_KEY, GEMINI_API_KEY_2 y/o GEMINI_API_KEY_3 en .env.local"
    )
  }

  const errors: string[] = []

  for (let i = 0; i < keys.length; i++) {
    try {
      const result = await callGeminiWithKey(keys[i], systemPrompt, userMessage, temperature)
      if (i > 0) {
        console.warn(`[Gemini] Key ${i + 1} usada (key anterior agotada)`)
      }
      return result
    } catch (err) {
      if (err instanceof RateLimitError) {
        errors.push(`Key ${i + 1}: cuota agotada`)
        await sleep(200)
        continue
      }
      throw err
    }
  }

  throw new Error(
    `Todas las API keys de Gemini agotaron su cuota:\n${errors.join("\n")}\nEspera unos minutos o configura keys adicionales.`
  )
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
