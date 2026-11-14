import { ArrowUp, ArrowDown } from '@phosphor-icons/react'

export interface RankBadgeProps {
  rank: number
  title?: string
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Huy hiệu thứ hạng chuẩn hóa (Podium Top 1-2-3 & Hạng thường):
 * Thiết kế tối giản, tinh tế, sử dụng font mono nhất quán
 */
export function RankBadge({ rank, title, className = '', size = 'md' }: RankBadgeProps) {
  const isSm = size === 'sm'
  const sizeClasses = isSm ? 'h-6 min-w-6 px-1.5 text-xs' : 'h-6.5 min-w-[32px] px-1.5 text-xs'

  if (rank === 1) {
    return (
      <div
        className={`inline-flex shrink-0 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/15 font-mono font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 select-none shadow-2xs ${sizeClasses} ${className}`}
        title={title || 'Top 1'}
      >
        #1
      </div>
    )
  }

  if (rank === 2) {
    return (
      <div
        className={`inline-flex shrink-0 items-center justify-center rounded-md border border-slate-300/80 bg-slate-200/60 font-mono font-bold text-slate-800 dark:border-slate-600/70 dark:bg-slate-700/50 dark:text-slate-200 select-none shadow-2xs ${sizeClasses} ${className}`}
        title={title || 'Top 2'}
      >
        #2
      </div>
    )
  }

  if (rank === 3) {
    return (
      <div
        className={`inline-flex shrink-0 items-center justify-center rounded-md border border-amber-700/25 bg-amber-700/10 font-mono font-bold text-amber-900 dark:border-amber-700/30 dark:bg-amber-700/20 dark:text-amber-400 select-none shadow-2xs ${sizeClasses} ${className}`}
        title={title || 'Top 3'}
      >
        #3
      </div>
    )
  }

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200/70 bg-slate-100/60 font-mono font-medium text-slate-600 dark:border-slate-800/80 dark:bg-slate-800/50 dark:text-slate-400 select-none ${sizeClasses} ${className}`}
      title={title || `#${rank}`}
    >
      #{rank}
    </div>
  )
}

export interface RankDiffBadgeProps {
  diff: number
  fromRank?: number
  toRank?: number
  showDashIfZero?: boolean
  className?: string
}

/**
 * Huy hiệu biến động thứ hạng (tăng / giảm / giữ nguyên)
 */
export function RankDiffBadge({
  diff,
  fromRank,
  toRank,
  showDashIfZero = false,
  className = '',
}: RankDiffBadgeProps) {
  if (diff === 0) {
    if (showDashIfZero) {
      return <span className={`text-[11px] font-bold text-slate-400 select-none ${className}`}>-</span>
    }
    return null
  }

  const isUp = diff > 0
  const title = fromRank && toRank ? `#${fromRank} ➔ #${toRank}` : undefined

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.2 font-mono text-[10px] font-black leading-none select-none ${
        isUp
          ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
          : 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
      } ${className}`}
      title={title}
    >
      {isUp ? (
        <>
          <ArrowUp weight="bold" className="h-2.5 w-2.5" />
          <span>{diff}</span>
        </>
      ) : (
        <>
          <ArrowDown weight="bold" className="h-2.5 w-2.5" />
          <span>{Math.abs(diff)}</span>
        </>
      )}
    </span>
  )
}
