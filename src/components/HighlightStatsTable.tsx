import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Swords,
  ShieldCheck,
  Trophy,
  Sparkles,
  TrendingDown,
  ShieldAlert,
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

  // Tìm tài khoản của tôi và các đối thủ khác trong bảng
  const myPlayer = useMemo(() => {
    return players.find((p) => p.id === myPlayerId)
  }, [players, myPlayerId])

  const otherPlayers = useMemo(() => {
    return players.filter((p) => p.id !== myPlayerId)
  }, [players, myPlayerId])

  // --- TÍNH TOÁN SO SÁNH NĂNG LỰC CỦA TÔI SO VỚI TOÀN BẢNG ---
  const myComparisonStats = useMemo(() => {
    if (!myPlayer) return null

    const totalOpponents = otherPlayers.length

    // 1. % Công: Lớn hơn là tốt hơn
    const myAtk = myPlayer.attackDestruction ?? 0
    const hasMyAttack = (myPlayer.attacks ?? 0) > 0 || myAtk > 0
    const activeAtkOpponents = otherPlayers.filter(
      (p) => (p.attacks ?? 0) > 0 || (p.attackDestruction ?? 0) > 0,
    )

    let atkPercentBetter = 0
    let atkBetterCount = 0
    let atkTiedCount = 0

    if (hasMyAttack) {
      if (totalOpponents === 0) {
        atkPercentBetter = 100
      } else {
        atkBetterCount = otherPlayers.filter((p) => myAtk > (p.attackDestruction ?? 0)).length
        atkTiedCount = otherPlayers.filter((p) => myAtk === (p.attackDestruction ?? 0)).length
        atkPercentBetter = Math.round((atkBetterCount / totalOpponents) * 1000) / 10
      }
    }

    // 2. % Thủ: Bé hơn là tốt hơn (chịu ít % phá huỷ hơn = thủ kiên cố hơn)
    const myDef = myPlayer.defenseDestruction ?? 0
    const hasMyDefense = (myPlayer.defenses ?? 0) > 0 || myDef > 0
    const activeDefOpponents = otherPlayers.filter(
      (p) => (p.defenses ?? 0) > 0 || (p.defenseDestruction ?? 0) > 0,
    )

    let defPercentBetter = 0
    let defBetterCount = 0
    let defTiedCount = 0

    if (hasMyDefense) {
      if (activeDefOpponents.length === 0) {
        defPercentBetter = 100
      } else {
        // So sánh với những đối thủ đã thực sự nhận lượt thủ
        defBetterCount = activeDefOpponents.filter((p) => myDef < (p.defenseDestruction ?? 0)).length
        defTiedCount = activeDefOpponents.filter((p) => myDef === (p.defenseDestruction ?? 0)).length
        defPercentBetter = Math.round((defBetterCount / activeDefOpponents.length) * 1000) / 10
      }
    }

    // 3. Cup tối đa: Lớn hơn là tốt hơn
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
      hasMyAttack,
      myAtk,
      atkPercentBetter,
      atkBetterCount,
      atkTiedCount,
      activeAtkCount: activeAtkOpponents.length,

      hasMyDefense,
      myDef,
      defPercentBetter,
      defBetterCount,
      defTiedCount,
      activeDefCount: activeDefOpponents.length,

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

  // --- 1. NHÓM TẤN CÔNG (Công cao nhất & Công thấp nhất) ---
  const candidateAttacks = useMemo(() => {
    return players.filter((p) => (p.attacks ?? 0) > 0 || (p.attackDestruction ?? 0) > 0)
  }, [players])

  const topAttack = useMemo(() => {
    if (candidateAttacks.length === 0) return null
    const maxVal = Math.max(...candidateAttacks.map((p) => p.attackDestruction ?? 0))
    const tiedPlayers = candidateAttacks.filter((p) => (p.attackDestruction ?? 0) === maxVal)
    return {
      destruction: maxVal,
      players: tiedPlayers,
    }
  }, [candidateAttacks])

  const worstAttack = useMemo(() => {
    if (candidateAttacks.length === 0) return null
    const minVal = Math.min(...candidateAttacks.map((p) => p.attackDestruction ?? 0))
    const tiedPlayers = candidateAttacks.filter((p) => (p.attackDestruction ?? 0) === minVal)
    return {
      destruction: minVal,
      players: tiedPlayers,
    }
  }, [candidateAttacks])

  // --- 2. NHÓM PHÒNG THỦ (Thủ thấp nhất - tốt nhất & Thủ cao nhất - tệ nhất) ---
  const candidateDefenses = useMemo(() => {
    return players.filter((p) => (p.defenses ?? 0) > 0 || (p.defenseDestruction ?? 0) > 0)
  }, [players])

  const bestDefense = useMemo(() => {
    if (candidateDefenses.length === 0) return null
    const minVal = Math.min(...candidateDefenses.map((p) => p.defenseDestruction ?? 0))
    const tiedPlayers = candidateDefenses.filter((p) => (p.defenseDestruction ?? 0) === minVal)
    return {
      destruction: minVal,
      players: tiedPlayers,
    }
  }, [candidateDefenses])

  const worstDefense = useMemo(() => {
    if (candidateDefenses.length === 0) return null
    const maxVal = Math.max(...candidateDefenses.map((p) => p.defenseDestruction ?? 0))
    const tiedPlayers = candidateDefenses.filter((p) => (p.defenseDestruction ?? 0) === maxVal)
    return {
      destruction: maxVal,
      players: tiedPlayers,
    }
  }, [candidateDefenses])

  // --- 3. NHÓM CUP TỐI ĐA (Cup tối đa cao nhất & Cup tối đa thấp nhất) ---
  const topMaxCups = useMemo(() => {
    if (players.length === 0) return null
    const maxVal = Math.max(...players.map((p) => p.maxPossibleCups ?? 0))
    const tiedPlayers = players.filter((p) => (p.maxPossibleCups ?? 0) === maxVal)
    return {
      maxCups: maxVal,
      players: tiedPlayers,
    }
  }, [players])

  const worstMaxCups = useMemo(() => {
    if (players.length === 0) return null
    const minVal = Math.min(...players.map((p) => p.maxPossibleCups ?? 0))
    const tiedPlayers = players.filter((p) => (p.maxPossibleCups ?? 0) === minVal)
    return {
      maxCups: minVal,
      players: tiedPlayers,
    }
  }, [players])

  const allPlayersShareMaxCups =
    topMaxCups !== null &&
    players.length > 5 &&
    topMaxCups.players.length === players.length

  const allPlayersShareMinCups =
    worstMaxCups !== null &&
    players.length > 5 &&
    worstMaxCups.players.length === players.length

  const showBest = filterMode === 'all' || filterMode === 'best'
  const showWorst = filterMode === 'all' || filterMode === 'worst'

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
            {/* Bộ lọc nhanh: Tất cả / Tốt nhất / Tệ nhất */}
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
                Tất cả (6)
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
                <span>Tốt nhất (3)</span>
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
                <span>Tệ nhất (3)</span>
              </button>
            </div>

            <span className="hidden text-xs text-slate-500 sm:inline dark:text-slate-400">
              Tổng cộng: <strong className="text-slate-800 dark:text-slate-200">{players.length}</strong> người chơi
            </span>
          </div>
        </div>

        {/* ==================== PHẦN MỚI: ĐỊNH VỊ NĂNG LỰC CỦA BẠN SO VỚI TOÀN BẢNG ==================== */}
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

            <div className="grid gap-3 sm:grid-cols-3">
              {/* Thẻ 1: % Phá huỷ công */}
              <div className="flex flex-col justify-between rounded-lg border border-amber-500/25 bg-white/80 p-3.5 shadow-2xs transition-all hover:border-amber-500/40 dark:border-amber-500/25 dark:bg-slate-900/70">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Swords className="h-3.5 w-3.5 text-amber-500" />
                      % Phá huỷ (Công)
                    </span>
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      {myComparisonStats.hasMyAttack ? `${myComparisonStats.myAtk.toFixed(1)} %` : 'Chưa đánh'}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    {myComparisonStats.hasMyAttack ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                          Tốt hơn {myComparisonStats.atkPercentBetter.toFixed(1)}%
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          đối thủ
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold italic text-slate-400 dark:text-slate-500">
                        Chưa có lượt đánh
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-600"
                      style={{ width: `${myComparisonStats.hasMyAttack ? myComparisonStats.atkPercentBetter : 0}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {myComparisonStats.hasMyAttack
                      ? `Vượt ${myComparisonStats.atkBetterCount}/${myComparisonStats.totalOpponents} người chơi trong bảng${
                          myComparisonStats.atkTiedCount > 0 ? ` (bằng ${myComparisonStats.atkTiedCount} người)` : ''
                        }`
                      : 'Cần ít nhất 1 lượt đánh để tính tỷ lệ'}
                  </p>
                </div>
              </div>

              {/* Thẻ 2: % Phá huỷ thủ */}
              <div className="flex flex-col justify-between rounded-lg border border-emerald-500/25 bg-white/80 p-3.5 shadow-2xs transition-all hover:border-emerald-500/40 dark:border-emerald-500/25 dark:bg-slate-900/70">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      % Phá huỷ (Thủ)
                    </span>
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {myComparisonStats.hasMyDefense ? `${myComparisonStats.myDef.toFixed(1)} %` : 'Chưa thủ'}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    {myComparisonStats.hasMyDefense ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          Tốt hơn {myComparisonStats.defPercentBetter.toFixed(1)}%
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          đối thủ
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold italic text-slate-400 dark:text-slate-500">
                        Chưa có lượt thủ
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-600"
                      style={{ width: `${myComparisonStats.hasMyDefense ? myComparisonStats.defPercentBetter : 0}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {myComparisonStats.hasMyDefense
                      ? `Thủ kiên cố hơn ${myComparisonStats.defBetterCount}/${myComparisonStats.activeDefCount} đối thủ đã thủ${
                          myComparisonStats.defTiedCount > 0 ? ` (bằng ${myComparisonStats.defTiedCount} người)` : ''
                        }`
                      : 'Cần nhận ít nhất 1 lượt thủ để tính tỷ lệ'}
                  </p>
                </div>
              </div>

              {/* Thẻ 3: Cup tối đa */}
              <div className="flex flex-col justify-between rounded-lg border border-indigo-500/25 bg-white/80 p-3.5 shadow-2xs transition-all hover:border-indigo-500/40 dark:border-indigo-500/25 dark:bg-slate-900/70">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Trophy className="h-3.5 w-3.5 text-indigo-500" />
                      Cup tối đa
                    </span>
                    <span className="rounded-md border border-indigo-500/30 bg-indigo-500/15 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {new Intl.NumberFormat('vi-VN').format(myComparisonStats.myMaxCups)} cup
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                        {myComparisonStats.cupsTiedCount === myComparisonStats.totalOpponents
                          ? 'Đồng hạng trần'
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
              Chọn tài khoản của bạn (bấm icon khiên ở cột <strong>"Tôi"</strong> trong bảng danh sách) để xem tỷ lệ năng lực của bạn vượt trội hơn bao nhiêu % người chơi trong bảng.
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

                    {/* 1.1: % Phá huỷ công cao nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs">
                            <Swords className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              % Phá huỷ công cao nhất
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Sát thương công kích trung bình đỉnh nhất
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {topAttack !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
                            {topAttack.destruction.toFixed(1)} %
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">
                            Chưa có dữ liệu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {topAttack && topAttack.players.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                            {topAttack.players.map((player) => (
                              <PlayerBadge
                                key={player.id}
                                player={player}
                                isMe={player.id === myPlayerId}
                                extraInfo={`${player.attacks} lượt`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Chưa có người chơi nào thực hiện lượt đánh
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* 1.2: % Phá huỷ thủ thấp nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              % Phá huỷ thủ thấp nhất
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Phòng thủ kiên cố nhất (chịu ít thiệt hại nhất)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {bestDefense !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                            {bestDefense.destruction.toFixed(1)} %
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">
                            Chưa có dữ liệu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {bestDefense && bestDefense.players.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                            {bestDefense.players.map((player) => (
                              <PlayerBadge
                                key={player.id}
                                player={player}
                                isMe={player.id === myPlayerId}
                                extraInfo={`${player.defenses} lượt`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Chưa có người chơi nào nhận lượt thủ
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* 1.3: Cup tối đa cao nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-2xs">
                            <Trophy className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              Cup tối đa cao nhất
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Trần cúp lý thuyết cao nhất mùa giải
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {topMaxCups !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-sm font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs">
                            {new Intl.NumberFormat('vi-VN').format(topMaxCups.maxCups)} cup
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

                {/* ==================== PHẦN 2: HẠNG MỤC TỆ NHẤT ==================== */}
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
                            Hạng mục thành tích tệ nhất / Cần cải thiện
                          </span>
                        </td>
                      </tr>
                    )}

                    {/* 2.1: % Phá huỷ công thấp nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-2xs">
                            <TrendingDown className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              % Phá huỷ công thấp nhất
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Sát thương công kích trung bình thấp nhất
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {worstAttack !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-sm font-bold text-rose-700 dark:text-rose-300 shadow-2xs">
                            {worstAttack.destruction.toFixed(1)} %
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">
                            Chưa có dữ liệu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {worstAttack && worstAttack.players.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                            {worstAttack.players.map((player) => (
                              <PlayerBadge
                                key={player.id}
                                player={player}
                                isMe={player.id === myPlayerId}
                                variant="danger"
                                extraInfo={`${player.attacks} lượt`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Chưa có người chơi nào thực hiện lượt đánh
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* 2.2: % Phá huỷ thủ cao nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-2xs">
                            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              % Phá huỷ thủ cao nhất
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Phòng thủ chịu nhiều thiệt hại nhất
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        {worstDefense !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-sm font-bold text-rose-700 dark:text-rose-300 shadow-2xs">
                            {worstDefense.destruction.toFixed(1)} %
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">
                            Chưa có dữ liệu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {worstDefense && worstDefense.players.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                            {worstDefense.players.map((player) => (
                              <PlayerBadge
                                key={player.id}
                                player={player}
                                isMe={player.id === myPlayerId}
                                variant="danger"
                                extraInfo={`${player.defenses} lượt`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Chưa có người chơi nào nhận lượt thủ
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* 2.3: Cup tối đa thấp nhất */}
                    <tr className="animate-filter-row hover:bg-slate-500/5 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400 shadow-2xs">
                            <TrendingDown className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              Cup tối đa thấp nhất
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
                            {new Intl.NumberFormat('vi-VN').format(worstMaxCups.maxCups)} cup
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

export const SummaryTables = HighlightStatsTable
