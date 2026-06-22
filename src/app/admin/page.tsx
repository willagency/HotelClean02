/**
 * src/app/admin/page.tsx  — 管理者ダッシュボード（Server Component）
 *
 * データ集計:
 *   ① 全体KPI   → MonthlyKpiSection（セクション A）
 *   ② ホテル別  → HotelKpiGrid    （セクション B）
 *   ③ 本日速報  → KpiCard 群
 */

import { createClient }   from '@/lib/supabase/server'
import { formatCurrency, todayString } from '@/lib/utils'
import {
  TrendingUp, Users, ClipboardCheck, Hotel,
  ArrowUpRight, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import {
  MonthlyKpiSection,
  type MonthlyKpiData,
  type RoomTypeBreakdown,
} from '@/components/admin/MonthlyKpiSection'
import {
  HotelKpiGrid,
  type HotelKpiItem,
} from '@/components/admin/HotelKpiGrid'

// ── 月範囲ユーティリティ ──────────────────────────────────────
function getMonthRange(today: string) {
  const [y, m] = today.split('-').map(Number)
  return {
    start:       `${y}-${String(m).padStart(2, '0')}-01`,
    end:         new Date(y, m, 1).toISOString().slice(0, 10),
    label:       new Date(y, m - 1, 1).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
    daysInMonth: new Date(y, m, 0).getDate(),
    daysElapsed: Number(today.split('-')[2]),
  }
}

// ── 本日速報カード（Server 内でレンダリング） ─────────────────
interface KpiCardProps {
  label: string; value: string | number; unit?: string; sub?: string
  icon: React.ElementType; accent: string; href: string
  trend?: string; trendUp?: boolean
}
function KpiCard({ label, value, unit, sub, icon: Icon, accent, href, trend, trendUp }: KpiCardProps) {
  return (
    <Link href={href} className="group">
      <div className={`kpi-card ${accent} transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5`}>
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-teal-50 transition-colors">
            <Icon size={16} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 tabular">{value}</span>
          {unit && <span className="text-sm text-slate-400">{unit}</span>}
        </div>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-slate-400'}`}>
            {trendUp && <ArrowUpRight size={13} />}{trend}
          </div>
        )}
      </div>
    </Link>
  )
}

