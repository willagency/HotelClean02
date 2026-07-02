'use server'

/**
 * src/app/auth/actions.ts
 *
 * 認証に関する Server Actions。
 *
 * Server Actions でセッションCookieを正しく書き込むには
 * @supabase/ssr の createServerClient + cookies() を使う必要がある。
 * auth-helpers-nextjs は使用しないこと（非推奨・動作不安定）。
 */

import { redirect }   from 'next/navigation'
import { cookies }    from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import type { Database } from '@/types/database'

// ─── Supabase クライアントを Server Action 内で生成 ──────────
// Server Actions は cookies() の書き込みが可能なので、
// lib/supabase/server.ts の共通関数とは別に定義する必要がある
// （setAll で例外を握り潰さず、確実にCookieをセットするため）
async function createActionClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Server Action 内は cookies().set() が使用可能
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// ─── バリデーションスキーマ ───────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('正しいメールアドレスの形式で入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(6,  'パスワードは6文字以上で入力してください'),
})

// ─── 返り値の型 ──────────────────────────────────────────────
export interface ActionResult {
  success: boolean
  error?: string
}

// ─── signIn ─────────────────────────────────────────────────
export async function signIn(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // バリデーション
  const raw = {
    email:    formData.get('email')    as string,
    password: formData.get('password') as string,
  }
  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? '入力内容を確認してください'
    return { success: false, error: firstError }
  }

  const supabase = await createActionClient()

  const { error } = await supabase.auth.signInWithPassword({
    email:    parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Supabase のエラーメッセージを日本語化
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'メールアドレスまたはパスワードが正しくありません' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { success: false, error: 'メールアドレスの確認が完了していません' }
    }
    if (error.message.includes('Too many requests')) {
      return { success: false, error: 'ログイン試行回数が上限に達しました。しばらく時間をおいてください' }
    }
    return { success: false, error: 'ログインに失敗しました。しばらく経ってから再試行してください' }
  }

  // ログイン成功 → 管理者画面へリダイレクト
  // redirect() は try/catch の外で呼ぶ（内部でエラーをthrowするため）
  redirect('/admin')
}

// ─── signOut ────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  const supabase = await createActionClient()
  await supabase.auth.signOut()
  redirect('/login')
}
