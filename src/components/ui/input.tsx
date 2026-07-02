import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm',
        'placeholder:text-slate-400 text-slate-900',
        'focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors',
        error && 'border-red-400 focus:ring-red-400/30 focus:border-red-400',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
export { Input }
