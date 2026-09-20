import { Outlet } from 'react-router-dom'
import VSidebar from './VSidebar'

export default function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      <VSidebar />
      <main className="relative min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
