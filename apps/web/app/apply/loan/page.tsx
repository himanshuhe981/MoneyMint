'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import type { ProfileResponse, LoanApplyResponse } from '../../lib/types'

export default function LoanConfigPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loanAmount, setLoanAmount] = useState(100000)
  const [tenure, setTenure] = useState(90)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get<ProfileResponse>('/borrower/profile')
        if (data.profile) {
          if (data.profile.breStatus !== 'PASSED') {
            showToast('Please pass the eligibility checks first', 'warning')
            router.push('/apply')
          } else if (!data.profile.salarySlipUrl) {
            showToast('Please upload your salary slip first', 'warning')
            router.push('/apply/salary-slip')
          }
        } else {
          router.push('/apply')
        }
      } catch {
        showToast('Please complete your personal details first', 'warning')
        router.push('/apply')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [router, showToast])

  // Math variables
  const interestRate = 12 // 12% p.a.
  const simpleInterest = parseFloat(((loanAmount * interestRate * tenure) / (365 * 100)).toFixed(2))
  const totalRepayment = parseFloat((loanAmount + simpleInterest).toFixed(2))

  const handleApply = async () => {
    setSubmitting(true)
    try {
      await api.post<LoanApplyResponse>('/borrower/loan/apply', {
        loanAmount,
        tenure
      })
      showToast('Loan application submitted successfully!', 'success')
      router.push('/apply/status')
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Application failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-serif font-bold tracking-tight text-black mb-3">Configure Loan</h1>
        <p className="text-sm font-medium text-text-secondary">Select your desired loan amount and repayment tenure.</p>
      </div>

      <div className="card max-w-2xl mx-auto flex flex-col gap-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        {/* Sliders */}
        <div className="flex flex-col gap-8">
          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="text-[10px] font-bold tracking-widest uppercase text-text-secondary" htmlFor="amount-input">Loan Amount (₹)</label>
              <input
                id="amount-input"
                type="number"
                min="50000"
                max="500000"
                step="10000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                disabled={submitting}
                className="w-40 text-right font-serif text-2xl font-bold bg-[#fafafa] border border-black/20 focus:border-black focus:ring-1 focus:ring-black transition-all py-1 px-3"
              />
            </div>
            <div className="relative py-2">
              <input
                id="amount-slider"
                type="range"
                min="50000"
                max="500000"
                step="10000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                disabled={submitting}
                className="w-full h-1 bg-black/10 appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
              />
              <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase text-text-secondary mt-3">
                <span>Min: ₹50,000</span>
                <span>Max: ₹5,00,000</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="text-[10px] font-bold tracking-widest uppercase text-text-secondary" htmlFor="tenure-input">Repayment Tenure (Days)</label>
              <input
                id="tenure-input"
                type="number"
                min="30"
                max="365"
                step="1"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                disabled={submitting}
                className="w-32 text-right font-serif text-2xl font-bold bg-[#fafafa] border border-black/20 focus:border-black focus:ring-1 focus:ring-black transition-all py-1 px-3"
              />
            </div>
            <div className="relative py-2">
              <input
                id="tenure-slider"
                type="range"
                min="30"
                max="365"
                step="1"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                disabled={submitting}
                className="w-full h-1 bg-black/10 appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
              />
              <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase text-text-secondary mt-3">
                <span>Min: 30 days</span>
                <span>Max: 365 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Panel */}
        <div className="bg-[#fafafa] border border-black/10 p-6">
          <div className="font-bold text-[10px] tracking-widest uppercase text-text-secondary mb-4 pb-2 border-b border-black/10">
            LOAN SUMMARY
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-text-secondary">Principal Amount</span>
              <span className="font-bold">₹{loanAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-text-secondary">Interest Rate</span>
              <span className="font-bold">{interestRate}% p.a. (Fixed)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-text-secondary">Tenure Period</span>
              <span className="font-bold">{tenure} Days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-text-secondary">Calculated Interest</span>
              <span className="font-bold">₹{simpleInterest.toLocaleString('en-IN')}</span>
            </div>
          </div>
          
          <div className="my-4 border-t border-black/10"></div>
          
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm uppercase tracking-widest text-text-secondary">Total Repayment</span>
            <span className="font-serif text-2xl font-bold">₹{totalRepayment.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-4 pt-6 border-t border-black/10">
          <button
            className="btn btn-ghost text-xs px-6 py-3 font-bold uppercase tracking-widest border border-black/20"
            onClick={() => router.push('/apply/salary-slip')}
            disabled={submitting}
          >
            Back
          </button>
          
          <button
            className="btn btn-primary text-xs px-8 py-3 font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(196,240,39,1)]"
            onClick={handleApply}
            disabled={submitting}
          >
            {submitting ? 'Submitting Application...' : 'Apply for Loan'}
          </button>
        </div>
      </div>
    </div>
  )
}
