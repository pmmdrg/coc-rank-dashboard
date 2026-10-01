import { useMemo, useState } from 'react'
import type { LeagueHistoryItem } from '../types'
import { parseSeasonDateRange } from '../lib/cocApi'
import { RANKED_TIERS_METADATA } from '../data/rankedTierMetadata'
import { TrendRecordCards } from './trend/TrendRecordCards'
import { TrendHistoryTable } from './trend/TrendHistoryTable'
import type { ProcessedSeasonPoint } from './trend/types'
import { useI18n } from '../i18n/LanguageContext'
import { SegmentedControl, type SegmentedControlOption } from './SegmentedControl'
import { CollapseToggleButton } from './CollapseToggleButton'

export interface PerformanceTrendSectionProps {
  leagueHistory?: LeagueHistoryItem[]
  myPlayerName?: string
  playerTag?: string
  isSyncingApi?: boolean
}

function TrendSectionSkeleton() {
  const { dict } = useI18n()

  return (
    <section className="glass-panel rounded-xl shadow-sm transition-all overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 p-4 sm:p-5 dark:border-slate-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {dict.performanceTrend.title}
            </h2>
            <span className="inline-flex h-5 items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 text-[10px] font-bold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 animate-ping" />
              {dict.common.loading}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {dict.performanceTrend.subtitle}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* 4 Thẻ kỷ lục Skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60 h-28"
            >
              <div>
                <div className="h-3 w-24 rounded-md skeleton-shimmer" />
                <div className="mt-2.5 h-6 w-16 rounded-md skeleton-shimmer" />
                <div className="mt-2 h-3 w-20 rounded-md skeleton-shimmer" />
              </div>
              <div className="mt-2 h-3 w-28 rounded-md skeleton-shimmer" />
            </div>
          ))}
        </div>

        {/* Khung Biểu đồ Skeleton */}
        <div className="rounded-xl border border-slate-200/70 bg-white/40 p-4 dark:border-slate-700/70 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex gap-2">
              <div className="h-7 w-28 rounded-lg skeleton-shimmer" />
              <div className="h-7 w-28 rounded-lg skeleton-shimmer" />
            </div>
            <div className="h-3 w-32 rounded-md skeleton-shimmer" />
          </div>
          <div className="h-52 w-full rounded-xl skeleton-shimmer flex items-center justify-center">
            <div className="h-4 w-44 rounded-md skeleton-shimmer" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function PerformanceTrendSection({
  leagueHistory = [],
  myPlayerName = '',
  playerTag = '',
  isSyncingApi = false,
}: PerformanceTrendSectionProps) {
  const { dict, interpolate } = useI18n()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeMetric, setActiveMetric] = useState<'cups_rank' | 'battles_stars'>('cups_rank')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(true)

  const metricOptions = useMemo<SegmentedControlOption<'cups_rank' | 'battles_stars'>[]>(() => [
    {
      value: 'cups_rank',
      label: <span>{dict.performanceTrend.metricCupsRank}</span>,
    },
    {
      value: 'battles_stars',
      label: <span>{dict.performanceTrend.metricBattlesStars}</span>,
    },
  ], [dict.performanceTrend])

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
      const matchedTier = RANKED_TIERS_METADATA.find(
        (t) => t.id === item.leagueTierId || t.tierNumber === item.leagueTierId,
      )

      let tierNumber = 0
      let tierName = `Cấp bậc #${item.leagueTierId}`
      if (matchedTier) {
        tierName = matchedTier.name
        tierNumber = matchedTier.tierNumber
      } else {
        const numId = Number(item.leagueTierId)
        if (numId > 105000000 && numId <= 105000036) {
          tierNumber = numId - 105000000
          const fallbackTier = RANKED_TIERS_METADATA.find((t) => t.tierNumber === tierNumber)
          if (fallbackTier) tierName = fallbackTier.name
        } else if (numId >= 1 && numId <= 36) {
          tierNumber = numId
          const fallbackTier = RANKED_TIERS_METADATA.find((t) => t.tierNumber === tierNumber)
          if (fallbackTier) tierName = fallbackTier.name
        }
      }

      const totalAttacks = (item.attackWins || 0) + (item.attackLosses || 0)
      const attackWinRate = totalAttacks > 0 ? Math.round(((item.attackWins || 0) / totalAttacks) * 1000) / 10 : 0

      const totalDefenses = (item.defenseWins || 0) + (item.defenseLosses || 0)

      return {
        seasonId: item.leagueSeasonId,
        displayPeriod: displayPeriod !== '--' ? displayPeriod : `Mùa ${item.leagueSeasonId}`,
        tierName,
        tierNumber,
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

    // 1. Kỷ lục thứ hạng: Ưu tiên giải đấu cao hơn trước, sau đó mới đến thứ hạng (#1 > #2)
    // Quy tắc: Rank 80 của Legend 3 vẫn cao hơn rank 16 của Electro 33
    const validPlacementSeasons = chronologicalHistory.filter((s) => s.placement > 0)
    const bestRankSeason = validPlacementSeasons.reduce((best, cur) => {
      if (!best) return cur
      // Ưu tiên giải đấu cấp cao hơn (tierNumber cao hơn)
      if (cur.tierNumber > best.tierNumber) return cur
      if (cur.tierNumber < best.tierNumber) return best
      // Trong cùng một giải đấu: Thứ hạng nhỏ hơn là tốt hơn (#1 tốt hơn #80)
      if (cur.placement < best.placement) return cur
      if (cur.placement > best.placement) return best
      // Nếu cùng thứ hạng trong cùng một giải: Mùa cúp cao hơn hoặc mới hơn
      return cur.trophies >= best.trophies ? cur : best
    }, validPlacementSeasons[0] || latest)

    // 2. Kỷ lục cúp: Ưu tiên giải đấu cao hơn trước, sau đó mới đến số cúp (tương tự quy tắc kỷ lục hạng)
    const bestCupsSeason = chronologicalHistory.reduce((best, cur) => {
      if (!best) return cur
      // Ưu tiên giải đấu cấp cao hơn trước (tierNumber cao hơn)
      if (cur.tierNumber > best.tierNumber) return cur
      if (cur.tierNumber < best.tierNumber) return best
      // Trong cùng một giải đấu: Số cúp cao hơn là tốt hơn
      if (cur.trophies > best.trophies) return cur
      if (cur.trophies < best.trophies) return best
      // Nếu cùng số cúp trong cùng một giải đấu: Chọn mùa có thứ hạng tốt hơn hoặc mới hơn
      return cur.placement <= best.placement ? cur : best
    }, chronologicalHistory[0])

    const totalWins = chronologicalHistory.reduce((acc, s) => acc + s.attackWins, 0)
    const totalAtks = chronologicalHistory.reduce((acc, s) => acc + s.totalAttacks, 0)
    const overallWinRate = totalAtks > 0 ? Math.round((totalWins / totalAtks) * 1000) / 10 : 0

    return {
      latest,
      bestRankSeason,
      bestCupsSeason,
      totalWins,
      totalAtks,
      overallWinRate,
    }
  }, [chronologicalHistory])

  if (isSyncingApi) {
    return <TrendSectionSkeleton />
  }

  if (chronologicalHistory.length === 0) {
    return (
      <section className="glass-panel rounded-xl shadow-sm transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 p-4 sm:p-5 dark:border-slate-700/60">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {dict.performanceTrend.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dict.performanceTrend.subtitle}
            </p>
          </div>
        </div>
        <div className="py-10 text-center px-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {dict.performanceTrend.emptyTitle}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {playerTag
              ? dict.performanceTrend.emptyDescWithTag
              : dict.performanceTrend.emptyDescNoTag}
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

  // --- TÍNH TOÁN DÃY TẦNG GIẢI ĐẤU (100 HẠNG MỖI TẦNG) ---
  // Mỗi giải đấu là 1 tầng gồm 100 bậc (hạng #100 ở đáy tầng, hạng #1 ở đỉnh tầng)
  // Tầng của giải đấu cao hơn sẽ nằm chồng lên trên tầng của giải đấu thấp hơn
  const minTierInHistory = Math.min(...chronologicalHistory.map((d) => (d.tierNumber > 0 ? d.tierNumber : 1)))
  const maxTierInHistory = Math.max(...chronologicalHistory.map((d) => (d.tierNumber > 0 ? d.tierNumber : 1)))

  // Score tính theo tầng giải đấu: tierNumber * 100 - placement
  const getStackedRankScore = (d: ProcessedSeasonPoint) => {
    const tier = d.tierNumber > 0 ? d.tierNumber : 1
    const place = Math.min(100, Math.max(1, d.placement || 100))
    return tier * 100 - place
  }

  // Đáy trục Y là hạng #100 của tầng thấp nhất trong lịch sử
  const floorRankScore = (minTierInHistory - 1) * 100
  // Đỉnh trục Y là hạng #1 của tầng cao nhất trong lịch sử
  const ceilRankScore = maxTierInHistory * 100
  const rankScoreSpan = Math.max(1, ceilRankScore - floorRankScore)

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

  // Rank: Điểm tầng giải đấu càng cao (hoặc thứ hạng nhỏ hơn) càng ở trên đỉnh biểu đồ
  const getRankY = (d: ProcessedSeasonPoint) => {
    const score = getStackedRankScore(d)
    return paddingTop + plotHeight - ((score - floorRankScore) / rankScoreSpan) * plotHeight
  }

  // WinRate: 100% ở trên, 0% ở dưới
  const getRateY = (rate: number) => {
    return paddingTop + plotHeight - ((rate - minRate) / rateSpan) * plotHeight
  }

  // Sao thủ mất: càng ít càng ở trên
  const getStarsY = (stars: number) => {
    return paddingTop + ((stars - minStars) / starsSpan) * plotHeight
  }

  // Tạo đường dẫn cong mềm mại (Smooth Spline Curve)
  const makeSmoothPath = (getY: (d: ProcessedSeasonPoint) => number, tension: number = 0.18) => {
    if (chronologicalHistory.length === 0) return ''
    const points = chronologicalHistory.map((d, i) => ({ x: getX(i), y: getY(d) }))
    if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
    if (points.length === 2) {
      return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`
    }

    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2]

      const cp1x = p1.x + (p2.x - p0.x) * tension
      const cp1y = p1.y + (p2.y - p0.y) * tension
      const cp2x = p2.x - (p3.x - p1.x) * tension
      const cp2y = p2.y - (p3.y - p1.y) * tension

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    }
    return path
  }

  const cupsPath = makeSmoothPath((d) => getCupsY(d.trophies))
  const rankPath = makeSmoothPath((d) => getRankY(d))
  const ratePath = makeSmoothPath((d) => getRateY(d.attackWinRate))
  const starsPath = makeSmoothPath((d) => getStarsY(d.defenseStars))

  // Tính vị trí tooltip thông minh (linh hoạt đổi bên để không bị che khuất / tràn mép)
  const tooltipPos = (() => {
    if (hoveredIndex === null || chronologicalHistory.length === 0) return null
    const total = chronologicalHistory.length
    const isOnRight = hoveredIndex < Math.ceil(total / 2)
    const pointX = getX(hoveredIndex)
    const offset = 16
    const targetX = isOnRight ? pointX + offset : pointX - offset
    const leftPercent = (targetX / chartWidth) * 100
    return { isOnRight, leftPercent }
  })()

  // Xử lý hover mượt mà liên tục toàn bộ biểu đồ (chuẩn Chart.js continuous hover zone không điểm mù)
  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (chronologicalHistory.length === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width <= 0) return

    const mouseX = e.clientX - rect.left
    const svgX = (mouseX / rect.width) * chartWidth

    let closestIndex = 0
    let minDistance = Infinity

    for (let i = 0; i < chronologicalHistory.length; i++) {
      const pointX = getX(i)
      const dist = Math.abs(svgX - pointX)
      if (dist < minDistance) {
        minDistance = dist
        closestIndex = i
      }
    }

    setHoveredIndex(closestIndex)
  }

  const handleChartMouseLeave = () => {
    setHoveredIndex(null)
  }

  const handleChartTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (chronologicalHistory.length === 0 || !e.touches[0]) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width <= 0) return

    const touchX = e.touches[0].clientX - rect.left
    const svgX = (touchX / rect.width) * chartWidth

    let closestIndex = 0
    let minDistance = Infinity

    for (let i = 0; i < chronologicalHistory.length; i++) {
      const pointX = getX(i)
      const dist = Math.abs(svgX - pointX)
      if (dist < minDistance) {
        minDistance = dist
        closestIndex = i
      }
    }

    setHoveredIndex(closestIndex)
  }

  return (
    <section className="glass-panel rounded-xl shadow-sm transition-all">
      {/* Header & Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 p-4 sm:p-5 dark:border-slate-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {dict.performanceTrend.title}
            </h2>
            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
              {interpolate(dict.performanceTrend.seasonsCount, { count: chronologicalHistory.length })}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {interpolate(dict.performanceTrend.officialDataNotice, { name: myPlayerName || playerTag || dict.common.you })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút bật/tắt bảng chi tiết */}
          <div className="apple-segmented-container">
            <button
              type="button"
              onClick={() => setShowTable((prev) => !prev)}
              className={`apple-segmented-item ${
                showTable
                  ? 'is-active text-sky-700 dark:text-sky-300 font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              } transition-all active:scale-95 cursor-pointer font-semibold`}
            >
              {showTable ? dict.performanceTrend.hideHistoryTable : dict.performanceTrend.showHistoryTable}
            </button>
          </div>

          {/* Nút thu gọn / mở rộng section */}
          <CollapseToggleButton
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed((prev) => !prev)}
            ariaLabel={dict.performanceTrend.title}
          />
        </div>
      </div>

      {overallStats && (
        <div className={`collapsible-grid ${!isCollapsed ? 'is-expanded' : ''}`}>
          <div className="collapsible-inner">
            <div className="p-4 sm:p-5 space-y-5">
              {/* 4 THẺ THỐNG KÊ TỔNG HỢP PHONG ĐỘ */}
              <TrendRecordCards
                overallStats={overallStats}
                historyCount={chronologicalHistory.length}
              />

          {/* KHU VỰC BIỂU ĐỒ SVG TƯƠNG TÁC */}
          <div className="rounded-xl border border-slate-200/70 bg-white/40 p-4 dark:border-slate-700/70 dark:bg-slate-900/40">
            {/* Chuyển đổi tab đo lường */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {dict.performanceTrend.chartMetric}
                </span>
                <SegmentedControl<'cups_rank' | 'battles_stars'>
                  options={metricOptions}
                  value={activeMetric}
                  onChange={setActiveMetric}
                  ariaLabel={dict.performanceTrend.chartMetric}
                />
              </div>

              {/* Chú giải màu sắc */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                {activeMetric === 'cups_rank' ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      {interpolate(dict.performanceTrend.cupsLegend, { min: minCups, max: maxCups })}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      {dict.performanceTrend.rankTierLegend}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {dict.performanceTrend.attackWinRateLegend}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      {dict.performanceTrend.defenseStarsLegend}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* SVG Visualizer */}
            <div className="relative mt-2 overflow-x-auto">
              <div className="relative w-full min-w-[620px]">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full select-none overflow-visible"
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                  onTouchMove={handleChartTouchMove}
                  onTouchEnd={handleChartMouseLeave}
                >
                {/* Lớp bắt sự kiện tương tác toàn diện không điểm mù (Continuous interactive hover zone) */}
                <rect
                  x={0}
                  y={0}
                  width={chartWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                />
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

                {/* Đường phân chia các tầng giải đấu (mỗi tầng 100 hạng) */}
                {activeMetric === 'cups_rank' &&
                  maxTierInHistory > minTierInHistory &&
                  Array.from({ length: maxTierInHistory - minTierInHistory }, (_, idx) => {
                    const t = minTierInHistory + idx
                    const boundaryScore = t * 100
                    const boundaryY = paddingTop + plotHeight - ((boundaryScore - floorRankScore) / rankScoreSpan) * plotHeight
                    return (
                      <line
                        key={`tier-boundary-${t}`}
                        x1={paddingX}
                        y1={boundaryY}
                        x2={chartWidth - paddingX}
                        y2={boundaryY}
                        stroke="#0284c7"
                        strokeDasharray="6 3"
                        strokeWidth="1.2"
                        className="opacity-30 dark:opacity-40"
                      />
                    )
                  })}

                {/* Nhãn tên từng tầng giải đấu hiển thị bên trong biểu đồ */}
                {activeMetric === 'cups_rank' &&
                  Array.from({ length: maxTierInHistory - minTierInHistory + 1 }, (_, idx) => {
                    const t = minTierInHistory + idx
                    const centerScore = (t - 0.5) * 100
                    const centerY = paddingTop + plotHeight - ((centerScore - floorRankScore) / rankScoreSpan) * plotHeight
                    const tierDef = RANKED_TIERS_METADATA.find((m) => m.tierNumber === t)
                    const label = tierDef ? tierDef.name : `Cấp #${t}`
                    return (
                      <text
                        key={`tier-label-${t}`}
                        x={paddingX + 8}
                        y={centerY - 4}
                        className="fill-sky-700/50 text-[10px] font-bold select-none dark:fill-sky-300/50 pointer-events-none"
                      >
                        {label}
                      </text>
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
                        {/* Đường Rank (Nét liền rõ nét) */}
                        <path
                          d={rankPath}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
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
                        {/* Đường Sao thủ bị cướp (Nét liền rõ nét) */}
                        <path
                          d={starsPath}
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
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
                    const yRank = getRankY(d)
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

              </svg>

              {/* Tooltip khi hover điểm mốc (Kích thước đồng nhất 260px, trượt mượt mà theo từng điểm mốc) */}
              {tooltipPos && hoveredIndex !== null && (
                <div
                  className="pointer-events-none absolute z-20 w-[260px] min-w-[260px] max-w-[260px] transition-[left,top,transform] duration-200 ease-out"
                  style={{
                    left: `${tooltipPos.leftPercent}%`,
                    top: '12px',
                    transform: tooltipPos.isOnRight ? 'translateX(0)' : 'translateX(-100%)',
                  }}
                >
                  <div className="relative w-full rounded-xl border border-slate-700/50 bg-slate-900/95 p-3.5 text-xs text-white shadow-2xl backdrop-blur-md dark:border-slate-600/60 dark:bg-slate-950/95">
                    {/* Mũi tên định hướng (pointer arrow) */}
                    <div
                      className={`absolute top-4 h-2.5 w-2.5 rotate-45 border-slate-700/60 bg-slate-900/95 dark:border-slate-600 dark:bg-slate-950/95 transition-all duration-200 ${
                        tooltipPos.isOnRight
                          ? '-left-[5px] border-b border-l'
                          : '-right-[5px] border-t border-r'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="font-bold text-sky-300 truncate">
                      {chronologicalHistory[hoveredIndex].displayPeriod}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-300 truncate">
                      {chronologicalHistory[hoveredIndex].tierName}
                    </div>
                    <div className="mt-2.5 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-amber-400 font-medium shrink-0">{dict.highlights.currentCups}:</span>
                        <span className="font-mono font-bold whitespace-nowrap">
                          {chronologicalHistory[hoveredIndex].trophies} {dict.common.trophies}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sky-400 font-medium shrink-0">{dict.common.rank}:</span>
                        <span className="font-mono font-bold whitespace-nowrap">
                          #{chronologicalHistory[hoveredIndex].placement} {dict.performanceTrend.outOfHundred}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-emerald-400 font-medium shrink-0">{dict.common.attacks}:</span>
                        <span className="font-mono font-bold whitespace-nowrap">
                          {chronologicalHistory[hoveredIndex].attackWins}W - {chronologicalHistory[hoveredIndex].attackLosses}L ({chronologicalHistory[hoveredIndex].attackWinRate}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-rose-400 font-medium shrink-0">{dict.common.defenses}:</span>
                        <span className="font-mono font-bold whitespace-nowrap">
                          {interpolate(dict.performanceTrend.lostStars, { stars: chronologicalHistory[hoveredIndex].defenseStars })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* BẢNG CHI TIẾT LỊCH SỬ TỪNG MÙA GIẢI */}
          <div className={`collapsible-grid ${showTable ? 'is-expanded' : ''}`}>
            <div className="collapsible-inner">
              <div className="pt-1">
                <TrendHistoryTable chronologicalHistory={chronologicalHistory} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</section>
  )
}
