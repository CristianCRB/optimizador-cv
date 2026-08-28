import type { AnalysisUsage, UsageSessionSummary } from "./types"

const STORAGE_KEY = "ats-usage-history"
const MAX_RECORDS = 200

export function loadUsageHistory(): AnalysisUsage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function appendUsage(record: AnalysisUsage): AnalysisUsage[] {
  if (typeof window === "undefined") return loadUsageHistory()
  const history = loadUsageHistory()
  history.push(record)
  const trimmed = history.slice(-MAX_RECORDS)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // storage full or unavailable; ignore
  }
  return trimmed
}

export function clearUsageHistory(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}

export function buildSessionSummary(
  records: AnalysisUsage[]
): UsageSessionSummary {
  if (records.length === 0) {
    return {
      totalAnalyses: 0,
      totalTokens: 0,
      totalPromptTokens: 0,
      totalCandidateTokens: 0,
      avgTokensPerCv: 0,
      heaviest: null,
      lightest: null,
      records: [],
    }
  }

  const totalTokens = records.reduce((s, r) => s + r.totalTokenCount, 0)
  const totalPromptTokens = records.reduce(
    (s, r) => s + r.promptTokenCount,
    0
  )
  const totalCandidateTokens = records.reduce(
    (s, r) => s + r.candidatesTokenCount,
    0
  )

  const sortedByTokens = [...records].sort(
    (a, b) => b.totalTokenCount - a.totalTokenCount
  )
  const heaviest = sortedByTokens[0]
  const lightest = sortedByTokens[sortedByTokens.length - 1]

  return {
    totalAnalyses: records.length,
    totalTokens,
    totalPromptTokens,
    totalCandidateTokens,
    avgTokensPerCv: Math.round(totalTokens / records.length),
    heaviest: {
      fileName: heaviest.fileName,
      totalTokenCount: heaviest.totalTokenCount,
    },
    lightest: {
      fileName: lightest.fileName,
      totalTokenCount: lightest.totalTokenCount,
    },
    records,
  }
}

export function makeUsageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
