import { Crown, ArrowUp, ArrowDown } from '@phosphor-icons/react'

export interface RankBadgeProps {
  rank: number
  title?: string
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Huy hiệu thứ hạng chuẩn hóa (Podium Top 1-2-3 & Hạng thường):
 * - Top 1: Huy hiệu vàng óng + icon vương miện
 * - Top 2: Huy hiệu ánh bạc
 * - Top 3: Huy hiệu đồng
 * - Top 4+: Khung monospaced tối giản
 */
export function RankBadge({ rank, title, className = '', size = 'md' }: RankBadgeProps) {
  const isSm = size === 'sm'

  if (rank === 1) {
    return (
      <div
        className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 font-mono font-black text-amber-950 shadow-xs shadow-amber-500/35 select-none ${
          isSm ? 'h-6.5 min-w-6.5 px-1.5 text-xs' : 'h-7 min-w-8 px-2 text-xs'
        } ${className}`}
        title={title || 'Top 1'}
      >
        <Crown weight="fill" className="mr-0.5 h-3.5 w-3.5 fill-amber-950 text-amber-950 drop-shadow-xs" />
        <span>1</span>
      </div>
    )
  }

  if (rank === 2) {
    return (
      <div
        className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 font-mono font-black text-slate-900 shadow-2xs select-none ${
          isSm ? 'h-6.5 min-w-6.5 px-1.5 text-xs' : 'h-7 min-w-8 px-2 text-xs'
        } ${className}`}
        title={title || 'Top 2'}
      >
        <span>2</span>
      </div>
    )
  }

  if (rank === 3) {
    return (
      <div
        className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 font-mono font-black text-white shadow-2xs select-none ${
          isSm ? 'h-6.5 min-w-6.5 px-1.5 text-xs' : 'h-7 min-w-8 px-2 text-xs'
        } ${className}`}
        title={title || 'Top 3'}
      >
        <span>3</span>
      </div>
    )
  }

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-100/80 font-mono font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 select-none ${
        isSm ? 'h-6.5 min-w-6.5 px-1 text-xs' : 'h-7 min-w-[32px] px-1.5 text-xs'
      } ${className}`}
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
