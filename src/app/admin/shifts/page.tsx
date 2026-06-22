'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Loader2, Check, X } from 'lucide-react'

interface ShiftRow { id: string; staffName: string; hotelName: string; date: string; status: 'requested' | 'approved' | 'rejected' }

const STATUS = {
  requested: { label: '申請中',  cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
  approved:  { label: '承認済', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  rejected:  { label: '却下',   cls: 'bg-rose-50 text-rose-600 border border-rose-200' },
}

export default function ShiftsPage() {
  const [rows, setRows]       = useState<ShiftRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'all' | 'requested'>('requested')

  const load = async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('shifts').select('*, staffs(name), hotels(name)').order('date')
    if (filter === 'requested') q = q.eq('status', 'requested')
    const { data } = await q
    setRows((data ?? []).map(s => ({
      id: s.id,
      staffName: (s.staffs as unknown as { name: string })?.name ?? '—',
      hotelName: (s.hotels as unknown as { name: string })?.name ?? '—',
      date: s.date, status: s.status as 'requested' | 'approved' | 'rejected',
    })))
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await createClient().from('shifts').update({ status }).eq('id', id)
    if (error) toast.error('更新に失敗しました')
    else { toast.success(status === 'approved' ? 'シフトを承認しました' : 'シフトを却下しました'); load() }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">シフト管理</h1>
        <p className="text-slate-400 text-sm mt-1">スタッフからのシフト申請を確認・承認します</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['requested', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
              filter === f ? 'bg-teal-600 text-white' : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200')}>
            {f === 'requested' ? '申請中のみ' : 'すべて表示'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-16"><Loader2 size={28} className="animate-spin text-slate-300" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center p-16 text-slate-400">{filter === 'requested' ? '申請中のシフトはありません' : 'シフトデータがありません'}</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                {['スタッフ','ホテル','希望日','ステータス','操作'].map((h, i) => (
                  <th key={h} className={cn('py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide',
                    i < 3 ? 'text-left' : 'text-center')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className={cn('border-b border-slate-100 hover:bg-slate-50 transition-colors', i % 2 === 1 ? 'bg-slate-50/40' : '')}>
                  <td className="py-3 px-4 font-medium text-slate-800">{row.staffName}</td>
                  <td className="py-3 px-4 text-slate-400">{row.hotelName}</td>
                  <td className="py-3 px-4 tabular">
                    {new Date(row.date).toLocaleDateString('ja-JP', { month:'long', day:'numeric', weekday:'short' })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn('inline-block px-2.5 py-1 rounded-full text-xs font-semibold', STATUS[row.status].cls)}>
                      {STATUS[row.status].label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {row.status === 'requested' && (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateStatus(row.id, 'approved')}
                          className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-400 transition-colors">
                          <Check size={12} /> 承認
                        </button>
                        <button onClick={() => updateStatus(row.id, 'rejected')}
                          className="flex items-center gap-1 bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-rose-400 transition-colors">
                          <X size={12} /> 却下
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
