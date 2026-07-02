import { StyleSheet } from '@react-pdf/renderer'

/** A4 pt 換算: 595.28 x 841.89 */
export const PAGE = {
  width: 595.28,
  height: 841.89,
  marginH: 50,
  marginV: 50,
} as const

/** ブランドカラー（Tailwindの navy / gold を流用） */
export const COLOR = {
  navy: '#1a2340',
  gold: '#c9a84c',
  linen: '#f4f4ef',
  linenDark: '#e8e8df',
  text: '#111827',
  muted: '#6b7280',
  white: '#ffffff',
  danger: '#ef4444',
  success: '#22c55e',
} as const

export const shared = StyleSheet.create({
  page: {
    fontFamily: 'Noto Sans JP',
    fontSize: 10,
    color: COLOR.text,
    paddingTop: PAGE.marginV,
    paddingBottom: PAGE.marginV + 20, // フッター分
    paddingHorizontal: PAGE.marginH,
    backgroundColor: COLOR.white,
  },

  // ─── ヘッダー ───────────────────────────────────────────
  headerBar: {
    backgroundColor: COLOR.navy,
    marginHorizontal: -PAGE.marginH,
    marginTop: -PAGE.marginV,
    paddingVertical: 18,
    paddingHorizontal: PAGE.marginH,
    marginBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: COLOR.gold,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#ffffff80',
    fontSize: 8,
    marginTop: 2,
  },
  headerMeta: {
    alignItems: 'flex-end',
  },
  headerMetaText: {
    color: '#ffffffcc',
    fontSize: 9,
    marginBottom: 2,
  },

  // ─── セクション ─────────────────────────────────────────
  sectionLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLOR.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLOR.linenDark,
    marginVertical: 12,
  },
  thinDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.linenDark,
    marginVertical: 6,
  },

  // ─── テーブル ────────────────────────────────────────────
  table: {
    width: '100%',
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLOR.navy,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tableHeaderCell: {
    color: COLOR.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.linenDark,
  },
  tableRowAlt: {
    backgroundColor: COLOR.linen,
  },
  tableCell: {
    fontSize: 9,
    color: COLOR.text,
  },
  tableCellMuted: {
    fontSize: 9,
    color: COLOR.muted,
  },
  tableFooter: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: COLOR.navy,
    borderRadius: 4,
    marginTop: 2,
  },
  tableFooterCell: {
    color: COLOR.white,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableFooterGold: {
    color: COLOR.gold,
    fontWeight: 'bold',
    fontSize: 10,
  },

  // ─── フッター ────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 30,
    left: PAGE.marginH,
    right: PAGE.marginH,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: COLOR.linenDark,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: COLOR.muted,
  },
})
