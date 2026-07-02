'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import QrScanner from '@/components/staff/QrScanner'
import StaffSelector from '@/components/staff/StaffSelector'
import { formatTime, cn } from '@/lib/utils'
import type { Staff, Role, Hotel } from '@/types/database'
import {
  Loader2, CheckCircle2, QrCode, ChevronRight,
  LogIn, LogOut, Clock, ArrowLeft,
} from 'lucide-react'

type StaffWithRole = Staff & { roles: Role | null }
type Step = 'scan' | 'select_staff' | 'confirm' | 'done'
interface ClockResult {
  action: 'clock_in' | 'clock_out'
  time: string
  staffName: string
}

// ── 状態ごとのデザイントークン ──────────────────────────────
const STATE = {
  before: {
    bg:         'bg-sky-500',
    bgLight:    'bg-sky-50',
    text:       'text-sky-600',
    textLight:  'text-sky-500',
    border:     'border-sky-200',
    ring:       'ring-sky-500',
    label:      '未出勤',
    badgeBg:    'bg-sky-100',
    badgeText:  'text-sky-700',
    btnLabel:   '出勤する',
    icon:       LogIn,
    pulse:      'animate-pulse-ring-sky',
  },
  working: {
    bg:         'bg-emerald-500',
    bgLight:    'bg-emerald-50',
    text:       'text-emerald-600',
    textLight:  'text-emerald-500',
    border:     'border-emerald-200',
    ring:       'ring-emerald-500',
    label:      '勤務中',
    badgeBg:    'bg-emerald-100',
    badgeText:  'text-emerald-700',
    btnLabel:   '退勤する',
    icon:       LogOut,
    pulse:      'animate-pulse-ring',
  },
  done: {
    bg:         'bg-slate-400',
    bgLight:    'bg-slate-50',
    text:       'text-slate-600',
    textLight:  'text-slate-400',
    border:     'border-slate-200',
    ring:       'ring-slate-400',
    label:      '退勤済',
    badgeBg:    'bg-slate-100',
    badgeText:  'text-slate-600',
    btnLabel:   'お疲れさまでした',
    icon:       CheckCircle2,
    pulse:      '',
  },
} as const

