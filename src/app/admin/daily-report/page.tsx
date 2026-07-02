'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import DailyReportTable, { ReportRow } from '@/components/admin/DailyReportTable'
import AdjustmentForm from '@/components/admin/AdjustmentForm'
import SalesSummary from '@/components/admin/SalesSummary'
import { todayString, formatDateJa, cn } from '@/lib/utils'
import type { Hotel, Adjustment } from '@/types/database'
import { Save, Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

type AdjRow = Omit<Adjustment, 'id' | 'hotel_id' | 'date' | 'created_at'>

export default function DailyReportPage() {
  const [hotels, setHotels]           = useState<Hotel[]>([])
  const [hotelId, setHotelId]         = useState('')
  const [date, setDate]               = useState(todayString())
  const [rows, setRows]               = useState<ReportRow[]>([])
  const [adjustments, setAdjustments] = useState<AdjRow[]>([])
  const [loading, setLoading]         = useState(false)
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    createClient().from('hotels').select('*').order('name').then(({ data }) => {
      const list = data ?? []
      setHotels(list)
      if (list.length > 0 && !hotelId) setHotelId(list[0].id)
    })
  }, [])

  const loadData = useCallback(async () => {
    if (!hotelId) return
    setLoading(true)
    const supabase = createClient()
    const { data: roomTypes } = await supabase.from('room_types').select('*').eq('hotel_id', hotelId).order('name')
    const res = await fetch(`/api/daily-report?hotelId=${hotelId}&date=${date}`)
    const existing = await res.json()
    const existingMap: Record<string, number> = {}
    for (const r of existing.reports ?? []) existingMap[r.room_type_id] = r.completed_rooms
    setRows((roomTypes ?? []).map(rt => ({
      roomTypeId: rt.id, roomTypeName: rt.name, unitPrice: rt.unit_price,
      completedRooms: existingMap[rt.id] ?? 0,
    })))
    setAdjustments(existing.adjustments ?? [])
    setLoading(false)
  }, [hotelId, date])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    if (!hotelId) { toast.error('ホテルを選択してください'); return }
    setSaving(true)
    const res = await fetch('/api/daily-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelId, date, rows, adjustments }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) toast.error(data.error ?? '保存に失敗しました')
    else         toast.success('日報を保存しました ✓')
  }

  const shiftDate = (d: number) => {
    const dt = new Date(date); dt.setDate(dt.getDate() + d)
    setDate(dt.toISOString().split('T')[0])
  }

  const baseSales = rows.reduce((s, r) => s + r.completedRooms * r.unitPrice, 0)
  const adjTotal  = adjustments.reduce((s, a) => s + a.amount, 0)
  const roomCount = rows.reduce((s, r) => s + r.completedRooms, 0)
  const isToday   = date === todayString()

  return (
    <div className="p-8">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">日報入力</h1>
          <p className="text-slate-400 text-sm mt-1">清掃完了室数を入力するとリアルタイムで売上が集計されます</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hotelId}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm',
            'bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-sm',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          保存する
        </button>
      </div>

      {/* コントロールバー */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        {/* ホテル */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">ホテル</label>
          <select
            value={hotelId} onChange={e => setHotelId(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-w-[180px] bg-white"
          >
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>

        <div className="w-px h-5 bg-slate-200" />

        {/* 日付 */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => shiftDate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
            <ChevronLeft size={16} />
          </button>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white"
          />
          <button onClick={() => shiftDate(1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
            <ChevronRight size={16} />
          </button>
          <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400" title="再読み込み">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isToday && (
            <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">今日</span>
          )}
          <span className="text-sm text-slate-400">{formatDateJa(date)}</span>
        </div>
      </div>

      {/* メインレイアウト */}
      <div className="flex gap-6 items-start">
        {/* テーブル + 調整金 */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-16">
                <Loader2 size={28} className="animate-spin text-slate-300" />
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center p-16 text-slate-400">
                <p className="text-base">このホテルの部屋タイプが登録されていません</p>
              </div>
            ) : (
              <DailyReportTable rows={rows} onChange={(id, v) =>
                setRows(prev => prev.map(r => r.roomTypeId === id ? { ...r, completedRooms: v } : r))
              } />
            )}
          </div>

          {rows.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">調整金</h2>
              <AdjustmentForm adjustments={adjustments} onChange={setAdjustments} />
            </div>
          )}
        </div>

        {/* サイドサマリー */}
        <div className="w-60 shrink-0 sticky top-8 space-y-3">
          <SalesSummary baseSales={baseSales} adjustment={adjTotal} roomCount={roomCount} />
          <button
            onClick={handleSave}
            disabled={saving || !hotelId}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-xl py-3',
              'bg-teal-600 text-white font-semibold text-sm',
              'hover:bg-teal-500 transition-colors shadow-sm shadow-teal-600/20',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            保存する
          </button>
        </div>
      </div>
    </div>
  )
}
