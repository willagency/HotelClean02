'use client'

import { useRef, useCallback } from 'react'
import { formatCurrency, cn } from '@/lib/utils'

export interface ReportRow {
  roomTypeId: string
  roomTypeName: string
  unitPrice: number
  completedRooms: number
}

interface DailyReportTableProps {
  rows: ReportRow[]
  onChange: (roomTypeId: string, value: number) => void
}

export default function DailyReportTable({ rows, onChange }: DailyReportTableProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, currentId: string) => {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        const ids  = rows.map(r => r.roomTypeId)
        const next = ids[(ids.indexOf(currentId) + 1) % ids.length]
        inputRefs.current[next]?.focus()
        inputRefs.current[next]?.select()
      }
    },
    [rows]
  )

  const subtotal   = rows.reduce((s, r) => s + r.completedRooms * r.unitPrice, 0)
  const totalRooms = rows.reduce((s, r) => s + r.completedRooms, 0)

  return (
    <div className="overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">部屋タイプ</th>
            <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">単価</th>
            <th className="text-right px-3 py-3 text-xs font-semibold text-teal-600 uppercase tracking-wide w-36 bg-teal-50/50">
              完了室数
              <span className="block text-[10px] font-normal text-teal-400 normal-case">Tab / Enter で移動</span>
            </th>
            <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-32">小計</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const sub = row.completedRooms * row.unitPrice
            return (
              <tr
                key={row.roomTypeId}
                className={cn(
                  'border-b border-slate-100 transition-colors',
                  'hover:bg-slate-50 group'
                )}
              >
                <td className="px-5 py-3.5 font-medium text-slate-800">{row.roomTypeName}</td>
                <td className="px-5 py-3.5 text-right tabular text-slate-400">{formatCurrency(row.unitPrice)}</td>
                <td className="px-1.5 py-1.5 bg-teal-50/50">
                  <input
                    ref={el => { inputRefs.current[row.roomTypeId] = el }}
                    type="number" min={0} max={999}
                    value={row.completedRooms === 0 ? '' : row.completedRooms}
                    placeholder="0"
                    onChange={e => {
                      const v = parseInt(e.target.value, 10)
                      onChange(row.roomTypeId, isNaN(v) ? 0 : Math.max(0, v))
                    }}
                    onKeyDown={e => handleKeyDown(e, row.roomTypeId)}
                    onFocus={e => e.target.select()}
                    className={cn(
                      'sheet-cell text-slate-900 placeholder:text-slate-300',
                      'h-9 rounded-lg',
                      // フォーカス時に teal のリングが入力セルを光らせる
                      'focus:bg-white focus:ring-2 focus:ring-teal-500/50 focus:ring-inset'
                    )}
                  />
                </td>
                <td className="px-5 py-3.5 text-right tabular font-semibold text-slate-800">
                  {sub > 0 ? formatCurrency(sub) : <span className="text-slate-300 font-normal">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-slate-900 text-white">
            <td className="px-5 py-4 font-bold rounded-bl-xl" colSpan={2}>合計</td>
            <td className="px-5 py-4 text-right tabular font-bold text-teal-300">{totalRooms} 室</td>
            <td className="px-5 py-4 text-right tabular font-bold text-teal-300 text-base rounded-br-xl">{formatCurrency(subtotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