// ── ライブ時計 ─────────────────────────────────────────────
function LiveClock({ clockInTime }: { clockInTime: string | null }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (clockInTime) {
    const elapsed = Math.floor((now.getTime() - new Date(clockInTime).getTime()) / 1000)
    const h = Math.floor(elapsed / 3600)
    const m = Math.floor((elapsed % 3600) / 60)
    const s = elapsed % 60
    return (
      <div className="text-center">
        <p className="text-slate-500 text-xs mb-1">勤務経過時間</p>
        <p className="text-4xl font-bold tabular text-slate-900 tracking-tight">
          {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}
          <span className="text-2xl text-slate-400">:{String(s).padStart(2,'0')}</span>
        </p>
        <p className="text-slate-400 text-xs mt-1">{formatTime(clockInTime)} 出勤</p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-4xl font-bold tabular text-slate-900 tracking-tight">
        {now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        <span className="text-xl text-slate-400">
          :{String(now.getSeconds()).padStart(2,'0')}
        </span>
      </p>
      <p className="text-slate-400 text-xs mt-1">
        {now.toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric', weekday:'short' })}
      </p>
    </div>
  )
}

// ── メインページ ────────────────────────────────────────────
export default function ClockPage() {
  const [step, setStep]               = useState<Step>('scan')
  const [scannerActive, setScannerActive] = useState(true)
  const [hotelId, setHotelId]         = useState<string | null>(null)
  const [hotelName, setHotelName]     = useState('')
  const [staffs, setStaffs]           = useState<StaffWithRole[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState<ClockResult | null>(null)
  const [clockInTime, setClockInTime] = useState<string | null>(null)

  const handleQrScan = async (text: string) => {
    if (step !== 'scan') return
    const match = text.match(/^hotel:([0-9a-f-]{36})$/)
    if (!match) {
      toast.error('このQRコードは対応していません', { description: 'ホテル入口のQRコードを読み取ってください' })
      return
    }
    const id = match[1]
    setScannerActive(false)
    const supabase = createClient()
    const { data: hotel, error } = await supabase.from('hotels').select('*').eq('id', id).single()
    if (error || !hotel) { toast.error('ホテルが見つかりません'); setScannerActive(true); return }
    const { data: staffData } = await supabase.from('staffs').select('*, roles(*)').order('name')
    setHotelId(id)
    setHotelName(hotel.name)
    setStaffs((staffData ?? []) as StaffWithRole[])
    setStep('select_staff')
  }

  const handleClock = async () => {
    if (!selectedStaffId || !hotelId) return
    setLoading(true)
    try {
      const res = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: selectedStaffId, hotelId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? '打刻に失敗しました'); return }
      const staff = staffs.find(s => s.id === selectedStaffId)
      setResult({
        action:    data.action,
        time:      data.action === 'clock_out' ? data.attendance.clock_out : data.attendance.clock_in,
        staffName: staff?.name ?? '',
      })
      if (data.action === 'clock_in') setClockInTime(data.attendance.clock_in)
      setStep('done')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('scan'); setScannerActive(true); setHotelId(null)
    setHotelName(''); setSelectedStaffId(null); setResult(null); setClockInTime(null)
  }

  // ── STEP: QRスキャン ──────────────────────────────────────
  if (step === 'scan') return (
    <div className="flex-1 flex flex-col px-5 py-4 gap-5 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-slate-900">QRコードをかざす</h1>
        <p className="text-sm text-slate-500 mt-1">ホテル入口のQRコードにカメラを向けてください</p>
      </div>

      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 overflow-hidden">
        <QrScanner active={scannerActive} onScan={handleQrScan} onError={() => {}} />
      </div>

      <div className="flex items-start gap-3 bg-teal-50 rounded-2xl p-4 text-sm text-teal-700 border border-teal-100">
        <QrCode size={18} className="shrink-0 mt-0.5" />
        <span>カメラのアクセスを許可してください。読み取り後、自動で次のステップへ進みます。</span>
      </div>
    </div>
  )

  // ── STEP: スタッフ選択 ────────────────────────────────────
  if (step === 'select_staff') return (
    <div className="flex-1 flex flex-col px-5 py-4 gap-5 animate-slide-up">
      <div>
        <p className="text-sm text-teal-600 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
          {hotelName}
        </p>
        <h1 className="text-xl font-bold text-slate-900 mt-1">あなたを選んでください</h1>
      </div>

      <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2">
        <StaffSelector staffs={staffs} selectedId={selectedStaffId} onSelect={setSelectedStaffId} />
      </div>

      <button
        disabled={!selectedStaffId || loading}
        onClick={() => setStep('confirm')}
        className={cn(
          'btn-clock h-16 text-white shadow-lg',
          selectedStaffId
            ? 'bg-teal-600 shadow-teal-600/30 hover:bg-teal-500'
            : 'bg-slate-300 shadow-none cursor-not-allowed'
        )}
      >
        <span className="flex items-center gap-2 text-base">
          次へ <ChevronRight size={20} />
        </span>
      </button>
    </div>
  )

  // ── STEP: 確認 ────────────────────────────────────────────
  if (step === 'confirm') return (
    <div className="flex-1 flex flex-col px-5 py-4 gap-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => setStep('select_staff')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">内容を確認</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {[
          { label: 'ホテル', value: hotelName },
          { label: '名前',   value: staffs.find(s => s.id === selectedStaffId)?.name ?? '' },
          { label: '時刻',   value: new Date().toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit' }) },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center px-5 py-4">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="font-semibold text-slate-900 tabular">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      <button
        disabled={loading}
        onClick={handleClock}
        className="btn-clock h-20 bg-teal-600 text-white shadow-xl shadow-teal-600/30 hover:bg-teal-500"
      >
        {loading
          ? <Loader2 size={28} className="animate-spin" />
          : <span className="flex flex-col items-center gap-1">
              <Clock size={24} />
              <span className="text-base font-bold">打刻する</span>
            </span>
        }
      </button>
    </div>
  )

  // ── STEP: 完了 ────────────────────────────────────────────
  if (step === 'done' && result) {
    const isClockin = result.action === 'clock_in'
    const token = isClockin ? STATE.working : STATE.done

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-8 animate-scale-in">
        {/* アイコン + パルスリング */}
        <div className="relative flex items-center justify-center">
          <div className={cn(
            'absolute w-32 h-32 rounded-full opacity-30',
            token.bg, token.pulse
          )} />
          <div className={cn('w-24 h-24 rounded-full flex items-center justify-center', token.bg)}>
            {isClockin
              ? <LogIn size={44} className="text-white" />
              : <LogOut size={44} className="text-white" />
            }
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-3xl font-bold text-slate-900">
            {isClockin ? '出勤しました' : '退勤しました'}
          </p>
          <p className="text-slate-500 text-base">{result.staffName}さん</p>
          <p className={cn('text-5xl font-bold tabular mt-4', token.text)}>
            {formatTime(result.time)}
          </p>
        </div>

        <div className={cn('w-full rounded-2xl p-4 text-center text-sm', token.bgLight, token.text)}>
          {isClockin
            ? '今日もよろしくお願いします！'
            : 'お疲れさまでした！ゆっくり休んでください。'}
        </div>

        <button
          onClick={reset}
          className="btn-clock h-16 w-full bg-slate-900 text-white hover:bg-slate-800 text-base font-bold"
        >
          完了
        </button>
      </div>
    )
  }

  return null
}
