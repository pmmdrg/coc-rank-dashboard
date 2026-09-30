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
      <div className="glass-panel group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 p-4 shadow-2xs transition-all hover:shadow-xs dark:border-white/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {dict.performanceTrend.latestRank}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100">
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
          className="mt-2.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate"
          title={recordRankText}
        >
          {recordRankText}
        </div>
      </div>

      {/* Thẻ 2: Cúp mùa giải */}
      <div className="glass-panel group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 p-4 shadow-2xs transition-all hover:shadow-xs dark:border-white/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {dict.performanceTrend.latestCups}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-black text-amber-600 dark:text-amber-400">
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
          className="mt-2.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate"
          title={recordCupsText}
        >
          {recordCupsText}
        </div>
      </div>

      {/* Thẻ 3: Tỷ lệ thắng công */}
      <div className="glass-panel group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 p-4 shadow-2xs transition-all hover:shadow-xs dark:border-white/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {dict.performanceTrend.attackWinRate}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-black text-rose-600 dark:text-rose-400">
              {overallStats.overallWinRate.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {wonMatchesText}
          </div>
        </div>
        <div className="mt-2.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          {seasonsCountText}
        </div>
      </div>

      {/* Thẻ 4: Cấp giải đấu */}
      <div className="glass-panel group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 p-4 shadow-2xs transition-all hover:shadow-xs dark:border-white/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {dict.performanceTrend.currentTier}
          </span>
          <div
            className="mt-2 truncate font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base"
            title={overallStats.latest.tierName}
          >
            {overallStats.latest.tierName}
          </div>
          <div className="mt-1 text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
            {maxBattlesText}
          </div>
        </div>
        <div className="mt-2.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          {seasonPeriodText}
        </div>
      </div>
    </div>
  )
}
