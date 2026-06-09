export interface ATSAnalysis {
  compatibility_score: number
  missing_keywords: string[]
  red_flags: string[]
  summary: string
}

export interface ResumeRewrite {
  optimized_resume: string
}

export interface FinalATSAudit {
  ignored_sections: string[]
  improvements: string[]
  final_resume: string
}

export interface OptimizationResult {
  initial_analysis: ATSAnalysis
  optimized_resume: string
  final_audit: FinalATSAudit
  final_analysis: ATSAnalysis
}

export interface ComparisonData {
  initial_score: number
  final_score: number
  improvement: number
  keywords_added: number
  red_flags_corrected: number
}

export type ProcessingStage =
  | "extracting"
  | "analyzing"
  | "rewriting"
  | "auditing"
  | "generating"
  | "calculating"
  | "done"
  | "error"

export interface ProcessingStatus {
  stage: ProcessingStage
  progress: number
  message: string
}

export interface ParsedResume {
  name: string
  contact: string
  summary: string
  experience: string
  education: string
  certifications: string
  skills: string
  raw_text: string
}
