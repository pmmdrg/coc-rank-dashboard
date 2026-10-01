import { useState } from 'react'
import { Trophy, ChartPieSlice, CaretDown } from '@phosphor-icons/react'
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

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('coc_season_overview_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const [isChartsCollapsed, setIsChartsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('coc_charts_distribution_collapsed') === 'true'
    } catch {
      return false
    }
  })

  function handleToggleCollapse() {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('coc_season_overview_collapsed', String(next))
      } catch {
        // Ignore localStorage errors
      }
      return next
    })
  }

  function handleToggleChartsCollapse() {
    setIsChartsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('coc_charts_distribution_collapsed', String(next))
      } catch {
        // Ignore localStorage errors
      }
      return next
    })
  }

  return (
    <section className="glass-panel rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
      {/* Header Thẻ lớn: Tổng quan mùa giải */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6 transition-all duration-300 ${
          !isCollapsed ? 'border-b border-slate-200/60 dark:border-slate-800/60' : ''
        }`}
      >
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {season.lastSyncedAt && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mr-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                {dict.seasonMeta.apiPrefix} {season.lastSyncedAt}
              </span>
            </div>
          )}

          {/* Nút thu gọn / mở rộng toàn bộ Thẻ lớn */}
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer shadow-2xs select-none"
            aria-expanded={!isCollapsed}
          >
            <span>{isCollapsed ? dict.performanceTrend.expand : dict.performanceTrend.collapse}</span>
            <CaretDown
              weight="bold"
              className={`h-3.5 w-3.5 transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Body Thẻ lớn với animation collapsible-grid */}
      <div className={`collapsible-grid ${!isCollapsed ? 'is-expanded' : ''}`}>
        <div className="collapsible-inner">
          <div className="p-5 sm:p-6 space-y-6">
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
              <div className="flex items-center justify-between gap-3">
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

                {/* Nút thu gọn / mở rộng riêng cho khối Phân tích phân bổ */}
                <button
                  type="button"
                  onClick={handleToggleChartsCollapse}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer shadow-2xs select-none"
                  aria-expanded={!isChartsCollapsed}
                >
                  <span>{isChartsCollapsed ? dict.performanceTrend.expand : dict.performanceTrend.collapse}</span>
                  <CaretDown
                    weight="bold"
                    className={`h-3 w-3 transition-transform duration-300 ${!isChartsCollapsed ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              {/* Lưới 3 biểu đồ con với animation collapsible-grid */}
              <div className={`collapsible-grid ${!isChartsCollapsed ? 'is-expanded' : ''}`}>
                <div className="collapsible-inner">
                  <ChartsSection
                    comparisonData={comparisonData}
                    attackStatusData={attackStatusData}
                    ratingData={ratingData}
                    myPlayerName={myPlayerName}
                    isSyncingApi={isSyncingApi}
                    embedded={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
