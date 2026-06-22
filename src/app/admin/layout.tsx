/**
 * src/app/admin/layout.tsx
 *
 * Server Component として動作し、セッションからユーザー情報を取得する。
 * 取得した AuthUser を AdminSidebar（Client Component）へ Props で渡す。
 *
 * ⚠️ Middleware が /admin/* を保護しているため、
 *    このLayoutに到達した時点でユーザーは必ず認証済み。
 *    ただし多層防御として createClient().auth.getUser() も維持する。
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toAuthUser, isLeader } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // セッション取得（getUser() を使うことでサーバーサイドで検証される）
  const { data: { user }, error } = await supabase.auth.getUser()

  // 未認証 or エラー → ログイン画面へ（Middleware の二重ガード）
  if (error || !user) {
    redirect('/login')
  }

  const authUser = toAuthUser(user)

  // スタッフ権限はAdmin画面にアクセス不可
  if (!isLeader(authUser)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <AdminSidebar user={authUser} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
