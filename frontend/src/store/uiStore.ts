import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebar: (v: boolean) => void
  /* 当前任务的模型选择；auto 使用后端分层编排。 */
  model: string
  setModel: (m: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebar: (v) => set({ sidebarCollapsed: v }),
  model: 'auto',
  setModel: (m) => set({ model: m }),
}))
