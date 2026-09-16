'use client'

import { useAuth } from '../lib/auth'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

/** Returns up-to-2-letter initials from a full name */
function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isBorrower = user?.role === 'BORROWER'

  const handleLogoClick = () => {
    router.push('/')
  }

  const handleScrollTo = (id: string) => {
    if (pathname !== '/') {
      router.push(`/#${id}`)
      return
    }
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/5 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all">
      <div className="container flex items-center justify-between h-[80px]">

        {/* ── Logo ── */}
        <button className="flex items-center gap-2.5 transition-opacity hover:opacity-80 focus:outline-none" onClick={handleLogoClick} aria-label="Go home">
          {/* invert class makes the white SVG black */}
          <Image src="/MoneyMintLogo.svg" alt="MoneyMint Logo" width={28} height={28} className="w-7 h-7 invert" />
          <div className="flex flex-col items-start leading-none">
            <span className="font-brand text-[22px] font-semibold tracking-wide text-black">MONEYMINT</span>
          </div>
        </button>

        {/* ── Right Side ── */}
        <div className="flex items-center gap-6 lg:gap-8">
          
          {pathname === '/' && (
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {/* Landing page anchors */}
              <button className="text-[11px] font-bold tracking-widest uppercase text-text-secondary hover:text-black transition-colors" onClick={() => handleScrollTo('estimator')}>
                Estimator
              </button>
              <button className="text-[11px] font-bold tracking-widest uppercase text-text-secondary hover:text-black transition-colors" onClick={() => handleScrollTo('platform')}>
                Platform
              </button>
              <button className="text-[11px] font-bold tracking-widest uppercase text-text-secondary hover:text-black transition-colors" onClick={() => handleScrollTo('status')}>
                Live Feed
              </button>
            </nav>
          )}

          {user && isBorrower && (
            <nav className="hidden md:flex items-center gap-6 ml-2">
              <button
                className={`text-[11px] font-bold tracking-widest uppercase transition-colors ${pathname === '/apply/status' ? 'text-black' : 'text-text-secondary hover:text-black'}`}
                onClick={() => router.push('/apply/status')}
              >
                My Loans
              </button>
            </nav>
          )}

          {/* Divider between nav links and auth actions */}
          <div className="hidden md:block w-px h-5 bg-black/10 mx-2" />

          {user ? (
            <div className="flex items-center gap-4 lg:gap-6">
              {isBorrower && (
                <Link href="/apply" className="hidden sm:flex btn btn-primary btn-sm rounded-none tracking-wide text-xs px-6 py-2.5 shadow-[2px_2px_0px_rgba(196,240,39,1)] hover:shadow-[4px_4px_0px_rgba(196,240,39,1)] transition-all">
                  Apply Now
                </Link>
              )}
              {/* User chip */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col leading-none text-right hidden sm:flex">
                  <span className="text-sm font-semibold text-text-main">{user.name}</span>
                  <span className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">{user.role.replace('_', ' ')}</span>
                </div>
                <div className="w-9 h-9 border border-black/10 bg-black flex items-center justify-center text-xs font-bold text-white">
                  {getInitials(user.name)}
                </div>
              </div>

              {/* Sign out */}
              <button className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-accent transition-colors" onClick={logout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden lg:inline font-semibold">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-semibold text-text-secondary hover:text-black transition-colors hidden sm:block">
                Log In
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm rounded-none tracking-wide text-xs px-6 py-2.5 shadow-[2px_2px_0px_rgba(196,240,39,1)] hover:shadow-[4px_4px_0px_rgba(196,240,39,1)] transition-all">
                Apply Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
