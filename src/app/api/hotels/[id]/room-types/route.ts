/**
 * POST /api/hotels/[id]/room-types  — 部屋タイプ追加（管理者のみ）
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toAuthUser, isAdmin } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: hotelId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const authUser = toAuthUser(user)

  if (!isAdmin(authUser)) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const body = await request.json()
  const { name, unit_price } = body

  if (!name?.trim()) return NextResponse.json({ error: '部屋タイプ名は必須です' }, { status: 400 })
  const price = Number(unit_price)
  if (isNaN(price) || price < 0) return NextResponse.json({ error: '単価は0以上の数値を入力してください' }, { status: 400 })

  const { data, error } = await supabase
    .from('room_types')
    .insert({ hotel_id: hotelId, name: name.trim(), unit_price: price })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ room_type: data }, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: hotelId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const authUser = toAuthUser(user)

  if (!isAdmin(authUser)) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const roomTypeId = searchParams.get('roomTypeId')
  if (!roomTypeId) return NextResponse.json({ error: 'roomTypeId は必須です' }, { status: 400 })

  const { error } = await supabase
    .from('room_types')
    .delete()
    .eq('id', roomTypeId)
    .eq('hotel_id', hotelId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