// ── ページ ────────────────────────────────────────────────────
export default async function AdminDashboard() {
  const supabase = await createClient()
  const today    = todayString()
  const { start: monthStart, end: monthEnd, label: monthLabel, daysInMonth, daysElapsed } = getMonthRange(today)

  // ── 並行データ取得 ─────────────────────────────────────────
  const [
    { count: staffCount },
    { data: hotels },
    { data: monthlyReports },
    { data: monthlyAdj },
    { data: todayAttendances },
    { data: todayReports },
  ] = await Promise.all([
    supabase.from('staffs').select('*', { count: 'exact', head: true }),

    // ホテル一覧（id・名前・目標売上）
    supabase.from('hotels').select('id, name, monthly_target_sales').order('name'),

    // 当月の日報（hotel_id ごとに集計するので hotel_id も取得）
    supabase
      .from('daily_reports')
      .select('hotel_id, completed_rooms, room_types(id, name, unit_price)')
      .gte('date', monthStart).lt('date', monthEnd),

    // 当月の調整金
    supabase
      .from('adjustments')
      .select('hotel_id, amount')
      .gte('date', monthStart).lt('date', monthEnd),

    // 本日の勤怠
    supabase
      .from('attendances')
      .select('id, clock_out')
      .gte('clock_in', `${today}T00:00:00`).lt('clock_in', `${today}T23:59:59`),

    // 本日の日報（速報カード用）
    supabase
      .from('daily_reports')
      .select('completed_rooms, room_types(unit_price)')
      .eq('date', today),
  ])

  // ── ① 全体KPI + 部屋タイプ別構成 ──────────────────────────
  const totalTarget = (hotels ?? []).reduce((s, h) => s + (h.monthly_target_sales ?? 0), 0)

  // hotel_id → 売上のマップ（ホテル別KPIのため）
  const hotelSalesMap = new Map<string, number>()
  const hotelAdjMap   = new Map<string, number>()

  // 部屋タイプ別（全社ドーナツチャート）
  const rtMap = new Map<string, { name: string; unit_price: number; sales: number; rooms: number }>()
  let totalSales = 0

  for (const r of monthlyReports ?? []) {
    const rt = r.room_types as unknown as { id: string; name: string; unit_price: number } | null
    if (!rt) continue
    const sale = r.completed_rooms * rt.unit_price
    totalSales += sale
    hotelSalesMap.set(r.hotel_id, (hotelSalesMap.get(r.hotel_id) ?? 0) + sale)

    const ex = rtMap.get(rt.id)
    if (ex) { ex.sales += sale; ex.rooms += r.completed_rooms }
    else rtMap.set(rt.id, { name: rt.name, unit_price: rt.unit_price, sales: sale, rooms: r.completed_rooms })
  }

  for (const a of monthlyAdj ?? []) {
    hotelAdjMap.set(a.hotel_id, (hotelAdjMap.get(a.hotel_id) ?? 0) + a.amount)
  }

  const totalAdj = Array.from(hotelAdjMap.values()).reduce((s, v) => s + v, 0)
  const breakdown: RoomTypeBreakdown[] = Array.from(rtMap.values()).sort((a, b) => b.sales - a.sales)

  const kpiData: MonthlyKpiData = {
    totalTarget, totalSales, adjustment: totalAdj,
    breakdown, monthLabel, daysElapsed, daysInMonth,
  }

  // ── ② ホテル別KPI ─────────────────────────────────────────
  const hotelKpiItems: HotelKpiItem[] = (hotels ?? []).map(h => ({
    id:         h.id,
    name:       h.name,
    target:     h.monthly_target_sales ?? 0,
    sales:      hotelSalesMap.get(h.id) ?? 0,
    adjustment: hotelAdjMap.get(h.id)   ?? 0,
  }))

  // ── ③ 本日速報 ────────────────────────────────────────────
  const todaySales = (todayReports ?? []).reduce(
    (s, r) => s + r.completed_rooms * ((r.room_types as unknown as { unit_price: number } | null)?.unit_price ?? 0), 0
  )
  const todayRooms = (todayReports ?? []).reduce((s, r) => s + r.completed_rooms, 0)
  const workingNow = (todayAttendances ?? []).filter(a => !a.clock_out).length

  return (
    <div className="p-8">
      {/* ── ページヘッダー ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString('ja-JP', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
            })}
          </p>
        </div>
        <Link
          href="/admin/daily-report"
          className="flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold
                     px-4 py-2.5 rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
        >
          <ClipboardCheck size={16} />
          今日の日報を入力
        </Link>
      </div>

      {/* ════════════════════════════════════════════
          セクション A — 全社サマリー KPI
      ════════════════════════════════════════════ */}
      <MonthlyKpiSection data={kpiData} />

      {/* ── 本日速報カード（A と B の橋渡し） ── */}
      <div className="my-8">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          本日の速報
        </h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="本日の売上"    value={formatCurrency(todaySales)} icon={TrendingUp}   accent="border-l-teal-500"    href="/admin/daily-report" sub="清掃売上（本日分）" />
          <KpiCard label="本日の清掃室数" value={todayRooms} unit="室"        icon={ClipboardCheck} accent="border-l-sky-500"   href="/admin/daily-report" />
          <KpiCard label="稼働スタッフ"  value={workingNow} unit="名 勤務中"  icon={Users}         accent="border-l-emerald-500" href="/admin/attendance"
            sub={`今日の出勤 ${(todayAttendances ?? []).length}名`} />
          <KpiCard label="対応ホテル"    value={(hotels ?? []).length} unit="件" icon={Hotel}       accent="border-l-amber-500"   href="/admin/hotels" />
        </div>
      </div>

      {/* ════════════════════════════════════════════
          セクション B — ホテル別パフォーマンス
      ════════════════════════════════════════════ */}
      <HotelKpiGrid hotels={hotelKpiItems} />

      {/* ── クイックアクション ── */}
      <div className="mt-10">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          クイックアクション
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { href: '/admin/daily-report', title: '日報を入力する',
              desc: '清掃完了室数を記録してリアルタイムで売上を確認',
              icon: ClipboardCheck, color: 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20' },
            { href: '/admin/attendance', title: '勤怠を確認する',
              desc: 'スタッフの出退勤状況と想定賃金を確認',
              icon: Users, color: 'bg-white hover:shadow-md border border-slate-200 text-slate-900 hover:border-teal-200' },
          ].map(({ href, title, desc, icon: Icon, color }) => (
            <Link key={href} href={href} className="group">
              <div className={`rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 shadow-sm ${color}`}>
                <Icon size={22} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-base">{title}</div>
                  <div className={`text-sm mt-1 ${color.includes('text-white') ? 'text-white/70' : 'text-slate-400'}`}>{desc}</div>
                </div>
                <ArrowRight size={18} className="mt-1 opacity-40 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
