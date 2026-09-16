'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import type { Loan } from '../../lib/types'

interface LoansResponse {
  loans: Loan[]
  count: number
}

export default function DisbursementPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)
  const { showToast } = useToast()

  const fetchLoans = useCallback(async () => {
    try {
      const data = await api.get<LoansResponse>('/dashboard/disbursement/loans')
      setLoans(data.loans || [])
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Failed to fetch sanctioned loans', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  const handleDisburse = async (loanId: string, borrowerName: string, amount: number) => {
    if (!confirm(`Are you sure you want to disburse ₹${amount.toLocaleString('en-IN')} to ${borrowerName}?`)) {
      return
    }

    setActioning(loanId)
    try {
      await api.patch(`/dashboard/disbursement/loans/${loanId}/disburse`)
      showToast(`Disbursed loan to ${borrowerName} successfully`, 'success')
      fetchLoans()
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Disbursement failed', 'error')
    } finally {
      setActioning(null)
    }
  }

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-10 pb-6 border-b border-black/10">
        <h1 className="text-3xl font-serif font-bold tracking-tight text-black mb-2">Disbursement Dashboard</h1>
        <p className="text-sm font-medium text-text-secondary">Manage and process payments for sanctioned loan applications.</p>
      </div>

      {loans.length === 0 ? (
        <div className="card w-full flex flex-col items-center text-center p-12 shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-white border border-black">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mb-6 text-black/40"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-2xl font-serif font-bold mb-3">No Pending Disbursements</h3>
          <p className="text-sm font-medium text-text-secondary">All sanctioned loans have been disbursed or closed.</p>
        </div>
      ) : (
        <div className="bg-white border border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-black/10">
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Borrower</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">PAN</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Disbursement Amount</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Sanctioned By</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Sanctioned Date</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {loans.map((loan) => {
                  const profile = typeof loan.profileId === 'object' && loan.profileId !== null ? loan.profileId : null
                  const borrower = typeof loan.borrowerId === 'object' && loan.borrowerId !== null ? loan.borrowerId : null
                  const sanctionedBy = typeof loan.sanctionedBy === 'object' && loan.sanctionedBy !== null ? loan.sanctionedBy : null
                  const borrowerName = profile?.fullName || borrower?.name || '—'

                  return (
                    <tr key={loan._id} className="transition-colors hover:bg-[#fafafa]">
                      <td className="py-4 px-6">
                        <div className="font-bold text-sm text-black">{borrowerName}</div>
                        <div className="text-xs font-medium text-text-secondary">{borrower?.email || '—'}</div>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm uppercase">{profile?.pan || '—'}</td>
                      <td className="py-4 px-6 font-bold text-sm text-accent">₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-sm font-medium">{sanctionedBy?.name || '—'}</td>
                      <td className="py-4 px-6 text-sm font-medium">
                        {loan.sanctionedAt ? (
                          new Date(loan.sanctionedAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          className="btn btn-primary px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(196,240,39,1)] hover:shadow-[6px_6px_0px_rgba(196,240,39,1)]"
                          onClick={() => handleDisburse(loan._id, borrowerName, loan.loanAmount)}
                          disabled={actioning !== null}
                        >
                          {actioning === loan._id ? 'Disbursing...' : 'Confirm Disburse'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
