import { api } from '../lib/axios'
import type { ApiResponse } from '../types/api'

export interface GeneratePayload {
  subject: string
  grade: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
  questionTypes: string[]
}

export type WorksheetStatus = 'pending' | 'done' | 'failed'

export interface WorksheetSummary {
  id: string
  title: string
  subject: string
  grade: string
  topic: string
  difficulty: string
  question_count: number
  status: WorksheetStatus
  progress: number
  created_at: string
}

export interface WorksheetDetail extends WorksheetSummary {
  content: {
    title: string
    subject: string
    grade: string
    questions: {
      id: number
      type: string
      question: string
      options: string[] | null
      answer: string
      explanation: string
    }[]
  }
}

export interface UsageInfo {
  plan: string
  used: number
  limit: number | null
  remaining: number | null
  yearMonth: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export async function generateWorksheet(body: GeneratePayload): Promise<WorksheetDetail> {
  const res = await api.post<ApiResponse<WorksheetDetail>>('/api/worksheets/generate', body)
  return (res.data as { data: WorksheetDetail }).data
}

export async function fetchWorksheets(page = 1, limit = 10): Promise<PaginatedResponse<WorksheetSummary>> {
  const res = await api.get<PaginatedResponse<WorksheetSummary>>(
    `/api/worksheets?page=${page}&limit=${limit}`
  )
  return res.data
}

export async function fetchWorksheet(id: string): Promise<WorksheetDetail> {
  const res = await api.get<ApiResponse<WorksheetDetail>>(`/api/worksheets/${id}`)
  return (res.data as { data: WorksheetDetail }).data
}

export async function fetchUsage(): Promise<UsageInfo> {
  const res = await api.get<ApiResponse<UsageInfo>>('/api/worksheets/usage/current')
  return (res.data as { data: UsageInfo }).data
}

export async function retryWorksheet(id: string): Promise<void> {
  await api.post(`/api/worksheets/${id}/retry`)
}
