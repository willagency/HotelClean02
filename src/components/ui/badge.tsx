import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'muted'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        variant === 'default' && 'bg-teal-50 text-teal-700 border border-teal-200',
        variant === 'success' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        variant === 'warning' && 'bg-amber-50 text-amber-700 border border-amber-200',
        variant === 'muted'   && 'bg-slate-100 text-slate-500 border border-slate-200',
        className
      )}
      {...props}
    />
  )
}
