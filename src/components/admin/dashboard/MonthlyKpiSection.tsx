'use client'

/**
 * src/components/admin/dashboard/MonthlyKpiSection.tsx
 *
 * 月次KPIセクション（Client Component）。
 * - ①サマリーKPIカード群
 * - ②アニメーション付き全体プログレスバー
 * - ③ホテル別達成率リスト（アニメーション付き小バー）
 * - ④売上構成比ドーナツチャート
 */

import { useEffect, useState } from 'react'
import {
  Target, TrendingUp, TrendingDown, Minus,
  Trophy, ChevronDown, ChevronUp, Hotel, Sparkles,
} from 'lucide-react'
import { SalesDonutChart } from './SalesDonutChart'
import { formatCurrency, cn } from '@/lib/utils'
import {
  getAchievementLevel,
  ACHIEVEMENT_COLORS,
  type HotelMonthlyKpi,
  type DashboardSummary,
  type RoomTypeSales,
} from '@/lib/dashboard'

// ══════════════════════════════════════════════════════════════
// 子コンポーネント群
// ══════════════════════════════════════════════════════════════

// ── ①全体プログレスバー（大・アニメーション付き） ────────────
function OverallProgressBar({
  value,
  colorHex,
}: {
  value:    number
  colorHex: string
}) {
  const [width, setWidth] = useState(0)
  const clamped = Math.min(value, 100)

  useEffect(() => {
    const t = setTimeout(() => setWidth(clamped), 200)
    return () => clearTimeout(t)
  }, [clamped])

  return (
    <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden">
      {/* メインバー */}
      <div
        className="h-full rounded-full"
        style={{
          width:            `${width}%`,
          backgroundColor:  colorHex,
          transition:       'width 1200ms cubic-bezier(0.34, 1.15, 0.64, 1)',
        }}
      />
      {/* 達成時グロー */}
      {value >= 100 && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{ backgroundColor: colorHex, opacity: 0.12 }}
        />
      )}
      {/* 目標ライン */}
      <div className="absolute top-0 right-0 w-0.5 h-full bg-slate-300/60" />
    </div>
  )
}

// ── ②ホテル別の細いプログレスバー ───────────────────────────
function SmallProgressBar({
  value,
  colorClass,
  delay,
}: {
  value:      number
  colorClass: string
  delay:      number
}) {
  const [width, setWidth] = useState(0)
  const clamped = Math.min(value, 100)

  useEffect(() => {
    const t = setTimeout(() => setWidth(clamped), delay + 100)
    return () => clearTimeout(t)
  }, [clamped, delay])

  return (
    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden flex-1">
      <div
        className={cn('h-full rounded-full transition-all ease-out', colorClass)}
        style={{
          width:              `${width}%`,
          transitionDuration: '900ms',
          transitionDelay:    `${delay}ms`,
        }}
      />
    </div>
  )
}

// ── ③KPIサマリーカード ───────────────────────────────────────
function KpiStatCard({
  label, value, sub, icon: Icon,
  highlighted, textColorClass, delay,
}: {
  label:           string
  value:           string
  sub?:            string
  icon:            React.ElementType
  highlighted?:    boolean
  textColorClass?: string
  delay:           number
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-5 border transition-all duration-500',
        highlighted ? 'shadow-md border-slate-200' : 'shadow-sm border-slate-100',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide leading-tight">
          {label}
        </span>
        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
          <Icon size={15} className={textColorClass ?? 'text-slate-400'} />
        </div>
      </div>
      <p className={cn(
        'text-2xl font-bold tabular leading-none',
        textColorClass ?? 'text-slate-900'
      )}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-2 leading-snug">{sub}</p>}
    </div>
  )
}

