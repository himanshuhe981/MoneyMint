'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'
import type { Loan, Payment } from '../../lib/types'

interface LoansResponse {
  loans: Loan[]
  count: number
}

interface PaymentsResponse {
  loan: {
    id: string
    totalRepayment: number
    amountPaid: number
    outstandingBalance: number
    status: string
  }
  payments: Payment[]
}

export default function CollectionPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null)
  
  // Expanded loan details state
  const [payments, setPayments] = useState<Payment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)

  // Payment form state
  const [utrNumber, setUtrNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [recording, setRecording] = useState(false)

  const { showToast } = useToast()

  const fetchLoans = useCallback(async () => {
    try {
      const data = await api.get<LoansResponse>('/dashboard/collection/loans')
      setLoans(data.loans || [])
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Failed to fetch active loans', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  const fetchPayments = async (loanId: string) => {
    setLoadingPayments(true)
    try {
      const data = await api.get<PaymentsResponse>(`/dashboard/collection/loans/${loanId}/payments`)
      setPayments(data.payments || [])
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Failed to fetch payments', 'error')
    } finally {
      setLoadingPayments(false)
    }
  }

  const handleToggleExpand = async (loanId: string) => {
    if (expandedLoanId === loanId) {
      setExpandedLoanId(null)
      setPayments([])
    } else {
      setExpandedLoanId(loanId)
      setUtrNumber('')
      setAmount('')
      setDate(new Date().toISOString().split('T')[0] || '')
      await fetchPayments(loanId)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent, loanId: string) => {
    e.preventDefault()

    if (!utrNumber.trim()) {
      showToast('UTR number is required', 'error')
      return
    }

    const payAmount = parseFloat(amount)
    if (isNaN(payAmount) || payAmount <= 0) {
      showToast('Payment amount must be greater than 0', 'error')
      return
    }

    if (!date) {
      showToast('Payment date is required', 'error')
      return
    }

    setRecording(true)
    try {
      const response = await api.post<{ message: string }>(`/dashboard/collection/loans/${loanId}/payment`, {
        utrNumber: utrNumber.trim(),
        amount: payAmount,
        date
      })
      showToast(response.message || 'Payment recorded successfully', 'success')
      
      setUtrNumber('')
      setAmount('')
      
      await fetchLoans()
      await fetchPayments(loanId)
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Failed to record payment', 'error')
    } finally {
      setRecording(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-10 pb-6 border-b border-black/10">
        <h1 className="text-3xl font-serif font-bold tracking-tight text-black mb-2">Collection Dashboard</h1>
        <p className="text-sm font-medium text-text-secondary">Record repayment transactions, check outstanding balances, and track payment histories.</p>
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
          <h3 className="text-2xl font-serif font-bold mb-3">No Active Collections</h3>
          <p className="text-sm font-medium text-text-secondary">There are no disbursed loans currently awaiting repayment.</p>
        </div>
      ) : (
        <div className="bg-white border border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-black/10">
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Borrower</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Loan Amount</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Total Repayment</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Amount Paid</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Outstanding</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Status</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {loans.map((loan) => {
                  const profile = typeof loan.profileId === 'object' && loan.profileId !== null ? loan.profileId : null
                  const borrower = typeof loan.borrowerId === 'object' && loan.borrowerId !== null ? loan.borrowerId : null
                  const isExpanded = expandedLoanId === loan._id
                  const borrowerName = profile?.fullName || borrower?.name || '—'

                  return (
                    <React.Fragment key={loan._id}>
                      <tr 
                        className={`cursor-pointer transition-colors hover:bg-[#fafafa] ${isExpanded ? 'bg-[#fafafa]' : ''}`}
                        onClick={() => handleToggleExpand(loan._id)}
                      >
                        <td className="py-4 px-6">
                          <div className="font-bold text-sm text-black">{borrowerName}</div>
                          <div className="text-xs font-medium text-text-secondary">{borrower?.email || '—'}</div>
                        </td>
                        <td className="py-4 px-6 font-bold text-sm">₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                        <td className="py-4 px-6 text-sm font-medium">₹{loan.totalRepayment.toLocaleString('en-IN')}</td>
                        <td className="py-4 px-6 text-sm font-bold text-green-700">₹{loan.amountPaid.toLocaleString('en-IN')}</td>
                        <td className="py-4 px-6 text-sm font-bold text-red-600">₹{loan.outstandingBalance.toLocaleString('en-IN')}</td>
                        <td className="py-4 px-6">
                          <StatusBadge status={loan.status} />
                        </td>
                        <td className="py-4 px-6">
                          <button
                            className={`btn px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                              isExpanded 
                                ? 'bg-black text-white hover:bg-black/90' 
                                : 'bg-transparent border border-black/20 hover:border-black text-black'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleExpand(loan._id)
                            }}
                          >
                            {isExpanded ? 'Hide Details' : 'Payments & Record'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable details panel */}
                      {isExpanded && (
                        <tr className="bg-[#fafafa]">
                          <td colSpan={7} className="p-0 border-t border-black/10" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Left Side: Payments History */}
                              <div className="lg:col-span-2">
                                <h4 className="text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-4 pb-2 border-b border-black/10">Payment History</h4>
                                {loadingPayments ? (
                                  <div className="py-8"><LoadingSpinner size={24} /></div>
                                ) : payments.length === 0 ? (
                                  <div className="text-sm font-medium text-text-secondary py-8 text-center bg-white border border-black/10">
                                    No payments have been recorded for this loan yet.
                                  </div>
                                ) : (
                                  <div className="bg-white border border-black/10 max-h-[250px] overflow-y-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead className="bg-[#fafafa] sticky top-0 border-b border-black/10">
                                        <tr>
                                          <th className="py-3 px-4 font-bold tracking-widest uppercase text-text-secondary">UTR Number</th>
                                          <th className="py-3 px-4 font-bold tracking-widest uppercase text-text-secondary">Amount</th>
                                          <th className="py-3 px-4 font-bold tracking-widest uppercase text-text-secondary">Date Paid</th>
                                          <th className="py-3 px-4 font-bold tracking-widest uppercase text-text-secondary">Recorded By</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-black/10">
                                        {payments.map((payment) => {
                                          const recordedBy = typeof payment.recordedBy === 'object' && payment.recordedBy !== null ? payment.recordedBy : null
                                          return (
                                            <tr key={payment._id}>
                                              <td className="py-3 px-4 font-mono font-medium">{payment.utrNumber}</td>
                                              <td className="py-3 px-4 font-bold text-green-700">₹{payment.amount.toLocaleString('en-IN')}</td>
                                              <td className="py-3 px-4 font-medium">
                                                {new Date(payment.date).toLocaleDateString('en-IN', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric'
                                                })}
                                              </td>
                                              <td className="py-3 px-4 font-medium">{recordedBy?.name || '—'}</td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>

                              {/* Right Side: Record a payment */}
                              {loan.status !== 'CLOSED' && (
                                <div className="bg-white border border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] p-6 h-fit">
                                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-4 pb-2 border-b border-black/10">Record New Repayment</h4>
                                  <form onSubmit={(e) => handleRecordPayment(e, loan._id)} className="flex flex-col gap-4">
                                    <div>
                                      <label className="form-label text-[10px]" htmlFor={`utr-${loan._id}`}>UTR Number</label>
                                      <input
                                        id={`utr-${loan._id}`}
                                        type="text"
                                        className="input rounded-none text-xs"
                                        placeholder="e.g. UTR123456789"
                                        value={utrNumber}
                                        onChange={(e) => setUtrNumber(e.target.value)}
                                        disabled={recording}
                                        required
                                      />
                                    </div>

                                    <div>
                                      <label className="form-label text-[10px]" htmlFor={`amount-${loan._id}`}>Amount Paid (₹)</label>
                                      <input
                                        id={`amount-${loan._id}`}
                                        type="number"
                                        className="input rounded-none text-xs"
                                        placeholder="e.g. 15000"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        max={loan.outstandingBalance}
                                        disabled={recording}
                                        required
                                      />
                                      <span className="form-hint text-[10px] tracking-widest font-bold mt-1">
                                        Max outstanding: ₹{loan.outstandingBalance.toLocaleString('en-IN')}
                                      </span>
                                    </div>

                                    <div>
                                      <label className="form-label text-[10px]" htmlFor={`date-${loan._id}`}>Date Received</label>
                                      <input
                                        id={`date-${loan._id}`}
                                        type="date"
                                        className="input rounded-none text-xs"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        disabled={recording}
                                        required
                                      />
                                    </div>

                                    <button
                                      type="submit"
                                      className="btn btn-primary w-full mt-2 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(196,240,39,1)]"
                                      disabled={recording}
                                    >
                                      {recording ? 'Recording...' : 'Record Payment'}
                                    </button>
                                  </form>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
