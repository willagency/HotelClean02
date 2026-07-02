'use client'

/**
 * src/components/admin/AdminSidebar.tsx
 *
 * 管理者サイドバー（Client Component）。
 * - ユーザー情報・ロールバッジの表示
 * - ログアウトボタン（Server Action を useTransition で呼び出す）
 */

import Link       from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import {
  LayoutDashboard, ClipboardList, Clock,
  Calendar, FileDown, ChevronRight, Hotel,
  LogOut, Loader2, UserCircle2,
} from 'lucide-react'
import { signOut }    from '@/app/auth/actions'
import { ROLE_LABEL } from '@/lib/auth'
import { cn }         from '@/lib/utils'
import type { AuthUser } from '@/lib/auth'

const NAV = [
  { href: '/admin',              label: 'ダッシュボード',   icon: LayoutDashboard },
  { href: '/admin/hotels',       label: 'クライアント管理', icon: Hotel           },
  { href: '/admin/daily-report', label: '日報入力',         icon: ClipboardList   },
  { href: '/admin/attendance',   label: '勤怠確認',         icon: Clock           },
  { href: '/admin/shifts',       label: 'シフト管理',       icon: Calendar        },
  { href: '/admin/export',       label: '帳票出力',         icon: FileDown        },
]

// ロールバッジのカラー
const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  admin:  { bg: 'bg-teal-50',   text: 'text-teal-700'   },
  leader: { bg: 'bg-sky-50',    text: 'text-sky-700'    },
  staff:  { bg: 'bg-slate-100', text: 'text-slate-600'  },
}

interface AdminSidebarProps {
  user: AuthUser
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  const badge = ROLE_BADGE[user.role] ?? ROLE_BADGE.staff

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* ── ロゴ ── */}
      <div className="px-5 py-5 border-b border-slate-100">
        <span className="text-teal-600 font-bold text-xl tracking-tight">CleanOps</span>
        <p className="text-slate-400 text-xs mt-0.5">ホテル清掃管理システム</p>
      </div>

      {/* ── ナビゲーション ── */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/admin'
              ? pathname === '/admin'
              : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-teal-400" />}
            </Link>
          )
        })}
      </nav>

      {/* ── ユーザー情報 + ログアウト ── */}
      <div className="border-t border-slate-100 p-3 space-y-1">
        {/* ユーザー情報カード */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
            <UserCircle2 size={18} className="text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">
              {user.email ?? 'ユーザー'}
            </p>
            <span className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
              badge.bg, badge.text
            )}>
              {ROLE_LABEL[user.role]}
            </span>
          </div>
        </div>

        {/* ログアウトボタン */}
        <button
          onClick={handleSignOut}
          disabled={isPending}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
            'text-slate-500 hover:text-red-600 hover:bg-red-50',
            'transition-all duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isPending
            ? <Loader2 size={17} className="animate-spin text-slate-400" />
            : <LogOut  size={17} />
          }
          {isPending ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
    </aside>
  )
}
