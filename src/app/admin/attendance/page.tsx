'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatTime, calcWorkMinutes, minutesToHHMM, todayString, cn } from '@/lib/utils'
import type { Hotel } from '@/types/database'
import { ChevronLeft, ChevronRight, Loader2, Circle } from 'lucide-react'

interface AttendanceRow {
  id: string; staffName: string; roleName: string; hourlyWage: number
  clockIn: string; clockOut: string | null; breakMinutes: number
}

export default function AttendancePage() {
  const [hotels, setHotels]   = useState<Hotel[]>([])
  const [hotelId, setHotelId] = useState('')
  const [date, setDate]       = useState(todayString())
  const [rows, setRows]       = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    createClient().from('hotels').select('*').order('name').then(({ data }) => {
      const list = data ?? []; setHotels(list)
      if (list.length > 0) setHotelId(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!hotelId) return
    setLoading(true)
    const supabase = createClient()
    const start = new Date(date); const end = new Date(date); end.setDate(end.getDate() + 1)
    supabase.from('attendances').select('*, staffs(name, roles(name, hourly_wage))')
      .eq('hotel_id', hotelId).gte('clock_in', start.toISOString()).lt('clock_in', end.toISOString()).order('clock_in')
      .then(({ data }) => {
        setRows((data ?? []).map(a => {
          const s = a.staffs as unknown as { name: string; roles: { name: string; hourly_wage: number } | null }
          return { id: a.id, staffName: s?.name ?? '—', roleName: s?.roles?.name ?? '—', hourlyWage: s?.roles?.hourly_wage ?? 0,
            clockIn: a.clock_in, clockOut: a.clock_out, breakMinutes: a.break_minutes }
        }))
        setLoading(false)
      })
  }, [hotelId, date])

  const shiftDate = (d: number) => {
    const dt = new Date(date); dt.setDate(dt.getDate() + d); setDate(dt.toISOString().split('T')[0])
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">勤怠確認</h1>
        <p className="text-slate-400 text-sm mt-1">スタッフの出退勤状況と想定賃金</p>
      </div>

      <div className="flex items-center gap-4 mb-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">ホテル</label>
          <select value={hotelId} onChange={e => setHotelId(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white">
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        <div className="w-px h-5 bg-slate-200" />
        <div className="flex items-center gap-1.5">
          <button onClick={() => shiftDate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"><ChevronLeft size={16} /></button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white" />
          <button onClick={() => shiftDate(1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"><ChevronRight size={16} /></button>
        </div>
        {rows.filter(r => !r.clockOut).length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            {rows.filter(r => !r.clockOut).length}名 勤務中
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-16"><Loader2 size={28} className="animate-spin text-slate-300" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center p-16 text-slate-400">この日の勤怠記録はありません</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                {['スタッフ','役割','出勤','退勤','休憩','勤務時間','想定賃金'].map((h, i) => (
                  <th key={h} className={cn(
                    'py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide',
                    i === 0 ? 'text-left' : i === 1 ? 'text-left' : 'text-right'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const workMin = calcWorkMinutes(row.clockIn, row.clockOut, row.breakMinutes)
                const wage    = Math.round((workMin / 60) * row.hourlyWage)
                const working = !row.clockOut
                return (
                  <tr key={row.id} className={cn('border-b border-slate-100 hover:bg-slate-50 transition-colors', i % 2 === 1 ? 'bg-slate-50/40' : '')}>
                    <td className="py-3 px-4 font-medium text-slate-800">{row.staffName}</td>
                    <td className="py-3 px-4 text-slate-400">{row.roleName}</td>
                    <td className="py-3 px-4 text-right tabular">{formatTime(row.clockIn)}</td>
                    <td className="py-3 px-4 text-right">
                      {working ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> 勤務中
                        </span>
                      ) : <span className="tabular">{formatTime(row.clockOut)}</span>}
                    </td>
                    <td className="py-3 px-4 text-right tabular text-slate-400">{row.breakMinutes}分</td>
                    <td className="py-3 px-4 text-right tabular font-medium">{working ? '—' : minutesToHHMM(workMin)}</td>
                    <td className="py-3 px-4 text-right tabular font-semibold text-slate-800">
                      {working ? '—' : `¥${wage.toLocaleString()}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
