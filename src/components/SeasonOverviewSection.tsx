import { Trophy, ChartPieSlice } from '@phosphor-icons/react'
import type { Season } from '../types'
import { formatLeagueName } from '../lib/ranking'
import { useI18n } from '../i18n/LanguageContext'
import { SeasonMetaForm } from './SeasonMetaForm'
import { ChartsSection, type ChartDataItem } from './ChartsSection'

export interface SeasonOverviewSectionProps {
  season: Season
  seasons: Season[]
  activeSeasonIndex: number
  onSelectSeasonIndex: (index: number) => void
  onUpdateSeasonMeta?: (field: keyof Season, value: string | number) => void
  comparisonData: ChartDataItem[]
  attackStatusData: ChartDataItem[]
  ratingData: ChartDataItem[]
  myPlayerName: string
  isSyncingApi?: boolean
}

export function SeasonOverviewSection({
  season,
  seasons,
  activeSeasonIndex,
  onSelectSeasonIndex,
  onUpdateSeasonMeta,
  comparisonData,
  attackStatusData,
  ratingData,
  myPlayerName,
  isSyncingApi = false,
}: SeasonOverviewSectionProps) {
  const { dict } = useI18n()

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden space-y-6">
      {/* Header Thẻ lớn: Tổng quan mùa giải */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300 shadow-2xs">
            <Trophy weight="duotone" className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {dict.seasonMeta.seasonOverviewTitle}
              </h2>
              {season.league && season.league !== '--' && (
                <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300 shadow-2xs">
                  {formatLeagueName(season.league)}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {dict.seasonMeta.seasonOverviewSubtitle}
            </p>
          </div>
        </div>

        {season.lastSyncedAt && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              {dict.seasonMeta.apiPrefix} {season.lastSyncedAt}
            </span>
          </div>
        )}
      </div>

      {/* Phân mục 1: Thông tin & Quy tắc mùa giải */}
      <SeasonMetaForm
        season={season}
        seasons={seasons}
        activeSeasonIndex={activeSeasonIndex}
        onSelectSeasonIndex={onSelectSeasonIndex}
        onUpdateSeasonMeta={onUpdateSeasonMeta}
        isSyncingApi={isSyncingApi}
        embedded={true}
      />

      {/* Đường phân cách giữa 2 khối thông tin */}
      <div className="border-t border-slate-200/60 dark:border-slate-800/60" />

      {/* Phân mục 2: Thẻ lớn Phân tích phân bổ mùa giải */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:bg-teal-400/15 dark:text-teal-300 shadow-2xs">
              <ChartPieSlice weight="duotone" className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {dict.charts.distributionTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {dict.charts.distributionSubtitle}
              </p>
            </div>
          </div>
        </div>

        <ChartsSection
          comparisonData={comparisonData}
          attackStatusData={attackStatusData}
          ratingData={ratingData}
          myPlayerName={myPlayerName}
          isSyncingApi={isSyncingApi}
          embedded={true}
        />
      </div>
    </section>
  )
}
