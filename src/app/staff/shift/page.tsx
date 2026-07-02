'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { Staff, Hotel } from '@/types/database'

type DayStatus = 'available' | 'unavailable'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export default function ShiftPage() {
  const today = new Date()
  // 来月をデフォルト表示
  const defaultMonth = today.getMonth() === 11
    ? { year: today.getFullYear() + 1, month: 0 }
    : { year: today.getFullYear(), month: today.getMonth() + 1 }

  const [year, setYear] = useState(defaultMonth.year)
  const [month, setMonth] = useState(defaultMonth.month)
  const [selectedDays, setSelectedDays] = useState<Record<string, DayStatus>>({})
  const [staffId, setStaffId] = useState<string>('')
  const [hotelId, setHotelId] = useState<string>('')
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 初回マウント時にスタッフ・ホテル取得
  useState(() => {
    const load = async () => {
      const supabase = createClient()
      const [staffRes, hotelRes] = await Promise.all([
        supabase.from('staffs').select('*').order('name'),
        supabase.from('hotels').select('*').order('name'),
      ])
      setStaffs(staffRes.data ?? [])
      setHotels(hotelRes.data ?? [])
      setLoaded(true)
    }
    load()
  })

  const toggleDay = useCallback((day: number) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDays((prev) => {
      if (!prev[key]) return { ...prev, [key]: 'available' }
      return Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key))
    })
  }, [year, month])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const handleSubmit = async () => {
    if (!staffId) { toast.error('スタッフを選んでください'); return }
    if (!hotelId) { toast.error('ホテルを選んでください'); return }
    const days = Object.entries(selectedDays).filter(([, v]) => v === 'available')
    if (days.length === 0) { toast.error('出勤希望日を選んでください'); return }

    setSubmitting(true)
    const supabase = createClient()

    const inserts = days.map(([date]) => ({
      staff_id: staffId,
      hotel_id: hotelId,
      date,
      status: 'requested' as const,
    }))

    const { error } = await supabase
      .from('shifts')
      .upsert(inserts, { onConflict: 'staff_id,date' })

    setSubmitting(false)

    if (error) {
      toast.error('提出に失敗しました', { description: error.message })
    } else {
      toast.success(`${days.length}日分のシフトを提出しました`)
      setSelectedDays({})
    }
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const selectedCount = Object.values(selectedDays).filter(v => v === 'available').length

  return (
    <div className="flex-1 flex flex-col px-5 py-6 gap-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">シフト希望を提出</h1>
        <p className="text-sm text-navy-800/50 mt-1">出勤できる日をタップしてください</p>
      </div>

      {/* スタッフ・ホテル選択 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div>
          <label className="text-xs font-bold text-navy-800/50 uppercase tracking-wide mb-1 block">あなたの名前</label>
          <select
            value={staffId}
            onChange={e => setStaffId(e.target.value)}
            className="w-full border border-linen-200 rounded-xl px-3 py-2.5 text-base bg-linen-50 focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            <option value="">選択してください</option>
            {staffs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-navy-800/50 uppercase tracking-wide mb-1 block">ホテル</label>
          <select
            value={hotelId}
            onChange={e => setHotelId(e.target.value)}
            className="w-full border border-linen-200 rounded-xl px-3 py-2.5 text-base bg-linen-50 focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            <option value="">選択してください</option>
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
      </div>

      {/* カレンダー */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* 月ナビ */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-linen-200">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-linen-100 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-base">
            {year}年{month + 1}月
          </span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-linen-100 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-linen-200">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={cn(
                'text-center text-xs font-bold py-2',
                i === 0 ? 'text-danger' : i === 6 ? 'text-blue-500' : 'text-navy-800/50'
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7">
          {/* 月初の空白 */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isSelected = !!selectedDays[key]
            const weekday = (firstDay + i) % 7
            const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

            return (
              <button
                key={day}
                disabled={isPast}
                onClick={() => toggleDay(day)}
                className={cn(
                  'aspect-square flex items-center justify-center text-sm font-medium transition-all active:scale-90',
                  isPast && 'opacity-25 cursor-not-allowed',
                  isSelected
                    ? 'bg-gold-400 text-navy-900 font-bold'
                    : weekday === 0
                    ? 'text-danger hover:bg-red-50'
                    : weekday === 6
                    ? 'text-blue-500 hover:bg-blue-50'
                    : 'text-navy-900 hover:bg-linen-100'
                )}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* 提出ボタン */}
      <button
        onClick={handleSubmit}
        disabled={submitting || selectedCount === 0}
        className="btn-tap bg-navy-900 text-linen-50 disabled:opacity-40 disabled:scale-100"
      >
        {submitting ? (
          <Loader2 size={24} className="animate-spin" />
        ) : (
          <span className="text-xl">📤</span>
        )}
        <span>
          {selectedCount > 0 ? `${selectedCount}日を提出する` : '日付を選んでください'}
        </span>
      </button>
    </div>
  )
}
