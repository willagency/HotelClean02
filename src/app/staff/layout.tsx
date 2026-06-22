'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, Calendar } from 'lucide-react'

const NAV = [
  { href: '/staff',       label: '打刻',   icon: Clock    },
  { href: '/staff/shift', label: 'シフト', icon: Calendar },
]

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 max-w-md mx-auto">
      {/* ヘッダー */}
      <header className="flex items-center px-5 pt-safe pt-4 pb-3">
        <span className="text-teal-600 font-bold text-xl tracking-tight">CleanOps</span>
      </header>

      {/* コンテンツ */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* ボトムナビ */}
      <nav className="bg-white border-t border-slate-200 safe-pb">
        <div className="flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/staff' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                  active ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600',
                ].join(' ')}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={active ? 'text-teal-600' : ''}
                />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
