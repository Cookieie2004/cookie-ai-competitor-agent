import { useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import type { HighlightColor } from '../store/annotationStore'

export interface InlineHighlight {
  text: string
  color: HighlightColor
  comment?: string
}

const MARK_CLS: Record<HighlightColor, string> = {
  sun: 'bg-sun/70',
  ok: 'bg-ok/40',
  risk: 'bg-risk/40',
  info: 'bg-info/40',
}

/** 把正文按已保存的高亮切片，命中片段套 <mark> 持久着色（支持批注 title 悬浮）。 */
function renderWithHighlights(value: string, highlights: InlineHighlight[]) {
  const hits: { start: number; end: number; color: HighlightColor; comment?: string }[] = []
  for (const h of highlights) {
    const needle = (h.text || '').trim()
    if (needle.length < 2) continue
    let from = 0
    // 同一高亮文本可能出现多次，全部命中
    while (from <= value.length) {
      const idx = value.indexOf(needle, from)
      if (idx === -1) break
      hits.push({ start: idx, end: idx + needle.length, color: h.color, comment: h.comment })
      from = idx + needle.length
    }
  }
  if (hits.length === 0) return value
  // 按起点排序并丢弃重叠（保留先到的）
  hits.sort((a, b) => a.start - b.start || b.end - a.end)
  const merged: typeof hits = []
  let cursor = 0
  for (const h of hits) {
    if (h.start < cursor) continue
    merged.push(h)
    cursor = h.end
  }
  const out: React.ReactNode[] = []
  let pos = 0
  merged.forEach((h, i) => {
    if (h.start > pos) out.push(value.slice(pos, h.start))
    out.push(
      <mark
        key={i}
        className={`${MARK_CLS[h.color]} rounded-[2px] px-0.5 text-ink`}
        title={h.comment || undefined}
      >
        {value.slice(h.start, h.end)}
      </mark>,
    )
    pos = h.end
  })
  if (pos < value.length) out.push(value.slice(pos))
  return out
}

/* 飞书式可编辑文本块：编辑模式下双击/点击进入编辑，失焦或回车保存。 */
export function VEditableBlock({
  value,
  editable,
  onSave,
  className = '',
  as = 'p',
  highlights,
}: {
  value: string
  editable: boolean
  onSave: (text: string) => void
  className?: string
  as?: 'p' | 'div'
  highlights?: InlineHighlight[]
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [editing])

  function commit() {
    setEditing(false)
    if (draft.trim() !== value.trim()) onSave(draft.trim())
  }
  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="relative">
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit()
            if (e.key === 'Escape') cancel()
          }}
          className="w-full resize-none rounded-card border border-primary/40 bg-primary-tint/20 p-3 text-body leading-relaxed text-ink outline-none focus:border-primary"
        />
        <div className="mt-1.5 flex items-center gap-2">
          <button
            onClick={commit}
            className="inline-flex items-center gap-1 rounded-btn bg-primary px-2.5 h-7 text-tag font-medium text-white hover:bg-primary-deep"
          >
            <Check size={12} /> 保存
          </button>
          <button
            onClick={cancel}
            className="inline-flex items-center gap-1 rounded-btn bg-line/60 px-2.5 h-7 text-tag font-medium text-ink-2 hover:bg-line"
          >
            <X size={12} /> 取消
          </button>
          <span className="text-tag text-ink-3">⌘/Ctrl + Enter 保存 · Esc 取消</span>
        </div>
      </div>
    )
  }

  const Tag = as
  const content =
    highlights && highlights.length > 0 ? renderWithHighlights(value, highlights) : value
  return (
    <Tag
      className={`${className} ${
        editable ? 'cursor-text rounded transition-colors hover:bg-primary-tint/30' : ''
      }`}
      onDoubleClick={() => editable && setEditing(true)}
      title={editable ? '双击编辑' : undefined}
    >
      {content}
    </Tag>
  )
}
