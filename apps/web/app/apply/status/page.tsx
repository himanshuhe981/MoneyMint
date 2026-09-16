'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'
import type { Loan, LoansResponse } from '../../lib/types'

export default function StatusPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchLoans() {
      try {
        const data = await api.get<LoansResponse>('/borrower/loans')
        setLoans(data.loans || [])
      } catch (err) {
        const error = err as Error
        showToast(error.message || 'Failed to fetch loan applications', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchLoans()
  }, [showToast])

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  // Returns progress percentage and step index for active status
  const getProgressInfo = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return { percent: 12.5, step: 1 }
      case 'SANCTIONED':
        return { percent: 37.5, step: 2 }
      case 'DISBURSED':
        return { percent: 62.5, step: 3 }
      case 'CLOSED':
        return { percent: 100, step: 4 }
      default:
        return { percent: 0, step: 0 }
    }
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-10 flex justify-between items-end border-b border-black/10 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-black mb-2">My Loans</h1>
          <p className="text-sm font-medium text-text-secondary">Track the lifecycle of your loan applications and payments.</p>
        </div>
        {loans.length > 0 && (
          <button
            className="btn btn-primary text-xs px-6 py-2.5 font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(196,240,39,1)] hover:shadow-[6px_6px_0px_rgba(196,240,39,1)]"
            onClick={() => router.push('/apply/loan')}
          >
            Apply Again
          </button>
        )}
      </div>

      {loans.length === 0 ? (
        <div className="card max-w-2xl mx-auto flex flex-col items-center text-center p-12 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mb-6 text-black/40"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h3 className="text-2xl font-serif font-bold mb-3">No Loan Applications Found</h3>
          <p className="text-sm font-medium text-text-secondary mb-8">You haven&apos;t submitted any loan requests yet.</p>
          <button
            className="btn btn-primary text-xs px-8 py-3 font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(196,240,39,1)]"
            onClick={() => router.push('/apply/loan')}
          >
            Configure & Apply Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {loans.map((loan) => {
            const isRejected = loan.status === 'REJECTED'
            const isDisbursedOrClosed = loan.status === 'DISBURSED' || loan.status === 'CLOSED'
            const { percent, step } = getProgressInfo(loan.status)

            return (
              <div key={loan._id} className="card flex flex-col gap-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                {/* Header info */}
                <div className="flex justify-between items-start pb-6 border-b border-black/10">
                  <div>
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">LOAN ID: {loan._id}</span>
                    <h3 className="mt-2 text-3xl font-serif font-bold">
                      ₹{loan.loanAmount.toLocaleString('en-IN')}
                    </h3>
                  </div>
                  <StatusBadge status={loan.status} />
                </div>

                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest block mb-1">Tenure Period</span>
                    <span className="font-bold text-lg">{loan.tenure} Days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest block mb-1">Interest Rate</span>
                    <span className="font-bold text-lg">{loan.interestRate}% p.a.</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest block mb-1">Total Repayment</span>
                    <span className="font-bold text-lg">₹{loan.totalRepayment.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest block mb-1">Applied On</span>
                    <span className="font-bold text-lg">
                      {new Date(loan.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Repayment details if disbursed */}
                {isDisbursedOrClosed && (
                  <div className="bg-[#fafafa] border border-black/10 p-5 flex flex-col gap-3">
                    <div className="font-bold text-[10px] text-text-secondary tracking-widest uppercase mb-1">REPAYMENT STATUS</div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-text-secondary">Paid to Date:</span>
                      <span className="font-bold text-green-700">₹{loan.amountPaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-text-secondary">Outstanding Balance:</span>
                      <span className="font-bold text-red-600">₹{loan.outstandingBalance.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* Progress Bar Flow */}
                {!isRejected ? (
                  <div className="pt-4 border-t border-black/10">
                    <div className="relative h-2 bg-black/10 mb-8 rounded-none mt-2">
                      <div
                        className="absolute h-full bg-black transition-all duration-500 ease-out"
                        style={{ width: `${percent}%` }}
                      />
                      {/* Dots */}
                      <div className="absolute -top-[6px] left-0 right-0 flex justify-between pointer-events-none">
                        {[1, 2, 3, 4].map((s) => {
                          const active = step >= s
                          return (
                            <div
                              key={s}
                              className={`w-5 h-5 bg-white border-[3px] transition-colors duration-500 ${
                                active ? 'border-black' : 'border-black/20'
                              }`}
                            />
                          )
                        })}
                      </div>
                    </div>
                    {/* Labels */}
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                      <span className={step >= 1 ? 'text-black' : ''}>Applied</span>
                      <span className={step >= 2 ? 'text-black' : ''}>Sanctioned</span>
                      <span className={step >= 3 ? 'text-black' : ''}>Disbursed</span>
                      <span className={step >= 4 ? 'text-black' : ''}>Closed</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50/50 border border-red-200 p-5 mt-2">
                    <div className="font-bold text-red-900 text-sm mb-1">Loan Application Rejected</div>
                    <p className="text-xs font-medium text-red-700">
                      Reason: {loan.rejectionReason || 'No rejection reason specified.'}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
