'use client'

import { useState } from 'react'
import { Plus, Minus, X, PlusCircle } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import type { Adjustment } from '@/types/database'

type AdjRow = Omit<Adjustment, 'id' | 'hotel_id' | 'date' | 'created_at'>

interface AdjustmentFormProps {
  adjustments: AdjRow[]
  onChange: (adjustments: AdjRow[]) => void
}

export default function AdjustmentForm({ adjustments, onChange }: AdjustmentFormProps) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [sign, setSign]     = useState<1 | -1>(1)

  const add = () => {
    const v = parseInt(amount.replace(/,/g, ''), 10)
    if (isNaN(v) || v === 0) return
    onChange([...adjustments, { amount: v * sign, reason: reason || null }])
    setAmount('')
    setReason('')
  }

  const remove = (i: number) => onChange(adjustments.filter((_, idx) => idx !== i))
  const total  = adjustments.reduce((s, a) => s + a.amount, 0)

  return (
    <div className="space-y-3">
      {/* 入力フォーム */}
      <div className="flex gap-2 items-end">
        {/* +/- トグル */}
        <div className="flex rounded-xl overflow-hidden border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setSign(1)}
            className={cn(
              'px-3 py-2.5 text-sm font-bold transition-colors flex items-center',
              sign === 1 ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'
            )}
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={() => setSign(-1)}
            className={cn(
              'px-3 py-2.5 text-sm font-bold transition-colors flex items-center',
              sign === -1 ? 'bg-rose-500 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'
            )}
          >
            <Minus size={15} />
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">金額（円）</label>
          <input
            type="number" min={0} value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="1000"
            className="w-28 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 tabular"
          />
        </div>

        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">理由</label>
          <input
            type="text" value={reason}
            onChange={e => setReason(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="例：クレーム対応、追加清掃..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>

        <button
          type="button" onClick={add} disabled={!amount}
          className="shrink-0 flex items-center gap-1.5 bg-slate-900 text-white rounded-xl px-4 py-2 text-sm font-semibold
                     hover:bg-slate-800 disabled:opacity-40 transition-colors"
        >
          <PlusCircle size={15} /> 追加
        </button>
      </div>

      {/* 調整リスト */}
      {adjustments.length > 0 && (
        <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200 divide-y divide-slate-200">
          {adjustments.map((adj, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className={cn(
                'font-bold tabular text-sm w-24 shrink-0',
                adj.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
              )}>
                {adj.amount >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
              </span>
              <span className="flex-1 text-sm text-slate-600">{adj.reason ?? '—'}</span>
              <button
                type="button" onClick={() => remove(i)}
                className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {/* 合計 */}
          <div className="flex justify-between px-4 py-2.5 bg-white">
            <span className="text-sm text-slate-400 font-medium">調整合計</span>
            <span className={cn('tabular font-bold text-sm', total >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {total >= 0 ? '+' : ''}{formatCurrency(total)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
