'use client'

/**
 * src/components/admin/MonthlyKpiSection.tsx
 * セクション A ― 全社サマリー KPI（全体達成状況 + ドーナツチャート）
 */

import { useEffect, useRef, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Progress }  from '@/components/ui/progress'
import { formatCurrency, cn } from '@/lib/utils'
import { getAchievementTheme } from '@/lib/kpi'
import { Target, TrendingUp, Minus } from 'lucide-react'

// ── 型定義（admin/page.tsx からも import） ────────────────────
export interface RoomTypeBreakdown {
  name:       string
  sales:      number
  rooms:      number
  unit_price: number
}

export interface MonthlyKpiData {
  totalTarget:  number
  totalSales:   number
  adjustment:   number
  breakdown:    RoomTypeBreakdown[]
  monthLabel:   string
  daysElapsed:  number
  daysInMonth:  number
}

const CHART_COLORS = [
  '#0d9488','#0ea5e9','#8b5cf6','#f59e0b',
  '#10b981','#f43f5e','#6366f1','#ec4899',
]

// ── カウントアップ Hook ───────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return value
}

// ── Donut Tooltip ─────────────────────────────────────────────
function DonutTooltip({ active, payload }: {
  active?: boolean
  payload?: { payload: RoomTypeBreakdown }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-bold text-slate-900 mb-1">{d.name}</p>
      <p className="text-slate-500">売上: <span className="font-semibold text-slate-800">{formatCurrency(d.sales)}</span></p>
      <p className="text-slate-500">{d.rooms}室 × {formatCurrency(d.unit_price)}</p>
    </div>
  )
}

