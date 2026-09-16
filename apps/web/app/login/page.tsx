'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <div className={styles.container}>
      <div className={`${styles.card} card animate-fade-in`}>
        <div className={styles.logo}>MoneyMint</div>
        <div className={styles.subtitle}>Loan Management System</div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          Don&apos;t have a borrower account?{' '}
          <Link href="/signup">Sign up here</Link>
        </div>
      </div>
    </div>
  )
}
