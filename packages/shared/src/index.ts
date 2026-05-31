// ────────────────────────────────────────────────
// 공통 API 응답 래퍼
// ────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  error?: string
}

// ────────────────────────────────────────────────
// 문제지 도메인 타입
// ────────────────────────────────────────────────

export type QuestionType = 'multiple-choice' | 'short-answer' | 'essay'

export interface Question {
  id: string
  type: QuestionType
  content: string
  answer?: string
  options?: string[]        // multiple-choice 전용
  points: number
}

export interface Worksheet {
  id: string
  title: string
  subject: string
  grade: string
  topic: string
  questions: Question[]
  createdAt: string
}

// ────────────────────────────────────────────────
// API 요청 / 응답 타입
// ────────────────────────────────────────────────

export interface GenerateWorksheetRequest {
  subject: string
  grade: string
  topic: string
  questionCount: number
  questionTypes: QuestionType[]
}

export type GenerateWorksheetResponse = ApiResponse<Worksheet>

export type GetWorksheetsResponse = ApiResponse<Worksheet[]>

export type GetWorksheetResponse = ApiResponse<Worksheet>
