/**
 * 月次請求書 PDF コンポーネント
 *
 * @react-pdf/renderer を使って A4 縦の請求書を生成する。
 * サーバーサイド（Route Handler）でのみ使うこと。
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { shared, COLOR, PAGE } from '@/lib/pdf/styles'
import type { InvoiceData } from '@/lib/pdf/data'

// ── ローカルスタイル（請求書固有） ─────────────────────────────────────
const s = StyleSheet.create({
  // 宛名ブロック
  addressBlock: {
    marginBottom: 20,
  },
  addressTo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLOR.text,
    marginBottom: 2,
  },
  addressSub: {
    fontSize: 9,
    color: COLOR.muted,
  },

  // 請求総額バナー
  totalBanner: {
    backgroundColor: COLOR.navy,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  totalLabel: {
    color: '#ffffffaa',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  totalAmount: {
    color: COLOR.gold,
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  totalTaxNote: {
    color: '#ffffff66',
    fontSize: 7,
    marginTop: 2,
  },
  totalIssueDate: {
    alignItems: 'flex-end',
  },
  totalIssueDateLabel: {
    color: '#ffffff66',
    fontSize: 7,
    marginBottom: 2,
  },
  totalIssueDateValue: {
    color: '#ffffffcc',
    fontSize: 9,
  },

  // 明細テーブルのカラム幅
  col: {
    roomType: { flex: 3 },
    unitPrice: { flex: 2, textAlign: 'right' as const },
    quantity: { flex: 1.5, textAlign: 'right' as const },
    subtotal: { flex: 2, textAlign: 'right' as const },
  },

  // 調整金テーブルのカラム幅
  adjCol: {
    reason: { flex: 4 },
    amount: { flex: 2, textAlign: 'right' as const },
  },

  // 正/負の金額色
  positive: { color: COLOR.success },
  negative: { color: COLOR.danger },

  // 合計行
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.linenDark,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 9,
    color: COLOR.muted,
    width: 80,
    textAlign: 'right',
  },
  summaryValue: {
    fontSize: 9,
    color: COLOR.text,
    width: 80,
    textAlign: 'right',
  },
  summaryGrandLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLOR.text,
    width: 80,
    textAlign: 'right',
  },
  summaryGrandValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLOR.navy,
    width: 90,
    textAlign: 'right',
  },
})

// ── ユーティリティ ──────────────────────────────────────────────────────
function yen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`
}

// ── コンポーネント ──────────────────────────────────────────────────────

export default function InvoicePdf({ data }: { data: InvoiceData }) {
  return (
    <Document
      title={`請求書_${data.hotelName}_${data.targetMonth}`}
      author="CleanOps"
      subject="月次清掃業務請求書"
    >
      <Page size="A4" style={shared.page}>
        {/* ── ヘッダーバー ── */}
        <View style={shared.headerBar}>
          <View>
            <Text style={shared.headerTitle}>CleanOps</Text>
            <Text style={shared.headerSubtitle}>ホテル客室清掃管理システム</Text>
          </View>
          <View style={shared.headerMeta}>
            <Text style={shared.headerMetaText}>月次清掃業務</Text>
            <Text style={{ ...shared.headerMetaText, color: COLOR.gold, fontSize: 11, fontWeight: 'bold' }}>
              請 求 書
            </Text>
          </View>
        </View>

        {/* ── 宛名 ── */}
        <View style={s.addressBlock}>
          <Text style={s.addressTo}>{data.hotelName} 御中</Text>
          <Text style={s.addressSub}>対象月: {data.targetMonth}</Text>
        </View>

        {/* ── 請求総額バナー ── */}
        <View style={s.totalBanner}>
          <View>
            <Text style={s.totalLabel}>請 求 総 額</Text>
            <Text style={s.totalAmount}>{yen(data.grandTotal)}</Text>
            <Text style={s.totalTaxNote}>（消費税別）</Text>
          </View>
          <View style={s.totalIssueDate}>
            <Text style={s.totalIssueDateLabel}>発行日</Text>
            <Text style={s.totalIssueDateValue}>{data.issuedAt}</Text>
          </View>
        </View>

        {/* ── 清掃実績明細 ── */}
        <Text style={shared.sectionLabel}>清掃実績明細</Text>

        <View style={shared.table}>
          {/* テーブルヘッダー */}
          <View style={shared.tableHeader}>
            <Text style={{ ...shared.tableHeaderCell, ...s.col.roomType }}>部屋タイプ</Text>
            <Text style={{ ...shared.tableHeaderCell, ...s.col.unitPrice }}>単価</Text>
            <Text style={{ ...shared.tableHeaderCell, ...s.col.quantity }}>数量（室）</Text>
            <Text style={{ ...shared.tableHeaderCell, ...s.col.subtotal }}>金額</Text>
          </View>

          {/* 明細行 */}
          {data.lineItems.length === 0 ? (
            <View style={shared.tableRow}>
              <Text style={{ ...shared.tableCellMuted, flex: 1, textAlign: 'center' as const }}>
                実績データがありません
              </Text>
            </View>
          ) : (
            data.lineItems.map((item, i) => (
              <View
                key={i}
                style={[
                  shared.tableRow,
                  i % 2 === 1 ? shared.tableRowAlt : {},
                ]}
              >
                <Text style={{ ...shared.tableCell, ...s.col.roomType }}>
                  {item.roomTypeName}
                </Text>
                <Text style={{ ...shared.tableCellMuted, ...s.col.unitPrice }}>
                  {yen(item.unitPrice)}
                </Text>
                <Text style={{ ...shared.tableCell, ...s.col.quantity }}>
                  {item.quantity}
                </Text>
                <Text style={{ ...shared.tableCell, ...s.col.subtotal, fontWeight: 'bold' }}>
                  {yen(item.subtotal)}
                </Text>
              </View>
            ))
          )}

          {/* 清掃小計行 */}
          <View style={shared.tableFooter}>
            <Text style={{ ...shared.tableFooterCell, flex: 3 }}>清掃売上 小計</Text>
            <Text style={{ ...shared.tableFooterGold, flex: 1.5 + 1.5 + 2, textAlign: 'right' as const }}>
              {yen(data.baseSalesTotal)}
            </Text>
          </View>
        </View>

        <View style={shared.thinDivider} />

        {/* ── 調整金明細 ── */}
        {data.adjustments.length > 0 && (
          <>
            <Text style={{ ...shared.sectionLabel, marginTop: 12 }}>調整金明細</Text>

            <View style={shared.table}>
              <View style={shared.tableHeader}>
                <Text style={{ ...shared.tableHeaderCell, ...s.adjCol.reason }}>理由</Text>
                <Text style={{ ...shared.tableHeaderCell, ...s.adjCol.amount }}>金額</Text>
              </View>

              {data.adjustments.map((adj, i) => (
                <View
                  key={i}
                  style={[shared.tableRow, i % 2 === 1 ? shared.tableRowAlt : {}]}
                >
                  <Text style={{ ...shared.tableCell, ...s.adjCol.reason }}>
                    {adj.reason ?? '—'}
                  </Text>
                  <Text
                    style={{
                      ...shared.tableCell,
                      ...s.adjCol.amount,
                      ...(adj.amount >= 0 ? s.positive : s.negative),
                      fontWeight: 'bold',
                    }}
                  >
                    {adj.amount >= 0 ? '+' : ''}{yen(adj.amount)}
                  </Text>
                </View>
              ))}

              <View style={shared.tableFooter}>
                <Text style={{ ...shared.tableFooterCell, flex: 4 }}>調整金 合計</Text>
                <Text
                  style={{
                    ...shared.tableFooterGold,
                    flex: 2,
                    textAlign: 'right' as const,
                  }}
                >
                  {data.adjustmentTotal >= 0 ? '+' : ''}{yen(data.adjustmentTotal)}
                </Text>
              </View>
            </View>

            <View style={shared.thinDivider} />
          </>
        )}

        {/* ── 合計サマリー ── */}
        <View style={{ marginTop: 8 }}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>清掃売上</Text>
            <Text style={s.summaryValue}>{yen(data.baseSalesTotal)}</Text>
          </View>
          {data.adjustmentTotal !== 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>調整金合計</Text>
              <Text style={{
                ...s.summaryValue,
                ...(data.adjustmentTotal >= 0 ? s.positive : s.negative),
              }}>
                {data.adjustmentTotal >= 0 ? '+' : ''}{yen(data.adjustmentTotal)}
              </Text>
            </View>
          )}
          <View style={{ ...s.summaryRow, borderBottomWidth: 0, paddingTop: 10 }}>
            <Text style={s.summaryGrandLabel}>請求総額</Text>
            <Text style={s.summaryGrandValue}>{yen(data.grandTotal)}</Text>
          </View>
        </View>

        {/* ── フッター ── */}
        <View style={shared.footer} fixed>
          <Text style={shared.footerText}>CleanOps — 自動生成帳票</Text>
          <Text style={shared.footerText}>{data.issuedAt} 発行</Text>
          <Text
            style={shared.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
