/**
 * 権限ユーティリティ
 *
 * Supabase Auth の user_metadata.role を参照して権限を判定する。
 * サーバー・クライアント両方から使える純粋関数群。
 */

import type { UserRole } from '@/types/database'

// ── 型 ───────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  email?: string
  role: UserRole
}

// ── Supabase user オブジェクトから AuthUser を生成 ────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toAuthUser(supabaseUser: any): AuthUser {
  const role = (supabaseUser?.user_metadata?.role ?? 'staff') as UserRole
  return {
    id:    supabaseUser?.id ?? '',
    email: supabaseUser?.email ?? '',
    role,
  }
}

// ── 権限チェック ─────────────────────────────────────────────
export const isAdmin  = (u: AuthUser | null) => u?.role === 'admin'
export const isLeader = (u: AuthUser | null) => u?.role === 'leader' || u?.role === 'admin'

// ── ロール表示名 ─────────────────────────────────────────────
export const ROLE_LABEL: Record<UserRole, string> = {
  admin:  '管理者',
  leader: 'リーダー',
  staff:  'スタッフ',
}
