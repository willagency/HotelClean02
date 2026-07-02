'use client'

/**
 * ホテル詳細 + 部屋タイプ管理
 *
 * - 管理者: 部屋タイプの追加・削除、ホテル情報の編集
 * - リーダー: 閲覧専用
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  ArrowLeft, PlusCircle, Trash2, Hotel,
  BedDouble, Pencil, Loader2,
} from 'lucide-react'

import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge }  from '@/components/ui/badge'
import { HotelFormDialog } from './HotelFormDialog'
import { formatCurrency, cn } from '@/lib/utils'
import { isAdmin } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'
import type { Hotel as HotelType, RoomType } from '@/types/database'

// ── 部屋タイプフォームスキーマ ────────────────────────────────
const roomTypeSchema = z.object({
  name: z.string().min(1, 'タイプ名を入力してください').max(50, '50文字以内'),
  unit_price: z
    .string()
    .min(1, '単価を入力してください')
    .refine(v => /^\d+$/.test(v.replace(/,/g, '')), { message: '数値で入力してください' })
    .transform(v => parseInt(v.replace(/,/g, ''), 10))
    .refine(v => v >= 0,       { message: '0以上の値を入力してください' })
    .refine(v => v <= 999_999, { message: '999,999以下の値を入力してください' }),
})
type RoomTypeFormValues = z.input<typeof roomTypeSchema>

// ── Props ────────────────────────────────────────────────────
interface HotelDetailProps {
  hotel: HotelType & { room_types: RoomType[] }
  currentUser: AuthUser
}

// ── コンポーネント ────────────────────────────────────────────
export function HotelDetail({ hotel: initialHotel, currentUser }: HotelDetailProps) {
  const [hotel, setHotel]         = useState(initialHotel)
  const [editOpen, setEditOpen]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const canEdit = isAdmin(currentUser)

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<RoomTypeFormValues>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: { name: '', unit_price: '' },
  })

  // ── 部屋タイプ追加 ────────────────────────────────────────
  const onAddRoomType = async (values: RoomTypeFormValues) => {
    const res = await fetch(`/api/hotels/${hotel.id}/room-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:       values.name,
        unit_price: roomTypeSchema.parse(values).unit_price,
      }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }

    setHotel(h => ({ ...h, room_types: [...h.room_types, data.room_type] }))
    reset()
    toast.success(`「${data.room_type.name}」を追加しました`)
  }

  // ── 部屋タイプ削除 ────────────────────────────────────────
  const onDeleteRoomType = async (rtId: string, rtName: string) => {
    if (!confirm(`「${rtName}」を削除しますか？\n過去の日報データには影響しません。`)) return
    setDeletingId(rtId)

    const res = await fetch(
      `/api/hotels/${hotel.id}/room-types?roomTypeId=${rtId}`,
      { method: 'DELETE' }
    )
    const data = await res.json()
    setDeletingId(null)

    if (!res.ok) { toast.error(data.error); return }
    setHotel(h => ({ ...h, room_types: h.room_types.filter(r => r.id !== rtId) }))
    toast.success(`「${rtName}」を削除しました`)
  }

  return (
    <>
      {/* ── パンくず ── */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/admin/hotels"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={15} />
          クライアント一覧
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-600 font-medium">{hotel.name}</span>
      </div>

      {/* ── ホテル情報カード ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center">
              <Hotel size={24} className="text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{hotel.name}</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                登録: {new Date(hotel.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600
                         border border-slate-200 hover:border-teal-300 rounded-xl px-3 py-2
                         transition-all hover:bg-teal-50"
            >
              <Pencil size={14} /> 編集
            </button>
          )}
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">月間目標売上</p>
            <p className="text-2xl font-bold text-slate-900 tabular">
              {hotel.monthly_target_sales > 0
                ? formatCurrency(hotel.monthly_target_sales)
                : <span className="text-slate-300 text-base font-normal">未設定</span>
              }
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">部屋タイプ数</p>
            <p className="text-2xl font-bold text-slate-900">{hotel.room_types.length} 種類</p>
          </div>
        </div>
      </div>

      {/* ── 部屋タイプ管理 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BedDouble size={17} className="text-teal-600" />
            <h2 className="font-bold text-slate-900">部屋タイプ・単価</h2>
          </div>
          {!canEdit && (
            <Badge variant="muted">閲覧のみ</Badge>
          )}
        </div>

        {/* 既存の部屋タイプ一覧 */}
        {hotel.room_types.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <BedDouble size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm">部屋タイプが登録されていません</p>
            {canEdit && <p className="text-xs mt-1">下のフォームから追加してください</p>}
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">タイプ名</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">清掃単価</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">月100室換算</th>
                {canEdit && <th className="px-4 py-3 w-12" />}
              </tr>
            </thead>
            <tbody>
              {hotel.room_types.map((rt, i) => (
                <tr key={rt.id} className={cn(
                  'border-b border-slate-100 hover:bg-slate-50/60 transition-colors',
                  i % 2 === 1 && 'bg-slate-50/40'
                )}>
                  <td className="px-6 py-3.5 font-medium text-slate-800">{rt.name}</td>
                  <td className="px-6 py-3.5 text-right tabular font-bold text-slate-900">
                    {formatCurrency(rt.unit_price)}
                  </td>
                  <td className="px-6 py-3.5 text-right tabular text-slate-400 text-xs">
                    {formatCurrency(rt.unit_price * 100)} / 月
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => onDeleteRoomType(rt.id, rt.name)}
                        disabled={deletingId === rt.id}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="削除"
                      >
                        {deletingId === rt.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── 追加フォーム（管理者のみ） ── */}
        {canEdit && (
          <form
            onSubmit={handleSubmit(onAddRoomType)}
            className="px-6 py-4 bg-slate-50/60 border-t border-slate-100"
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              新しい部屋タイプを追加
            </p>
            <div className="flex gap-3 items-start">
              {/* タイプ名 */}
              <div className="flex-1">
                <Input
                  placeholder="例：スタンダードシングル"
                  error={!!errors.name}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* 単価 */}
              <div className="w-36">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">¥</span>
                  <Input
                    placeholder="1,000"
                    className="pl-7"
                    inputMode="numeric"
                    error={!!errors.unit_price}
                    {...register('unit_price')}
                  />
                </div>
                {errors.unit_price && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.unit_price.message as string}
                  </p>
                )}
              </div>

              {/* 追加ボタン */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl gap-2 shrink-0"
              >
                {isSubmitting
                  ? <Loader2 size={15} className="animate-spin" />
                  : <PlusCircle size={15} />
                }
                追加
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* ホテル編集ダイアログ */}
      {canEdit && (
        <HotelFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          editTarget={hotel}
          onSuccess={updated => setHotel(h => ({ ...h, ...updated }))}
        />
      )}
    </>
  )
}