// ── ④ホテル別達成率の行 ─────────────────────────────────────
function HotelKpiRow({
  hotel, index,
}: {
  hotel: HotelMonthlyKpi
  index: number
}) {
  const level  = getAchievementLevel(hotel.achievementRate)
  const colors = ACHIEVEMENT_COLORS[level]
  const isOver = hotel.achievementRate >= 100

  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-slate-100 last:border-0">
      {/* 順位 */}
      <span className="text-xs font-bold text-slate-300 w-4 text-right shrink-0">
        {index + 1}
      </span>

      {/* ホテル名 */}
      <div className="w-36 shrink-0 flex items-center gap-1.5 min-w-0">
        <Hotel size={12} className="text-slate-300 shrink-0" />
        <span className="text-sm font-semibold text-slate-700 truncate">
          {hotel.hotelName}
        </span>
        {isOver && <Trophy size={11} className="text-yellow-500 shrink-0" />}
      </div>

      {/* プログレスバー */}
      <SmallProgressBar
        value={hotel.achievementRate}
        colorClass={colors.bar}
        delay={index * 70}
      />

      {/* 達成率 */}
      <span className={cn('text-sm font-bold tabular w-12 text-right shrink-0', colors.text)}>
        {hotel.achievementRate.toFixed(1)}%
      </span>

      {/* 売上 / 目標 */}
      <div className="w-36 text-right shrink-0 hidden xl:block">
        <p className="text-sm font-bold text-slate-800 tabular">
          {formatCurrency(hotel.currentSales)}
        </p>
        <p className="text-[11px] text-slate-400 tabular">
          / {formatCurrency(hotel.monthlyTarget)}
        </p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// メインコンポーネント
// ══════════════════════════════════════════════════════════════

interface MonthlyKpiSectionProps {
  summary: DashboardSummary
}

export function MonthlyKpiSection({ summary }: MonthlyKpiSectionProps) {
  const [showAll, setShowAll] = useState(false)

  const overallLevel  = getAchievementLevel(summary.overallRate)
  const overallColors = ACHIEVEMENT_COLORS[overallLevel]
  const isAchieved    = summary.overallRate >= 100

  // ドーナツチャート用：全ホテルの部屋タイプ別売上を合算
  const aggregatedRoomSales = aggregateRoomTypeSales(summary.hotels)

  const displayedHotels = showAll ? summary.hotels : summary.hotels.slice(0, 4)

  return (
    <section className="space-y-5">

      {/* ── セクションヘッダー ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target size={16} className="text-teal-600" />
            {summary.targetMonth.replace('-', '年')}月 目標達成状況
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {summary.hotels.length} ホテルの売上を合算して表示
          </p>
        </div>

        {isAchieved && (
          <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full animate-in fade-in duration-500">
            <Sparkles size={12} />
            今月の目標達成！
          </div>
        )}
      </div>

      {/* ── ①サマリーKPIカード群 ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiStatCard
          label="今月の目標売上"
          value={formatCurrency(summary.totalTarget)}
          sub={`${summary.hotels.length} ホテル合算`}
          icon={Target}
          delay={0}
        />
        <KpiStatCard
          label="現在の売上合計"
          value={formatCurrency(summary.totalCurrentSales)}
          sub="清掃売上 + 調整金"
          icon={TrendingUp}
          highlighted
          textColorClass={overallColors.text}
          delay={80}
        />
        <KpiStatCard
          label={summary.remainingAmount >= 0 ? '目標までの残額' : '目標超過額'}
          value={formatCurrency(Math.abs(summary.remainingAmount))}
          sub={summary.remainingAmount < 0 ? '目標をクリアしました！' : undefined}
          icon={summary.remainingAmount < 0 ? TrendingUp : TrendingDown}
          highlighted={summary.remainingAmount < 0}
          textColorClass={summary.remainingAmount < 0 ? 'text-emerald-600' : 'text-slate-600'}
          delay={160}
        />
        <KpiStatCard
          label="目標達成率"
          value={`${summary.overallRate.toFixed(1)}%`}
          sub={rateComment(summary.overallRate)}
          icon={isAchieved ? Trophy : Minus}
          highlighted
          textColorClass={overallColors.text}
          delay={240}
        />
      </div>

      {/* ── ②③+④ メインビジュアルエリア ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

        {/* 左: プログレスバー + ホテル別リスト */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">

          {/* ②全体プログレスバー */}
          <div>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                  全ホテル合計 達成率
                </p>
                <p className="text-xs text-slate-400">
                  {formatCurrency(summary.totalCurrentSales)}
                  <span className="mx-1.5 text-slate-300">/</span>
                  目標 {formatCurrency(summary.totalTarget)}
                </p>
              </div>
              <span className={cn('text-4xl font-bold tabular leading-none', overallColors.text)}>
                {summary.overallRate.toFixed(1)}
                <span className="text-xl font-semibold ml-0.5 text-slate-400">%</span>
              </span>
            </div>

            <OverallProgressBar
              value={summary.overallRate}
              colorHex={overallColors.hex}
            />

            <div className="flex justify-between items-center mt-2">
              <span className="text-[11px] text-slate-400">0%</span>
              <span className={cn(
                'text-xs font-semibold',
                isAchieved ? overallColors.text : 'text-slate-400'
              )}>
                {isAchieved ? '🎉 目標達成！' : `残り ${formatCurrency(summary.remainingAmount)}`}
              </span>
              <span className="text-[11px] text-slate-400">100%</span>
            </div>
          </div>

          {/* ③ホテル別達成率リスト */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              ホテル別 達成率
            </p>

            {summary.hotels.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                ホテルが登録されていません
              </p>
            ) : (
              <>
                {displayedHotels.map((hotel, i) => (
                  <HotelKpiRow key={hotel.hotelId} hotel={hotel} index={i} />
                ))}

                {summary.hotels.length > 4 && (
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className="w-full flex items-center justify-center gap-1.5 mt-2
                               text-xs text-slate-400 hover:text-teal-600
                               py-2 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    {showAll
                      ? <><ChevronUp size={13} /> 折りたたむ</>
                      : <><ChevronDown size={13} /> 残り {summary.hotels.length - 4} 件を表示</>
                    }
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 右: ④ドーナツチャート */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-5">
            今月の売上構成（部屋タイプ別）
          </p>
          <div className="flex-1 min-h-[200px]">
            <SalesDonutChart
              data={aggregatedRoomSales}
              totalSales={summary.totalCurrentSales}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── ユーティリティ ────────────────────────────────────────────

function aggregateRoomTypeSales(hotels: HotelMonthlyKpi[]): RoomTypeSales[] {
  const map = new Map<string, RoomTypeSales>()
  for (const hotel of hotels) {
    for (const rt of hotel.roomTypeSales) {
      const existing = map.get(rt.roomTypeName)
      if (existing) {
        existing.totalRooms += rt.totalRooms
        existing.totalSales += rt.totalSales
      } else {
        map.set(rt.roomTypeName, { ...rt })
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalSales - a.totalSales)
}

function rateComment(rate: number): string {
  if (rate >= 120) return '目標を大幅に超過しています！'
  if (rate >= 100) return '目標達成おめでとうございます！'
  if (rate >= 80)  return 'あと一息、頑張りましょう！'
  if (rate >= 50)  return '着実に積み上げています'
  if (rate > 0)    return '目標に向けて頑張りましょう'
  return '実績データを入力してください'
}
