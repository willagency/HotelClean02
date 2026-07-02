'use client'

/**
 * src/components/admin/dashboard/SalesDonutChart.tsx
 *
 * 部屋タイプ別売上構成比のドーナツチャート。
 * recharts の PieChart を使用。
 * shadcn/ui のデザイントークン（CSS変数）と整合するカラーパレットを使用。
 */

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { RoomTypeSales } from '@/lib/dashboard'

// ── カラーパレット（Zinc/Tealベースで視認性が高い組み合わせ）──
const PALETTE = [
  '#0d9488', // teal-600
  '#0ea5e9', // sky-500
  '#6366f1', // indigo-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#f97316', // orange-500
]

interface SalesDonutChartProps {
  data: RoomTypeSales[]
  totalSales: number
}

// ── カスタム Tooltip ─────────────────────────────────────────
function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: RoomTypeSales & { color: string } }>
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const pct  = item.payload.totalSales > 0
    ? Math.round((item.value / ((payload[0].payload as unknown as { _total: number })._total ?? 1)) * 100)
    : 0

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm min-w-[160px]">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: item.payload.color }}
        />
        <span className="font-semibold text-slate-800">{item.name}</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">売上</span>
          <span className="font-bold text-slate-900 tabular">{formatCurrency(item.value)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">室数</span>
          <span className="font-bold text-slate-900 tabular">{item.payload.totalRooms} 室</span>
        </div>
      </div>
    </div>
  )
}

// ── カスタム Legend ──────────────────────────────────────────
function CustomLegend({
  data,
  totalSales,
}: {
  data: (RoomTypeSales & { color: string })[]
  totalSales: number
}) {
  return (
    <div className="flex flex-col gap-2 justify-center pl-2">
      {data.map(item => {
        const pct = totalSales > 0
          ? Math.round((item.totalSales / totalSales) * 100)
          : 0
        return (
          <div key={item.roomTypeId} className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600 font-medium truncate">
                  {item.roomTypeName}
                </span>
                <span className="text-xs font-bold text-slate-800 tabular shrink-0">
                  {pct}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tabular">
                {formatCurrency(item.totalSales)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── メインコンポーネント ─────────────────────────────────────
export function SalesDonutChart({ data, totalSales }: SalesDonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-slate-400">まだ実績データがありません</p>
      </div>
    )
  }

  const chartData = data.map((item, i) => ({
    ...item,
    name:  item.roomTypeName,
    value: item.totalSales,
    color: PALETTE[i % PALETTE.length],
    _total: totalSales,
  }))

  return (
    <div className="flex items-center gap-4 h-full">
      {/* ドーナツ */}
      <div className="w-[180px] h-[180px] shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              animationBegin={100}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* 中央テキスト */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] text-slate-400 font-medium">今月合計</span>
          <span className="text-base font-bold text-slate-900 tabular leading-tight">
            {formatCurrency(totalSales)}
          </span>
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex-1 min-w-0">
        <CustomLegend data={chartData} totalSales={totalSales} />
      </div>
    </div>
  )
}
