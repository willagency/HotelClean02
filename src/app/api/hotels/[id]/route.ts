/**
 * PATCH /api/hotels/[id]  — ホテル情報更新（管理者のみ）
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toAuthUser, isAdmin } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const authUser = toAuthUser(user)

  if (!isAdmin(authUser)) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const body = await request.json()
  const { name, monthly_target_sales } = body

  const patch: Record<string, unknown> = {}
  if (name !== undefined) {
    if (!name.trim()) return NextResponse.json({ error: 'ホテル名は必須です' }, { status: 400 })
    patch.name = name.trim()
  }
  if (monthly_target_sales !== undefined) {
    const v = Number(monthly_target_sales)
    if (isNaN(v) || v < 0) return NextResponse.json({ error: '目標売上は0以上の数値を入力してください' }, { status: 400 })
    patch.monthly_target_sales = v
  }

  const { data, error } = await supabase
    .from('hotels')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ hotel: data })
}
