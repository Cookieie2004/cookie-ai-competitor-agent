import { ShieldCheck, AlertTriangle, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { AuditReview, AuditOpinion } from '../types'

/** 质检审裁：展示质检官对分析产物的真实审阅——逐维度打分、问题、改进建议，
 *  以及返工前后的对比改善（对应评分维度：反馈闭环真实可触发、重做后有改善）。 */
export function VAuditReview({ review }: { review?: AuditReview }) {
  if (!review || (!review.before && !review.after)) return null
  const before = review.before
  const after = review.after
  const hasRework = (review.rework_rounds ?? 0) > 0 && after && after !== before
  // 主展示用复审结果（若有返工），否则用初审
  const main: AuditOpinion = (hasRework ? after : before) || {}
  const scoreKeys = Object.keys(main.scores ?? {})
  const verdictPass = main.verdict !== 'rework'

  function scoreColor(v: number) {
    if (v >= 80) return 'text-ok'
    if (v >= 60) return 'text-warn'
    return 'text-risk'
  }
  function barColor(v: number) {
    if (v >= 80) return 'bg-ok'
    if (v >= 60) return 'bg-warn'
    return 'bg-risk'
  }

  return (
    <div className="my-6 rounded-card border border-line bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-btn bg-primary-tint text-primary-deep">
          <ShieldCheck size={17} />
        </span>
        <div className="flex-1">
          <div className="text-aux font-semibold text-ink">质检审裁 · 质检官终审意见</div>
          <div className="text-tag text-ink-3">L3 决策层对分析产物逐维度评分、指出问题并给出可执行改进建议</div>
        </div>
        <span className={`rounded-chip px-3 py-1 text-tag font-semibold ${
          verdictPass ? 'bg-ok/15 text-ok' : 'bg-risk/15 text-risk'
        }`}>
          {verdictPass ? '✓ 达标签发' : '⟲ 触发返工'}
        </span>
      </div>

      {/* 逐维度打分 */}
      {scoreKeys.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {scoreKeys.map((k) => {
            const cur = Math.round(main.scores![k] ?? 0)
            const prev = hasRework ? Math.round((before?.scores?.[k] ?? cur)) : null
            const up = prev != null && cur > prev
            return (
              <div key={k} className="rounded-card border border-line/60 bg-bg p-3">
                <div className="flex items-center justify-between text-tag">
                  <span className="text-ink-2">{k}</span>
                  <span className="flex items-center gap-1.5">
                    {prev != null && cur !== prev && (
                      <>
                        <span className="text-ink-3 line-through">{prev}</span>
                        <ArrowRight size={11} className="text-ink-3" />
                      </>
                    )}
                    <span className={`font-bold ${scoreColor(cur)}`}>{cur}</span>
                    {up && <span className="text-ok">↑</span>}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-chip bg-line">
                  <div className={`h-full rounded-chip ${barColor(cur)} transition-all`} style={{ width: `${cur}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 总体评审意见 */}
      {main.review && (
        <p className="mt-4 rounded-card border-l-[3px] border-primary bg-primary-tint/30 p-3 text-aux leading-relaxed text-ink-2">
          {main.review}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 发现的问题 */}
        {main.issues && main.issues.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-tag font-semibold text-risk">
              <AlertTriangle size={13} /> 发现的问题（{main.issues.length}）
            </div>
            <ul className="mt-2 space-y-1.5">
              {main.issues.map((it, i) => (
                <li key={i} className="flex gap-2 text-tag leading-relaxed text-ink-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-risk" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* 改进建议 */}
        {main.suggestions && main.suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-tag font-semibold text-primary-deep">
              <Lightbulb size={13} /> 可执行改进建议（{main.suggestions.length}）
            </div>
            <ul className="mt-2 space-y-1.5">
              {main.suggestions.map((it, i) => (
                <li key={i} className="flex gap-2 text-tag leading-relaxed text-ink-2">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-ok" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 返工闭环说明 */}
      {hasRework && (
        <div className="mt-4 flex items-center gap-2 rounded-card bg-sun-soft p-3 text-tag text-ink-2">
          <ShieldCheck size={14} className="text-warn" />
          质检触发 {review.rework_rounds} 轮返工，复审后解决了 {review.issues_resolved ?? 0} 项问题 —— 真实反馈闭环，重做后输出有改善。
        </div>
      )}
    </div>
  )
}
