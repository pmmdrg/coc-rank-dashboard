import { useMemo, useState } from 'react'
import type { LeagueHistoryItem } from '../types'
import { parseSeasonDateRange } from '../lib/cocApi'
import { RANKED_TIERS_METADATA } from '../data/rankedTierMetadata'

export interface PerformanceTrendSectionProps {
  leagueHistory?: LeagueHistoryItem[]
  myPlayerName?: string
  playerTag?: string
}

interface ProcessedSeasonPoint {
  seasonId: number
  displayPeriod: string
  tierName: string
  placement: number
  trophies: number
  attackWins: number
  attackLosses: number
  totalAttacks: number
  attackWinRate: number
  defenseWins: number
  defenseLosses: number
  totalDefenses: number
  defenseStars: number
  maxBattles: number
}

export function PerformanceTrendSection({
  leagueHistory = [],
  myPlayerName = '',
  playerTag = '',
}: PerformanceTrendSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeMetric, setActiveMetric] = useState<'cups_rank' | 'battles_stars'>('cups_rank')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(true)

  // Xử lý và chuẩn hóa dữ liệu lịch sử các mùa giải từ Supercell endpoint /players/{tag}/leaguehistory
  // Giới hạn tối đa 10 mùa giải gần nhất theo yêu cầu
  const chronologicalHistory = useMemo<ProcessedSeasonPoint[]>(() => {
    if (!leagueHistory || leagueHistory.length === 0) return []

    // Sắp xếp theo thứ tự thời gian tăng dần và lấy tối đa 10 mùa gần nhất
    const sorted = [...leagueHistory]
      .sort((a, b) => a.leagueSeasonId - b.leagueSeasonId)
      .slice(-10)

    return sorted.map((item) => {
      const { displayPeriod } = parseSeasonDateRange(item.leagueSeasonId)
      const matchedTier = RANKED_TIERS_METADATA.find((t) => t.id === item.leagueTierId)
      const tierName = matchedTier ? matchedTier.name : `Cấp bậc #${item.leagueTierId}`

      const totalAttacks = (item.attackWins || 0) + (item.attackLosses || 0)
      const attackWinRate = totalAttacks > 0 ? Math.round(((item.attackWins || 0) / totalAttacks) * 1000) / 10 : 0

      const totalDefenses = (item.defenseWins || 0) + (item.defenseLosses || 0)

      return {
        seasonId: item.leagueSeasonId,
        displayPeriod: displayPeriod !== '--' ? displayPeriod : `Mùa ${item.leagueSeasonId}`,
        tierName,
        placement: item.placement,
        trophies: item.leagueTrophies,
        attackWins: item.attackWins || 0,
        attackLosses: item.attackLosses || 0,
        totalAttacks,
        attackWinRate,
        defenseWins: item.defenseWins || 0,
        defenseLosses: item.defenseLosses || 0,
        totalDefenses,
        defenseStars: item.defenseStars || 0,
        maxBattles: item.maxBattles,
      }
    })
  }, [leagueHistory])

  // Thống kê tổng hợp qua các mùa giải
  const overallStats = useMemo(() => {
    if (chronologicalHistory.length === 0) return null

    const latest = chronologicalHistory[chronologicalHistory.length - 1]
    const placements = chronologicalHistory.map((s) => s.placement).filter((p) => p > 0)
    const bestPlacement = placements.length > 0 ? Math.min(...placements) : latest.placement

    const allTrophies = chronologicalHistory.map((s) => s.trophies)
    const maxTrophies = Math.max(...allTrophies)

    const totalWins = chronologicalHistory.reduce((acc, s) => acc + s.attackWins, 0)
    const totalAtks = chronologicalHistory.reduce((acc, s) => acc + s.totalAttacks, 0)
    const overallWinRate = totalAtks > 0 ? Math.round((totalWins / totalAtks) * 1000) / 10 : 0

    return {
      latest,
      bestPlacement,
      maxTrophies,
      totalWins,
      totalAtks,
      overallWinRate,
    }
  }, [chronologicalHistory])

  if (chronologicalHistory.length === 0) {
    return (
      <section className="glass-panel rounded-xl shadow-sm transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 p-4 sm:p-5 dark:border-slate-700/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Theo dõi phong độ qua các mùa giải
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lịch sử thứ hạng, cúp, và tỷ lệ chiến đấu lấy trực tiếp từ Supercell API
            </p>
          </div>
        </div>
        <div className="py-10 text-center px-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Chưa có dữ liệu lịch sử mùa giải
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {playerTag
              ? 'Người chơi chưa có dữ liệu lưu trữ trên endpoint League History của Supercell hoặc vừa tạo bảng mới.'
              : 'Vui lòng nhập Player Tag và bấm "Tải dữ liệu từ Supercell API" để xem toàn bộ phong độ qua các mùa.'}
          </p>
        </div>
      </section>
    )
  }

  // --- THIẾT LẬP VẼ BIỂU ĐỒ SVG TƯƠNG TÁC ---
  const chartWidth = 760
  const chartHeight = 220
  const paddingX = 64
  const paddingTop = 32
  const paddingBottom = 40
  const plotWidth = chartWidth - paddingX * 2
  const plotHeight = chartHeight - paddingTop - paddingBottom

  // Trục Cups: min/max
  const cupsValues = chronologicalHistory.map((d) => d.trophies)
  const minCups = Math.min(...cupsValues)
  const maxCups = Math.max(...cupsValues)
  const cupsSpan = Math.max(1, maxCups - minCups)

  // Trục Rank/Placement (Nghịch đảo: #1 ở đỉnh, #100 ở đáy)
  const rankValues = chronologicalHistory.map((d) => d.placement)
  const minRank = Math.min(...rankValues) // Hạng tốt nhất (số nhỏ nhất)
  const maxRank = Math.max(...rankValues) // Hạng thấp nhất (số lớn nhất)
  const rankSpan = Math.max(1, maxRank - minRank)

  // Trục WinRate (0% - 100%)
  const minRate = 0
  const rateSpan = 100

  // Trục Stars phòng thủ bị mất (0 - maxDefenseStars)
  const starsValues = chronologicalHistory.map((d) => d.defenseStars)
  const minStars = 0
  const maxStars = Math.max(1, ...starsValues)
  const starsSpan = maxStars - minStars

  const getX = (index: number) => {
    if (chronologicalHistory.length <= 1) return chartWidth / 2
    return paddingX + (index / (chronologicalHistory.length - 1)) * plotWidth
  }

  // Cúp: càng cao càng ở trên
  const getCupsY = (cups: number) => {
    return paddingTop + plotHeight - ((cups - minCups) / cupsSpan) * plotHeight
  }

  // Rank: càng nhỏ (#1) càng ở trên
  const getRankY = (rank: number) => {
    return paddingTop + ((rank - minRank) / rankSpan) * plotHeight
  }

  // WinRate: 100% ở trên, 0% ở dưới
  const getRateY = (rate: number) => {
    return paddingTop + plotHeight - ((rate - minRate) / rateSpan) * plotHeight
  }

  // Sao thủ mất: càng ít càng ở trên
  const getStarsY = (stars: number) => {
    return paddingTop + ((stars - minStars) / starsSpan) * plotHeight
  }

  // Tạo đường dẫn path SVG
  const makeLinePath = (getY: (d: ProcessedSeasonPoint) => number) => {
    return chronologicalHistory
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d).toFixed(1)}`)
      .join(' ')
  }

  const cupsPath = makeLinePath((d) => getCupsY(d.trophies))
  const rankPath = makeLinePath((d) => getRankY(d.placement))
  const ratePath = makeLinePath((d) => getRateY(d.attackWinRate))
  const starsPath = makeLinePath((d) => getStarsY(d.defenseStars))

  return (
    <section className="glass-panel rounded-xl shadow-sm transition-all">
      {/* Header & Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 p-4 sm:p-5 dark:border-slate-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Theo dõi phong độ qua các mùa giải
            </h2>
            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
              {chronologicalHistory.length} mùa gần nhất
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Đồng bộ dữ liệu lịch sử chính thức từ endpoint Supercell API ({myPlayerName || playerTag || 'Bạn'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút bật/tắt bảng chi tiết */}
          <button
            type="button"
            onClick={() => setShowTable((prev) => !prev)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
              showTable
                ? 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {showTable ? 'Ẩn bảng chi tiết' : 'Xem bảng chi tiết'}
          </button>

          {/* Nút thu gọn / mở rộng section */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          </button>
        </div>
      </div>

      {!isCollapsed && overallStats && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* 4 THẺ THỐNG KÊ TỔNG HỢP PHONG ĐỘ */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Thẻ 1: Thứ hạng */}
            <div className="rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Hạng mùa gần nhất
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  #{overallStats.latest.placement}
                </span>
                <span className="text-[11px] font-medium text-slate-400">/ 100</span>
              </div>
              <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Kỷ lục: #{overallStats.bestPlacement}
              </div>
            </div>

            {/* Thẻ 2: Cúp mùa giải */}
            <div className="rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Cúp mùa gần nhất
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                  {overallStats.latest.trophies}
                </span>
                <span className="text-[11px] font-medium text-slate-400">cúp</span>
              </div>
              <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Kỷ lục: {overallStats.maxTrophies} cúp
              </div>
            </div>

            {/* Thẻ 3: Tỷ lệ thắng công */}
            <div className="rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tỷ lệ thắng công
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                  {overallStats.overallWinRate.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Thắng {overallStats.totalWins}/{overallStats.totalAtks} trận
              </div>
            </div>

            {/* Thẻ 4: Cấp giải đấu */}
            <div className="rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Cấp bậc hiện tại
              </span>
              <div className="mt-2 truncate font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base" title={overallStats.latest.tierName}>
                {overallStats.latest.tierName}
              </div>
              <div className="mt-1 text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                Tối đa {overallStats.latest.maxBattles} lượt/mùa
              </div>
            </div>
          </div>

          {/* KHU VỰC BIỂU ĐỒ SVG TƯƠNG TÁC */}
          <div className="rounded-xl border border-slate-200/70 bg-white/40 p-4 dark:border-slate-700/70 dark:bg-slate-900/40">
            {/* Chuyển đổi tab đo lường */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chỉ số biểu đồ:
                </span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800/70">
                  <button
                    type="button"
                    onClick={() => setActiveMetric('cups_rank')}
                    className={`rounded-md px-2.5 py-1 transition-all ${
                      activeMetric === 'cups_rank'
                        ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Cúp & Thứ hạng
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMetric('battles_stars')}
                    className={`rounded-md px-2.5 py-1 transition-all ${
                      activeMetric === 'battles_stars'
                        ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Thắng công & Sao thủ bị mất
                  </button>
                </div>
              </div>

              {/* Chú giải màu sắc */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                {activeMetric === 'cups_rank' ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Điểm Cúp ({minCups} - {maxCups})
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      Thứ hạng (#{minRank} - #{maxRank})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Tỷ lệ thắng công (%)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Số sao phòng thủ bị cướp
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* SVG Visualizer */}
            <div className="relative mt-2 overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full min-w-[620px] select-none overflow-visible"
              >
                {/* Lưới đường ngang mờ */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = paddingTop + plotHeight * ratio
                  return (
                    <line
                      key={ratio}
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-200/80 dark:text-slate-800"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  )
                })}

                {/* Các đường thẳng đứng ứng với từng mùa giải */}
                {chronologicalHistory.map((_, i) => {
                  const x = getX(i)
                  return (
                    <line
                      key={i}
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={paddingTop + plotHeight}
                      stroke="currentColor"
                      className={
                        hoveredIndex === i
                          ? 'text-sky-400 dark:text-sky-500 stroke-[1.5]'
                          : 'text-slate-200/50 dark:text-slate-800'
                      }
                      strokeDasharray={hoveredIndex === i ? undefined : '2 2'}
                    />
                  )
                })}

                {/* Đường vẽ theo Metric */}
                {chronologicalHistory.length >= 2 && (
                  <>
                    {activeMetric === 'cups_rank' ? (
                      <>
                        {/* Đường Cup */}
                        <path
                          d={cupsPath}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Đường Rank */}
                        <path
                          d={rankPath}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="5 3"
                        />
                      </>
                    ) : (
                      <>
                        {/* Đường Thắng công */}
                        <path
                          d={ratePath}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Đường Sao thủ bị cướp */}
                        <path
                          d={starsPath}
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="5 3"
                        />
                      </>
                    )}
                  </>
                )}

                {/* Các điểm mốc tròn (Data points) */}
                {chronologicalHistory.map((d, i) => {
                  const x = getX(i)
                  const isHovered = hoveredIndex === i

                  if (activeMetric === 'cups_rank') {
                    const yCups = getCupsY(d.trophies)
                    const yRank = getRankY(d.placement)
                    return (
                      <g key={i}>
                        {/* Điểm Cúp */}
                        <circle
                          cx={x}
                          cy={yCups}
                          r={isHovered ? 6 : 4.5}
                          fill="#f59e0b"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                        {/* Điểm Rank */}
                        <circle
                          cx={x}
                          cy={yRank}
                          r={isHovered ? 6 : 4.5}
                          fill="#0284c7"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                      </g>
                    )
                  } else {
                    const yRate = getRateY(d.attackWinRate)
                    const yStars = getStarsY(d.defenseStars)
                    return (
                      <g key={i}>
                        {/* Điểm Win Rate */}
                        <circle
                          cx={x}
                          cy={yRate}
                          r={isHovered ? 6 : 4.5}
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                        {/* Điểm Stars */}
                        <circle
                          cx={x}
                          cy={yStars}
                          r={isHovered ? 6 : 4.5}
                          fill="#f43f5e"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                      </g>
                    )
                  }
                })}

                {/* Nhãn trục X: Mùa giải */}
                {chronologicalHistory.map((d, i) => {
                  const x = getX(i)
                  return (
                    <text
                      key={i}
                      x={x}
                      y={chartHeight - 10}
                      textAnchor="middle"
                      className={`text-[10px] font-semibold transition-colors ${
                        hoveredIndex === i
                          ? 'fill-sky-600 font-bold dark:fill-sky-400'
                          : 'fill-slate-500 dark:fill-slate-400'
                      }`}
                    >
                      {d.displayPeriod.split(' - ')[0]}
                    </text>
                  )
                })}

                {/* Lớp bắt sự kiện hover vô hình */}
                {chronologicalHistory.map((_, i) => {
                  const x = getX(i)
                  const colWidth = plotWidth / Math.max(1, chronologicalHistory.length)
                  return (
                    <rect
                      key={i}
                      x={x - colWidth / 2}
                      y={0}
                      width={colWidth}
                      height={chartHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  )
                })}
              </svg>

              {/* Tooltip khi hover điểm mốc (Không có icon/emoji) */}
              {hoveredIndex !== null && (
                <div
                  className="pointer-events-none absolute z-20 rounded-lg border border-slate-700/30 bg-slate-900/90 p-3 text-xs text-white shadow-xl backdrop-blur -translate-x-1/2 dark:border-slate-600 dark:bg-slate-950/95 transition-all"
                  style={{
                    left: `${(getX(hoveredIndex) / chartWidth) * 100}%`,
                    top: '8px',
                  }}
                >
                  <div className="font-bold text-sky-300">
                    {chronologicalHistory[hoveredIndex].displayPeriod}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-300">
                    {chronologicalHistory[hoveredIndex].tierName}
                  </div>
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-amber-400 font-medium">Điểm cúp:</span>
                      <span className="font-mono font-bold">
                        {chronologicalHistory[hoveredIndex].trophies} cúp
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sky-400 font-medium">Thứ hạng:</span>
                      <span className="font-mono font-bold">
                        #{chronologicalHistory[hoveredIndex].placement} / 100
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-emerald-400 font-medium">Tấn công:</span>
                      <span className="font-mono font-bold">
                        {chronologicalHistory[hoveredIndex].attackWins}T - {chronologicalHistory[hoveredIndex].attackLosses}B ({chronologicalHistory[hoveredIndex].attackWinRate}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-rose-400 font-medium">Phòng thủ:</span>
                      <span className="font-mono font-bold">
                        Bị trừ {chronologicalHistory[hoveredIndex].defenseStars} sao
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BẢNG CHI TIẾT LỊCH SỬ TỪNG MÙA GIẢI */}
          {showTable && (
            <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-700/70">
              <table className="w-full text-left text-xs">
                <thead className="soft-table-head uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3.5 py-2.5 font-bold">Khoảng thời gian</th>
                    <th className="px-3 py-2.5 font-bold">Cấp giải đấu</th>
                    <th className="px-3 py-2.5 font-bold">Thứ hạng</th>
                    <th className="px-3 py-2.5 font-bold">Điểm Cúp</th>
                    <th className="px-3 py-2.5 font-bold">Tấn công</th>
                    <th className="px-3 py-2.5 font-bold">Phòng thủ</th>
                    <th className="px-3 py-2.5 font-bold">Số trận tối đa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60">
                  {/* Hiển thị mùa mới nhất lên trên cùng của bảng */}
                  {[...chronologicalHistory].reverse().map((item, idx) => {
                    const isLatest = idx === 0
                    return (
                      <tr
                        key={item.seasonId}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                          isLatest ? 'bg-sky-500/[0.04] dark:bg-sky-500/[0.08]' : ''
                        }`}
                      >
                        {/* Thời gian */}
                        <td className="px-3.5 py-3 align-middle whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span>{item.displayPeriod}</span>
                            {isLatest && (
                              <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[9px] font-bold text-sky-700 dark:text-sky-300">
                                Mới nhất
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Cấp giải đấu */}
                        <td className="px-3 py-3 align-middle whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                          {item.tierName}
                        </td>

                        {/* Thứ hạng */}
                        <td className="px-3 py-3 align-middle whitespace-nowrap font-mono font-bold text-slate-900 dark:text-slate-100">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${
                              item.placement <= 10
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            #{item.placement}
                          </span>
                        </td>

                        {/* Điểm Cúp */}
                        <td className="px-3 py-3 align-middle whitespace-nowrap font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.trophies} cúp
                        </td>

                        {/* Tấn công */}
                        <td className="px-3 py-3 align-middle whitespace-nowrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.attackWins}T - {item.attackLosses}B
                          </span>{' '}
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            ({item.attackWinRate}%)
                          </span>
                        </td>

                        {/* Phòng thủ */}
                        <td className="px-3 py-3 align-middle whitespace-nowrap">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Mất {item.defenseStars} sao
                          </span>
                        </td>

                        {/* Giới hạn trận */}
                        <td className="px-3 py-3 align-middle whitespace-nowrap font-mono text-slate-500 dark:text-slate-400">
                          {item.maxBattles} lượt/mùa
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
