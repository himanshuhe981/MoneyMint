'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import styles from './page.module.css'
import type { LoansResponse } from '../lib/types'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, login, isLoading } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'BORROWER') {
        router.replace('/apply')
      } else {
        router.replace('/dashboard')
      }
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      showToast('Please fill in all fields', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await login(email, password)
      showToast('Successfully signed in', 'success')

      // For borrowers: if they already have a loan, send them straight to My Loans
      // instead of making them navigate through the apply steps again
      const stored = localStorage.getItem('lms_user')
      const loggedInUser = stored ? JSON.parse(stored) : null
      if (loggedInUser?.role === 'BORROWER') {
        try {
          const data = await api.get<LoansResponse>('/borrower/loans')
          if (data.loans && data.loans.length > 0) {
            router.replace('/apply/status')
            return
          }
        } catch {
          // loan check failed, just go to /apply normally
        }
        router.replace('/apply')
      } else {
        router.replace('/dashboard')
      }
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Authentication failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || (user && !isSubmitting)) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 selection:bg-accent selection:text-black">
      <div className="card w-full max-w-md animate-[slideUp_0.3s_ease-out] border-black/20 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col items-center text-center mb-8">
          <Image src="/MoneyMintLogo.svg" alt="MoneyMint Logo" width={48} height={48} className="mb-4 invert" />
          <h1 className="text-2xl font-serif font-bold tracking-tight text-text-main">Welcome Back</h1>
          <p className="text-xs font-bold tracking-widest uppercase text-text-secondary mt-2">Sign in to your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="input rounded-none"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input rounded-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full mt-4 py-4 rounded-none uppercase tracking-widest text-xs"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-text-secondary border-t border-black/10 pt-6">
          Don&apos;t have a borrower account?{' '}
          <Link href="/signup" className="text-black font-bold hover:underline">Register here</Link>
        </div>
      </div>
    </div>
  )
}
