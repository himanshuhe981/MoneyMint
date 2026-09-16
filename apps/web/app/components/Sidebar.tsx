'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../lib/auth'
import type { Role } from '../lib/types'

interface NavItem {
  label: string
  path: string
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Sales', path: '/dashboard/sales', roles: ['SALES', 'ADMIN'] },
  { label: 'Sanction', path: '/dashboard/sanction', roles: ['SANCTION', 'ADMIN'] },
  { label: 'Disbursement', path: '/dashboard/disbursement', roles: ['DISBURSEMENT', 'ADMIN'] },
  { label: 'Collection', path: '/dashboard/collection', roles: ['COLLECTION', 'ADMIN'] },
]

export default function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  if (!user) return null

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role))

  return (
    <aside className="w-full md:w-64 shrink-0 bg-[#fafafa] border-b md:border-b-0 md:border-r border-black/10 z-10 sticky top-[72px] md:top-[72px]">
      <div className="px-4 py-3 md:p-6 flex md:flex-col overflow-x-auto no-scrollbar gap-2 md:gap-4 md:sticky md:top-[72px]">
        <div className="hidden md:block text-[10px] font-bold tracking-widest uppercase text-text-secondary mb-2 px-3">
          Modules
        </div>
        <nav className="flex md:flex-col gap-3 md:gap-1 w-max md:w-full">
          {visibleItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <button
                key={item.path}
                className={`flex items-center whitespace-nowrap px-4 py-2 md:px-3 md:py-2.5 text-xs md:text-sm font-semibold transition-colors text-center md:text-left rounded md:rounded-none ${
                  isActive
                    ? 'bg-black text-white shadow-[2px_2px_0px_rgba(196,240,39,1)]'
                    : 'bg-black/5 md:bg-transparent text-text-secondary hover:bg-black/10 md:hover:bg-black/5 hover:text-black'
                }`}
                onClick={() => router.push(item.path)}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
