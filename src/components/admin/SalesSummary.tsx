'use client'

import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Home, Sliders } from 'lucide-react'

interface SalesSummaryProps {
  baseSales: number
  adjustment: number
  roomCount: number
}

export default function SalesSummary({ baseSales, adjustment, roomCount }: SalesSummaryProps) {
  const total = baseSales + adjustment
  const pct   = baseSales > 0 ? Math.round((baseSales / (total || baseSales)) * 100) : 0

  return (
    <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-5">
      {/* タイトル */}
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="text-teal-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">想定売上</span>
      </div>

      {/* 合計金額（大） */}
      <div>
        <p className="text-xs text-slate-500 mb-1">請求予定合計</p>
        <p className="text-3xl font-bold tabular text-teal-400 leading-none">
          {formatCurrency(total)}
        </p>
      </div>

      {/* 内訳 */}
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-400">
            <Home size={13} /> 清掃売上
          </span>
          <span className="tabular">{formatCurrency(baseSales)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-400">
            <Sliders size={13} /> 調整金
          </span>
          <span className={cn('tabular font-semibold', adjustment >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
            {adjustment >= 0 ? '+' : ''}{formatCurrency(adjustment)}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>清掃室数</span>
          <span className="tabular font-semibold text-white">{roomCount} 室</span>
        </div>
      </div>

      {/* プログレスバー */}
      {total > 0 && (
        <div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">清掃売上が全体の {pct}%</p>
        </div>
      )}
    </div>
  )
}

// cn を直接インポートしていない場合のフォールバック
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
