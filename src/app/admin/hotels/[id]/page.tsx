/**
 * /admin/hotels/[id] — ホテル詳細 + 部屋タイプ管理ページ
 *
 * - リーダーは閲覧のみ、管理者は追加・削除が可能
 * - ホテル登録直後の「部屋タイプを登録する」ボタンから遷移してくる
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toAuthUser, isLeader } from '@/lib/auth'
import { HotelDetail } from '@/components/admin/hotels/HotelDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function HotelDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const authUser = toAuthUser(user)

  if (!isLeader(authUser)) redirect('/admin')

  const { data: hotel, error } = await supabase
    .from('hotels')
    .select('*, room_types(id, name, unit_price, created_at)')
    .eq('id', id)
    .single()

  if (error || !hotel) redirect('/admin/hotels')

  return (
    <div className="p-8">
      <HotelDetail hotel={hotel as any} currentUser={authUser} />
    </div>
  )
}
