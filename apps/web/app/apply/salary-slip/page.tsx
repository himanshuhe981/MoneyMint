'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import type { BorrowerProfile, ProfileResponse } from '../../lib/types'

export default function SalarySlipPage() {
  const [profile, setProfile] = useState<BorrowerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get<ProfileResponse>('/borrower/profile')
        if (data.profile) {
          setProfile(data.profile)
          if (data.profile.breStatus !== 'PASSED') {
            showToast('Please pass the eligibility checks first', 'warning')
            router.push('/apply')
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      showToast('Only PDF, JPG, and PNG files are allowed', 'error')
      return false
    }
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      showToast('File size must be less than 5MB', 'error')
      return false
    }
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append('salarySlip', selectedFile)

    try {
      const data = await api.post<ProfileResponse>('/borrower/salary-slip', formData)
      setProfile(data.profile)
      setSelectedFile(null)
      showToast('Salary slip uploaded successfully!', 'success')
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'File upload failed. Make sure the S3 service is running.', 'error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out] w-full px-4">
      <div className="mb-8 text-center max-w-lg mx-auto">
        <h1 className="text-2xl font-serif font-semibold tracking-tight text-black mb-2">Upload Salary Slip</h1>
        <p className="text-[13px] font-medium text-text-secondary leading-relaxed">Provide your latest net salary slip for income verification.</p>
      </div>

      <div className="card w-full max-w-xl mx-auto flex flex-col gap-6 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
        {profile?.salarySlipUrl && (
          <div className="bg-green-50/50 border border-green-200 p-4 flex items-center justify-between">
            <div>
              <span className="font-bold text-green-900 block text-xs">Salary Slip Verified</span>
              <p className="text-[10px] font-medium text-green-700 mt-1">A valid salary slip is already on file.</p>
            </div>
            <a
              href={profile.salarySlipUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost bg-white border-black/10 text-[10px] px-3 py-1.5 uppercase tracking-widest font-bold"
            >
              View File
            </a>
          </div>
        )}

        <div
          className={`border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            dragActive ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-black/20 hover:border-black/40 hover:bg-[#fafafa]'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileChange}
          />
          
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto mb-4 text-black/40"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>

          {selectedFile ? (
            <div>
              <div className="font-bold text-sm text-black">{selectedFile.name}</div>
              <div className="text-xs font-medium text-text-secondary mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          ) : (
            <div>
              <div className="font-bold text-sm text-black">Drag & drop your file here, or click to browse</div>
              <div className="text-xs font-medium text-text-secondary mt-2">Supports PDF, JPG, PNG up to 5MB</div>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="flex justify-end gap-3 pt-4 border-t border-black/10">
            <button
              className="btn btn-ghost px-6 py-2.5 text-xs font-bold uppercase tracking-widest"
              onClick={() => setSelectedFile(null)}
              disabled={uploading}
            >
              Clear
            </button>
            <button
              className="btn btn-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        )}

        <div className="flex justify-between mt-4 pt-6 border-t border-black/10">
          <button
            className="btn btn-ghost text-xs px-6 py-3 font-bold uppercase tracking-widest border border-black/20"
            onClick={() => router.push('/apply')}
          >
            Back
          </button>
          
          <button
            className="btn btn-primary text-xs px-8 py-3 font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(196,240,39,1)]"
            onClick={() => router.push('/apply/loan')}
            disabled={!profile?.salarySlipUrl}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
