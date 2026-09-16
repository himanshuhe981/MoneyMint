'use client'

import { useAuth } from '../lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import LoadingSpinner from './LoadingSpinner'

const DASHBOARD_ROLES = ['ADMIN', 'SALES', 'SANCTION', 'DISBURSEMENT', 'COLLECTION']

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (!isLoading && user && !DASHBOARD_ROLES.includes(user.role)) {
      router.push('/apply')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  if (!user || !DASHBOARD_ROLES.includes(user.role)) return null

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans selection:bg-accent selection:text-black">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1 pt-[72px]">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-x-hidden md:border-l border-black/10 bg-white">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
