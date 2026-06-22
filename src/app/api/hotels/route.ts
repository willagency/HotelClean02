/**
 * POST /api/hotels  — ホテル新規登録（管理者のみ）
 * GET  /api/hotels  — ホテル一覧取得（管理者・リーダー）
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toAuthUser, isAdmin, isLeader } from '@/lib/auth'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const authUser = toAuthUser(user)

  if (!isLeader(authUser)) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('hotels')
    .select('*, room_types(id, name, unit_price)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ hotels: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const authUser = toAuthUser(user)

  // 管理者のみ登録可能（RLS でも二重ガード）
  if (!isAdmin(authUser)) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const body = await request.json()
  const { name, monthly_target_sales } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'ホテル名は必須です' }, { status: 400 })
  }

  const salesValue = Number(monthly_target_sales)
  if (isNaN(salesValue) || salesValue < 0) {
    return NextResponse.json({ error: '目標売上は0以上の数値を入力してください' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('hotels')
    .insert({ name: name.trim(), monthly_target_sales: salesValue })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ hotel: data }, { status: 201 })
}
