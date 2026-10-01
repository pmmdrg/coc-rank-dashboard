import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Player } from '../types'
import { useI18n } from '../i18n/LanguageContext'
import { SegmentedControl, type SegmentedControlOption } from './SegmentedControl'
import { CollapseToggleButton } from './CollapseToggleButton'

export interface HighlightStatsTableProps {
  players: Player[]
  myPlayerId?: string
  onSelectPlayer?: (playerId: string) => void
  isSyncingApi?: boolean
}

function HighlightStatsSkeleton() {
  const { dict } = useI18n()

  return (
    <section className="glass-panel rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            {dict.highlights.title}
          </h2>
          <span className="inline-flex h-5 items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 text-[10px] font-bold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 animate-ping" />
            {dict.highlights.analyzing}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="h-7 w-52 rounded-lg skeleton-shimmer" />
          <div className="h-7 w-20 rounded-lg skeleton-shimmer" />
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">

        {/* 2 Thẻ vị thế năng lực của bạn so với bảng */}
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 dark:border-sky-500/30 dark:bg-sky-950/20">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3.5">
            <div className="h-4 w-72 rounded-md skeleton-shimmer" />
            <div className="h-3 w-32 rounded-md skeleton-shimmer" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-lg border border-slate-200/80 bg-white/80 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-900/70"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-24 rounded-md skeleton-shimmer" />
                    <div className="h-5 w-20 rounded-md skeleton-shimmer" />
                  </div>
                  <div className="mt-2.5 h-6 w-36 rounded-md skeleton-shimmer" />
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full rounded-full skeleton-shimmer" />
                  <div className="mt-2 h-3 w-48 rounded-md skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bảng hàng kỷ lục */}
        <div className="overflow-x-auto rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <table className="w-full text-sm">
            <thead className="soft-table-head text-xs uppercase tracking-wider">
              <tr>
                <th className="w-64 min-w-[200px] px-4 py-2.5 text-left font-semibold">
                  {dict.highlights.category}
                </th>
                <th className="w-44 min-w-[150px] px-4 py-2.5 text-center font-semibold">
                  {dict.highlights.recordMetric}
                </th>
                <th className="px-4 py-2.5 text-left font-semibold">
                  {dict.highlights.recordHolder}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-slate-200/40 dark:border-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="h-4 w-44 rounded-md skeleton-shimmer" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="h-5 w-20 mx-auto rounded-md skeleton-shimmer" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-6 w-36 rounded-md skeleton-shimmer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

type FilterMode = 'all' | 'best' | 'worst'

function PlayerBadge({
  player,
  isMe,
  extraInfo,
  variant = 'default',
  onClick,
}: {
  player: Player
  isMe: boolean
  extraInfo?: string
  variant?: 'default' | 'danger'
  onClick?: () => void
}) {
  const { dict } = useI18n()

  return (
    <button
      type="button"
      onClick={onClick}
      title={`#${player.rank} - ${player.name}`}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold shadow-2xs transition-all cursor-pointer select-none hover:scale-[1.03] active:scale-[0.98] ${
        isMe
          ? 'border-sky-500/50 bg-sky-500/15 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500/30 hover:bg-sky-500/25'
          : variant === 'danger'
            ? 'border-rose-200/80 bg-rose-50/70 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 hover:bg-rose-100/80 dark:hover:bg-rose-900/40'
            : 'border-slate-200/80 bg-white/80 text-slate-800 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/80'
      }`}
    >
      <span className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500">
        #{player.rank}
      </span>
      <span className="font-semibold underline-offset-2 hover:underline">{player.name}</span>
      {isMe && (
        <span className="rounded bg-sky-500/25 px-1 py-0.2 text-[9px] font-extrabold tracking-wide text-sky-700 dark:text-sky-300">
          {dict.common.you}
        </span>
      )}
      {extraInfo && (
        <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
          ({extraInfo})
        </span>
      )}
    </button>
  )
}

export function HighlightStatsTable({
  players,
  myPlayerId,
  onSelectPlayer,
  isSyncingApi = false,
}: HighlightStatsTableProps) {
  const { dict, interpolate, language } = useI18n()
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('coc_highlights_collapsed') === 'true'
    } catch {
      return false
    }
  })

  function handleToggleCollapse() {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('coc_highlights_collapsed', String(next))
      } catch {
        // Ignore localStorage errors
      }
      return next
    })
  }

  const animatedWrapperRef = useRef<HTMLDivElement>(null)
  const innerContentRef = useRef<HTMLDivElement>(null)
  const prevHeightRef = useRef<number | null>(null)

  const formatNumber = (val: number) =>
    new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(val)

  // Lọc chỉ những người chơi đã tham gia đánh hoặc thủ (loại bỏ người chưa đánh và chưa thủ)
  const activePlayers = useMemo(() => {
    return players.filter((p) => (p.attacks ?? 0) > 0 || (p.defenses ?? 0) > 0)
  }, [players])

  // Tìm tài khoản của tôi và các đối thủ khác trong danh sách người chơi đã thi đấu
  const myPlayer = useMemo(() => {
    return activePlayers.find((p) => p.id === myPlayerId)
  }, [activePlayers, myPlayerId])

  const otherPlayers = useMemo(() => {
    return activePlayers.filter((p) => p.id !== myPlayerId)
  }, [activePlayers, myPlayerId])

  // --- TÍNH TOÁN SO SÁNH NĂNG LỰC CỦA TÔI SO VỚI TOÀN BẢNG ---
  const myComparisonStats = useMemo(() => {
    if (!myPlayer) return null

    const totalOpponents = otherPlayers.length

    // 1. Cúp hiện tại: Lớn hơn là tốt hơn
    const myCurrentCups = myPlayer.currentCups ?? 0
    let currentCupsPercentBetter = 0
    let currentCupsBetterCount = 0
    let currentCupsTiedCount = 0

    if (totalOpponents === 0) {
      currentCupsPercentBetter = 100
    } else {
      currentCupsBetterCount = otherPlayers.filter((p) => myCurrentCups > (p.currentCups ?? 0)).length
      currentCupsTiedCount = otherPlayers.filter((p) => myCurrentCups === (p.currentCups ?? 0)).length
      currentCupsPercentBetter = Math.round((currentCupsBetterCount / totalOpponents) * 1000) / 10
    }

    // 2. Cúp tối đa: Lớn hơn là tốt hơn
    const myMaxCups = myPlayer.maxPossibleCups ?? 0
    let cupsPercentBetter = 0
    let cupsBetterCount = 0
    let cupsTiedCount = 0

    if (totalOpponents === 0) {
      cupsPercentBetter = 100
    } else {
      cupsBetterCount = otherPlayers.filter((p) => myMaxCups > (p.maxPossibleCups ?? 0)).length
      cupsTiedCount = otherPlayers.filter((p) => myMaxCups === (p.maxPossibleCups ?? 0)).length
      cupsPercentBetter = Math.round((cupsBetterCount / totalOpponents) * 1000) / 10
    }

    return {
      myCurrentCups,
      currentCupsPercentBetter,
      currentCupsBetterCount,
      currentCupsTiedCount,

      myMaxCups,
      cupsPercentBetter,
      cupsBetterCount,
      cupsTiedCount,

      totalOpponents,
    }
  }, [myPlayer, otherPlayers])

  // Lưu chiều cao trước khi state filter thay đổi để tạo hiệu ứng chuyển động mượt mà
  const handleFilterChange = (mode: FilterMode) => {
    if (mode === filterMode) return
    if (animatedWrapperRef.current) {
      prevHeightRef.current = animatedWrapperRef.current.offsetHeight
    }
    setFilterMode(mode)
  }

  const filterOptions = useMemo<SegmentedControlOption<FilterMode>[]>(() => [
    {
      value: 'all',
      label: <span>{interpolate(dict.highlights.filterAll, { count: 4 })}</span>,
    },
    {
      value: 'best',
      label: (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>{interpolate(dict.highlights.filterBest, { count: 2 })}</span>
        </>
      ),
      activeColorClass: 'text-emerald-700 dark:text-emerald-300',
      hoverColorClass: 'hover:text-emerald-600 dark:hover:text-emerald-400',
    },
    {
      value: 'worst',
      label: (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          <span>{interpolate(dict.highlights.filterWorst, { count: 2 })}</span>
        </>
      ),
      activeColorClass: 'text-rose-700 dark:text-rose-300',
      hoverColorClass: 'hover:text-rose-600 dark:hover:text-rose-400',
    },
  ], [dict.highlights, interpolate])

  // Animation co giãn chiều cao (Height FLIP transition) mượt mà, triệt tiêu giật layout
  useLayoutEffect(() => {
    if (isCollapsed) return
    const wrapper = animatedWrapperRef.current
    const inner = innerContentRef.current
    if (!wrapper || !inner || prevHeightRef.current === null) return

    const startHeight = prevHeightRef.current
    const targetHeight = inner.offsetHeight
    prevHeightRef.current = null

    if (startHeight === targetHeight) return

    wrapper.style.height = `${startHeight}px`
    wrapper.style.overflow = 'hidden'
    // Kích hoạt browser reflow
    void wrapper.offsetHeight

    wrapper.style.transition = 'height 340ms cubic-bezier(0.22, 1, 0.36, 1)'
    wrapper.style.height = `${targetHeight}px`

    const onEnd = () => {
      if (wrapper) {
        wrapper.style.height = ''
        wrapper.style.overflow = ''
        wrapper.style.transition = ''
      }
    }

    const timer = setTimeout(onEnd, 360)
    return () => {
      clearTimeout(timer)
      onEnd()
    }
  }, [filterMode, isCollapsed])

  // --- 1. NHÓM CUP HIỆN TẠI (Cao nhất & Thấp nhất) ---
  const topCurrentCups = useMemo(() => {
    if (activePlayers.length === 0) return null
    const maxVal = Math.max(...activePlayers.map((p) => p.currentCups ?? 0))
    const tiedPlayers = activePlayers.filter((p) => (p.currentCups ?? 0) === maxVal)
    return {
      cups: maxVal,
      players: tiedPlayers,
    }
  }, [activePlayers])

  const worstCurrentCups = useMemo(() => {
    if (activePlayers.length === 0) return null
    const minVal = Math.min(...activePlayers.map((p) => p.currentCups ?? 0))
    const tiedPlayers = activePlayers.filter((p) => (p.currentCups ?? 0) === minVal)
    return {
      cups: minVal,
      players: tiedPlayers,
    }
  }, [activePlayers])

  // --- 2. NHÓM CUP TỐI ĐA (Cup tối đa cao nhất & Cup tối đa thấp nhất) ---
  const topMaxCups = useMemo(() => {
    if (activePlayers.length === 0) return null
    const maxVal = Math.max(...activePlayers.map((p) => p.maxPossibleCups ?? 0))
    const tiedPlayers = activePlayers.filter((p) => (p.maxPossibleCups ?? 0) === maxVal)
    return {
      maxCups: maxVal,
      players: tiedPlayers,
    }
  }, [activePlayers])

  const worstMaxCups = useMemo(() => {
    if (activePlayers.length === 0) return null
    const minVal = Math.min(...activePlayers.map((p) => p.maxPossibleCups ?? 0))
    const tiedPlayers = activePlayers.filter((p) => (p.maxPossibleCups ?? 0) === minVal)
    return {
      maxCups: minVal,
      players: tiedPlayers,
    }
  }, [activePlayers])

  const allPlayersShareMaxCups =
    topMaxCups !== null &&
    activePlayers.length > 5 &&
    topMaxCups.players.length === activePlayers.length

  const allPlayersShareMinCups =
    worstMaxCups !== null &&
    activePlayers.length > 5 &&
    worstMaxCups.players.length === activePlayers.length

  const showBest = filterMode === 'all' || filterMode === 'best'
  const showWorst = filterMode === 'all' || filterMode === 'worst'

  if (isSyncingApi) {
    return <HighlightStatsSkeleton />
  }

  if (activePlayers.length === 0) {
    return (
      <section className="glass-panel rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {dict.highlights.title}
            </h2>
          </div>
          <div className="py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
            {dict.highlights.noActivePlayers}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="glass-panel rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
      {/* Header với Tiêu đề, Bộ lọc nhanh & Nút thu gọn */}
      <div
        className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 transition-all duration-300 ${
          !isCollapsed ? 'border-b border-slate-200/60 dark:border-slate-800/60' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            {dict.highlights.title}
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <SegmentedControl<FilterMode>
            options={filterOptions}
            value={filterMode}
            onChange={handleFilterChange}
            ariaLabel={dict.highlights.title}
          />

          {/* Nút thu gọn / mở rộng đồng bộ style với filter segmented control */}
          <CollapseToggleButton
            isCollapsed={isCollapsed}
            onToggle={handleToggleCollapse}
            ariaLabel={dict.highlights.title}
          />
        </div>
      </div>

      {/* Body với animation collapsible-grid */}
      <div className={`collapsible-grid ${!isCollapsed ? 'is-expanded' : ''}`}>
        <div className="collapsible-inner">
          <div className="p-4 sm:p-5 space-y-4">

        {/* ==================== ĐỊNH VỊ NĂNG LỰC CỦA BẠN SO VỚI TOÀN BẢNG ==================== */}
        {myPlayer && myComparisonStats ? (
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 dark:border-sky-500/30 dark:bg-sky-950/20">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                {interpolate(dict.highlights.myStandingTitle, { name: myPlayer.name })}
              </h4>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {interpolate(dict.highlights.measuredAcross, { count: myComparisonStats.totalOpponents })}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Thẻ 1: Cúp hiện tại */}
              <div className="flex flex-col justify-between rounded-lg border border-amber-500/25 bg-white/80 p-3.5 shadow-2xs transition-all hover:border-amber-500/40 dark:border-amber-500/25 dark:bg-slate-900/70">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {dict.highlights.currentCups}
                    </span>
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      {formatNumber(myComparisonStats.myCurrentCups)} {dict.common.trophies}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                        {myComparisonStats.currentCupsTiedCount === myComparisonStats.totalOpponents
                          ? dict.highlights.tiedTrophies
                          : interpolate(dict.highlights.betterThan, { percent: myComparisonStats.currentCupsPercentBetter.toFixed(1) })}
                      </span>
                      {myComparisonStats.currentCupsTiedCount !== myComparisonStats.totalOpponents && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {dict.highlights.opponents}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-600"
                      style={{
                        width: `${
                          myComparisonStats.currentCupsTiedCount === myComparisonStats.totalOpponents
                            ? 100
                            : myComparisonStats.currentCupsPercentBetter
                        }%`,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {myComparisonStats.currentCupsTiedCount === myComparisonStats.totalOpponents
                      ? interpolate(dict.highlights.tiedWithAll, { count: myComparisonStats.totalOpponents })
                      : `${interpolate(dict.highlights.higherThanCount, { better: myComparisonStats.currentCupsBetterCount, total: myComparisonStats.totalOpponents })}${
                          myComparisonStats.currentCupsTiedCount > 0 ? interpolate(dict.highlights.tiedCountNotice, { tied: myComparisonStats.currentCupsTiedCount }) : ''
                        }`}
                  </p>
                </div>
              </div>

              {/* Thẻ 2: Cúp tối đa có thể đạt */}
              <div className="flex flex-col justify-between rounded-lg border border-indigo-500/25 bg-white/80 p-3.5 shadow-2xs transition-all hover:border-indigo-500/40 dark:border-indigo-500/25 dark:bg-slate-900/70">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {dict.highlights.maxCups}
                    </span>
                    <span className="rounded-md border border-indigo-500/30 bg-indigo-500/15 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {formatNumber(myComparisonStats.myMaxCups)} {dict.common.trophies}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                        {myComparisonStats.cupsTiedCount === myComparisonStats.totalOpponents
                          ? dict.highlights.tiedMaxTrophies
                          : interpolate(dict.highlights.betterThan, { percent: myComparisonStats.cupsPercentBetter.toFixed(1) })}
                      </span>
                      {myComparisonStats.cupsTiedCount !== myComparisonStats.totalOpponents && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {dict.highlights.opponents}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all duration-600"
                      style={{
                        width: `${
                          myComparisonStats.cupsTiedCount === myComparisonStats.totalOpponents
                            ? 100
                            : myComparisonStats.cupsPercentBetter
                        }%`,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {myComparisonStats.cupsTiedCount === myComparisonStats.totalOpponents
                      ? interpolate(dict.highlights.maxCupsFormulaNotice, { count: myComparisonStats.totalOpponents })
                      : `${interpolate(dict.highlights.higherMaxCupsCount, { better: myComparisonStats.cupsBetterCount, total: myComparisonStats.totalOpponents })}${
                          myComparisonStats.cupsTiedCount > 0 ? interpolate(dict.highlights.tiedCountNotice, { tied: myComparisonStats.cupsTiedCount }) : ''
                        }`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300/80 bg-slate-50/50 p-3.5 text-xs text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/30 dark:text-slate-400">
            <span>{dict.highlights.myStandingTooltip}</span>
          </div>
        )}

        {/* Khung chuyển động co giãn chiều cao mượt mà khi filter */}
        <div ref={animatedWrapperRef} className="will-change-[height]">
          <div ref={innerContentRef} className="overflow-x-auto overflow-y-hidden rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <table className="w-full text-sm">
              <thead className="soft-table-head text-xs uppercase tracking-wider">
                <tr>
                  <th className="w-64 min-w-[200px] px-4 py-2.5 text-left font-semibold">
                    {dict.highlights.category}
                  </th>
                  <th className="w-44 min-w-[150px] px-4 py-2.5 text-center font-semibold">
                    {dict.highlights.recordMetric}
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold">
                    {dict.highlights.recordHolder}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {/* ==================== PHẦN 1: HẠNG MỤC TỐT NHẤT ==================== */}
                {showBest && (
                  <>
                    {filterMode === 'all' && (
                      <tr className="animate-filter-row bg-emerald-500/10 dark:bg-emerald-500/15">
                        <td
                          colSpan={3}
                          className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300"
                        >
                          {dict.highlights.bestSection}
                        </td>
                      </tr>
                    )}

                    {/* 1.1: Cúp hiện tại cao nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {dict.highlights.categoryHighestCups}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {dict.highlights.leadCurrentScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {topCurrentCups !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
                            {formatNumber(topCurrentCups.cups)} {dict.common.trophies}
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">
                            {dict.common.noData}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {topCurrentCups && topCurrentCups.players.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                            {topCurrentCups.players.map((player) => (
                              <PlayerBadge
                                key={player.id}
                                player={player}
                                isMe={player.id === myPlayerId}
                                extraInfo={`${player.attacks} ${dict.common.attacks.toLowerCase()} • ${player.defenses} ${dict.common.defenses.toLowerCase()}`}
                                onClick={() => onSelectPlayer?.(player.id || player.playerTag || '')}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {dict.common.noData}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* 1.2: Cup tối đa cao nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {dict.highlights.categoryHighestMaxCups}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {dict.highlights.highestCeiling}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {topMaxCups !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-sm font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs">
                            {formatNumber(topMaxCups.maxCups)} {dict.common.trophies}
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">
                            {dict.common.noData}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {topMaxCups && topMaxCups.players.length > 0 ? (
                          allPlayersShareMaxCups ? (
                            <div className="flex flex-col gap-1.5 py-0.5">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {interpolate(dict.highlights.allPlayersTiedMax, { count: players.length })}
                              </span>
                              <div className="flex max-h-28 flex-wrap items-center gap-1.5 overflow-y-auto pr-1">
                                {topMaxCups.players.map((player) => (
                                  <PlayerBadge
                                    key={player.id}
                                    player={player}
                                    isMe={player.id === myPlayerId}
                                    onClick={() => onSelectPlayer?.(player.id || player.playerTag || '')}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                              {topMaxCups.players.map((player) => (
                                <PlayerBadge
                                  key={player.id}
                                  player={player}
                                  isMe={player.id === myPlayerId}
                                  onClick={() => onSelectPlayer?.(player.id || player.playerTag || '')}
                                />
                              ))}
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {dict.common.noData}
                          </span>
                        )}
                      </td>
                    </tr>
                  </>
                )}

                {/* ==================== PHẦN 2: HẠNG MỤC THẤP NHẤT ==================== */}
                {showWorst && (
                  <>
                    {filterMode === 'all' && (
                      <tr className="animate-filter-row bg-rose-500/10 dark:bg-rose-500/15">
                        <td
                          colSpan={3}
                          className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300"
                        >
                          {dict.highlights.worstSection}
                        </td>
                      </tr>
                    )}

                    {/* 2.1: Cúp hiện tại thấp nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {dict.highlights.categoryLowestCups}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {dict.highlights.lowestCurrentScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {worstCurrentCups !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-sm font-bold text-rose-700 dark:text-rose-300 shadow-2xs">
                            {formatNumber(worstCurrentCups.cups)} {dict.common.trophies}
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">
                            {dict.common.noData}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {worstCurrentCups && worstCurrentCups.players.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                            {worstCurrentCups.players.map((player) => (
                              <PlayerBadge
                                key={player.id}
                                player={player}
                                isMe={player.id === myPlayerId}
                                variant="danger"
                                extraInfo={`${player.attacks} ${dict.common.attacks.toLowerCase()} • ${player.defenses} ${dict.common.defenses.toLowerCase()}`}
                                onClick={() => onSelectPlayer?.(player.id || player.playerTag || '')}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {dict.common.noData}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* 2.2: Cup tối đa thấp nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {dict.highlights.categoryLowestMaxCups}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {dict.highlights.lowestCeiling}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {worstMaxCups !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/30 bg-slate-500/15 px-3 py-1 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
                            {formatNumber(worstMaxCups.maxCups)} {dict.common.trophies}
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">
                            {dict.common.noData}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {worstMaxCups && worstMaxCups.players.length > 0 ? (
                          allPlayersShareMinCups ? (
                            <div className="flex flex-col gap-1.5 py-0.5">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {interpolate(dict.highlights.allPlayersTiedMin, { count: players.length })}
                              </span>
                              <div className="flex max-h-28 flex-wrap items-center gap-1.5 overflow-y-auto pr-1">
                                {worstMaxCups.players.map((player) => (
                                  <PlayerBadge
                                    key={player.id}
                                    player={player}
                                    isMe={player.id === myPlayerId}
                                    variant="danger"
                                    onClick={() => onSelectPlayer?.(player.id || player.playerTag || '')}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                              {worstMaxCups.players.map((player) => (
                                <PlayerBadge
                                  key={player.id}
                                  player={player}
                                  isMe={player.id === myPlayerId}
                                  variant="danger"
                                  onClick={() => onSelectPlayer?.(player.id || player.playerTag || '')}
                                />
                              ))}
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {dict.common.noData}
                          </span>
                        )}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
  )
}
