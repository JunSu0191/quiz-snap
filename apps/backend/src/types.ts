export type AppVariables = {
  userId: string
  userEmail: string
  accessToken: string
}

// 공통 응답 헬퍼
export function ok<T>(data: T, message?: string) {
  return { success: true as const, data, ...(message ? { message } : {}) }
}

export function fail(code: string, message: string) {
  return { success: false as const, error: { code, message } }
}
