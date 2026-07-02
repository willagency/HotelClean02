import { createClient } from '@/lib/supabase/server'

// ─── 月次請求書 ──────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  roomTypeName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface InvoiceAdjustment {
  reason: string | null
  amount: number
}

export interface InvoiceData {
  hotelName: string
  targetMonth: string        // "2025年6月" 形式
  issuedAt: string           // "2025年6月30日" 形式
  lineItems: InvoiceLineItem[]
  adjustments: InvoiceAdjustment[]
  baseSalesTotal: number
  adjustmentTotal: number
  grandTotal: number
}

export async function fetchInvoiceData(
  hotelId: string,
  targetMonth: string  // "YYYY-MM"
): Promise<InvoiceData> {
  const supabase = await createClient()

  const [year, month] = targetMonth.split('-').map(Number)
  const dateFrom = `${targetMonth}-01`
  const dateTo = new Date(year, month, 0).toISOString().split('T')[0] // 月末日

  // 並行取得
  const [hotelRes, reportsRes, adjRes] = await Promise.all([
    supabase.from('hotels').select('name').eq('id', hotelId).single(),
    supabase
      .from('daily_reports')
      .select('room_type_id, completed_rooms, room_types(name, unit_price)')
      .eq('hotel_id', hotelId)
      .gte('date', dateFrom)
      .lte('date', dateTo),
    supabase
      .from('adjustments')
      .select('amount, reason')
      .eq('hotel_id', hotelId)
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .order('created_at'),
  ])

  if (hotelRes.error) throw new Error('ホテル情報の取得に失敗しました')

  // 部屋タイプ別に集計
  const aggregated = new Map<
    string,
    { name: string; unitPrice: number; quantity: number }
  >()

  for (const row of reportsRes.data ?? []) {
    const rt = row.room_types as unknown as { name: string; unit_price: number } | null
    if (!rt) continue
    const existing = aggregated.get(row.room_type_id)
    if (existing) {
      existing.quantity += row.completed_rooms
    } else {
      aggregated.set(row.room_type_id, {
        name: rt.name,
        unitPrice: rt.unit_price,
        quantity: row.completed_rooms,
      })
    }
  }

  const lineItems: InvoiceLineItem[] = Array.from(aggregated.values()).map((v) => ({
    roomTypeName: v.name,
    unitPrice: v.unitPrice,
    quantity: v.quantity,
    subtotal: v.unitPrice * v.quantity,
  }))

  const adjustments: InvoiceAdjustment[] = (adjRes.data ?? []).map((a) => ({
    reason: a.reason,
    amount: a.amount,
  }))

  const baseSalesTotal = lineItems.reduce((s, l) => s + l.subtotal, 0)
  const adjustmentTotal = adjustments.reduce((s, a) => s + a.amount, 0)
  const grandTotal = baseSalesTotal + adjustmentTotal

  // 表示用日付フォーマット
  const targetMonthJa = new Date(year, month - 1, 1).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  })
  const issuedAt = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return {
    hotelName: hotelRes.data.name,
    targetMonth: targetMonthJa,
    issuedAt,
    lineItems,
    adjustments,
    baseSalesTotal,
    adjustmentTotal,
    grandTotal,
  }
}

// ─── 日次レポート ────────────────────────────────────────────────────────────

export interface DailyReportLineItem {
  roomTypeName: string
  completedRooms: number
  unitPrice: number
  subtotal: number
}

export interface DailyReportData {
  hotelName: string
  targetDate: string       // "2025年6月15日（日）" 形式
  targetDateRaw: string    // "2025-06-15"
  lineItems: DailyReportLineItem[]
  totalRooms: number
  totalSales: number
}

export async function fetchDailyReportData(
  hotelId: string,
  targetDate: string   // "YYYY-MM-DD"
): Promise<DailyReportData> {
  const supabase = await createClient()

  const [hotelRes, reportsRes] = await Promise.all([
    supabase.from('hotels').select('name').eq('id', hotelId).single(),
    supabase
      .from('daily_reports')
      .select('completed_rooms, room_types(name, unit_price)')
      .eq('hotel_id', hotelId)
      .eq('date', targetDate)
      .order('created_at'),
  ])

  if (hotelRes.error) throw new Error('ホテル情報の取得に失敗しました')

  const lineItems: DailyReportLineItem[] = (reportsRes.data ?? []).map((r) => {
    const rt = r.room_types as unknown as { name: string; unit_price: number } | null
    return {
      roomTypeName: rt?.name ?? '—',
      completedRooms: r.completed_rooms,
      unitPrice: rt?.unit_price ?? 0,
      subtotal: r.completed_rooms * (rt?.unit_price ?? 0),
    }
  })

  const totalRooms = lineItems.reduce((s, l) => s + l.completedRooms, 0)
  const totalSales = lineItems.reduce((s, l) => s + l.subtotal, 0)

  const targetDateJa = new Date(targetDate).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return {
    hotelName: hotelRes.data.name,
    targetDate: targetDateJa,
    targetDateRaw: targetDate,
    lineItems,
    totalRooms,
    totalSales,
  }
}