// ── メインコンポーネント ──────────────────────────────────────
export function MonthlyKpiSection({ data }: { data: MonthlyKpiData }) {
  const { totalTarget, totalSales, adjustment, breakdown, monthLabel, daysElapsed, daysInMonth } = data

  const actual      = totalSales + adjustment
  const pct         = totalTarget > 0 ? Math.round((actual / totalTarget) * 100) : 0
  const remaining   = Math.max(0, totalTarget - actual)
  const theme       = getAchievementTheme(pct)
  const StatusIcon  = theme.icon
  const projected   = daysElapsed > 0 ? Math.round((actual / daysElapsed) * daysInMonth) : 0
  const projPct     = totalTarget > 0 ? Math.round((projected / totalTarget) * 100) : 0

  const [dispPct, setDispPct] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setDispPct(Math.min(pct, 100)), 150)
    return () => clearTimeout(t)
  }, [pct])

  const animSales  = useCountUp(actual)
  const animTarget = useCountUp(totalTarget)
  const animRem    = useCountUp(remaining)
  const chartData  = breakdown.filter(d => d.sales > 0)

  return (
    <section className="mb-2 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center border shadow-lg',
            theme.bg, theme.border, theme.glow
          )}>
            <StatusIcon size={18} className={theme.text} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{monthLabel} の全社目標達成状況</h2>
            <p className="text-xs text-slate-400 mt-0.5">月{daysInMonth}日中 {daysElapsed}日経過</p>
          </div>
        </div>
        <span className={cn('text-xs font-bold px-3 py-1.5 rounded-full', theme.badge)}>
          {theme.label}
        </span>
      </div>

      {/* メインパネル */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* 左 2/3: KPIカード + プログレスバー */}
        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">

            {/* 目標 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Target size={12} /> 月間目標売上
              </p>
              <p className="text-2xl font-bold text-slate-900 tabular leading-none">
                {formatCurrency(animTarget)}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                日割り目標: {formatCurrency(Math.round(totalTarget / daysInMonth))} /日
              </p>
            </div>

            {/* 実績 */}
            <div className={cn(
              'rounded-2xl border shadow-sm p-5',
              pct >= 100
                ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900 border-slate-900'
            )}>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <TrendingUp size={12} /> 現在の売上合計
              </p>
              <p className={cn('text-2xl font-bold tabular leading-none', pct >= 100 ? 'text-white' : 'text-teal-400')}>
                {formatCurrency(animSales)}
              </p>
              <p className="text-xs text-white/40 mt-2">清掃売上 + 調整金</p>
            </div>

            {/* 残額 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Minus size={12} /> 目標までの残額
              </p>
              {remaining === 0 ? (
                <p className="text-2xl font-bold text-emerald-600 tabular leading-none">達成済み 🎉</p>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-900 tabular leading-none">{formatCurrency(animRem)}</p>
                  <p className="text-xs text-slate-400 mt-2">あと {daysInMonth - daysElapsed} 日</p>
                </>
              )}
            </div>

            {/* 達成率 */}
            <div className={cn('rounded-2xl border shadow-sm p-5', theme.bg, theme.border)}>
              <p className={cn('text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5', theme.text)}>
                <StatusIcon size={12} /> 目標達成率
              </p>
              <div className="flex items-baseline gap-1">
                <span className={cn('text-4xl font-bold tabular leading-none', theme.text)}>{pct}</span>
                <span className={cn('text-xl font-bold', theme.text)}>%</span>
              </div>
              <p className={cn('text-xs mt-2 opacity-70', theme.text)}>月末予測: {projPct}%</p>
            </div>
          </div>

          {/* プログレスバー */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">月間進捗</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">
                  <span className={cn('font-bold', theme.text)}>{formatCurrency(actual)}</span>
                  {' '}/ {formatCurrency(totalTarget)}
                </span>
                <span className={cn('font-bold px-2 py-0.5 rounded-full', theme.badge)}>{pct}%</span>
              </div>
            </div>

            <Progress
              value={dispPct}
              className="h-4 bg-slate-100"
              indicatorClassName={cn(
                'rounded-full',
                theme.bar,
                pct >= 100 && 'shadow-lg shadow-emerald-500/40'
              )}
            />

            <div className="mt-2.5">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>月間経過日数</span>
                <span>{daysElapsed} / {daysInMonth}日（{Math.round((daysElapsed / daysInMonth) * 100)}%）</span>
              </div>
              <Progress
                value={Math.round((daysElapsed / daysInMonth) * 100)}
                className="h-1.5 bg-slate-100"
                indicatorClassName="bg-slate-300 rounded-full"
              />
            </div>

            {totalTarget > 0 && daysElapsed > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
                {[
                  { label: '日次平均売上', value: formatCurrency(Math.round(actual / daysElapsed)), sub: '実績ベース' },
                  { label: '必要ペース',   value: formatCurrency(remaining > 0 ? Math.round(remaining / Math.max(daysInMonth - daysElapsed, 1)) : 0), sub: remaining > 0 ? '残日数割り' : '達成済み' },
                  { label: '月末着地予測', value: formatCurrency(projected), sub: `目標比 ${projPct}%`,
                    accent: projPct >= 100 ? 'text-emerald-600' : projPct >= 80 ? 'text-teal-600' : 'text-amber-600' },
                ].map(({ label, value, sub, accent }) => (
                  <div key={label} className="text-center">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className={cn('font-bold text-sm tabular', accent ?? 'text-slate-800')}>{value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右 1/3: ドーナツチャート */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
            部屋タイプ別 売上構成比
          </p>
          {chartData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <TrendingUp size={22} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">今月の実績データがありません</p>
              <p className="text-xs text-slate-300 mt-1">日報を入力すると表示されます</p>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="sales" nameKey="name"
                      cx="50%" cy="50%" innerRadius="55%" outerRadius="80%"
                      paddingAngle={3} strokeWidth={0}
                      animationBegin={300} animationDuration={900} animationEasing="ease-out"
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {chartData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-xs text-slate-600 flex-1 truncate">{item.name}</span>
                    <span className="text-xs font-semibold text-slate-700 tabular">
                      {actual > 0 ? Math.round((item.sales / actual) * 100) : 0}%
                    </span>
                    <span className="text-xs text-slate-400 tabular w-20 text-right">
                      {formatCurrency(item.sales)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between">
                <span className="text-xs text-slate-400 font-semibold">合計</span>
                <span className="text-sm font-bold text-slate-900 tabular">{formatCurrency(actual)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
