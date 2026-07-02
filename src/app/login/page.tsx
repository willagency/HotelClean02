/**
 * src/app/login/page.tsx
 *
 * ログイン画面。
 * - useForm（react-hook-form）でリアルタイムバリデーション
 * - useTransition + useActionState で Server Action を呼び出し
 * - ログイン成功時は Server Action 内で /admin にリダイレクト
 */

'use client'

import { useEffect, useRef, useTransition, useActionState } from 'react'
import { useForm }        from 'react-hook-form'
import { zodResolver }    from '@hookform/resolvers/zod'
import { z }              from 'zod'
import { useSearchParams } from 'next/navigation'
import { toast }          from 'sonner'
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { signIn, type ActionResult } from '@/app/auth/actions'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState, Suspense } from 'react'

// ── バリデーションスキーマ（クライアント側でも同じルール） ──
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('正しいメールアドレスの形式で入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(6, 'パスワードは6文字以上で入力してください'),
})
type LoginFormValues = z.infer<typeof loginSchema>

// ── ログインフォーム本体 ──────────────────────────────────────
function LoginForm() {
  const searchParams   = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showPw, setShowPw]          = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  // フォーム送信 → Server Action へ
  const onSubmit = (values: LoginFormValues) => {
    setServerError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('email',    values.email)
      fd.set('password', values.password)

      // signIn は成功時に redirect() するのでここには戻ってこない
      // エラー時のみ ActionResult が返る
      const result: ActionResult = await signIn(null, fd)
      if (!result.success && result.error) {
        setServerError(result.error)
        toast.error(result.error)
      }
    })
  }

  // ?next= パラメータがあればトースト表示
  useEffect(() => {
    if (searchParams.get('next')) {
      toast.info('続きを開始するには、ログインが必要です')
    }
  }, [searchParams])

  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── ロゴ ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4 shadow-lg shadow-teal-600/25">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">CleanOps</h1>
          <p className="text-slate-400 text-sm mt-1">ホテル客室清掃管理システム</p>
        </div>

        {/* ── カード ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">ログイン</h2>
            <p className="text-slate-400 text-sm mt-1">
              アカウント情報を入力してください
            </p>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* サーバーエラーバナー */}
            {serverError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{serverError}</span>
              </div>
            )}

            {/* メールアドレス */}
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                error={!!errors.email}
                disabled={isPending}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <span>⚠</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* パスワード */}
            <div>
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-10"
                  error={!!errors.password}
                  disabled={isPending}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPw ? 'パスワードを隠す' : 'パスワードを表示'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <span>⚠</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* ログインボタン */}
            <Button
              type="submit"
              disabled={isPending}
              className={cn(
                'w-full h-11 rounded-xl font-semibold text-base',
                'bg-teal-600 hover:bg-teal-500 text-white',
                'shadow-sm shadow-teal-600/20',
                'transition-all duration-150',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={17} className="animate-spin" />
                  ログイン中...
                </span>
              ) : (
                'ログイン'
              )}
            </Button>
          </form>
        </div>

        {/* ── フッター ── */}
        <p className="text-center text-xs text-slate-400 mt-6">
          ログインに問題がある場合はシステム管理者にお問い合わせください
        </p>
      </div>
    </div>
  )
}

// Suspense でラップ（useSearchParams のため）
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-teal-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
