import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import AppLayout from './layout/AppLayout'
import HomePage from './pages/HomePage'
import ClarifyPage from './pages/ClarifyPage'
import WorkspacePage from './pages/WorkspacePage'
import ReportPage from './pages/ReportPage'
import GraphPage from './pages/GraphPage'
import TracePage from './pages/TracePage'
import ExpertsPage from './pages/ExpertsPage'
import ExpertDetailPage from './pages/ExpertDetailPage'
import LibraryPage from './pages/LibraryPage'
import DashboardPage from './pages/DashboardPage'
import KnowledgePage from './pages/KnowledgePage'
import { useExpertStore } from './store/expertStore'

export default function App() {
  const load = useExpertStore((s) => s.load)
  useEffect(() => {
    load()
  }, [load])

  return (
    <BrowserRouter>
      <Routes>
        {/* 带侧边栏框架的页面 */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/experts" element={<ExpertsPage />} />
          <Route path="/experts/:id" element={<ExpertDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* 全屏沉浸页：澄清 / 工作台 / 报告 / 图谱 */}
        <Route path="/clarify/:taskId" element={<ClarifyPage />} />
        <Route path="/workspace/:taskId" element={<WorkspacePage />} />
        <Route path="/report/:reportId" element={<ReportPage />} />
        <Route path="/graph/:reportId" element={<GraphPage />} />
        <Route path="/trace/:reportId" element={<TracePage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
