'use client'

/**
 * ホテル一覧テーブル
 *
 * - 管理者: 新規登録・編集・目標売上達成率 すべて表示
 * - リーダー: 閲覧専用（目標売上金額は見える、ボタン類は非表示）
 */

import { useState } from 'react'
import { Pencil, PlusCircle, Hotel, TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { HotelFormDialog } from './HotelFormDialog'
import type { Hotel as HotelType } from '@/types/database'
import type { AuthUser } from '@/lib/auth'
import { isAdmin } from '@/lib/auth'

interface HotelWithMeta extends HotelType {
  room_types?: { id: string; name: string; unit_price: number }[]
  /** 当月の実績売上（親から渡す場合） */
  current_month_sales?: number
}

interface HotelTableProps {
  initialHotels: HotelWithMeta[]
  currentUser: AuthUser
}

// ── 達成率バー ────────────────────────────────────────────────
function AchievementBar({ actual, target }: { actual: number; target: number }) {
  if (target === 0) return <span className="text-xs text-slate-300">目標未設定</span>
  const pct = Math.min(Math.round((actual / target) * 100), 100)
  const color =
    pct >= 100 ? 'bg-emerald-500' :
    pct >= 70  ? 'bg-teal-500'    :
    pct >= 40  ? 'bg-amber-400'   : 'bg-red-400'

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-xs font-semibold tabular w-8 text-right',
        pct >= 100 ? 'text-emerald-600' : pct >= 70 ? 'text-teal-600' : 'text-slate-400'
      )}>
        {pct}%
      </span>
    </div>
  )
}

// ── メインコンポーネント ───────────────────────────────────────
export function HotelTable({ initialHotels, currentUser }: HotelTableProps) {
  const [hotels, setHotels]     = useState<HotelWithMeta[]>(initialHotels)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<HotelType | null>(null)
  const canEdit = isAdmin(currentUser)

  const handleSuccess = (hotel: HotelType) => {
    setHotels(prev => {
      const exists = prev.find(h => h.id === hotel.id)
      if (exists) return prev.map(h => h.id === hotel.id ? { ...h, ...hotel } : h)
      return [{ ...hotel, room_types: [] }, ...prev]
    })
  }

  const openNew = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const openEdit = (hotel: HotelType) => {
    setEditTarget(hotel)
    setDialogOpen(true)
  }

  return (
    <>
      {/* ── ヘッダー ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">クライアント管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            登録済みホテル {hotels.length} 件
            {!canEdit && <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">閲覧のみ</span>}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white
                       text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            新規登録
          </button>
        )}
      </div>

      {/* ── テーブル ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {hotels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <Hotel size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">ホテルが登録されていません</p>
            {canEdit && (
              <button
                onClick={openNew}
                className="mt-4 text-sm text-teal-600 hover:text-teal-500 font-semibold flex items-center gap-1"
              >
                <PlusCircle size={14} /> 最初のホテルを登録する
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  ホテル名
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  月間目標売上
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  今月の達成率
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  部屋タイプ
                </th>
                <th className="px-5 py-3.5 w-24" />
              </tr>
            </thead>
            <tbody>
              {hotels.map((hotel, i) => (
                <tr
                  key={hotel.id}
                  className={cn(
                    'border-b border-slate-100 transition-colors hover:bg-slate-50/70',
                    i % 2 === 1 && 'bg-slate-50/40'
                  )}
                >
                  {/* ホテル名 */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                        <Hotel size={15} className="text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{hotel.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          登録: {new Date(hotel.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 月間目標売上（リーダーも閲覧可） */}
                  <td className="px-5 py-4 text-right">
                    <span className="font-bold tabular text-slate-800">
                      {hotel.monthly_target_sales > 0
                        ? formatCurrency(hotel.monthly_target_sales)
                        : <span className="text-slate-300 font-normal text-xs">未設定</span>
                      }
                    </span>
                  </td>

                  {/* 達成率バー */}
                  <td className="px-5 py-4">
                    <AchievementBar
                      actual={hotel.current_month_sales ?? 0}
                      target={hotel.monthly_target_sales}
                    />
                  </td>

                  {/* 部屋タイプ */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(hotel.room_types ?? []).length === 0 ? (
                        <Badge variant="muted">未設定</Badge>
                      ) : (
                        hotel.room_types!.slice(0, 3).map(rt => (
                          <Badge key={rt.id} variant="default">{rt.name}</Badge>
                        ))
                      )}
                      {(hotel.room_types ?? []).length > 3 && (
                        <Badge variant="muted">+{hotel.room_types!.length - 3}</Badge>
                      )}
                    </div>
                  </td>

                  {/* アクション */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* 管理者のみ: 編集ボタン */}
                      {canEdit && (
                        <button
                          onClick={() => openEdit(hotel)}
                          className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="編集"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {/* 全員: 詳細へのリンク */}
                      <Link
                        href={`/admin/hotels/${hotel.id}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="詳細"
                      >
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ダイアログ */}
      {canEdit && (
        <HotelFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editTarget={editTarget}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
