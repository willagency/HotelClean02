/**
 * /admin/hotels — ホテル一覧ページ（Server Component）
 *
 * - サーバーで認証・権限チェック → リダイレクト
 * - データ取得もサーバーサイドで行い、HotelTable（Client）へ渡す
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toAuthUser, isLeader } from '@/lib/auth'
import { HotelTable } from '@/components/admin/hotels/HotelTable'
import { todayString } from '@/lib/utils'

export const metadata = { title: 'クライアント管理 | CleanOps' }

export default async function HotelsPage() {
  const supabase = await createClient()

  // ── 認証・権限チェック ──────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  const authUser = toAuthUser(user)

  // リーダー未満（スタッフ・未ログイン）はリダイレクト
  if (!isLeader(authUser)) {
    redirect('/admin')
  }

  // ── データ取得 ──────────────────────────────────────────────
  const { data: hotels } = await supabase
    .from('hotels')
    .select('*, room_types(id, name, unit_price)')
    .order('created_at', { ascending: false })

  // 今月の売上を hotel_id ごとに集計
  const thisMonth = todayString().slice(0, 7) // "YYYY-MM"
  const monthStart = `${thisMonth}-01`
  const monthEnd   = new Date(
    new Date(monthStart).getFullYear(),
    new Date(monthStart).getMonth() + 1,
    1
  ).toISOString().slice(0, 10)

  const { data: monthlyReports } = await supabase
    .from('daily_reports')
    .select('hotel_id, completed_rooms, room_types(unit_price)')
    .gte('date', monthStart)
    .lt('date', monthEnd)

  const { data: monthlyAdj } = await supabase
    .from('adjustments')
    .select('hotel_id, amount')
    .gte('date', monthStart)
    .lt('date', monthEnd)

  // hotel_id → 当月売上 のマップを作成
  const salesMap: Record<string, number> = {}
  for (const r of monthlyReports ?? []) {
    const price = (r.room_types as unknown as { unit_price: number } | null)?.unit_price ?? 0
    salesMap[r.hotel_id] = (salesMap[r.hotel_id] ?? 0) + r.completed_rooms * price
  }
  for (const a of monthlyAdj ?? []) {
    salesMap[a.hotel_id] = (salesMap[a.hotel_id] ?? 0) + a.amount
  }

  const hotelsWithSales = (hotels ?? []).map(h => ({
    ...h,
    current_month_sales: salesMap[h.id] ?? 0,
  }))

  return (
    <div className="p-8">
      <HotelTable
        initialHotels={hotelsWithSales}
        currentUser={authUser}
      />
    </div>
  )
}
