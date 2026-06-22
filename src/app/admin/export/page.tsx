/**
 * 帳票出力ページ（管理者向け）
 *
 * 月次請求書PDFと日次レポートPDFをダウンロードするUIを提供する。
 * PDF生成はすべてサーバーサイド（Route Handler）に委譲するため、
 * クライアントはAPIエンドポイントへのリンクを叩くだけ。
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { todayString } from '@/lib/utils'
import { FileText, CalendarDays, Loader2, Download, AlertCircle } from 'lucide-react'
import type { Hotel } from '@/types/database'
import { cn } from '@/lib/utils'

// ── ユーティリティ ──────────────────────────────────────────────────────

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7) // "YYYY-MM"
}

async function downloadPdf(url: string, label: string) {
  // 新しいタブで開かず、fetch → Blob → anchorクリックでダウンロード
  const res = await fetch(url)
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error ?? `${label}の生成に失敗しました`)
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)

  // Content-Disposition のファイル名をデコード
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const filenameMatch = disposition.match(/filename\*=UTF-8''(.+)/)
  const filename = filenameMatch
    ? decodeURIComponent(filenameMatch[1])
    : `${label}.pdf`

  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  a.click()
  URL.revokeObjectURL(objectUrl)
}

// ── サブコンポーネント ──────────────────────────────────────────────────

interface CardProps {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}

function ExportCard({ icon, title, description, children }: CardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* カードヘッダー */}
      <div className="bg-navy-900 px-6 py-5 flex items-center gap-4">
        <div className="w-10 h-10 bg-gold-400/20 rounded-xl flex items-center justify-center text-gold-400">
          {icon}
        </div>
        <div>
          <h2 className="text-linen-50 font-bold text-base">{title}</h2>
          <p className="text-linen-200/50 text-xs mt-0.5">{description}</p>
        </div>
      </div>
      {/* カードボディ */}
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── メインページ ────────────────────────────────────────────────────────

