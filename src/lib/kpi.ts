/**
 * src/lib/kpi.ts
 *
 * KPI 表示に関する共通ユーティリティ。
 * MonthlyKpiSection・HotelKpiGrid の両方から参照する。
 */

import {
  Award, TrendingUp, TrendingDown, Zap, AlertTriangle,
} from 'lucide-react'

export interface AchievementTheme {
  bar:    string   // Progress インジケーターの bg クラス
  text:   string   // 数値・ラベルの text クラス
  bg:     string   // カード背景の bg クラス
  border: string   // カード枠の border クラス
  badge:  string   // バッジの bg + text クラス
  glow:   string   // shadow クラス（グローエフェクト用）
  icon:   typeof Award
  label:  string   // 日本語ステータスラベル
}

export function getAchievementTheme(pct: number): AchievementTheme {
  if (pct >= 100) return {
    bar:    'bg-emerald-500',
    text:   'text-emerald-600',
    bg:     'bg-emerald-50',
    border: 'border-emerald-200',
    badge:  'bg-emerald-100 text-emerald-700',
    glow:   'shadow-emerald-500/25',
    icon:   Award,
    label:  '目標達成！',
  }
  if (pct >= 80) return {
    bar:    'bg-teal-500',
    text:   'text-teal-600',
    bg:     'bg-teal-50',
    border: 'border-teal-200',
    badge:  'bg-teal-100 text-teal-700',
    glow:   'shadow-teal-500/20',
    icon:   TrendingUp,
    label:  '順調に進捗中',
  }
  if (pct >= 50) return {
    bar:    'bg-sky-500',
    text:   'text-sky-600',
    bg:     'bg-sky-50',
    border: 'border-sky-200',
    badge:  'bg-sky-100 text-sky-700',
    glow:   'shadow-sky-500/20',
    icon:   Zap,
    label:  'もうひと踏ん張り',
  }
  if (pct >= 20) return {
    bar:    'bg-amber-500',
    text:   'text-amber-600',
    bg:     'bg-amber-50',
    border: 'border-amber-200',
    badge:  'bg-amber-100 text-amber-700',
    glow:   'shadow-amber-500/20',
    icon:   TrendingDown,
    label:  'ペースアップが必要',
  }
  return {
    bar:    'bg-red-400',
    text:   'text-red-600',
    bg:     'bg-red-50',
    border: 'border-red-200',
    badge:  'bg-red-100 text-red-700',
    glow:   'shadow-red-500/15',
    icon:   AlertTriangle,
    label:  '要注意',
  }
}
