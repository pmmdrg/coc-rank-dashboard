import { ArrowUp, ArrowDown } from '@phosphor-icons/react'

export interface RankBadgeProps {
  rank: number
  title?: string
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Huy hiệu thứ hạng chuẩn hóa TH19 (Vàng ánh kim #1, Trắng bạc #2, Đồng ánh kim #3, Đen than cho các hạng còn lại):
 * Tối giản, tương phản cao, phông mono
 */
export function RankBadge({ rank, title, className = '', size = 'md' }: RankBadgeProps) {
  const isSm = size === 'sm'
  const sizeClasses = isSm ? 'h-6 min-w-6 px-1.5 text-xs' : 'h-6.5 min-w-[32px] px-1.5 text-xs'

  if (rank === 1) {
    return (
      <div
        className={`inline-flex shrink-0 items-center justify-center rounded-md border border-amber-400/40 bg-amber-500/20 font-mono font-black text-amber-300 select-none shadow-2xs ${sizeClasses} ${className}`}
        title={title || 'Top 1'}
      >
        #1
      </div>
    )
  }

  if (rank === 2) {
    return (
      <div
        className={`inline-flex shrink-0 items-center justify-center rounded-md border border-white/30 bg-white/10 font-mono font-bold text-white select-none shadow-2xs ${sizeClasses} ${className}`}
        title={title || 'Top 2'}
      >
        #2
      </div>
    )
  }

  if (rank === 3) {
    return (
      <div
        className={`inline-flex shrink-0 items-center justify-center rounded-md border border-amber-600/40 bg-amber-600/15 font-mono font-bold text-amber-400 select-none shadow-2xs ${sizeClasses} ${className}`}
        title={title || 'Top 3'}
      >
        #3
      </div>
    )
  }

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-md border border-[#272226] bg-[#18171b] font-mono font-medium text-zinc-400 select-none ${sizeClasses} ${className}`}
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
 * Huy hiệu biến động thứ hạng chuẩn TH19:
 * - Tăng hạng: Vàng ánh kim (Amber)
 * - Giảm hạng: Đỏ Crimson (Red)
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
      return <span className={`text-[11px] font-bold text-zinc-500 select-none ${className}`}>-</span>
    }
    return null
  }

  const isUp = diff > 0
  const title = fromRank && toRank ? `#${fromRank} ➔ #${toRank}` : undefined

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.2 font-mono text-[10px] font-black leading-none select-none border ${
        isUp
          ? 'border-amber-500/30 bg-amber-500/20 text-amber-300'
          : 'border-red-500/30 bg-red-500/20 text-red-300'
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
