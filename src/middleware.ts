/**
 * src/middleware.ts
 *
 * 役割：
 *  1. セッションCookieのリフレッシュ（@supabase/ssr 公式要件）
 *  2. /admin/* への未認証アクセスを /login へリダイレクト
 *  3. ログイン済みユーザーが /login にアクセスしたら /admin へリダイレクト
 *
 * ⚠️ Middleware 内では createBrowserClient / createClient（lib/supabase/server）
 *    ではなく、createServerClient を直接使うこと。
 *    Middleware は Edge Runtime で動作するため、cookies() ではなく
 *    NextRequest / NextResponse の cookies API を使う必要がある。
 */

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // レスポンスオブジェクトを先に作成し、Cookieの書き込み先にする
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // リクエストとレスポンス両方に書き込む（@supabase/ssr 公式パターン）
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ⚠️ 重要: getUser() を必ず呼ぶことでセッションが自動リフレッシュされる
  //    getSession() ではなく getUser() を使うこと（セキュリティ上の理由）
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── /admin/* 保護: 未認証 → /login へ ─────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      // ログイン後に元のページへ戻れるよう next パラメータを付与
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── /login: ログイン済み → /admin へ ────────────────────────
  if (pathname === '/login' && user) {
    const adminUrl = request.nextUrl.clone()
    adminUrl.pathname = '/admin'
    adminUrl.search = ''
    return NextResponse.redirect(adminUrl)
  }

  // ── /staff/* 保護: スタッフ向け画面は認証不要（QR打刻はスタッフが利用）
  //    必要に応じてここに追加のガードを実装する

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスに適用:
     * - _next/static  (静的ファイル)
     * - _next/image   (画像最適化)
     * - favicon.ico
     * - public フォルダのファイル
     * - API routes の一部（QR打刻は認証不要にする場合）
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
