import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Plus, Clock, Network, ShieldCheck } from 'lucide-react'
import { fetchReports } from '../lib/api'
import type { ReportCard } from '../types'
import { fadeUp, stagger } from '../lib/motion'

export default function LibraryPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<ReportCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
      .then(setReports)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-content px-8 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-h1 text-ink">我的调研</h1>
          <p className="mt-1 text-aux text-ink-2">所有已完成的竞品分析报告 · 结论可溯源、证据可沉淀</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-btn bg-primary px-5 h-11 font-medium text-white shadow-card transition-all hover:bg-primary-deep hover:shadow-float"
        >
          <Plus size={18} /> 发起新调研
        </button>
      </header>

      {loading ? (
        <div className="mt-16 text-center text-aux text-ink-3">正在加载历史调研……</div>
      ) : reports.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-4 text-center">
          <img
            src="/assets/brand/empty-state.png"
            alt="empty"
            className="h-40 w-40 object-contain opacity-90"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
          <div>
            <div className="text-h3 text-ink">还没有调研记录</div>
            <p className="mt-1 text-aux text-ink-2">发起你的第一次竞品分析，48 位专家即刻就位</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-btn bg-primary px-6 h-11 font-medium text-white shadow-card hover:bg-primary-deep"
          >
            <Plus size={18} /> 开始调研
          </button>
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {reports.map((r) => (
            <motion.button
              key={r.id}
              variants={fadeUp}
              onClick={() => navigate(`/report/${r.id}`)}
              className="group flex flex-col overflow-hidden rounded-card border border-line/60 bg-card text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-float"
            >
              <div className="relative h-32 overflow-hidden">
                <img
                  src={r.cover_image ?? '/assets/brand/report-cover.png'}
                  alt={r.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="line-clamp-2 text-aux font-semibold text-ink">{r.title}</div>
                <p className="mt-1 line-clamp-1 text-tag text-ink-3">{r.subtitle}</p>
                <div className="mt-auto flex items-center gap-3 pt-3 text-tag text-ink-3">
                  <span className="inline-flex items-center gap-1"><Clock size={12} /> {r.created_at}</span>
                  <span className="inline-flex items-center gap-1"><FileText size={12} /> {r.evidence_count} 证据</span>
                  <span className="inline-flex items-center gap-1 text-primary-deep">
                    <ShieldCheck size={12} /> {r.high_conf_count} 高置信
                  </span>
                  <span
                    className="ml-auto inline-flex items-center gap-1 text-primary-deep"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/graph/${r.id}`)
                    }}
                  >
                    <Network size={12} /> 图谱
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  )
}
