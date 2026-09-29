import type { OverallStats } from './types'

interface TrendRecordCardsProps {
  overallStats: OverallStats
  historyCount: number
}

export function TrendRecordCards({ overallStats, historyCount }: TrendRecordCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Thẻ 1: Thứ hạng */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Hạng mùa gần nhất
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              #{overallStats.latest.placement}
            </span>
            <span className="text-[11px] font-medium text-slate-400">/ 100</span>
          </div>
          <div
            className="mt-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate"
            title={`Giải đấu: ${overallStats.latest.tierName}`}
          >
            {overallStats.latest.tierName}
          </div>
        </div>
        <div
          className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate"
          title={`Kỷ lục: #${overallStats.bestRankSeason.placement} (${overallStats.bestRankSeason.tierName})`}
        >
          Kỷ lục: #{overallStats.bestRankSeason.placement} ({overallStats.bestRankSeason.tierName})
        </div>
      </div>

      {/* Thẻ 2: Cúp mùa giải */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Cúp mùa gần nhất
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {overallStats.latest.trophies}
            </span>
            <span className="text-[11px] font-medium text-slate-400">cúp</span>
          </div>
          <div
            className="mt-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate"
            title={`Giải đấu: ${overallStats.latest.tierName}`}
          >
            {overallStats.latest.tierName}
          </div>
        </div>
        <div
          className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate"
          title={`Kỷ lục: ${overallStats.bestCupsSeason.trophies} cúp (${overallStats.bestCupsSeason.tierName})`}
        >
          Kỷ lục: {overallStats.bestCupsSeason.trophies} cúp ({overallStats.bestCupsSeason.tierName})
        </div>
      </div>

      {/* Thẻ 3: Tỷ lệ thắng công */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60">
        <div>
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
        <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          {historyCount} mùa gần nhất
        </div>
      </div>

      {/* Thẻ 4: Cấp giải đấu */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Cấp bậc hiện tại
          </span>
          <div
            className="mt-2 truncate font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base"
            title={overallStats.latest.tierName}
          >
            {overallStats.latest.tierName}
          </div>
          <div className="mt-1 text-[11px] text-sky-600 dark:text-sky-400 font-medium">
            Tối đa {overallStats.latest.maxBattles} lượt/mùa
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          Mùa {overallStats.latest.displayPeriod}
        </div>
      </div>
    </div>
  )
}
