export type ProcessingStage =
  | "extracting"
  | "evaluating"
  | "done"
  | "error"

export interface ProcessingStatus {
  stage: ProcessingStage
  progress: number
  message: string
}

export interface PersonalInfo {
  full_name: string
  email: string
  phone: string
  location: string
  linkedin: string
  other: string
}

export interface WorkExperience {
  company: string
  position: string
  duration: string
  description: string
  achievements: string[]
}

export interface Education {
  institution: string
  degree: string
  field: string
  year: string
}

export interface ATSAnalysis {
  compatibility_score: number
  missing_keywords: string[]
  red_flags: string[]
  summary: string
}

export interface ATSOptimization {
  section: string
  original: string
  suggestion: string
  explanation: string
}

export interface DimensionScores {
  skills: number
  experience: number
  education: number
  structure: number
}

export type SectionStatus = "ok" | "improve" | "critical"

export interface SectionAnalysis {
  id: string
  title: string
  status: SectionStatus
  score: number
  detected: string
  strengths: string[]
  issues: string[]
  instructions: string[]
}

export interface CVEvaluation {
  overall_score: number
  dimension_scores: DimensionScores
  personal_info: PersonalInfo
  skills: string[]
  work_experience: WorkExperience[]
  education: Education[]
  suggestions: string[]
  professional_summary: string
  ats_analysis: ATSAnalysis
  ats_optimizations: ATSOptimization[]
  sections: SectionAnalysis[]
}

export interface GeminiUsage {
  promptTokenCount: number
  candidatesTokenCount: number
  totalTokenCount: number
  modelVersion: string
  responseId: string
}

export interface AnalysisUsage {
  id: string
  fileName: string
  timestamp: string
  promptTokenCount: number
  candidatesTokenCount: number
  totalTokenCount: number
  countedPromptTokens: number
  model: string
  charCount: number
  durationMs: number
  overallScore: number
}

export interface UsageSessionSummary {
  totalAnalyses: number
  totalTokens: number
  totalPromptTokens: number
  totalCandidateTokens: number
  avgTokensPerCv: number
  heaviest: { fileName: string; totalTokenCount: number } | null
  lightest: { fileName: string; totalTokenCount: number } | null
  records: AnalysisUsage[]
}
