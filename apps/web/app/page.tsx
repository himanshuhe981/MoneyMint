'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from './lib/auth'
import Navbar from './components/Navbar'
import LoadingSpinner from './components/LoadingSpinner'

interface MockLoan {
  id: string
  borrower: string
  amount: number
  status: 'DISBURSED' | 'PENDING' | 'SANCTIONED' | 'CLOSED' | 'REJECTED'
}

const INITIAL_MOCK_LOANS: MockLoan[] = [
  { id: 'L-8941', borrower: 'Aditya Sharma', amount: 120000, status: 'DISBURSED' },
  { id: 'L-8942', borrower: 'Pooja Patel', amount: 350000, status: 'SANCTIONED' },
  { id: 'L-8943', borrower: 'Rohan Mehta', amount: 75000, status: 'CLOSED' },
  { id: 'L-8944', borrower: 'Sneha Reddy', amount: 500000, status: 'PENDING' },
  { id: 'L-8945', borrower: 'Vikram Singh', amount: 250000, status: 'DISBURSED' },
  { id: 'L-8946', borrower: 'Anita Desai', amount: 180000, status: 'SANCTIONED' },
  { id: 'L-8947', borrower: 'Karan Kapoor', amount: 420000, status: 'PENDING' },
]

export default function LandingPage() {
  const { user, isLoading } = useAuth()
  const [loanAmount, setLoanAmount] = useState<number>(100000)
  const [tenure, setTenure] = useState<number>(90)
  const [employmentCategory, setEmploymentCategory] = useState<'SALARIED' | 'SELF_EMPLOYED'>('SALARIED')
  const [loans, setLoans] = useState<MockLoan[]>(INITIAL_MOCK_LOANS)

  const interestRate = 12 // Fixed at 12% according to assignment
  const simpleInterest = Math.round((loanAmount * interestRate * tenure) / (365 * 100))
  const totalRepayment = loanAmount + simpleInterest

  useEffect(() => {
    const interval = setInterval(() => {
      setLoans((prev) => {
        const next = [...prev]
        const idx = Math.floor(Math.random() * next.length)
        const loan = { ...next[idx] } as MockLoan
        if (loan.status === 'PENDING') loan.status = 'SANCTIONED'
        else if (loan.status === 'SANCTIONED') loan.status = 'DISBURSED'
        else if (loan.status === 'DISBURSED') loan.status = 'CLOSED'
        else {
          loan.status = 'PENDING'
          loan.amount = Math.floor((Math.random() * 400000 + 50000) / 5000) * 5000
        }
        next[idx] = loan
        return next
      })
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-accent selection:text-black overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-36 lg:pb-32 overflow-hidden border-b border-black/10 bg-white" id="estimator">
        
        {/* Subtle glowing orb */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            
            {/* Left Content */}
            <div className="flex flex-col items-start gap-10">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 border border-black text-xs font-bold tracking-widest uppercase bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <span className="w-2 h-2 rounded-none bg-accent animate-pulse"></span>
                Institutional Capital Platform
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-serif tracking-tight leading-[1.1]">
                Precision <br />
                <span className="italic font-light text-black/70">Lending</span> <br />
                Infrastructure.
              </h1>
              
              <p className="text-lg text-text-secondary max-w-lg leading-relaxed font-medium">
                MoneyMint powers the next generation of credit. Automated underwriting, live ledger tracking, and instant disbursements—designed for unparalleled financial scale.
              </p>

              <div className="flex items-center gap-6 mt-2">
                <Link href={user ? (user.role === 'BORROWER' ? '/apply' : '/dashboard') : '/signup'} className="btn btn-primary text-sm px-8 py-3.5 rounded-none shadow-[4px_4px_0px_rgba(196,240,39,1)]">
                  {user ? 'Get Started' : 'Apply Now'}
                </Link>
                <Link href="#status" className="btn btn-ghost border border-black/20 hover:bg-[#fafafa] text-sm px-8 py-3.5 rounded-none">
                  Live Feed
                </Link>
              </div>

              <div className="flex gap-10 mt-6 border-t border-black/10 pt-6 w-full max-w-sm">
                <div>
                  <div className="text-2xl font-serif font-bold tracking-tight">₹78M+</div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-text-secondary mt-1">Capital Disbursed</div>
                </div>
                <div>
                  <div className="text-2xl font-serif font-bold tracking-tight">50,000+</div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-text-secondary mt-1">Active Users</div>
                </div>
              </div>
            </div>

            {/* Right Calculator Card */}
            <div className="relative">
              <div className="bg-white border border-black p-8 lg:p-10 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative">
                
                <div className="flex justify-between items-center mb-8 border-b border-black/10 pb-4">
                  <span className="text-xs font-bold tracking-widest uppercase">Loan Estimator</span>
                  <span className="badge badge-passed text-[10px]">FIXED 12% APR</span>
                </div>

                {/* Employment Category */}
                <div className="mb-6">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-xs font-medium text-text-secondary">Employment Category</span>
                    <span className="text-xs font-bold">{employmentCategory === 'SALARIED' ? 'Salaried' : 'Self Employed'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setEmploymentCategory('SALARIED')}
                      className={`py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${employmentCategory === 'SALARIED' ? 'border-2 border-black bg-[#fafafa] text-black' : 'border border-black/20 text-black/50 hover:border-black/40 hover:text-black'}`}
                    >
                      Salaried
                    </button>
                    <button 
                      onClick={() => setEmploymentCategory('SELF_EMPLOYED')}
                      className={`py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${employmentCategory === 'SELF_EMPLOYED' ? 'border-2 border-black bg-[#fafafa] text-black' : 'border border-black/20 text-black/50 hover:border-black/40 hover:text-black'}`}
                    >
                      Self Employed
                    </button>
                  </div>
                </div>

                {/* Requested Principal */}
                <div className="mb-6">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-xs font-medium text-text-secondary">Requested Principal</span>
                    <span className="text-2xl font-serif font-bold">₹{loanAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="relative py-2">
                    <input
                      type="range"
                      min="50000"
                      max="500000"
                      step="10000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full h-1 bg-black/10 appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
                    />
                    <div className="flex justify-between text-[10px] text-text-secondary font-bold tracking-widest uppercase mt-3">
                      <span>₹50,000</span>
                      <span>₹5,00,000</span>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-xs font-medium text-text-secondary">Repayment Tenure</span>
                    <span className="text-lg font-serif font-bold">{tenure} Days</span>
                  </div>
                  <div className="relative py-2">
                    <input
                      type="range"
                      min="30"
                      max="365"
                      step="1"
                      value={tenure}
                      onChange={(e) => setTenure(Number(e.target.value))}
                      className="w-full h-1 bg-black/10 appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
                    />
                    <div className="flex justify-between text-[10px] text-text-secondary font-bold tracking-widest uppercase mt-3">
                      <span>30 Days</span>
                      <span>365 Days</span>
                    </div>
                  </div>
                </div>

                {/* Estimations */}
                <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-black/10">
                  <div>
                    <span className="text-[10px] font-medium text-text-secondary uppercase tracking-widest block mb-1">Calculated Interest</span>
                    <span className="text-xl font-serif font-bold tracking-tight">₹{simpleInterest.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-text-secondary uppercase tracking-widest block mb-1">Total Payment</span>
                    <span className="text-xl font-serif font-bold tracking-tight">₹{totalRepayment.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="border-t border-black/10 pt-6">
                  <Link href={user ? '/apply' : '/signup'} className="btn btn-primary w-full py-4 text-xs rounded-none tracking-widest uppercase shadow-[4px_4px_0px_rgba(196,240,39,1)] hover:shadow-[6px_6px_0px_rgba(196,240,39,1)]">
                    Proceed to Application
                  </Link>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Stats / Success Section */}
      <section className="py-24 bg-white border-b border-black/10" id="platform">
        <div className="container">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-xl">
              <h2 className="text-4xl lg:text-5xl font-serif leading-tight">Institutional <br/> Capital Deployed —</h2>
              <p className="text-text-secondary mt-4 font-medium">A robust track record of successful originations, reflecting our commitment to seamless execution and precise credit analysis.</p>
            </div>
            <div className="text-7xl lg:text-8xl font-serif font-light tracking-tighter">
              ₹78.2<span className="text-accent font-medium">M</span>
            </div>
          </div>

          {/* Abstract Graph Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-y border-x border-black/10 h-64">
            <div className="bg-white border-r border-black/10 p-6 flex flex-col justify-end relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 right-0 bg-black/5 h-1/4 transition-all duration-500 group-hover:h-1/3"></div>
              <span className="relative z-10 font-bold text-xs tracking-widest uppercase text-text-secondary">FY 2021-22</span>
              <span className="relative z-10 text-3xl font-serif mt-1">18.5M</span>
            </div>
            <div className="bg-white border-r border-black/10 p-6 flex flex-col justify-end relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 right-0 bg-black/10 h-2/5 transition-all duration-500 group-hover:h-1/2"></div>
              <span className="relative z-10 font-bold text-xs tracking-widest uppercase text-text-secondary">FY 2022-23</span>
              <span className="relative z-10 text-3xl font-serif mt-1">32.0M</span>
            </div>
            <div className="bg-white border-r border-black/10 p-6 flex flex-col justify-end relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 right-0 bg-black/20 h-3/5 transition-all duration-500 group-hover:h-2/3"></div>
              <span className="relative z-10 font-bold text-xs tracking-widest uppercase text-text-secondary">FY 2023-24</span>
              <span className="relative z-10 text-3xl font-serif mt-1">55.3M</span>
            </div>
            <div className="bg-black p-6 flex flex-col justify-end relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
              <span className="font-bold text-xs tracking-widest uppercase text-white/50">FY 2024-25</span>
              <span className="text-4xl font-serif mt-1 text-white">78.6M</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Tracked Status Section */}
      <section className="py-24 bg-[#fafafa]" id="status">
        <div className="container max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 border-b border-black/10 pb-6">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-2 block">Live Streams</span>
              <h2 className="text-3xl font-serif">Global Activity Index</h2>
            </div>
            <div className="flex items-center gap-3 bg-black px-4 py-2 text-white text-[10px] font-bold tracking-widest uppercase shadow-[2px_2px_0px_rgba(196,240,39,1)]">
              <span className="w-1.5 h-1.5 bg-accent rounded-none animate-pulse"></span>
              Feed Active
            </div>
          </div>

          <div className="flex flex-col border-l border-black/10 ml-4 pl-8 relative space-y-8">
            <div className="absolute top-0 bottom-0 -left-px w-px bg-gradient-to-b from-accent to-transparent"></div>
            
            {loans.map((loan, idx) => (
              <div key={loan.id} className="relative group hover:-translate-y-0.5 transition-transform">
                {/* Node indicator */}
                <div className="absolute -left-[37px] top-4 w-2 h-2 bg-black border border-white group-hover:bg-accent transition-colors"></div>
                
                <div className="bg-white border border-black/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                  <div className="flex items-center gap-6">
                    <div className="font-mono text-[10px] font-bold text-text-secondary tracking-widest bg-black/5 px-2 py-1">{loan.id}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-text-main">{loan.borrower}</div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="font-serif text-xl font-bold">₹{loan.amount.toLocaleString('en-IN')}</div>
                    <span className={`w-28 text-center text-[10px] font-bold tracking-widest uppercase py-1 border ${
                      loan.status === 'DISBURSED' ? 'bg-black text-white border-black' :
                      loan.status === 'SANCTIONED' ? 'bg-[#fafafa] text-black border-black/20' :
                      loan.status === 'CLOSED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-text-secondary border-black/10'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-black text-white py-20 relative overflow-hidden">
        <div className="container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            
            {/* Brand Column */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <Image src="/MoneyMintLogo.svg" alt="MoneyMint Logo" width={28} height={28} className="w-7 h-7 invert" />
                <div className="flex flex-col items-start leading-none">
                  <span className="font-brand text-[22px] font-semibold tracking-wide text-white">MONEYMINT</span>
                </div>
              </div>
              <p className="text-sm font-medium text-white/50 leading-relaxed max-w-xs">
                Next-generation automated lending infrastructure for institutional capital deployment and transparent borrower experiences.
              </p>
            </div>

            {/* Links Columns */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">Platform</h4>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Automated Underwriting</a>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Risk Assessment</a>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Disbursement API</a>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Live Ledger</a>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">Company</h4>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">About Us</a>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Careers</a>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Press & Media</a>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Contact Support</a>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">Legal</h4>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Regulatory Compliance</a>
              <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Security Disclosure</a>
            </div>

          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-medium text-white/40">
              © {new Date().getFullYear()} MoneyMint Financial Technologies. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-xs font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-xs font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      </footer>
    </div>
  )
}
