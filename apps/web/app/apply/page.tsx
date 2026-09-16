'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import type { BorrowerProfile, ProfileResponse } from '../lib/types'

export default function PersonalDetailsPage() {
  const [fullName, setFullName] = useState('')
  const [pan, setPan] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [monthlySalary, setMonthlySalary] = useState('')
  const [employmentMode, setEmploymentMode] = useState<'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | ''>('')

  const [profile, setProfile] = useState<BorrowerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()

  const isUnemployed = employmentMode === 'UNEMPLOYED'
  const isSelfEmployed = employmentMode === 'SELF_EMPLOYED'
  const hasPickedMode = employmentMode !== ''

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get<ProfileResponse>('/borrower/profile')
        if (data.profile) {
          setProfile(data.profile)
          setFullName(data.profile.fullName)
          setPan(data.profile.pan)
          if (data.profile.dateOfBirth) {
            setDateOfBirth(new Date(data.profile.dateOfBirth).toISOString().split('T')[0] || '')
          }
          setMonthlySalary(data.profile.monthlySalary.toString())
          setEmploymentMode(data.profile.employmentMode)
        }
      } catch (err) {
        const error = err as Error
        if (error.message && !error.message.includes('not found') && !error.message.includes('404')) {
          showToast(error.message || 'Failed to fetch profile', 'error')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employmentMode) {
      showToast('Please select your employment mode first', 'error')
      return
    }

    if (!fullName.trim()) {
      showToast('Please enter your full name', 'error')
      return
    }

    const panUpper = pan.trim().toUpperCase()
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    if (!panRegex.test(panUpper)) {
      showToast('Invalid PAN format (e.g., ABCDE1234F)', 'error')
      return
    }

    if (!dateOfBirth) {
      showToast('Please select your date of birth', 'error')
      return
    }

    if (!isUnemployed) {
      const salaryNum = parseFloat(monthlySalary)
      if (isNaN(salaryNum) || salaryNum <= 0) {
        showToast('Please enter a valid monthly income', 'error')
        return
      }
    }

    setSubmitting(true)
    try {
      const response = await api.post<ProfileResponse>('/borrower/profile', {
        fullName: fullName.trim(),
        pan: panUpper,
        dateOfBirth,
        monthlySalary: isUnemployed ? 0 : parseFloat(monthlySalary),
        employmentMode
      })

      const updatedProfile = response.profile
      setProfile(updatedProfile)

      if (response.breStatus === 'PASSED' || updatedProfile.breStatus === 'PASSED') {
        showToast('Personal details verified successfully!', 'success')
        router.push('/apply/salary-slip')
      } else {
        showToast('Eligibility checks failed. Please review errors.', 'error')
      }
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Failed to submit profile', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  const hasPassedBRE = profile?.breStatus === 'PASSED'

  const salaryLabel = isSelfEmployed ? 'Monthly Net Income (₹)' : 'Monthly Net Salary (₹)'
  const salaryHint = isSelfEmployed
    ? 'Your average monthly income — minimum ₹25,000'
    : 'Minimum required: ₹25,000'

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-serif font-bold tracking-tight text-black mb-3">Personal Details</h1>
        <p className="text-sm font-medium text-text-secondary">Complete your personal profile to run the eligibility verification check.</p>
      </div>

      {profile && profile.breStatus === 'FAILED' && (
        <div className="mb-8 p-5 bg-red-50/50 border border-red-200">
          <div className="font-bold text-red-900 mb-2">Eligibility Check Failed:</div>
          <ul className="list-disc pl-5 m-0 text-sm font-medium text-red-800">
            {profile.breErrors?.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
          <div className="mt-3 text-xs font-medium text-red-700">
            Please review and update your information below to try again.
          </div>
        </div>
      )}

      {hasPassedBRE ? (
        <div className="card max-w-2xl mx-auto flex flex-col gap-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <div className="bg-green-50/50 border border-green-200 p-5">
            <div className="font-bold text-green-900 text-sm mb-1">Verification Passed</div>
            <div className="text-xs font-medium text-green-700">Your profile meets all initial lending eligibility criteria.</div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Full Name</div>
              <div className="font-serif text-lg font-bold">{profile.fullName}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">PAN Card Number</div>
              <div className="font-serif text-lg font-bold">{profile.pan}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Date of Birth</div>
              <div className="font-serif text-lg font-bold">
                {new Date(profile.dateOfBirth).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Monthly Salary</div>
              <div className="font-serif text-lg font-bold">
                ₹{profile.monthlySalary.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Employment Mode</div>
              <div className="font-serif text-lg font-bold">{profile.employmentMode.replace('_', ' ')}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">BRE Verification</div>
              <div className="mt-1">
                <span className="badge badge-passed text-[10px]">PASSED</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-6 border-t border-black/10">
            <button
              className="btn btn-primary text-xs px-8 py-3 font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(196,240,39,1)]"
              onClick={() => router.push('/apply/salary-slip')}
            >
              Continue to Salary Slip Upload
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card max-w-2xl mx-auto flex flex-col gap-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">

          {/* Employment mode */}
          <div>
            <label className="form-label flex gap-1" htmlFor="employment">
              Employment Mode <span className="text-red-500">*</span>
            </label>
            <select
              id="employment"
              className="input rounded-none"
              value={employmentMode}
              onChange={(e) => {
                setEmploymentMode(e.target.value as 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED')
                if (e.target.value === 'UNEMPLOYED') setMonthlySalary('0')
              }}
              disabled={submitting}
              required
            >
              <option value="" disabled>Select your employment status…</option>
              <option value="SALARIED">Salaried</option>
              <option value="SELF_EMPLOYED">Self-Employed</option>
              <option value="UNEMPLOYED">Unemployed</option>
            </select>
            {!hasPickedMode && (
              <span className="form-hint text-[10px] uppercase tracking-widest font-bold">Select this first — it determines your eligibility</span>
            )}
          </div>

          {isUnemployed && (
            <div className="bg-red-50/50 border border-red-200 p-4">
              <div className="font-bold text-red-900 text-sm">Not Eligible</div>
              <div className="text-xs font-medium text-red-700 mt-1">
                Unemployed applicants do not qualify for a loan. Please update your employment status if this is incorrect.
              </div>
            </div>
          )}

          {hasPickedMode && (
            <>
              <div>
                <label className="form-label" htmlFor="fullName">Full Name (as on PAN)</label>
                <input
                  id="fullName"
                  type="text"
                  className="input rounded-none"
                  placeholder="e.g. Johnathan Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label" htmlFor="pan">PAN Card Number</label>
                  <input
                    id="pan"
                    type="text"
                    className="input rounded-none uppercase"
                    placeholder="e.g. ABCDE1234F"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    disabled={submitting}
                    required
                  />
                  <span className="form-hint text-[10px] uppercase tracking-widest font-bold">Format: 5 letters, 4 digits, 1 letter</span>
                </div>

                <div>
                  <label className="form-label" htmlFor="dob">Date of Birth</label>
                  <input
                    id="dob"
                    type="date"
                    className="input rounded-none"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={submitting}
                    required
                  />
                  <span className="form-hint text-[10px] uppercase tracking-widest font-bold">Must be between 23 and 50 years old</span>
                </div>
              </div>

              {!isUnemployed && (
                <div>
                  <label className="form-label" htmlFor="salary">{salaryLabel}</label>
                  <input
                    id="salary"
                    type="number"
                    className="input rounded-none"
                    placeholder="e.g. 35000"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    disabled={submitting}
                    required
                  />
                  <span className="form-hint text-[10px] uppercase tracking-widest font-bold">{salaryHint}</span>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end mt-4 pt-6 border-t border-black/10">
            <button
              type="submit"
              className="btn btn-primary text-xs px-8 py-3 font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(196,240,39,1)] hover:shadow-[6px_6px_0px_rgba(196,240,39,1)]"
              disabled={submitting || !hasPickedMode}
            >
              {submitting ? 'Verifying...' : 'Verify Eligibility'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
