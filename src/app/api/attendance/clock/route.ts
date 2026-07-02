import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { staffId, hotelId } = body

  if (!staffId || !hotelId) {
    return NextResponse.json({ error: 'スタッフIDとホテルIDは必須です' }, { status: 400 })
  }

  // 本日のオープンな勤怠レコードを検索（clock_outがnull）
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

  const { data: openAttendance, error: fetchError } = await supabase
    .from('attendances')
    .select('*')
    .eq('staff_id', staffId)
    .eq('hotel_id', hotelId)
    .is('clock_out', null)
    .gte('clock_in', todayStart)
    .lt('clock_in', todayEnd)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: 'データ取得エラー: ' + fetchError.message }, { status: 500 })
  }

  if (openAttendance) {
    // 退勤処理
    const { data, error } = await supabase
      .from('attendances')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', openAttendance.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '退勤記録に失敗しました: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ action: 'clock_out', attendance: data })
  } else {
    // 出勤処理
    const { data, error } = await supabase
      .from('attendances')
      .insert({
        staff_id: staffId,
        hotel_id: hotelId,
        clock_in: new Date().toISOString(),
        break_minutes: 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '出勤記録に失敗しました: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ action: 'clock_in', attendance: data })
  }
}
