'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import type { Loan, BorrowerProfile } from '../../lib/types'

interface LoansResponse {
  loans: Loan[]
  count: number
}

export default function SanctionPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [actioning, setActioning] = useState(false)
  
  // Rejection state
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const { showToast } = useToast()

  const fetchLoans = useCallback(async () => {
    try {
      const data = await api.get<LoansResponse>('/dashboard/sanction/loans')
      setLoans(data.loans || [])
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Failed to fetch loans', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  const handleApprove = async (loanId: string) => {
    if (!confirm('Are you sure you want to approve this loan?')) return

    setActioning(true)
    try {
      await api.patch(`/dashboard/sanction/loans/${loanId}/approve`)
      showToast('Loan approved successfully', 'success')
      setSelectedLoan(null)
      fetchLoans()
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Approve failed', 'error')
    } finally {
      setActioning(false)
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLoan) return
    if (!rejectionReason.trim()) {
      showToast('Please enter a rejection reason', 'error')
      return
    }

    setActioning(true)
    try {
      await api.patch(`/dashboard/sanction/loans/${selectedLoan._id}/reject`, {
        rejectionReason: rejectionReason.trim()
      })
      showToast('Loan rejected successfully', 'success')
      setSelectedLoan(null)
      setShowRejectForm(false)
      setRejectionReason('')
      fetchLoans()
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Rejection failed', 'error')
    } finally {
      setActioning(false)
    }
  }

  const openReview = (loan: Loan) => {
    setSelectedLoan(loan)
    setShowRejectForm(false)
    setRejectionReason('')
  }

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-10 pb-6 border-b border-black/10">
        <h1 className="text-3xl font-serif font-bold tracking-tight text-black mb-2">Sanction Dashboard</h1>
        <p className="text-sm font-medium text-text-secondary">Review submitted loan applications, verify details, and approve/reject.</p>
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
          <h3 className="text-2xl font-serif font-bold mb-3">No Pending Reviews</h3>
          <p className="text-sm font-medium text-text-secondary">All applied loans have been reviewed.</p>
        </div>
      ) : (
        <div className="bg-white border border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-black/10">
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Borrower</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">PAN</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Requested Amount</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Tenure</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Repayment</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Applied Date</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {loans.map((loan) => {
                  const profile = typeof loan.profileId === 'object' && loan.profileId !== null ? loan.profileId : null
                  const borrower = typeof loan.borrowerId === 'object' && loan.borrowerId !== null ? loan.borrowerId : null
                  return (
                    <tr
                      key={loan._id}
                      className="cursor-pointer transition-colors hover:bg-[#fafafa]"
                      onClick={() => openReview(loan)}
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-sm text-black">{profile?.fullName || '—'}</div>
                        <div className="text-xs font-medium text-text-secondary">{borrower?.email || '—'}</div>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm uppercase">{profile?.pan || '—'}</td>
                      <td className="py-4 px-6 font-bold text-sm">₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-sm font-medium">{loan.tenure} Days</td>
                      <td className="py-4 px-6 text-sm font-medium">₹{loan.totalRepayment.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-sm font-medium">
                        {new Date(loan.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          className="btn btn-ghost px-4 py-2 text-xs font-bold uppercase tracking-widest"
                          onClick={(e) => {
                            e.stopPropagation()
                            openReview(loan)
                          }}
                        >
                          Review
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

      {/* Review Modal */}
      {selectedLoan && (
        <Modal
          isOpen={!!selectedLoan}
          onClose={() => !actioning && setSelectedLoan(null)}
          title="Review Loan Application"
        >
          {(() => {
            const profile = typeof selectedLoan.profileId === 'object' && selectedLoan.profileId !== null ? (selectedLoan.profileId as unknown as BorrowerProfile) : null
            const borrower = typeof selectedLoan.borrowerId === 'object' && selectedLoan.borrowerId !== null ? selectedLoan.borrowerId : null
            return (
              <div className="flex flex-col gap-8">
                {/* Borrower details */}
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-4 pb-2 border-b border-black/10">Applicant Profile</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-1">Full Name</span>
                      <span className="font-bold">{profile?.fullName || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-1">Email Address</span>
                      <span className="font-bold">{borrower?.email || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-1">PAN Card</span>
                      <span className="font-bold font-mono uppercase">{profile?.pan || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-1">Employment Mode</span>
                      <span className="font-bold">{profile?.employmentMode?.replace('_', ' ') || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-1">Monthly Net Salary</span>
                      <span className="font-bold">₹{profile?.monthlySalary?.toLocaleString('en-IN') || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-1">Salary Slip</span>
                      {profile?.salarySlipUrl ? (
                        <a
                          href={profile.salarySlipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-accent hover:underline"
                        >
                          View Salary Slip <svg className="w-3 h-3 ml-1 inline-block text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </a>
                      ) : (
                        <span className="font-bold text-red-600">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Loan terms */}
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-4 pb-2 border-b border-black/10">Requested Loan Terms</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-1">Principal Amount</span>
                      <span className="font-bold text-accent">₹{selectedLoan.loanAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-1">Tenure Period</span>
                      <span className="font-bold">{selectedLoan.tenure} Days</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-1">Interest Rate</span>
                      <span className="font-bold">{selectedLoan.interestRate}% p.a.</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-1">Simple Interest</span>
                      <span className="font-bold">₹{selectedLoan.simpleInterest.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-black/10 mt-2">
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-1">Total Repayment Amount</span>
                      <span className="font-serif text-2xl font-bold">₹{selectedLoan.totalRepayment.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Approve/Reject Area */}
                {!showRejectForm ? (
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-black/10">
                    <button
                      className="btn btn-ghost px-6 py-2.5 text-xs font-bold uppercase tracking-widest"
                      onClick={() => setSelectedLoan(null)}
                      disabled={actioning}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn bg-red-600 text-white hover:bg-red-700 px-6 py-2.5 text-xs font-bold uppercase tracking-widest border border-red-700 shadow-[4px_4px_0px_rgba(185,28,28,0.2)]"
                      onClick={() => setShowRejectForm(true)}
                      disabled={actioning}
                    >
                      Reject Application
                    </button>
                    <button
                      className="btn btn-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(196,240,39,1)]"
                      onClick={() => handleApprove(selectedLoan._id)}
                      disabled={actioning}
                    >
                      {actioning ? 'Approving...' : 'Approve & Sanction'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReject} className="flex flex-col gap-6 pt-6 border-t border-black/10">
                    <div>
                      <label className="form-label" htmlFor="reason">Reason for Rejection</label>
                      <textarea
                        id="reason"
                        className="input rounded-none"
                        placeholder="Provide details on why this loan application is rejected (e.g. documents unclear, verification failed)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        disabled={actioning}
                        required
                        rows={3}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <button
                        type="button"
                        className="btn btn-ghost px-6 py-2.5 text-xs font-bold uppercase tracking-widest"
                        onClick={() => setShowRejectForm(false)}
                        disabled={actioning}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn bg-red-600 text-white hover:bg-red-700 px-6 py-2.5 text-xs font-bold uppercase tracking-widest border border-red-700 shadow-[4px_4px_0px_rgba(185,28,28,0.2)]"
                        disabled={actioning}
                      >
                        {actioning ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )
          })()}
        </Modal>
      )}
    </div>
  )
}
