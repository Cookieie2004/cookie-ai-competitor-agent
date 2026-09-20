import type { ReactNode, ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'

/* ── 卡片 VCard ─────────────────────────────────────────── */
export function VCard({
  children,
  className = '',
  hover = true,
  ...rest
}: { children: ReactNode; className?: string; hover?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-card rounded-card shadow-card p-6 border border-line/60 transition-all duration-300 ease-cookie ${
        hover ? 'hover:shadow-float hover:-translate-y-0.5' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

/* ── 按钮 VButton ───────────────────────────────────────── */
export function VButton({
  children,
  variant = 'primary',
  className = '',
  ...p
}: {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'soft'
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'inline-flex items-center justify-center gap-2 px-5 h-11 rounded-btn font-medium text-sm transition-all duration-200 ease-cookie active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
  const styles =
    variant === 'primary'
      ? 'bg-primary text-white hover:bg-primary-deep shadow-card hover:shadow-float'
      : variant === 'soft'
        ? 'bg-primary-tint text-primary-deep hover:bg-primary-soft/40'
        : 'bg-transparent text-ink-2 hover:bg-primary-tint hover:text-primary-deep'
  return (
    <button className={`${base} ${styles} ${className}`} {...p}>
      {children}
    </button>
  )
}

/* ── Chip / 置信度标签 VChip ────────────────────────────── */
const tone = {
  high: 'bg-ok/15 text-ok',
  medium: 'bg-warn/15 text-warn',
  low: 'bg-risk/15 text-risk',
  unverified: 'bg-ink-3/15 text-ink-3',
  neutral: 'bg-primary-tint text-primary-deep',
} as const

export function VChip({
  label,
  level = 'neutral',
  icon,
  className = '',
}: {
  label: ReactNode
  level?: keyof typeof tone
  icon?: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 h-7 rounded-chip text-xs font-medium ${tone[level]} ${className}`}
    >
      {icon}
      {label}
    </span>
  )
}

/* ── 柔光晕 VSunGlow（春日阳光氛围） ────────────────────── */
export function VSunGlow({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute -z-0 ${className}`}
      style={{
        width: 520,
        height: 520,
        top: -160,
        right: -120,
        background: 'radial-gradient(circle, #F4E2B8 0%, rgba(244,226,184,0) 70%)',
        opacity: 0.5,
        filter: 'blur(8px)',
      }}
    />
  )
}

/* ── 数字滚动 VCountUp（Agent 感关键） ──────────────────── */
export function VCountUp({ value, className = '' }: { value: number; className?: string }) {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, (v) => Math.round(v))
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.8, ease: 'easeOut' })
    return () => c.stop()
  }, [value, mv])
  return <motion.span className={className}>{rounded}</motion.span>
}

/* ── 骨架占位 VSkeleton（降级用，绝不白屏） ─────────────── */
export function VSkeleton({ className = '' }: { className?: string }) {
  return <div className={`v-skeleton ${className}`} />
}
