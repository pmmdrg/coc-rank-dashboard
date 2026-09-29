import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Trophy,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Award,
  AlertTriangle,
  Shield,
  UserCheck,
} from 'lucide-react'
import type { Player } from '../types'

export interface HighlightStatsTableProps {
  players: Player[]
  myPlayerId?: string
}

type FilterMode = 'all' | 'best' | 'worst'

function PlayerBadge({
  player,
  isMe,
  extraInfo,
  variant = 'default',
}: {
  player: Player
  isMe: boolean
  extraInfo?: string
  variant?: 'default' | 'danger'
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold shadow-2xs transition-all ${
        isMe
          ? 'border-sky-500/50 bg-sky-500/15 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500/30'
          : variant === 'danger'
            ? 'border-rose-200/80 bg-rose-50/70 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
            : 'border-slate-200/80 bg-white/80 text-slate-800 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200'
      }`}
    >
      <span className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500">
        #{player.rank}
      </span>
      <span className="font-semibold">{player.name}</span>
      {isMe && (
        <span className="rounded bg-sky-500/25 px-1 py-0.2 text-[9px] font-extrabold tracking-wide text-sky-700 dark:text-sky-300">
          BẠN
        </span>
      )}
      {extraInfo && (
        <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
          ({extraInfo})
        </span>
      )}
    </span>
  )
}

export function HighlightStatsTable({ players, myPlayerId }: HighlightStatsTableProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  const animatedWrapperRef = useRef<HTMLDivElement>(null)
  const innerContentRef = useRef<HTMLDivElement>(null)
  const prevHeightRef = useRef<number | null>(null)

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

  // Animation co giãn chiều cao (Height FLIP transition) mượt mà, triệt tiêu giật layout
  useLayoutEffect(() => {
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
  }, [filterMode])

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

  if (activePlayers.length === 0) {
    return (
      <section>
        <div className="glass-panel rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Thống kê nổi bật & kỷ lục mùa giải
            </h3>
          </div>
          <div className="py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
            Chưa có người chơi nào thực hiện lượt đánh hoặc thủ trong mùa này
          </div>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="glass-panel rounded-xl p-5 shadow-sm space-y-4">
        {/* Header với Tiêu đề, Bộ lọc nhanh & Tổng số người chơi */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Thống kê nổi bật & kỷ lục mùa giải
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Bộ lọc nhanh: Tất cả / Tốt nhất / Thấp nhất */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800/70">
              <button
                type="button"
                onClick={() => handleFilterChange('all')}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Tất cả (4)
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('best')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                  filterMode === 'best'
                    ? 'bg-emerald-600 text-white shadow-2xs dark:bg-emerald-500'
                    : 'text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400'
                }`}
              >
                <Award className="h-3 w-3" />
                <span>Tốt nhất (2)</span>
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('worst')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                  filterMode === 'worst'
                    ? 'bg-rose-600 text-white shadow-2xs dark:bg-rose-500'
                    : 'text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400'
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Thấp nhất (2)</span>
              </button>
            </div>

            <span className="hidden text-xs text-slate-500 sm:inline dark:text-slate-400">
              Tổng cộng: <strong className="text-slate-800 dark:text-slate-200">{activePlayers.length}</strong> người chơi đã thi đấu
            </span>
          </div>
        </div>

        {/* ==================== ĐỊNH VỊ NĂNG LỰC CỦA BẠN SO VỚI TOÀN BẢNG ==================== */}
        {myPlayer && myComparisonStats ? (
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 dark:border-sky-500/30 dark:bg-sky-950/20">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400">
                  <UserCheck className="h-3.5 w-3.5" />
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Vị thế năng lực của bạn ({myPlayer.name}) so với các đối thủ trong bảng
                </h4>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Đo lường trên {myComparisonStats.totalOpponents} đối thủ
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Thẻ 1: Cúp hiện tại */}
              <div className="flex flex-col justify-between rounded-lg border border-amber-500/25 bg-white/80 p-3.5 shadow-2xs transition-all hover:border-amber-500/40 dark:border-amber-500/25 dark:bg-slate-900/70">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                      Cúp hiện tại
                    </span>
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      {new Intl.NumberFormat('vi-VN').format(myComparisonStats.myCurrentCups)} cúp
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                        {myComparisonStats.currentCupsTiedCount === myComparisonStats.totalOpponents
                          ? 'Đồng hạng cúp'
                          : `Tốt hơn ${myComparisonStats.currentCupsPercentBetter.toFixed(1)}%`}
                      </span>
                      {myComparisonStats.currentCupsTiedCount !== myComparisonStats.totalOpponents && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          đối thủ
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
                      ? `Cùng số cúp với tất cả ${myComparisonStats.totalOpponents} người chơi`
                      : `Cúp hiện tại cao hơn ${myComparisonStats.currentCupsBetterCount}/${myComparisonStats.totalOpponents} người chơi${
                          myComparisonStats.currentCupsTiedCount > 0 ? ` (bằng ${myComparisonStats.currentCupsTiedCount} người)` : ''
                        }`}
                  </p>
                </div>
              </div>

              {/* Thẻ 2: Cúp tối đa có thể đạt */}
              <div className="flex flex-col justify-between rounded-lg border border-indigo-500/25 bg-white/80 p-3.5 shadow-2xs transition-all hover:border-indigo-500/40 dark:border-indigo-500/25 dark:bg-slate-900/70">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Trophy className="h-3.5 w-3.5 text-indigo-500" />
                      Cúp tối đa có thể đạt
                    </span>
                    <span className="rounded-md border border-indigo-500/30 bg-indigo-500/15 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {new Intl.NumberFormat('vi-VN').format(myComparisonStats.myMaxCups)} cúp
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                        {myComparisonStats.cupsTiedCount === myComparisonStats.totalOpponents
                          ? 'Đồng hạng trần cúp'
                          : `Tốt hơn ${myComparisonStats.cupsPercentBetter.toFixed(1)}%`}
                      </span>
                      {myComparisonStats.cupsTiedCount !== myComparisonStats.totalOpponents && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          đối thủ
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
                      ? `Cùng mức trần cúp lý thuyết với tất cả ${myComparisonStats.totalOpponents} người chơi`
                      : `Trần cúp cao hơn ${myComparisonStats.cupsBetterCount}/${myComparisonStats.totalOpponents} người chơi${
                          myComparisonStats.cupsTiedCount > 0 ? ` (bằng ${myComparisonStats.cupsTiedCount} người)` : ''
                        }`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300/80 bg-slate-50/50 p-3.5 text-xs text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/30 dark:text-slate-400">
            <Shield className="h-4 w-4 text-sky-500 shrink-0" />
            <span>
              Tài khoản của bạn được đánh dấu với nhãn <strong>"Tôi"</strong> trong bảng danh sách để theo dõi tỷ lệ năng lực vượt trội hơn bao nhiêu % người chơi trong bảng.
            </span>
          </div>
        )}

        {/* Khung chuyển động co giãn chiều cao mượt mà khi filter */}
        <div ref={animatedWrapperRef} className="will-change-[height]">
          <div ref={innerContentRef} className="overflow-x-auto rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <table className="w-full text-sm">
              <thead className="soft-table-head text-xs uppercase tracking-wider">
                <tr>
                  <th className="w-64 min-w-[200px] px-4 py-2.5 text-left font-semibold">
                    Hạng mục thống kê
                  </th>
                  <th className="w-44 min-w-[150px] px-4 py-2.5 text-center font-semibold">
                    Kỷ lục / Chỉ số
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold">
                    Người chơi nắm giữ
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
                          <span className="inline-flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5" />
                            Hạng mục thành tích tốt nhất
                          </span>
                        </td>
                      </tr>
                    )}

                    {/* 1.1: Cúp hiện tại cao nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs">
                            <TrendingUp className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              Cúp hiện tại cao nhất
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Dẫn đầu điểm số hiện tại của bảng đấu
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {topCurrentCups !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
                            {new Intl.NumberFormat('vi-VN').format(topCurrentCups.cups)} cúp
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">
                            Chưa có dữ liệu
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
                                extraInfo={`${player.attacks} công • ${player.defenses} thủ`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Chưa có dữ liệu
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* 1.2: Cup tối đa cao nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-2xs">
                            <Trophy className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              Cúp tối đa cao nhất
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Trần cúp lý thuyết cao nhất bảng đấu
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {topMaxCups !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-sm font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs">
                            {new Intl.NumberFormat('vi-VN').format(topMaxCups.maxCups)} cúp
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">
                            Chưa có dữ liệu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {topMaxCups && topMaxCups.players.length > 0 ? (
                          allPlayersShareMaxCups ? (
                            <div className="flex flex-col gap-1.5 py-0.5">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                Tất cả <strong className="text-indigo-600 dark:text-indigo-400">{players.length}</strong> người chơi đều đang cùng mức trần cao nhất
                              </span>
                              <div className="flex max-h-28 flex-wrap items-center gap-1.5 overflow-y-auto pr-1">
                                {topMaxCups.players.map((player) => (
                                  <PlayerBadge
                                    key={player.id}
                                    player={player}
                                    isMe={player.id === myPlayerId}
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
                                />
                              ))}
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Chưa có dữ liệu người chơi
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
                          <span className="inline-flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Hạng mục thành tích thấp nhất / Cần nỗ lực
                          </span>
                        </td>
                      </tr>
                    )}

                    {/* 2.1: Cúp hiện tại thấp nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-2xs">
                            <TrendingDown className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              Cúp hiện tại thấp nhất
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Điểm số cúp thấp nhất bảng đấu hiện tại
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {worstCurrentCups !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-sm font-bold text-rose-700 dark:text-rose-300 shadow-2xs">
                            {new Intl.NumberFormat('vi-VN').format(worstCurrentCups.cups)} cúp
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">
                            Chưa có dữ liệu
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
                                extraInfo={`${player.attacks} công • ${player.defenses} thủ`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Chưa có dữ liệu
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* 2.2: Cup tối đa thấp nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400 shadow-2xs">
                            <TrendingDown className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              Cúp tối đa thấp nhất
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Trần cúp lý thuyết thấp nhất mùa giải
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {worstMaxCups !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/30 bg-slate-500/15 px-3 py-1 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
                            {new Intl.NumberFormat('vi-VN').format(worstMaxCups.maxCups)} cúp
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">
                            Chưa có dữ liệu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {worstMaxCups && worstMaxCups.players.length > 0 ? (
                          allPlayersShareMinCups ? (
                            <div className="flex flex-col gap-1.5 py-0.5">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                Tất cả <strong className="text-slate-600 dark:text-slate-400">{players.length}</strong> người chơi đều đang cùng mức trần thấp nhất
                              </span>
                              <div className="flex max-h-28 flex-wrap items-center gap-1.5 overflow-y-auto pr-1">
                                {worstMaxCups.players.map((player) => (
                                  <PlayerBadge
                                    key={player.id}
                                    player={player}
                                    isMe={player.id === myPlayerId}
                                    variant="danger"
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
                                />
                              ))}
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Chưa có dữ liệu người chơi
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
    </section>
  )
}
