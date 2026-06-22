import Link from 'next/link'
import { Hotel, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-navy-900 px-6 gap-8">
      {/* ロゴ */}
      <div className="text-center mb-2">
        <span className="text-gold-400 text-4xl font-bold tracking-tight">CleanOps</span>
        <p className="text-linen-200/60 text-sm mt-1">ホテル客室清掃管理システム</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* スタッフ向け */}
        <Link
          href="/staff"
          className="btn-tap bg-gold-400 hover:bg-gold-500 text-navy-900"
        >
          <Users size={28} />
          <span>スタッフ打刻・シフト</span>
        </Link>

        {/* 管理者向け */}
        <Link
          href="/admin"
          className="btn-tap bg-linen-50 hover:bg-white text-navy-900"
        >
          <Hotel size={28} />
          <span>管理者ダッシュボード</span>
        </Link>
      </div>

      <p className="text-linen-200/30 text-xs mt-4">MVP v0.1</p>
    </main>
  )
}
