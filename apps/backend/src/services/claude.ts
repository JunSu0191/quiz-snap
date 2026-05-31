import Anthropic from '@anthropic-ai/sdk'
import { logger } from '../lib/logger.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface GenerateParams {
  subject: string
  grade: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
  questionTypes: string[]
}

export interface GeneratedQuestion {
  id: number
  type: '객관식' | '주관식' | '서술형'
  question: string
  options: string[] | null
  answer: string
  explanation: string
}

export interface GeneratedWorksheet {
  title: string
  subject: string
  grade: string
  questions: GeneratedQuestion[]
}

const DIFFICULTY_MAP = { easy: '쉬움', medium: '보통', hard: '어려움' } as const

const DEV_SUBJECTS = [
  'CS 기초', '자료구조', '알고리즘', '운영체제', '네트워크',
  '데이터베이스', '정보처리기사', '웹 개발', '소프트웨어공학',
]

function buildSystemPrompt(subject: string): string {
  if (DEV_SUBJECTS.includes(subject)) {
    return `당신은 소프트웨어 엔지니어링과 CS 이론에 정통한 IT 교육 전문가입니다.
정보처리기사, 기사 자격증, 취업 면접, CS 심화 학습을 위한 실전 문제를 출제합니다.

규칙:
- 응답은 반드시 순수 JSON 객체만 출력하세요. 설명, 인사말, 마크다운 없이 { 로 시작해서 } 로 끝나야 합니다.
- 실무·시험에서 출제되는 핵심 개념 위주로 문제를 구성하세요.
- 객관식은 options 배열(4개)을 반드시 포함하세요.
- 주관식/서술형은 options를 null로 설정하세요.
- answer는 정확한 정답을 간결하게 작성하세요.
- explanation은 개념 원리와 실무 맥락을 포함해 2~3문장으로 설명하세요.`
  }

  return `당신은 대한민국 초중고 교육과정에 정통한 교육 전문가입니다.
주어진 조건에 맞는 학습 문제지를 생성합니다.

규칙:
- 반드시 유효한 JSON만 출력하세요. 다른 텍스트 없이.
- 문제는 해당 학년 수준에 맞게 출제하세요.
- 객관식은 options 배열(4개)을 반드시 포함하세요.
- 주관식/서술형은 options를 null로 설정하세요.
- answer는 정확한 정답을 간결하게 작성하세요.
- explanation은 풀이 과정을 2~3문장으로 설명하세요.`
}

export async function generateWorksheet(params: GenerateParams): Promise<GeneratedWorksheet> {
  const { subject, grade, topic, difficulty, questionCount, questionTypes } = params

  const systemPrompt = buildSystemPrompt(subject)

  const userPrompt = `다음 조건으로 문제지를 생성해주세요:
- 과목: ${subject}
- 학년: ${grade}
- 단원/주제: ${topic}
- 난이도: ${DIFFICULTY_MAP[difficulty]}
- 문항 수: ${questionCount}개
- 문제 유형: ${questionTypes.join(', ')}

아래 JSON 형식으로만 응답하세요:
{
  "title": "문제지 제목",
  "subject": "${subject}",
  "grade": "${grade}",
  "questions": [
    {
      "id": 1,
      "type": "객관식",
      "question": "문제 내용",
      "options": ["① 보기1", "② 보기2", "③ 보기3", "④ 보기4"],
      "answer": "① 보기1",
      "explanation": "풀이 설명"
    }
  ]
}`

  // 문항 수 × 난이도에 따라 토큰 여유 확보 (최소 8192, 최대 16000)
  const maxTokens = Math.min(Math.max(questionCount * 400, 8192), 16000)

  logger.info('Claude API 호출', { subject, grade, topic, questionCount, maxTokens })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  // 1순위: 마크다운 코드블록 안 JSON
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as GeneratedWorksheet
    } catch { /* fallthrough */ }
  }

  // 2순위: 첫 { 부터 마지막 } 까지 추출 (앞뒤 설명 텍스트 무시)
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1)) as GeneratedWorksheet
    } catch { /* fallthrough */ }
  }

  logger.error('Claude 응답 파싱 실패', { preview: text.slice(0, 800), stopReason: message.stop_reason })
  throw new Error('Claude API 응답을 파싱할 수 없습니다.')
}
