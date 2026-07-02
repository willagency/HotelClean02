import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(value: string | Date | null | undefined) {
  if (!value) return "—"

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

export function calcWorkMinutes(
  clockIn: string | Date | null | undefined,
  clockOut: string | Date | null | undefined,
  breakMinutes = 0,
) {
  if (!clockIn || !clockOut) return 0

  const start = clockIn instanceof Date ? clockIn : new Date(clockIn)
  const end = clockOut instanceof Date ? clockOut : new Date(clockOut)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0

  const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000)
  return Math.max(0, diffMinutes - breakMinutes)
}

export function minutesToHHMM(minutes: number) {
  const total = Math.max(0, Math.floor(minutes))
  const hours = String(Math.floor(total / 60)).padStart(2, "0")
  const mins = String(total % 60).padStart(2, "0")
  return `${hours}:${mins}`
}

export function todayString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatDateJa(value: string | Date | null | undefined) {
  if (!value) return ""

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "¥0"

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value)
}
