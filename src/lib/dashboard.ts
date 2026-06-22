/**
 * src/lib/dashboard.ts
 *
 * ダッシュボード用のデータ集計ロジック。
 * Server Component から呼び出す純粋な集計関数群。
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ── 型定義 ──────────────────────────────────────────────────

/** 部屋タイプ別売上内訳（ドーナツチャート用） */
export interface RoomTypeSales {
  roomTypeId:   string
  roomTypeName: string
  unitPrice:    number
  totalRooms:   number
  totalSales:   number
}

/** ホテル別 月次KPI */
export interface HotelMonthlyKpi {
  hotelId:         string
  hotelName:       string
  monthlyTarget:   number
  currentSales:    number
  achievementRate: number
  remainingAmount: number
  roomTypeSales:   RoomTypeSales[]
}

/** ダッシュボード全体のサマリー */
export interface DashboardSummary {
  targetMonth:        string
  totalTarget:        number
  totalCurrentSales:  number
  overallRate:        number
  remainingAmount:    number
  hotels:             HotelMonthlyKpi[]
  todayRooms:         number
  todayWorkingStaff:  number
  todayTotalStaff:    number
}

// ── 月の範囲を返す ───────────────────────────────────────────
function getMonthRange(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split('-').map(Number)
  const start = `${yearMonth}-01`
  const endDate = new Date(year, month, 1)
  const end = endDate.toISOString().slice(0, 10)
  return { start, end }
}

// ── メイン集計関数 ───────────────────────────────────────────
export async function fetchDashboardSummary(
  supabase: SupabaseClient<Database>,
  targetMonth: string,
  today: string,
): Promise<DashboardSummary> {
  const { start: monthStart, end: monthEnd } = getMonthRange(targetMonth)

  const [
    { data: hotels },
    { data: monthlyReports },
    { data: monthlyAdj },
    { data: todayAttendances },
  ] = await Promise.all([
    supabase
      .from('hotels')
      .select('id, name, monthly_target_sales, room_types(id, name, unit_price)')
      .order('name'),
    supabase
      .from('daily_reports')
      .select('hotel_id, room_type_id, completed_rooms, room_types(id, name, unit_price)')
      .gte('date', monthStart)
      .lt('date', monthEnd),
    supabase
      .from('adjustments')
      .select('hotel_id, amount')
      .gte('date', monthStart)
      .lt('date', monthEnd),
    supabase
      .from('attendances')
      .select('id, clock_out')
      .gte('clock_in', `${today}T00:00:00`)
      .lt('clock_in', `${today}T23:59:59`),
  ])

  type RoomTypeSalesMap = Record<string, RoomTypeSales>
  const hotelRoomSalesMap: Record<string, RoomTypeSalesMap> = {}
  const hotelBaseSalesMap: Record<string, number> = {}

  // monthlyReports を any[] として扱うことで、r が never になるのを防ぐ
  for (const item of monthlyReports ?? []) {
    const r = item as any // 一旦any型として扱う
    const rt = r.room_types as unknown as { id: string; name: string; unit_price: number } | null
    if (!rt) continue

    const hotelId = r.hotel_id
    const rtId    = rt.id
    const sales   = r.completed_rooms * rt.unit_price

    if (!hotelRoomSalesMap[hotelId]) hotelRoomSalesMap[hotelId] = {}
    if (!hotelRoomSalesMap[hotelId][rtId]) {
      hotelRoomSalesMap[hotelId][rtId] = {
        roomTypeId:   rtId,
        roomTypeName: rt.name,
        unitPrice:    rt.unit_price,
        totalRooms:   0,
        totalSales:   0,
      }
    }
    hotelRoomSalesMap[hotelId][rtId].totalRooms += r.completed_rooms
    hotelRoomSalesMap[hotelId][rtId].totalSales += sales
    hotelBaseSalesMap[hotelId] = (hotelBaseSalesMap[hotelId] ?? 0) + sales
  }

  const hotelAdjMap: Record<string, number> = {}
  for (const a of monthlyAdj ?? []) {
    hotelAdjMap[a.hotel_id] = (hotelAdjMap[a.hotel_id] ?? 0) + a.amount
  }

  const hotelKpis: HotelMonthlyKpi[] = (hotels ?? []).map(hotel => {
    const base      = hotelBaseSalesMap[hotel.id] ?? 0
    const adj       = hotelAdjMap[hotel.id]       ?? 0
    const current   = base + adj
    const target    = hotel.monthly_target_sales  ?? 0
    const rate      = target > 0 ? (current / target) * 100 : 0
    const roomSales = Object.values(hotelRoomSalesMap[hotel.id] ?? {})
      .sort((a, b) => b.totalSales - a.totalSales)

    return {
      hotelId:         hotel.id,
      hotelName:       hotel.name,
      monthlyTarget:   target,
      currentSales:    current,
      achievementRate: Math.round(rate * 10) / 10,
      remainingAmount: target - current,
      roomTypeSales:   roomSales,
    }
  })

  const totalTarget       = hotelKpis.reduce((s, h) => s + h.monthlyTarget, 0)
  const totalCurrentSales = hotelKpis.reduce((s, h) => s + h.currentSales, 0)
  const overallRate       = totalTarget > 0
    ? Math.round((totalCurrentSales / totalTarget) * 1000) / 10
    : 0
  const remainingAmount   = totalTarget - totalCurrentSales

  const todayAllStaff   = (todayAttendances ?? []).length
  const todayWorkingNow = (todayAttendances ?? []).filter(a => !a.clock_out).length

  return {
    targetMonth:        targetMonth,
    totalTarget,
    totalCurrentSales,
    overallRate,
    remainingAmount,
    hotels:             hotelKpis,
    todayRooms:         0,
    todayWorkingStaff:  todayWorkingNow,
    todayTotalStaff:    todayAllStaff,
  }
}

// ── 達成率レベルと対応カラートークン ─────────────────────────
export type AchievementLevel = 'danger' | 'warning' | 'good' | 'excellent'

export function getAchievementLevel(rate: number): AchievementLevel {
  if (rate >= 100) return 'excellent'
  if (rate >= 70)  return 'good'
  if (rate >= 40)  return 'warning'
  return 'danger'
}

export const ACHIEVEMENT_COLORS: Record<AchievementLevel, {
  text:    string
  bg:      string
  bgLight: string
  border:  string
  bar:     string
  hex:     string
}> = {
  excellent: {
    text:    'text-emerald-600',
    bg:      'bg-emerald-500',
    bgLight: 'bg-emerald-50',
    border:  'border-emerald-200',
    bar:     'bg-emerald-500',
    hex:     '#10b981',
  },
  good: {
    text:    'text-teal-600',
    bg:      'bg-teal-500',
    bgLight: 'bg-teal-50',
    border:  'border-teal-200',
    bar:     'bg-teal-500',
    hex:     '#14b8a6',
  },
  warning: {
    text:    'text-amber-600',
    bg:      'bg-amber-500',
    bgLight: 'bg-amber-50',
    border:  'border-amber-200',
    bar:     'bg-amber-500',
    hex:     '#f59e0b',
  },
  danger: {
    text:    'text-rose-600',
    bg:      'bg-rose-500',
    bgLight: 'bg-rose-50',
    border:  'border-rose-200',
    bar:     'bg-rose-400',
    hex:     '#f43f5e',
  },
}
