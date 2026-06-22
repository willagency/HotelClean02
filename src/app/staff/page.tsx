import Link from 'next/link'
import { QrCode, Calendar, ArrowRight } from 'lucide-react'

export default function StaffTopPage() {
  return (
    <div className="flex-1 flex flex-col px-5 py-6 gap-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-900">今日のアクション</h1>
        <p className="text-slate-500 text-sm mt-1">何をしますか？</p>
      </div>

      <Link href="/staff/clock" className="group">
        <div className="bg-teal-600 text-white rounded-3xl p-6 flex items-center gap-5
                        shadow-lg shadow-teal-600/20
                        transition-all duration-200
                        hover:bg-teal-500 hover:shadow-teal-500/30
                        active:scale-[0.98]">
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
            <QrCode size={28} />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold">出退勤を打刻</div>
            <div className="text-sm text-white/70 mt-0.5">QRコードを読み取る</div>
          </div>
          <ArrowRight size={20} className="text-white/50 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      <Link href="/staff/shift" className="group">
        <div className="bg-white text-slate-900 rounded-3xl p-6 flex items-center gap-5
                        shadow-sm border border-slate-200
                        transition-all duration-200
                        hover:border-teal-300 hover:shadow-md
                        active:scale-[0.98]">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center shrink-0">
            <Calendar size={28} className="text-teal-600" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold">シフトを提出</div>
            <div className="text-sm text-slate-500 mt-0.5">来月の希望を入力</div>
          </div>
          <ArrowRight size={20} className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
        </div>
      </Link>
    </div>
  )
}
