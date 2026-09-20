import { create } from 'zustand'
import type { Expert } from '../types'
import { fetchExperts } from '../lib/api'

interface ExpertState {
  experts: Expert[]
  loaded: boolean
  loading: boolean
  load: () => Promise<void>
  byId: (id: string) => Expert | undefined
}

export const useExpertStore = create<ExpertState>((set, get) => ({
  experts: [],
  loaded: false,
  loading: false,
  load: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const experts = await fetchExperts()
      set({ experts, loaded: true, loading: false })
    } catch {
      set({ loading: false })
    }
  },
  byId: (id) => get().experts.find((e) => e.id === id),
}))
