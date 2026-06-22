/**
 * GET /api/pdf/daily-report?hotelId=xxx&date=YYYY-MM-DD
 *
 * 日次レポートPDFをサーバーサイドで生成してストリーム返却する。
 */

import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { registerJapaneseFonts } from '@/lib/pdf/fonts'
import { fetchDailyReportData } from '@/lib/pdf/data'
import DailyReportPdf from '@/components/pdf/DailyReportPdf'
import React from 'react'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hotelId = searchParams.get('hotelId')
  const date = searchParams.get('date') // YYYY-MM-DD

  // バリデーション
  if (!hotelId || !date) {
    return NextResponse.json(
      { error: 'hotelId と date（YYYY-MM-DD形式）は必須です' },
      { status: 400 }
    )
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'date は YYYY-MM-DD 形式で指定してください' },
      { status: 400 }
    )
  }

  try {
    // 1. 日本語フォントを登録（冪等）
    await registerJapaneseFonts()

    // 2. Supabaseからデータ取得
    const data = await fetchDailyReportData(hotelId, date)

    // 3. PDFをストリーム生成
    const stream = await renderToStream(
      React.createElement(DailyReportPdf as any, { data }) as any
    )

    // 4. ReadableStream に変換して返却
    const readable = new ReadableStream({
      start(controller) {
        ;(stream as NodeJS.ReadableStream).on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk))
        })
        ;(stream as NodeJS.ReadableStream).on('end', () => {
          controller.close()
        })
        ;(stream as NodeJS.ReadableStream).on('error', (err: Error) => {
          controller.error(err)
        })
      },
    })

    const filename = encodeURIComponent(
      `日次レポート_${data.hotelName}_${date}.pdf`
    )

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF生成に失敗しました'
    console.error('[PDF/daily-report]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
