/**
 * GET /api/pdf/invoice?hotelId=xxx&month=YYYY-MM
 *
 * 月次請求書PDFをサーバーサイドで生成してストリーム返却する。
 * @react-pdf/renderer の renderToStream() を使用。
 */

import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { registerJapaneseFonts } from '@/lib/pdf/fonts'
import { fetchInvoiceData } from '@/lib/pdf/data'
import InvoicePdf from '@/components/pdf/InvoicePdf'
import React from 'react'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hotelId = searchParams.get('hotelId')
  const month = searchParams.get('month') // YYYY-MM

  // バリデーション
  if (!hotelId || !month) {
    return NextResponse.json(
      { error: 'hotelId と month（YYYY-MM形式）は必須です' },
      { status: 400 }
    )
  }
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: 'month は YYYY-MM 形式で指定してください' },
      { status: 400 }
    )
  }

  try {
    // 1. 日本語フォントを登録（冪等）
    await registerJapaneseFonts()

    // 2. Supabaseからデータ集計
    const data = await fetchInvoiceData(hotelId, month)

    // 3. PDFをストリーム生成
    const stream = await renderToStream(
      React.createElement(InvoicePdf as any, { data }) as any
    )

    // 4. ReadableStream に変換して返却
    const readable = new ReadableStream({
      start(controller) {
        // Node.js Readable → Web ReadableStream のブリッジ
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

    // ファイル名（日本語を含む場合は RFC 5987 エンコード）
    const filename = encodeURIComponent(
      `請求書_${data.hotelName}_${month}.pdf`
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
    console.error('[PDF/invoice]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
