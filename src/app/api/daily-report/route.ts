import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { hotelId, date, rows, adjustments } = body

  if (!hotelId || !date) {
    return NextResponse.json({ error: 'ホテルと日付は必須です' }, { status: 400 })
  }

  // 日報のアップサート
  const reportInserts = rows
    .filter((r: { completedRooms: number }) => r.completedRooms > 0)
    .map((r: { roomTypeId: string; completedRooms: number }) => ({
      hotel_id: hotelId,
      date,
      room_type_id: r.roomTypeId,
      completed_rooms: r.completedRooms,
    }))

  if (reportInserts.length > 0) {
    const { error } = await supabase
      .from('daily_reports')
      .upsert(reportInserts, { onConflict: 'hotel_id,date,room_type_id' })

    if (error) {
      return NextResponse.json({ error: '日報保存エラー: ' + error.message }, { status: 500 })
    }
  }

  // ゼロ室は削除（入力クリア）
  const zeroIds = rows
    .filter((r: { completedRooms: number }) => r.completedRooms === 0)
    .map((r: { roomTypeId: string }) => r.roomTypeId)

  if (zeroIds.length > 0) {
    await supabase
      .from('daily_reports')
      .delete()
      .eq('hotel_id', hotelId)
      .eq('date', date)
      .in('room_type_id', zeroIds)
  }

  // 調整金: 当日分を全削除→再挿入
  await supabase.from('adjustments').delete().eq('hotel_id', hotelId).eq('date', date)

  if (adjustments.length > 0) {
    const adjInserts = adjustments.map((a: { amount: number; reason: string | null }) => ({
      hotel_id: hotelId,
      date,
      amount: a.amount,
      reason: a.reason,
    }))

    const { error } = await supabase.from('adjustments').insert(adjInserts)
    if (error) {
      return NextResponse.json({ error: '調整金保存エラー: ' + error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const hotelId = searchParams.get('hotelId')
  const date = searchParams.get('date')

  if (!hotelId || !date) {
    return NextResponse.json({ error: 'hotelIdとdateは必須です' }, { status: 400 })
  }

  const [reportsRes, adjRes] = await Promise.all([
    supabase
      .from('daily_reports')
      .select('room_type_id, completed_rooms')
      .eq('hotel_id', hotelId)
      .eq('date', date),
    supabase
      .from('adjustments')
      .select('amount, reason')
      .eq('hotel_id', hotelId)
      .eq('date', date),
  ])

  return NextResponse.json({
    reports: reportsRes.data ?? [],
    adjustments: adjRes.data ?? [],
  })
}
