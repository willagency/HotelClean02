/**
 * 日次レポート PDF コンポーネント
 *
 * 対象日の清掃完了室数一覧と、右下に承認欄を配置したA4縦帳票。
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
import type { DailyReportData } from '@/lib/pdf/data'

// ── ローカルスタイル ────────────────────────────────────────────────────
const s = StyleSheet.create({
  // 宛名・日付ブロック
  metaBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  hotelName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLOR.text,
    marginBottom: 2,
  },
  metaSub: {
    fontSize: 9,
    color: COLOR.muted,
  },
  targetDate: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLOR.navy,
    textAlign: 'right' as const,
  },

  // サマリーカード（合計室数・売上）
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLOR.linen,
    borderRadius: 6,
    padding: 12,
  },
  summaryCardHighlight: {
    flex: 1,
    backgroundColor: COLOR.navy,
    borderRadius: 6,
    padding: 12,
  },
  summaryCardLabel: {
    fontSize: 8,
    color: COLOR.muted,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  summaryCardLabelLight: {
    fontSize: 8,
    color: '#ffffff66',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  summaryCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLOR.text,
  },
  summaryCardValueGold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLOR.gold,
  },

  // テーブルのカラム幅
  col: {
    roomType: { flex: 3 },
    unitPrice: { flex: 2, textAlign: 'right' as const },
    completedRooms: { flex: 2, textAlign: 'right' as const },
    subtotal: { flex: 2, textAlign: 'right' as const },
  },

  // 承認欄（右下に配置）
  approvalSection: {
    position: 'absolute',
    bottom: PAGE.marginV + 30,  // フッターの上
    right: PAGE.marginH,
    width: 200,
  },
  approvalLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLOR.muted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  approvalBoxRow: {
    flexDirection: 'row',
    gap: 8,
  },
  approvalBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLOR.linenDark,
    borderRadius: 4,
    height: 60,
    padding: 6,
  },
  approvalBoxLabel: {
    fontSize: 7,
    color: COLOR.muted,
    marginBottom: 4,
  },
})

// ── ユーティリティ ──────────────────────────────────────────────────────
function yen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`
}

// ── コンポーネント ──────────────────────────────────────────────────────

export default function DailyReportPdf({ data }: { data: DailyReportData }) {
  return (
    <Document
      title={`日次レポート_${data.hotelName}_${data.targetDateRaw}`}
      author="CleanOps"
      subject="清掃完了報告書"
    >
      <Page size="A4" style={shared.page}>
        {/* ── ヘッダーバー ── */}
        <View style={shared.headerBar}>
          <View>
            <Text style={shared.headerTitle}>CleanOps</Text>
            <Text style={shared.headerSubtitle}>ホテル客室清掃管理システム</Text>
          </View>
          <View style={shared.headerMeta}>
            <Text style={shared.headerMetaText}>清掃完了</Text>
            <Text style={{ ...shared.headerMetaText, color: COLOR.gold, fontSize: 11, fontWeight: 'bold' }}>
              日 次 レ ポ ー ト
            </Text>
          </View>
        </View>

        {/* ── 宛名・対象日 ── */}
        <View style={s.metaBlock}>
          <View>
            <Text style={s.hotelName}>{data.hotelName} 御中</Text>
            <Text style={s.metaSub}>下記のとおり清掃業務が完了しましたのでご報告申し上げます</Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: COLOR.muted, textAlign: 'right' as const, marginBottom: 2 }}>
              対象日
            </Text>
            <Text style={s.targetDate}>{data.targetDate}</Text>
          </View>
        </View>

        {/* ── サマリーカード ── */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryCardLabel}>合計清掃室数</Text>
            <Text style={s.summaryCardValue}>{data.totalRooms} 室</Text>
          </View>
          <View style={s.summaryCardHighlight}>
            <Text style={s.summaryCardLabelLight}>本日の清掃売上</Text>
            <Text style={s.summaryCardValueGold}>{yen(data.totalSales)}</Text>
          </View>
        </View>

        {/* ── 清掃実績テーブル ── */}
        <Text style={shared.sectionLabel}>清掃完了室数 一覧</Text>

        <View style={shared.table}>
          {/* ヘッダー */}
          <View style={shared.tableHeader}>
            <Text style={{ ...shared.tableHeaderCell, ...s.col.roomType }}>部屋タイプ</Text>
            <Text style={{ ...shared.tableHeaderCell, ...s.col.unitPrice }}>単価</Text>
            <Text style={{ ...shared.tableHeaderCell, ...s.col.completedRooms }}>完了室数</Text>
            <Text style={{ ...shared.tableHeaderCell, ...s.col.subtotal }}>小計</Text>
          </View>

          {/* データ行 */}
          {data.lineItems.length === 0 ? (
            <View style={shared.tableRow}>
              <Text style={{ ...shared.tableCellMuted, flex: 1, textAlign: 'center' as const }}>
                本日の清掃実績がありません
              </Text>
            </View>
          ) : (
            data.lineItems.map((item, i) => (
              <View
                key={i}
                style={[shared.tableRow, i % 2 === 1 ? shared.tableRowAlt : {}]}
              >
                <Text style={{ ...shared.tableCell, ...s.col.roomType }}>
                  {item.roomTypeName}
                </Text>
                <Text style={{ ...shared.tableCellMuted, ...s.col.unitPrice }}>
                  {yen(item.unitPrice)}
                </Text>
                <Text style={{
                  ...shared.tableCell,
                  ...s.col.completedRooms,
                  fontWeight: 'bold',
                  fontSize: 11,
                  color: COLOR.navy,
                }}>
                  {item.completedRooms}
                </Text>
                <Text style={{ ...shared.tableCell, ...s.col.subtotal }}>
                  {yen(item.subtotal)}
                </Text>
              </View>
            ))
          )}

          {/* フッター合計行 */}
          <View style={shared.tableFooter}>
            <Text style={{ ...shared.tableFooterCell, ...s.col.roomType }}>合計</Text>
            <Text style={{ ...shared.tableFooterCell, ...s.col.unitPrice }} />
            <Text style={{ ...shared.tableFooterGold, ...s.col.completedRooms }}>
              {data.totalRooms} 室
            </Text>
            <Text style={{ ...shared.tableFooterGold, ...s.col.subtotal }}>
              {yen(data.totalSales)}
            </Text>
          </View>
        </View>

        {/* ── 備考欄 ── */}
        <View style={{ marginTop: 20 }}>
          <Text style={shared.sectionLabel}>備考</Text>
          <View style={{
            borderWidth: 1,
            borderColor: COLOR.linenDark,
            borderRadius: 4,
            height: 50,
            padding: 8,
          }}>
            <Text style={{ fontSize: 8, color: COLOR.muted }}>（自由記入欄）</Text>
          </View>
        </View>

        {/* ── 承認欄（右下・絶対配置） ── */}
        <View style={s.approvalSection}>
          <Text style={s.approvalLabel}>確認・承認</Text>
          <View style={s.approvalBoxRow}>
            <View style={s.approvalBox}>
              <Text style={s.approvalBoxLabel}>リーダー</Text>
            </View>
            <View style={s.approvalBox}>
              <Text style={s.approvalBoxLabel}>管理者</Text>
            </View>
            <View style={s.approvalBox}>
              <Text style={s.approvalBoxLabel}>ホテル担当</Text>
            </View>
          </View>
        </View>

        {/* ── フッター ── */}
        <View style={shared.footer} fixed>
          <Text style={shared.footerText}>CleanOps — 自動生成帳票</Text>
          <Text style={shared.footerText}>{data.targetDateRaw}</Text>
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