export default function ExportPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])

  // 月次請求書の状態
  const [invoiceHotelId, setInvoiceHotelId] = useState('')
  const [invoiceMonth, setInvoiceMonth] = useState(currentMonth())
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  // 日次レポートの状態
  const [dailyHotelId, setDailyHotelId] = useState('')
  const [dailyDate, setDailyDate] = useState(todayString())
  const [dailyLoading, setDailyLoading] = useState(false)

  // ホテル一覧を取得
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('hotels')
      .select('*')
      .order('name')
      .then(({ data }) => {
        const list = data ?? []
        setHotels(list)
        if (list.length > 0) {
          setInvoiceHotelId(list[0].id)
          setDailyHotelId(list[0].id)
        }
      })
  }, [])

  // 月次請求書ダウンロード
  const handleInvoiceDownload = async () => {
    if (!invoiceHotelId) { toast.error('ホテルを選択してください'); return }
    setInvoiceLoading(true)
    try {
      const url = `/api/pdf/invoice?hotelId=${invoiceHotelId}&month=${invoiceMonth}`
      await downloadPdf(url, '月次請求書')
      toast.success('月次請求書をダウンロードしました')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ダウンロードに失敗しました')
    } finally {
      setInvoiceLoading(false)
    }
  }

  // 日次レポートダウンロード
  const handleDailyDownload = async () => {
    if (!dailyHotelId) { toast.error('ホテルを選択してください'); return }
    setDailyLoading(true)
    try {
      const url = `/api/pdf/daily-report?hotelId=${dailyHotelId}&date=${dailyDate}`
      await downloadPdf(url, '日次レポート')
      toast.success('日次レポートをダウンロードしました')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ダウンロードに失敗しました')
    } finally {
      setDailyLoading(false)
    }
  }

  return (
    <div className="p-8">
      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900">帳票出力</h1>
        <p className="text-navy-800/50 text-sm mt-1">
          月次請求書・日次レポートをPDFで出力します。日本語フォント（Noto Sans JP）を埋め込み済みです。
        </p>
      </div>

      {/* 注意書き */}
      <div className="flex items-start gap-3 bg-gold-400/10 border border-gold-400/30 rounded-xl px-4 py-3 mb-8">
        <AlertCircle size={16} className="text-gold-500 shrink-0 mt-0.5" />
        <p className="text-sm text-navy-800/70">
          初回のPDF生成時は日本語フォントをGoogleから取得するため、数秒かかる場合があります。
          2回目以降はキャッシュされるため高速になります。
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── 月次請求書 ── */}
        <ExportCard
          icon={<FileText size={20} />}
          title="月次請求書"
          description="ホテルへ毎月提出する清掃業務の請求書（A4縦）"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-navy-800/40 uppercase tracking-wide mb-1.5 block">
                対象ホテル
              </label>
              <select
                value={invoiceHotelId}
                onChange={e => setInvoiceHotelId(e.target.value)}
                className="w-full border border-linen-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 bg-linen-50"
              >
                <option value="">ホテルを選択</option>
                {hotels.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-navy-800/40 uppercase tracking-wide mb-1.5 block">
                対象月
              </label>
              <input
                type="month"
                value={invoiceMonth}
                onChange={e => setInvoiceMonth(e.target.value)}
                className="w-full border border-linen-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 bg-linen-50"
              />
            </div>

            {/* 含まれる内容プレビュー */}
            <div className="bg-linen-100 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-bold text-navy-800/40 uppercase tracking-wide mb-2">含まれる内容</p>
              {[
                '宛名・発行日・請求総額',
                '部屋タイプ別 清掃実績明細',
                '調整金明細（クレーム減額など）',
                '合計金額サマリー',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-navy-800/60">
                  <span className="text-gold-400">✓</span> {item}
                </div>
              ))}
            </div>

            <button
              onClick={handleInvoiceDownload}
              disabled={invoiceLoading || !invoiceHotelId}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm transition-colors',
                'bg-navy-900 text-linen-50 hover:bg-navy-800',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              {invoiceLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  生成中…
                </>
              ) : (
                <>
                  <Download size={16} />
                  請求書PDFをダウンロード
                </>
              )}
            </button>
          </div>
        </ExportCard>

        {/* ── 日次レポート ── */}
        <ExportCard
          icon={<CalendarDays size={20} />}
          title="日次レポート"
          description="ホテルへ毎日提出する清掃完了報告書（A4縦）"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-navy-800/40 uppercase tracking-wide mb-1.5 block">
                対象ホテル
              </label>
              <select
                value={dailyHotelId}
                onChange={e => setDailyHotelId(e.target.value)}
                className="w-full border border-linen-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 bg-linen-50"
              >
                <option value="">ホテルを選択</option>
                {hotels.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-navy-800/40 uppercase tracking-wide mb-1.5 block">
                対象日
              </label>
              <input
                type="date"
                value={dailyDate}
                onChange={e => setDailyDate(e.target.value)}
                className="w-full border border-linen-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 bg-linen-50"
              />
            </div>

            {/* 含まれる内容プレビュー */}
            <div className="bg-linen-100 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-bold text-navy-800/40 uppercase tracking-wide mb-2">含まれる内容</p>
              {[
                '宛名・対象日・サマリー（室数・売上）',
                '部屋タイプ別 清掃完了室数一覧',
                '備考欄（自由記入）',
                '確認・承認欄（リーダー / 管理者 / ホテル担当）',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-navy-800/60">
                  <span className="text-gold-400">✓</span> {item}
                </div>
              ))}
            </div>

            <button
              onClick={handleDailyDownload}
              disabled={dailyLoading || !dailyHotelId}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm transition-colors',
                'bg-gold-400 text-navy-900 hover:bg-gold-500',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              {dailyLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  生成中…
                </>
              ) : (
                <>
                  <Download size={16} />
                  日次レポートPDFをダウンロード
                </>
              )}
            </button>
          </div>
        </ExportCard>
      </div>
    </div>
  )
}
