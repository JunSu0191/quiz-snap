import fs from 'fs'
import path from 'path'

const LOG_DIR = path.resolve(process.cwd(), 'logs')

function today() {
  return new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
}

function timestamp() {
  return new Date().toISOString()
}

function write(level: string, message: string, data?: unknown) {
  const line = JSON.stringify({
    ts: timestamp(),
    level,
    message,
    ...(data !== undefined ? { data } : {}),
  })
  console[level === 'error' ? 'error' : 'log'](`[${level.toUpperCase()}] ${message}`, data ?? '')
  const logPath = path.join(LOG_DIR, `${today()}.log`)
  fs.appendFileSync(logPath, line + '\n', 'utf8')
}

export const logger = {
  info: (message: string, data?: unknown) => write('info', message, data),
  warn: (message: string, data?: unknown) => write('warn', message, data),
  error: (message: string, data?: unknown) => write('error', message, data),
}
