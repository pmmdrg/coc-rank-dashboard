import { useMemo, useState } from 'react'
import { Award, ChevronDown, ChevronUp, Flame, Shield, TrendingUp, Trophy } from 'lucide-react'
import type { RatingCategory, Season } from '../types'
import { formatDestruction, normalizeSeason, ratingColors, ratingLabels } from '../lib/ranking'

export interface PerformanceTrendSectionProps {
  seasons: Season[]
  myPlayerName: string
  activeSeasonIndex: number
}

interface SeasonDataPoint {
  seasonId: string
  seasonName: string
  rank: number
  totalPlayers: number
  currentCups: number
  maxPossibleCups: number
  attackDestruction: number
  defenseDestruction: number
  attacks: number
  defenses: number
  maxAttacks: number
  maxDefenses: number
  rating: RatingCategory
}

export function PerformanceTrendSection({
  seasons,
  myPlayerName,
  activeSeasonIndex,
}: PerformanceTrendSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeMetric, setActiveMetric] = useState<'cups_rank' | 'destruction'>('cups_rank')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Trích xuất dữ liệu phong độ của tài khoản qua từng mùa giải
  const history = useMemo(() => {
    const points: SeasonDataPoint[] = []

    seasons.forEach((rawSeason) => {
      const s = normalizeSeason(rawSeason)
      const myPlayer = s.players.find(
        (p) =>
          p.id === s.myPlayerId ||
          p.name.trim().toLowerCase() === myPlayerName.trim().toLowerCase(),
      )

      if (myPlayer) {
        points.push({
          seasonId: s.seasonName + (s.startsAt || ''),
          seasonName: s.seasonName,
          rank: myPlayer.rank,
          totalPlayers: s.players.length,
          currentCups: myPlayer.currentCups,
          maxPossibleCups: myPlayer.maxPossibleCups,
          attackDestruction: myPlayer.attackDestruction ?? 0,
          defenseDestruction: myPlayer.defenseDestruction ?? 0,
          attacks: myPlayer.attacks,
          defenses: myPlayer.defenses,
          maxAttacks: s.maxAttacks ?? 24,
          maxDefenses: s.maxDefenses ?? 24,
          rating: myPlayer.rating,
        })
      }
    })

    return points
  }, [seasons, myPlayerName])

  if (history.length === 0) {
    return (
      <section className="glass-panel rounded-xl shadow-sm transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 p-4 sm:p-5 dark:border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-sky-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Theo dõi phong độ qua các mùa giải
            </h2>
          </div>
        </div>
        <div className="p-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
          Chưa có dữ liệu
        </div>
      </section>
    )
  }

  const latestPoint = history[history.length - 1]
  const currentSeasonPoint = history[activeSeasonIndex] ?? latestPoint
  const hasMultipleSeasons = history.length >= 2

  // Tính toán tọa độ biểu đồ SVG cho >= 2 mùa giải
  const chartWidth = 720
  const chartHeight = 220
  const paddingX = 60
  const paddingTop = 30
  const paddingBottom = 40
  const plotWidth = chartWidth - paddingX * 2
  const plotHeight = chartHeight - paddingTop - paddingBottom

  // Tìm min/max theo metric
  const cupsValues = history.map((d) => d.currentCups)
  const minCups = Math.min(...cupsValues, 5000)
  const maxCups = Math.max(...cupsValues, 5500)
  const cupsSpan = Math.max(1, maxCups - minCups)

  const atkDestValues = history.map((d) => d.attackDestruction)
  const defDestValues = history.map((d) => d.defenseDestruction)
  const minDest = Math.max(0, Math.min(...atkDestValues, ...defDestValues) - 5)
  const maxDest = Math.min(100, Math.max(...atkDestValues, ...defDestValues) + 5)
  const destSpan = Math.max(1, maxDest - minDest)

  const getX = (index: number) => {
    if (history.length <= 1) return chartWidth / 2
    return paddingX + (index / (history.length - 1)) * plotWidth
  }

  const getCupsY = (cups: number) => {
    return paddingTop + plotHeight - ((cups - minCups) / cupsSpan) * plotHeight
  }

  const getDestY = (dest: number) => {
    return paddingTop + plotHeight - ((dest - minDest) / destSpan) * plotHeight
  }

  // Tạo chuỗi đường path cho SVG
  const cupsPath = history
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getCupsY(d.currentCups)}`)
    .join(' ')

  const atkDestPath = history
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getDestY(d.attackDestruction)}`)
    .join(' ')

  const defDestPath = history
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getDestY(d.defenseDestruction)}`)
    .join(' ')

  return (
    <section className="glass-panel rounded-xl shadow-sm transition-all">
      {/* Header thanh tiêu đề */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 p-4 sm:p-5 dark:border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Theo Dõi Phong Độ Qua Các Mùa Giải
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {myPlayerName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasMultipleSeasons
                ? `Lịch sử thi đấu qua ${history.length} mùa giải`
                : 'Thông số phong độ mùa giải hiện tại'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMultipleSeasons && !isCollapsed && (
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setActiveMetric('cups_rank')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  activeMetric === 'cups_rank'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Cúp & Thứ hạng
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('destruction')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  activeMetric === 'destruction'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                % Công vs % Thủ
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Lưới các thẻ chỉ số tóm tắt */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Thứ hạng */}
            <div className="rounded-lg border border-slate-200/60 bg-white/40 p-3 dark:border-slate-800/60 dark:bg-slate-900/40">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Thứ Hạng Mùa Này</span>
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                  #{currentSeasonPoint.rank}
                </span>
                <span className="text-xs text-slate-400">/ {currentSeasonPoint.totalPlayers}</span>
              </div>
            </div>

            {/* Cúp hiện tại */}
            <div className="rounded-lg border border-slate-200/60 bg-white/40 p-3 dark:border-slate-800/60 dark:bg-slate-900/40">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Điểm Cúp Hiện Tại</span>
                <Award className="h-3.5 w-3.5 text-sky-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-black text-sky-600 dark:text-sky-400">
                  {currentSeasonPoint.currentCups.toLocaleString('vi-VN')}
                </span>
                <span className="text-[11px] text-slate-400">
                  (Trần: {currentSeasonPoint.maxPossibleCups.toLocaleString('vi-VN')})
                </span>
              </div>
            </div>

            {/* % Công */}
            <div className="rounded-lg border border-slate-200/60 bg-white/40 p-3 dark:border-slate-800/60 dark:bg-slate-900/40">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>% Công Trung Bình</span>
                <Flame className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {currentSeasonPoint.attacks > 0
                    ? `${formatDestruction(currentSeasonPoint.attackDestruction)}%`
                    : 'Chưa đánh'}
                </span>
                {currentSeasonPoint.attacks > 0 && (
                  <span
                    className="rounded px-1.5 py-0.2 text-[10px] font-bold"
                    style={{
                      backgroundColor: `${ratingColors[currentSeasonPoint.rating]}20`,
                      color: ratingColors[currentSeasonPoint.rating],
                    }}
                  >
                    {ratingLabels[currentSeasonPoint.rating]}
                  </span>
                )}
              </div>
            </div>

            {/* % Thủ */}
            <div className="rounded-lg border border-slate-200/60 bg-white/40 p-3 dark:border-slate-800/60 dark:bg-slate-900/40">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>% Thủ Trung Bình</span>
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {currentSeasonPoint.defenses > 0
                    ? `${formatDestruction(currentSeasonPoint.defenseDestruction)}%`
                    : 'Chưa thủ'}
                </span>
                <span className="text-[11px] text-slate-400">
                  ({currentSeasonPoint.defenses}/{currentSeasonPoint.maxDefenses} trận)
                </span>
              </div>
            </div>
          </div>

          {/* Biểu đồ SVG nếu có từ 2 mùa giải trở lên */}
          {hasMultipleSeasons ? (
            <div className="relative overflow-x-auto rounded-lg border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/50">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>
                  {activeMetric === 'cups_rank'
                    ? '📈 Biểu đồ điểm Cúp & Thứ hạng qua các mùa'
                    : '⚔️ Biểu đồ % Công (Đỏ) vs % Thủ (Xanh ngọc) qua các mùa'}
                </span>
                <div className="flex items-center gap-3">
                  {activeMetric === 'cups_rank' ? (
                    <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      Điểm Cúp
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        % Công
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        % Thủ
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="min-w-[600px]">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-auto overflow-visible select-none"
                >
                  {/* Đường lưới ngang */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                    const y = paddingTop + plotHeight * pct
                    const val =
                      activeMetric === 'cups_rank'
                        ? Math.round(maxCups - pct * cupsSpan)
                        : Math.round(maxDest - pct * destSpan)
                    return (
                      <g key={pct}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="currentColor"
                          className="text-slate-200/70 dark:text-slate-800"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={paddingX - 8}
                          y={y + 3}
                          textAnchor="end"
                          className="fill-slate-400 text-[10px] font-mono"
                        >
                          {val}
                          {activeMetric === 'destruction' ? '%' : ''}
                        </text>
                      </g>
                    )
                  })}

                  {/* Đường biểu đồ */}
                  {activeMetric === 'cups_rank' ? (
                    <path
                      d={cupsPath}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="drop-shadow-sm transition-all duration-300"
                    />
                  ) : (
                    <>
                      <path
                        d={atkDestPath}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-sm transition-all duration-300"
                      />
                      <path
                        d={defDestPath}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-sm transition-all duration-300"
                      />
                    </>
                  )}

                  {/* Các điểm nút tròn tương tác */}
                  {history.map((point, i) => {
                    const x = getX(i)
                    const isHovered = hoveredIndex === i

                    if (activeMetric === 'cups_rank') {
                      const y = getCupsY(point.currentCups)
                      return (
                        <g
                          key={point.seasonId}
                          onMouseEnter={() => setHoveredIndex(i)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className="cursor-pointer"
                        >
                          {/* Trục X nhãn mùa giải */}
                          <text
                            x={x}
                            y={chartHeight - 12}
                            textAnchor="middle"
                            className={`text-[11px] font-semibold transition-colors ${
                              isHovered
                                ? 'fill-sky-600 dark:fill-sky-400 font-bold'
                                : 'fill-slate-500 dark:fill-slate-400'
                            }`}
                          >
                            {point.seasonName}
                          </text>

                          {/* Vòng tròn điểm */}
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 6 : 4.5}
                            fill="#0284c7"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-all duration-150 drop-shadow-sm"
                          />

                          {/* Nhãn điểm cúp & thứ hạng trên đầu */}
                          <text
                            x={x}
                            y={y - 10}
                            textAnchor="middle"
                            className="fill-slate-800 dark:fill-slate-100 text-[10px] font-bold"
                          >
                            {point.currentCups} (#{point.rank})
                          </text>
                        </g>
                      )
                    }

                    const yAtk = getDestY(point.attackDestruction)
                    const yDef = getDestY(point.defenseDestruction)
                    return (
                      <g
                        key={point.seasonId}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="cursor-pointer"
                      >
                        {/* Trục X nhãn mùa giải */}
                        <text
                          x={x}
                          y={chartHeight - 12}
                          textAnchor="middle"
                          className={`text-[11px] font-semibold transition-colors ${
                            isHovered
                              ? 'fill-slate-900 dark:fill-slate-100 font-bold'
                              : 'fill-slate-500 dark:fill-slate-400'
                          }`}
                        >
                          {point.seasonName}
                        </text>

                        {/* Điểm % công */}
                        <circle
                          cx={x}
                          cy={yAtk}
                          r={isHovered ? 6 : 4.5}
                          fill="#f43f5e"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-all duration-150 drop-shadow-sm"
                        />
                        <text
                          x={x}
                          y={yAtk - 8}
                          textAnchor="middle"
                          className="fill-rose-700 dark:fill-rose-300 text-[9px] font-bold"
                        >
                          {point.attackDestruction.toFixed(1)}%
                        </text>

                        {/* Điểm % thủ */}
                        <circle
                          cx={x}
                          cy={yDef}
                          r={isHovered ? 6 : 4.5}
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-all duration-150 drop-shadow-sm"
                        />
                        <text
                          x={x}
                          y={yDef + 16}
                          textAnchor="middle"
                          className="fill-emerald-700 dark:fill-emerald-300 text-[9px] font-bold"
                        >
                          {point.defenseDestruction.toFixed(1)}%
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-sky-200/60 bg-sky-50/50 p-3 text-xs text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300">
              <span>💡</span>
              <span>
                <strong>Mẹo thi đấu:</strong> Đồ thị đường xu hướng (Trend Line) sẽ tự động vẽ biến thiên phong độ qua từng tuần khi bạn bấm nút <strong>"+ Mùa mới"</strong> để lưu trữ giải đấu tiếp theo.
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
