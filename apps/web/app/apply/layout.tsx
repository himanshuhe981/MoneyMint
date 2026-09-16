'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../lib/auth'
import Navbar from '../components/Navbar'
import StepIndicator from '../components/StepIndicator'
import LoadingSpinner from '../components/LoadingSpinner'

const STEPS = [
  'Personal Details',
  'Salary Slip',
  'Configure Loan',
  'Application Status'
]

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
    } else if (user.role !== 'BORROWER') {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== 'BORROWER') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fafafa]">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  // Determine current step based on pathname
  let currentStep = 1
  if (pathname.includes('/salary-slip')) {
    currentStep = 2
  } else if (pathname.includes('/loan')) {
    currentStep = 3
  } else if (pathname.includes('/status')) {
    currentStep = 4
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-accent selection:text-black">
      <Navbar />
      
      {/* pt-[72px] prevents the sticky Navbar from covering content */}
      <div className="pt-[72px] bg-white border-b border-black/10 py-6">
        <div className="container">
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>
      </div>

      <main className="py-12">
        <div className="container container-narrow">
          {children}
        </div>
      </main>
    </div>
  )
}
