'use client'

/**
 * ホテル登録・編集ダイアログ
 *
 * - react-hook-form + zod によるバリデーション
 * - 登録完了後に「部屋タイプを続けて登録しますか？」の導線を表示
 * - 管理者のみ表示・操作可能（呼び出し元で権限チェック済みだが念のため受け取る）
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2, Hotel, ArrowRight, PlusCircle } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import type { Hotel as HotelType } from '@/types/database'

// ── Zod スキーマ ─────────────────────────────────────────────
const hotelSchema = z.object({
  name: z
    .string()
    .min(1, 'ホテル名を入力してください')
    .max(100, '100文字以内で入力してください'),
  monthly_target_sales: z
    .string()
    .refine(v => v === '' || /^\d+$/.test(v.replace(/,/g, '')), {
      message: '半角数字で入力してください',
    })
    .transform(v => (v === '' ? 0 : parseInt(v.replace(/,/g, ''), 10)))
    .refine(v => v >= 0, { message: '0以上の値を入力してください' })
    .refine(v => v <= 999_999_999, { message: '999,999,999以下の値を入力してください' }),
})

type HotelFormValues = z.input<typeof hotelSchema>
type HotelParsed     = z.output<typeof hotelSchema>

// ── Props ────────────────────────────────────────────────────
interface HotelFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 編集モードの場合は既存ホテルを渡す */
  editTarget?: HotelType | null
  onSuccess: (hotel: HotelType) => void
}

// ── 数値入力のカンマ整形 ─────────────────────────────────────
function formatNumberInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('ja-JP')
}

// ── コンポーネント ────────────────────────────────────────────
export function HotelFormDialog({
  open, onOpenChange, editTarget, onSuccess,
}: HotelFormDialogProps) {
  const router    = useRouter()
  const isEdit    = !!editTarget
  const [submittedHotel, setSubmittedHotel] = useState<HotelType | null>(null)
  const [phase, setPhase] = useState<'form' | 'next-action'>('form')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HotelFormValues>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      name: editTarget?.name ?? '',
      monthly_target_sales: editTarget?.monthly_target_sales
        ? editTarget.monthly_target_sales.toLocaleString('ja-JP')
        : '',
    },
  })

  const salesRaw = watch('monthly_target_sales') as string

  // ── 送信処理 ──────────────────────────────────────────────
  const onSubmit = async (values: HotelFormValues) => {
    const parsed = hotelSchema.parse(values) as HotelParsed

    const url    = isEdit ? `/api/hotels/${editTarget!.id}` : '/api/hotels'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:                  parsed.name,
        monthly_target_sales:  parsed.monthly_target_sales,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? '保存に失敗しました')
      return
    }

    const hotel: HotelType = data.hotel
    onSuccess(hotel)

    if (isEdit) {
      toast.success(`「${hotel.name}」を更新しました`)
      onOpenChange(false)
    } else {
      // 新規登録 → 次のアクション画面へ
      setSubmittedHotel(hotel)
      setPhase('next-action')
      toast.success(`「${hotel.name}」を登録しました`)
    }
  }

  // ── ダイアログを閉じるときにリセット ──────────────────────
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset()
      setPhase('form')
      setSubmittedHotel(null)
    }
    onOpenChange(next)
  }

  // ── 部屋タイプ登録画面へ遷移 ──────────────────────────────
  const goToRoomTypes = () => {
    handleOpenChange(false)
    router.push(`/admin/hotels/${submittedHotel!.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">

        {/* ── フェーズ①: 入力フォーム ── */}
        {phase === 'form' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Hotel size={18} className="text-teal-600" />
                </div>
                <DialogTitle>
                  {isEdit ? 'ホテル情報を編集' : 'ホテルを新規登録'}
                </DialogTitle>
              </div>
              <DialogDescription>
                {isEdit
                  ? '変更したい項目を編集してください'
                  : 'ホテル名と月間目標売上を入力してください'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* ── ホテル名 ── */}
              <div>
                <Label htmlFor="hotel-name">
                  ホテル名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hotel-name"
                  placeholder="例：ホテルサンプル A"
                  error={!!errors.name}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* ── 月間目標売上 ── */}
              <div>
                <Label htmlFor="target-sales">月間目標売上</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                    ¥
                  </span>
                  <Input
                    id="target-sales"
                    inputMode="numeric"
                    placeholder="0"
                    className="pl-7"
                    error={!!errors.monthly_target_sales}
                    {...register('monthly_target_sales', {
                      onChange: e => {
                        const formatted = formatNumberInput(e.target.value)
                        setValue('monthly_target_sales', formatted, { shouldValidate: true })
                      },
                    })}
                  />
                </div>
                {errors.monthly_target_sales ? (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.monthly_target_sales.message as string}
                  </p>
                ) : salesRaw ? (
                  <p className="text-xs text-slate-400 mt-1">
                    {formatCurrency(parseInt((salesRaw as string).replace(/,/g, ''), 10) || 0)} / 月
                  </p>
                ) : null}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="rounded-xl"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl gap-2"
                >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  {isEdit ? '変更を保存' : '登録する'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {/* ── フェーズ②: 登録完了 → 次のアクション ── */}
        {phase === 'next-action' && submittedHotel && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <span className="text-emerald-600 text-lg">✓</span>
                </div>
                <DialogTitle>登録が完了しました</DialogTitle>
              </div>
              <DialogDescription>
                「{submittedHotel.name}」を登録しました。<br />
                続けて部屋タイプと単価を設定しますか？
              </DialogDescription>
            </DialogHeader>

            {/* プレビューカード */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 my-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">ホテル名</span>
                <span className="font-semibold text-slate-900">{submittedHotel.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">月間目標売上</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(submittedHotel.monthly_target_sales)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">部屋タイプ</span>
                <span className="text-slate-400 italic">未設定</span>
              </div>
            </div>

            {/* 次のアクション */}
            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={goToRoomTypes}
                className={cn(
                  'w-full flex items-center justify-between gap-3',
                  'bg-teal-600 hover:bg-teal-500 text-white',
                  'rounded-2xl px-5 py-4 transition-colors group'
                )}
              >
                <div className="flex items-center gap-3">
                  <PlusCircle size={20} />
                  <div className="text-left">
                    <div className="font-bold text-sm">部屋タイプを登録する</div>
                    <div className="text-xs text-white/70 mt-0.5">日報入力に必要です（推奨）</div>
                  </div>
                </div>
                <ArrowRight size={18} className="opacity-60 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleOpenChange(false)}
                className="w-full text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
              >
                あとで設定する
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
