'use client'

import { Staff, Role } from '@/types/database'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface StaffSelectorProps {
  staffs: (Staff & { roles: Role | null })[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function StaffSelector({ staffs, selectedId, onSelect }: StaffSelectorProps) {
  return (
    <div className="space-y-2">
      {staffs.map((staff) => {
        const selected = selectedId === staff.id
        return (
          <button
            key={staff.id}
            onClick={() => onSelect(staff.id)}
            className={cn(
              'w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 text-left',
              'transition-all duration-150 active:scale-[0.98] border-2',
              selected
                ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-600/20'
                : 'bg-white text-slate-900 border-slate-200 hover:border-teal-300 hover:shadow-sm'
            )}
          >
            {/* アバター */}
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0 transition-colors',
              selected ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-700'
            )}>
              {staff.name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base leading-tight">{staff.name}</div>
              <div className={cn('text-sm mt-0.5', selected ? 'text-white/70' : 'text-slate-400')}>
                {staff.roles?.name ?? '役割未設定'}
              </div>
            </div>

            <div className={cn(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
              selected ? 'bg-white border-white' : 'border-slate-300'
            )}>
              {selected && <Check size={13} className="text-teal-600" strokeWidth={3} />}
            </div>
          </button>
        )
      })}
    </div>
  )
}
