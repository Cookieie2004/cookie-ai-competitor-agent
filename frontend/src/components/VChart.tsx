import ReactECharts from 'echarts-for-react'
import type { ChartSpec } from '../types'

/** ECharts 包装：统一莫兰迪背景与卡片样式，option 由后端下发。 */
export function VChart({
  spec,
  height = 280,
  onCite,
}: {
  spec: ChartSpec
  height?: number
  onCite?: (ids: string[]) => void
}) {
  const ids = spec.evidence_ids ?? []
  return (
    <div className="rounded-card border border-line/60 bg-card p-4 shadow-card">
      {spec.title && (
        <div className="mb-2 text-aux font-semibold text-ink">{spec.title}</div>
      )}
      <ReactECharts
        option={spec.option}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'svg' }}
        notMerge
      />
      {ids.length > 0 && (
        <button
          onClick={() => onCite?.(ids)}
          className="mt-2 inline-flex items-center gap-1 text-tag text-primary-deep hover:underline"
          title="跳转到支撑该图表的证据"
        >
          数据来源：{ids.length} 条证据 →
        </button>
      )}
    </div>
  )
}
