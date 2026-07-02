/**
 * @react-pdf/renderer 用 日本語フォント設定
 *
 * ## 文字化けの根本原因と解決策
 *
 * ❌ 旧実装の問題:
 *   Google Fonts CSS2 API は日本語を「unicode-range」で約50個のwoff2に分割して返す。
 *   正規表現 src: url(...) の「最初のマッチ」だけ取得すると、
 *   ラテン文字/記号しか含まない部分フォント(例: .0.woff2)だけが登録される。
 *   ひらがな・カタカナ・漢字のグリフが存在しないため、日本語が豆腐(□)になる。
 *
 * ✅ 修正後の解決策:
 *   全グリフを含む単一の .ttf ファイルを直接使用する。
 *   優先順位: ① public/fonts/ に同梱（高速・オフライン対応）
 *            ② Google Fonts CDN の ttf URL から直接取得（同梱ファイル未配置時のフォールバック）
 */

import path from 'path'
import fs from 'fs'
import { Font } from '@react-pdf/renderer'

// public/fonts/ に配置するファイル名（README.md参照）
const LOCAL_FONT_DIR = path.join(process.cwd(), 'public', 'fonts')
const LOCAL_REGULAR  = path.join(LOCAL_FONT_DIR, 'NotoSansJP-Regular.ttf')
const LOCAL_BOLD     = path.join(LOCAL_FONT_DIR, 'NotoSansJP-Bold.ttf')

/**
 * Google Fonts CDN の ttf 直接URL（全グリフ入りの単一ファイル）
 *
 * woff2 ではなく ttf を使う理由:
 *   woff2 は「ブラウザ向け最適化フォーマット」でunicode-rangeによる分割が前提。
 *   @react-pdf/renderer はブラウザCSS仕様のunicode-rangeを解釈しないため、
 *   全グリフが1ファイルに入っている ttf を使う必要がある。
 *
 * URL は Google Fonts の GitHub リリースから取得:
 *   https://github.com/google/fonts/tree/main/ofl/notosansjp
 *
 * ⚠️ バージョンが変わった場合の確認方法:
 *   https://fonts.gstatic.com/s/notosansjp/v53/uK0GbuciJMv-DPFZM7a1kqzcsIA9J-lnwbkJGbWs5g.ttf
 *   上記をブラウザで開き、日本語グリフが表示されるか確認すること。
 */
const CDN_REGULAR = 'https://fonts.gstatic.com/s/notosansjp/v53/uK0GbuciJMv-DPFZM7a1kqzcsIA9J-lnwbkJGbWs5g.ttf'
const CDN_BOLD    = 'https://fonts.gstatic.com/s/notosansjp/v53/uK0GbuciJMv-DPFZM7a1kqzcsIA9J-lnwbkJGbWs5u4GVgs.ttf'

let registered = false

export async function registerJapaneseFonts(): Promise<void> {
  if (registered) return

  // ① public/fonts/ にファイルが存在すればローカルパスを使う（高速）
  // ② なければ CDN の ttf URL にフォールバック
  const regularSrc = fs.existsSync(LOCAL_REGULAR) ? LOCAL_REGULAR : CDN_REGULAR
  const boldSrc    = fs.existsSync(LOCAL_BOLD)    ? LOCAL_BOLD    : CDN_BOLD

  if (fs.existsSync(LOCAL_REGULAR)) {
    console.log('[PDF Font] Using local font files from public/fonts/')
  } else {
    console.warn('[PDF Font] Local fonts not found. Fetching ttf from Google CDN.')
    console.warn('[PDF Font] → Place NotoSansJP-Regular.ttf / NotoSansJP-Bold.ttf in public/fonts/ for better performance.')
  }

  Font.register({
    family: 'Noto Sans JP',
    fonts: [
      { src: regularSrc, fontWeight: 'normal' },
      { src: boldSrc,    fontWeight: 'bold'   },
    ],
  })

  // 日本語はハイフネーション不要（途中で単語分割しない）
  Font.registerHyphenationCallback((word) => [word])

  registered = true
}
