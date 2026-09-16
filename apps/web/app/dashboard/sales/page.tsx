'use client'

import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'
import type { Lead, LeadsResponse } from '../../lib/types'

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    async function fetchLeads() {
      try {
        const data = await api.get<LeadsResponse>('/dashboard/sales/leads')
        setLeads(data.leads || [])
      } catch (err) {
        const error = err as Error
        showToast(error.message || 'Failed to fetch leads', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()
  }, [showToast])

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-10 pb-6 border-b border-black/10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-black mb-2">Sales Dashboard</h1>
          <p className="text-sm font-medium text-text-secondary">Track registered users and borrower application leads.</p>
        </div>
        <div className="w-full sm:max-w-xs relative">
          <input
            type="text"
            className="input w-full rounded-none"
            placeholder="Search leads by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredLeads.length === 0 ? (
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.25 2.25 0 0112.75 21.5h-1.5a2.25 2.25 0 01-2.25-2.263V19.13m0 0a9.337 9.337 0 01-4.121-.952 4.125 4.125 0 00-7.533 2.493M9 19.128v-.003c0-1.113.285-2.16.786-3.07M15 7.5a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <h3 className="text-2xl font-serif font-bold mb-3">No Leads Found</h3>
          <p className="text-sm font-medium text-text-secondary">
            {searchTerm ? 'No results match your search criteria.' : 'There are currently no registered borrower leads.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-black/10">
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Borrower Name</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Email Address</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Registration Date</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Profile Status</th>
                  <th className="text-[10px] font-bold tracking-widest uppercase text-text-secondary py-4 px-6 font-sans">Salary Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredLeads.map((lead) => {
                  const profile = lead.profile
                  return (
                    <tr key={lead._id} className="transition-colors hover:bg-[#fafafa]">
                      <td className="py-4 px-6">
                        <div className="font-bold text-sm text-black">{lead.name}</div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-text-secondary">{lead.email}</td>
                      <td className="py-4 px-6 text-sm font-medium">
                        {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6">
                        {profile ? (
                          <StatusBadge status={profile.breStatus} />
                        ) : (
                          <span className="badge border border-black/10 bg-[#fafafa] text-text-secondary text-[10px]">NO PROFILE</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {profile ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm">
                              ₹{profile.monthlySalary.toLocaleString('en-IN')} <span className="text-xs text-text-secondary font-medium">/ mo</span>
                            </span>
                            <span className="text-[10px] tracking-widest font-bold uppercase text-text-secondary">
                              {profile.employmentMode.replace('_', ' ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-secondary font-bold">—</span>
                        )}
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
