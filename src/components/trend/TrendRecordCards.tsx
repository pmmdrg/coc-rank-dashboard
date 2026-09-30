import type { OverallStats } from './types'
import { useI18n } from '../../i18n/LanguageContext'

interface TrendRecordCardsProps {
  overallStats: OverallStats
  historyCount: number
}

export function TrendRecordCards({ overallStats, historyCount }: TrendRecordCardsProps) {
  const { dict, interpolate } = useI18n()

  const recordRankText = interpolate(dict.performanceTrend.recordRank, {
    rank: overallStats.bestRankSeason.placement,
    tier: overallStats.bestRankSeason.tierName,
  })

  const recordCupsText = interpolate(dict.performanceTrend.recordCups, {
    cups: overallStats.bestCupsSeason.trophies,
    tier: overallStats.bestCupsSeason.tierName,
  })

  const wonMatchesText = interpolate(dict.performanceTrend.wonMatches, {
    wins: overallStats.totalWins,
    total: overallStats.totalAtks,
  })

  const seasonsCountText = interpolate(dict.performanceTrend.seasonsCount, {
    count: historyCount,
  })

  const maxBattlesText = interpolate(dict.performanceTrend.maxBattlesPerSeason, {
    max: overallStats.latest.maxBattles,
  })

  const seasonPeriodText = interpolate(dict.performanceTrend.seasonPrefix, {
    period: overallStats.latest.displayPeriod,
  })

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Thẻ 1: Thứ hạng */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {dict.performanceTrend.latestRank}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              #{overallStats.latest.placement}
            </span>
            <span className="text-[11px] font-medium text-slate-400">{dict.performanceTrend.outOfHundred}</span>
          </div>
          <div
            className="mt-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate"
            title={`${dict.seasonMeta.league}: ${overallStats.latest.tierName}`}
          >
            {overallStats.latest.tierName}
          </div>
        </div>
        <div
          className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate"
          title={recordRankText}
        >
          {recordRankText}
        </div>
      </div>

      {/* Thẻ 2: Cúp mùa giải */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {dict.performanceTrend.latestCups}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {overallStats.latest.trophies}
            </span>
            <span className="text-[11px] font-medium text-slate-400">{dict.common.trophies}</span>
          </div>
          <div
            className="mt-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate"
            title={`${dict.seasonMeta.league}: ${overallStats.latest.tierName}`}
          >
            {overallStats.latest.tierName}
          </div>
        </div>
        <div
          className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate"
          title={recordCupsText}
        >
          {recordCupsText}
        </div>
      </div>

      {/* Thẻ 3: Tỷ lệ thắng công */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {dict.performanceTrend.attackWinRate}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
              {overallStats.overallWinRate.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {wonMatchesText}
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          {seasonsCountText}
        </div>
      </div>

      {/* Thẻ 4: Cấp giải đấu */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white/60 p-3.5 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {dict.performanceTrend.currentTier}
          </span>
          <div
            className="mt-2 truncate font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base"
            title={overallStats.latest.tierName}
          >
            {overallStats.latest.tierName}
          </div>
          <div className="mt-1 text-[11px] text-sky-600 dark:text-sky-400 font-medium">
            {maxBattlesText}
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          {seasonPeriodText}
        </div>
      </div>
    </div>
  )
}
