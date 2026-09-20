/* Cookie 全局类型定义 —— 前后端契约 */

export type ExpertLevel = 'L1' | 'L2' | 'L3'
export type ExpertGroup = 'decision' | 'strategy' | 'industry' | 'function'
export type ExpertStatus = 'idle' | 'working' | 'done' | 'rework'

export interface Expert {
  id: string
  level: ExpertLevel
  group: ExpertGroup
  name: string
  nickname: string
  role_title: string
  one_liner: string
  skills: string[]
  knowledge_base: string
  knowledge_tags: string[]
  avatar: string
  badge_color: string
  domain_icon: string
  gender: 'male' | 'female'
  status: ExpertStatus
  stats: { missions: number; avg_evidence: number }
}

/* 任务创建返回 */
export interface ClarifyQuestion {
  id: string
  question: string
  hint?: string
  type: 'single' | 'multi' | 'text' | 'slider'
  options?: string[]
}
export interface CreateTaskResp {
  taskId: string
  needClarify: boolean
  clarifyQuestions?: ClarifyQuestion[]
}

/* SSE 事件 */
export type SSEEventType =
  | 'node_update'
  | 'thought'
  | 'message'
  | 'evidence'
  | 'chart'
  | 'image'
  | 'progress'
  | 'trace'
  | 'report_ready'
  | 'done'
  | 'error'

/* 可观测性 Trace Span */
export interface TraceSpan {
  span_id: string
  seq: number
  agent_id: string
  stage: string
  purpose: string
  model: string
  prompt: string
  response: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  latency_ms: number
  decision?: string
  evidence_ids?: string[]
  ts: string
}

export interface DAGNode {
  id: string
  label: string
  status: ExpertStatus
  expert?: string // expert id
}

export type ThoughtKind = 'plan' | 'dispatch' | 'action' | 'finding' | 'reflect'

export interface ThoughtItem {
  id: string
  kind: ThoughtKind
  expert?: string
  text: string
  ts: number
}

export interface Evidence {
  evidence_id: string
  source_url: string
  source_type: string
  title: string
  excerpt: string
  screenshot_path?: string
  image_urls?: string[]
  captured_at: string
  credibility: number
  collected_by: string
  brand?: string
  domain?: string
  freshness_days?: number | null
}

export interface Claim {
  claim_id: string
  text: string
  field: string
  evidence_ids: string[]
  confidence: 'high' | 'medium' | 'low' | 'unverified'
  cross_validated: boolean
  author: string
}

export interface ChartSpec {
  chart_id: string
  type: string
  title?: string
  option: Record<string, unknown>
  png?: string
  evidence_ids?: string[]
}

export interface ProgressInfo {
  percent: number
  evidence_count: number
  token_used: number
  stage: string
}

/* 数据空间（CSV 表格） */
export interface DataGrid {
  columns: string[]
  rows: {
    name: string
    value: string | number
    metric: string
    source: string
    source_url: string
    evidence_id?: string
  }[]
}

/* 结构化竞品知识 */
export interface StructuredBlock {
  type: 'feature_tree' | 'pricing_model' | 'user_persona'
  data: Record<string, unknown>[]
}

/* 报告 */
export interface ReportSection {
  id: string
  title: string
  level: number
  key_takeaway?: string
  highlights?: string[]
  paragraphs?: string[]
  claims?: Claim[]
  charts?: ChartSpec[]
  source_evidence_ids?: string[]
  structured?: StructuredBlock | null
  data_grid?: DataGrid | null
  refined?: boolean
}

/* 量化指标 */
export interface ReportMetrics {
  efficiency?: Record<string, unknown>
  coverage?: Record<string, unknown>
  consistency?: Record<string, unknown>
  business?: Record<string, unknown>
}

export interface SentimentResult {
  overall: { pos: number; neu: number; neg: number }
  overall_count?: { pos: number; neu: number; neg: number }
  by_platform: Record<string, { pos: number; neu: number; neg: number }>
  timeline: { date: string; pos: number; neu: number; neg: number }[]
  camps: { title: string; ratio: number; summary: string; quotes: { text: string; url: string; platform?: string }[] }[]
  voices?: { platform: string; platform_label: string; text: string; sentiment: string; url: string; title?: string }[]
  highlights?: { phrase: string; platform: string; platform_label: string; sentiment: string; url: string }[]
  sample_size: number
}

export interface Report {
  id: string
  title: string
  subtitle: string
  query?: string
  brands?: string[]
  mode?: string
  created_at: string
  experts: string[]
  dispatch?: { id: string; reason: string }[]
  cover_image?: string
  toc: { id: string; title: string; level: number }[]
  sections: ReportSection[]
  charts: ChartSpec[]
  evidence: Evidence[]
  claims: Claim[]
  sentiment?: SentimentResult
  glossary: { term: string; definition: string; source?: string }[]
  figures?: ReportFigure[]
  structured?: Record<string, Record<string, unknown>[]>
  metrics?: ReportMetrics
  quality_before?: Record<string, unknown>
  quality_after?: Record<string, unknown>
  audit_review?: AuditReview
  trace?: TraceSpan[]
}

export interface AuditOpinion {
  verdict?: string
  scores?: Record<string, number>
  review?: string
  issues?: string[]
  suggestions?: string[]
}

export interface AuditReview {
  before?: AuditOpinion
  after?: AuditOpinion
  rework_rounds?: number
  issues_resolved?: number
}

export interface ReportFigure {
  src: string
  alt?: string
  title?: string
  source_url: string
  domain?: string
  source_type?: string
  brand?: string
  evidence_id?: string
}

/* 报告卡片（历史列表，不含全文） */
export interface ReportCard {
  id: string
  report_id: string
  title: string
  subtitle: string
  query: string
  brands: string[]
  experts: string[]
  cover_image?: string
  evidence_count: number
  claim_count: number
  high_conf_count: number
  created_at: string
}

/* 仪表盘真实统计 */
export interface ResearchCard {
  id: string
  title: string
  query: string
  brands: string[]
  evidence_count: number
  claim_count: number
  high_conf_count: number
  created_at: string
  efficiency_multiple?: number | null
  coverage_multiple?: number | null
  elapsed_minutes?: number | null
  minutes_saved?: number | null
  tokens_used?: number | null
}

export interface DashboardStats {
  reports: number
  evidence_total: number
  claim_total: number
  high_conf_total: number
  avg_evidence_per_report: number
  fact_accuracy: number
  platform_distribution: Record<string, number>
  brand_distribution: Record<string, number>
  // 业务闭环聚合（真实，来自各报告 metrics）
  minutes_saved?: number
  avg_efficiency?: number
  avg_coverage?: number
  total_tokens?: number
  research_cards?: ResearchCard[]
}

/* 全局证据溯源库 */
export interface EvidenceRecord {
  evidence_id: string
  report_id: string
  source_url: string
  source_type: string
  domain: string
  title: string
  excerpt: string
  credibility: number
  collected_by: string
  brand: string
  captured_at: string
}
export interface EvidenceFacets {
  total: number
  by_type: Record<string, number>
  by_brand: Record<string, number>
}
export interface EvidenceQueryResp {
  items: EvidenceRecord[]
  facets: EvidenceFacets
}

/* 竞品监控订阅 */
export interface Subscription {
  sub_id: string
  query: string
  brands: string[]
  created_at: string
  last_run_at: string
  last_report_id: string
  run_count: number
}

/* 专家工作量 */
export interface ExpertWorkload {
  id: string
  name: string
  title: string
  layer: string
  avatar: string
  missions: number
  claims_authored: number
  evidence_collected: number
  last_active: string
}
