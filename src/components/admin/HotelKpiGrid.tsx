'use client'

/**
 * src/components/admin/HotelKpiGrid.tsx
 * セクション B ― ホテル別パフォーマンスグリッド
 *
 * - ホテルごとに達成状況をカード表示
 * - 達成率に応じて5段階カラー + 達成時グローエフェクト
 * - ミニプログレスバーにアニメーション
 * - カードクリックで /admin/hotels/[id] へ遷移
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, cn } from '@/lib/utils'
import { getAchievementTheme } from '@/lib/kpi'
import { ChevronRight, Hotel } from 'lucide-react'

// ── 型定義（admin/page.tsx から export） ─────────────────────
export interface HotelKpiItem {
  id:          string
  name:        string
  target:      number   // monthly_target_sales
  sales:       number   // 当月の清掃売上
  adjustment:  number   // 当月の調整金合計
}

// ── ホテル 1 枚のカード ───────────────────────────────────────
function HotelKpiCard({ hotel }: { hotel: HotelKpiItem }) {
  const actual    = hotel.sales + hotel.adjustment
  const pct       = hotel.target > 0 ? Math.round((actual / hotel.target) * 100) : 0
  const remaining = Math.max(0, hotel.target - actual)
  const theme     = getAchievementTheme(pct)
  const Icon      = theme.icon

  // マウント後にアニメーション
  const [dispPct, setDispPct] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setDispPct(Math.min(pct, 100)), 200)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <Link href={`/admin/hotels/${hotel.id}`} className="group block">
      <article className={cn(
        'bg-white rounded-2xl border shadow-sm overflow-hidden',
        'transition-all duration-200',
        'group-hover:shadow-md group-hover:-translate-y-0.5',
        // 達成時: 枠に emerald グロー
        pct >= 100
          ? `border-emerald-200 shadow-lg ${theme.glow}`
          : 'border-slate-200'
      )}>
        {/* ── カードヘッダー ── */}
        <div className={cn(
          'px-4 py-3 flex items-center justify-between',
          // 達成時はヘッダー背景に色を乗せる
          pct >= 100 ? 'bg-emerald-50' : 'bg-slate-50/60'
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
              pct >= 100 ? 'bg-emerald-100' : 'bg-white border border-slate-200'
            )}>
              <Hotel size={14} className={pct >= 100 ? 'text-emerald-600' : 'text-slate-400'} />
            </div>
            <p className="text-sm font-bold text-slate-900 truncate">{hotel.name}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', theme.badge)}>
              {theme.label}
            </span>
            <ChevronRight
              size={14}
              className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all"
            />
          </div>
        </div>

        {/* ── カードボディ ── */}
        <div className="px-4 py-3 space-y-3">
          {/* 数値行 */}
          <div className="grid grid-cols-3 gap-2">
            {/* 目標 */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">目標</p>
              <p className="text-sm font-bold text-slate-700 tabular leading-tight">
                {hotel.target > 0 ? formatCurrency(hotel.target) : (
                  <span className="text-slate-300 font-normal text-xs">未設定</span>
                )}
              </p>
            </div>

            {/* 実績 */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">実績</p>
              <p className={cn('text-sm font-bold tabular leading-tight', theme.text)}>
                {formatCurrency(actual)}
              </p>
            </div>

            {/* 達成率 */}
            <div className="text-right">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">達成率</p>
              <p className={cn('text-sm font-bold tabular leading-tight', theme.text)}>
                {hotel.target > 0 ? `${pct}%` : (
                  <span className="text-slate-300 font-normal text-xs">—</span>
                )}
              </p>
            </div>
          </div>

          {/* ミニプログレスバー */}
          {hotel.target > 0 && (
            <div>
              <Progress
                value={dispPct}
                className="h-2 bg-slate-100"
                indicatorClassName={cn(
                  'rounded-full transition-all duration-700 ease-out',
                  theme.bar,
                  pct >= 100 && 'shadow-md shadow-emerald-500/40'
                )}
              />
            </div>
          )}

          {/* 残額 or 超過 */}
          <div className={cn(
            'text-[11px] font-medium flex items-center justify-between',
            pct >= 100 ? 'text-emerald-600' : 'text-slate-400'
          )}>
            {hotel.target === 0 ? (
              <span className="text-slate-300">月間目標を設定してください</span>
            ) : pct >= 100 ? (
              <span className="flex items-center gap-1">
                <Icon size={11} />
                {formatCurrency(actual - hotel.target)} 超過達成
              </span>
            ) : (
              <span>残り {formatCurrency(remaining)}</span>
            )}
            {/* 調整金がある場合 */}
            {hotel.adjustment !== 0 && (
              <span className={cn(
                'text-[10px]',
                hotel.adjustment > 0 ? 'text-emerald-500' : 'text-rose-400'
              )}>
                調整 {hotel.adjustment > 0 ? '+' : ''}{formatCurrency(hotel.adjustment)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

// ── グリッドコンテナ ──────────────────────────────────────────
export function HotelKpiGrid({ hotels }: { hotels: HotelKpiItem[] }) {
  // 達成率降順でソート（達成済み → 未達成の順）
  const sorted = [...hotels].sort((a, b) => {
    const pa = a.target > 0 ? (a.sales + a.adjustment) / a.target : -1
    const pb = b.target > 0 ? (b.sales + b.adjustment) / b.target : -1
    return pb - pa
  })

  return (
    <section className="mt-10">
      {/* セクションヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-slate-900">ホテル別パフォーマンス</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {hotels.length} 件 · 達成率の高い順
          </p>
        </div>
        <Link
          href="/admin/hotels"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 transition-colors font-medium"
        >
          すべて管理 <ChevronRight size={13} />
        </Link>
      </div>

      {/* 区切り線 */}
      <div className="h-px bg-slate-200 mb-6" />

      {/* グリッド */}
      {hotels.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Hotel size={26} className="text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">ホテルが登録されていません</p>
          <Link
            href="/admin/hotels"
            className="mt-3 inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-500 font-semibold"
          >
            ホテルを登録する <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(hotel => (
            <HotelKpiCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      )}
    </section>
  )
}
