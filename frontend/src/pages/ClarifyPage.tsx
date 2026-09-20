import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sprout, ArrowRight, SkipForward } from 'lucide-react'
import type { ClarifyQuestion } from '../types'
import { submitClarify } from '../lib/api'
import { VSunGlow } from '../components/ui'
import { fadeUp, stagger } from '../lib/motion'

interface NavState {
  query?: string
  clarify?: ClarifyQuestion[]
}

export default function ClarifyPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation() as { state: NavState | null }
  const query = state?.query ?? ''
  const questions = state?.clarify ?? []
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  // 用户自定义补充的竞品（按题 id 存，目前主要用于 competitors 题）
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})

  // 无澄清问题（如直接刷新进入）：直接进工作台
  if (!taskId || questions.length === 0) {
    navigate(`/workspace/${taskId}`, { replace: true, state: { query } })
    return null
  }

  function setSingle(qid: string, val: string) {
    setAnswers((a) => ({ ...a, [qid]: val }))
  }
  function toggleMulti(qid: string, val: string) {
    setAnswers((a) => {
      const cur = (a[qid] as string[]) ?? []
      return {
        ...a,
        [qid]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val],
      }
    })
  }
  // 添加自定义选项（如用户自己想调研的竞品），加入已选集合并成为可见 chip
  function addCustom(qid: string) {
    const raw = (customInputs[qid] ?? '').trim()
    if (!raw) return
    // 支持一次输入多个，用逗号/顿号/空格分隔
    const items = raw.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean)
    setAnswers((a) => {
      const cur = (a[qid] as string[]) ?? []
      const merged = [...cur]
      for (const it of items) if (!merged.includes(it)) merged.push(it)
      return { ...a, [qid]: merged }
    })
    setCustomInputs((c) => ({ ...c, [qid]: '' }))
  }

  async function go() {
    if (submitting || !taskId) return
    setSubmitting(true)
    try {
      await submitClarify(taskId, answers)
    } finally {
      navigate(`/workspace/${taskId}`, { state: { query } })
    }
  }

  return (
    <div className="relative min-h-screen overflow-y-auto bg-bg">
      <VSunGlow className="opacity-40" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[680px] flex-col justify-center px-6 py-16">
        <motion.div variants={fadeUp} initial="initial" animate="animate" className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-btn bg-primary-tint text-primary">
            <Sprout size={22} strokeWidth={1.8} />
          </span>
          <div>
            <div className="text-h3 text-ink">在开始前，请确认几个关键点</div>
            <div className="text-aux text-ink-2">这能帮助专家队更精准地锁定调研范围</div>
          </div>
        </motion.div>

        {query && (
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="mt-5 rounded-card border border-line/60 bg-card p-4 text-aux text-ink-2 shadow-card"
          >
            <span className="text-tag text-ink-3">你的需求</span>
            <p className="mt-1 text-body text-ink">{query}</p>
          </motion.div>
        )}

        <motion.div variants={stagger} initial="initial" animate="animate" className="mt-6 flex flex-col gap-5">
          {questions.map((q) => (
            <motion.div key={q.id} variants={fadeUp} className="rounded-card border border-line/60 bg-card p-5 shadow-card">
              <p className="text-body font-medium text-ink">{q.question}</p>
              {q.hint && <p className="mt-1 text-tag text-ink-3">{q.hint}</p>}

              {q.type === 'text' ? (
                <textarea
                  rows={2}
                  value={(answers[q.id] as string) ?? ''}
                  onChange={(e) => setSingle(q.id, e.target.value)}
                  placeholder="选填，可补充背景信息"
                  className="mt-3 w-full resize-none rounded-btn border border-line bg-bg px-3 py-2 text-aux text-ink outline-none transition-colors focus:border-primary"
                />
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {/* 预置选项 + 用户自定义新增的选项一起渲染为可勾选 chip */}
                  {Array.from(new Set([
                    ...(q.options ?? []),
                    ...(q.type === 'multi' ? ((answers[q.id] as string[]) ?? []) : []),
                  ])).map((opt) => {
                    const selected =
                      q.type === 'multi'
                        ? ((answers[q.id] as string[]) ?? []).includes(opt)
                        : answers[q.id] === opt
                    return (
                      <button
                        key={opt}
                        onClick={() =>
                          q.type === 'multi' ? toggleMulti(q.id, opt) : setSingle(q.id, opt)
                        }
                        className={`rounded-chip px-4 h-9 text-aux font-medium transition-all ${
                          selected
                            ? 'bg-primary text-white shadow-card'
                            : 'bg-primary-tint text-primary-deep hover:bg-primary-soft/40'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* 竞品题：允许用户自行补充想调研的竞品 */}
              {q.id === 'competitors' && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={customInputs[q.id] ?? ''}
                    onChange={(e) => setCustomInputs((c) => ({ ...c, [q.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(q.id) } }}
                    placeholder="补充其他想调研的竞品，回车添加（可用逗号分隔多个）"
                    className="h-9 flex-1 rounded-btn border border-line bg-bg px-3 text-aux text-ink outline-none transition-colors focus:border-primary"
                  />
                  <button
                    onClick={() => addCustom(q.id)}
                    className="shrink-0 rounded-btn bg-primary px-4 h-9 text-aux font-medium text-white hover:bg-primary-deep"
                  >
                    添加
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-7 flex items-center justify-between">
          <button
            onClick={go}
            className="inline-flex items-center gap-1.5 text-aux text-ink-3 transition-colors hover:text-ink-2"
          >
            <SkipForward size={15} /> 跳过，直接开始
          </button>
          <button
            onClick={go}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-btn bg-primary px-6 h-12 font-medium text-white shadow-card transition-all hover:bg-primary-deep hover:shadow-float active:scale-95 disabled:opacity-50"
          >
            {submitting ? '正在派遣专家队…' : '启动调研'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
