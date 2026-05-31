import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGenerateWorksheet } from '../hooks/useWorksheets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const SUBJECT_CATEGORIES = [
  {
    label: '학교 과목',
    subjects: ['수학', '영어', '국어', '과학', '사회', '역사', '도덕', '체육', '음악', '미술'],
  },
  {
    label: '개발 / IT',
    subjects: ['CS 기초', '자료구조', '알고리즘', '운영체제', '네트워크', '데이터베이스', '정보처리기사', '웹 개발', '소프트웨어공학'],
  },
]
const DEV_SUBJECTS = SUBJECT_CATEGORIES[1].subjects
const GRADES = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3']
const QUESTION_TYPE_OPTIONS = ['객관식', '주관식', '서술형']
const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '쉬움' },
  { value: 'medium', label: '보통' },
  { value: 'hard', label: '어려움' },
] as const

export function Generate() {
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useGenerateWorksheet()

  const [form, setForm] = useState({
    subject: '수학',
    grade: '중1',
    topic: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    questionCount: 10,
    questionTypes: ['객관식'] as string[],
  })

  const isDevSubject = DEV_SUBJECTS.includes(form.subject)

  const toggleType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type)
        ? prev.questionTypes.filter((t) => t !== type)
        : [...prev.questionTypes, type],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.questionTypes.length === 0) return
    // 즉시 응답 (pending 상태) → 바로 상세 페이지로 이동
    const ws = await mutateAsync(form)
    if (ws?.id) navigate(`/worksheets/${ws.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">문제지 생성</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI가 과목과 학년에 맞는 맞춤형 문제지를 생성합니다. 생성 후에도 다른 작업을 계속할 수 있어요.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">기본 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 과목 */}
            <div className="space-y-3">
              <Label>과목</Label>
              {SUBJECT_CATEGORIES.map((cat) => (
                <div key={cat.label} className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">{cat.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subjects.map((s) => (
                      <Badge
                        key={s}
                        variant={form.subject === s ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            subject: s,
                            grade: DEV_SUBJECTS.includes(s) ? '성인/취준' : (DEV_SUBJECTS.includes(p.subject) ? '중1' : p.grade),
                          }))
                        }
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 학년 — 개발 과목 선택 시 숨김 */}
            {!isDevSubject && (
              <div className="space-y-1.5">
                <Label>학년</Label>
                <div className="flex flex-wrap gap-1.5">
                  {GRADES.map((g) => (
                    <Badge
                      key={g}
                      variant={form.grade === g ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setForm((p) => ({ ...p, grade: g }))}
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* 단원/주제 */}
            <div className="space-y-1.5">
              <Label htmlFor="topic">단원 / 주제</Label>
              <Input
                id="topic"
                required
                value={form.topic}
                onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                placeholder="예) 이차방정식, 영어 현재완료, 조선시대"
              />
            </div>

            <Separator />

            {/* 난이도 */}
            <div className="space-y-2">
              <Label>난이도</Label>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map(({ value, label }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={form.difficulty === value ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setForm((p) => ({ ...p, difficulty: value }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* 문항 수 */}
            <div className="space-y-2">
              <Label>
                문항 수{' '}
                <span className="font-normal text-muted-foreground">({form.questionCount}개)</span>
              </Label>
              <input
                type="range"
                min={5}
                max={30}
                step={5}
                value={form.questionCount}
                onChange={(e) => setForm((p) => ({ ...p, questionCount: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5개</span><span>30개</span>
              </div>
            </div>

            <Separator />

            {/* 문제 유형 */}
            <div className="space-y-2">
              <Label>문제 유형 (복수 선택 가능)</Label>
              <div className="flex gap-2">
                {QUESTION_TYPE_OPTIONS.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={form.questionTypes.includes(type) ? 'default' : 'outline'}
                    className={cn('flex-1', form.questionTypes.length === 0 && 'border-destructive')}
                    onClick={() => toggleType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
              {form.questionTypes.length === 0 && (
                <p className="text-xs text-destructive">문제 유형을 하나 이상 선택하세요.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="mt-6 w-full"
          disabled={isPending || form.questionTypes.length === 0}
        >
          {isPending ? '생성 요청 중...' : '문제지 생성하기'}
        </Button>
      </form>
    </div>
  )
}
