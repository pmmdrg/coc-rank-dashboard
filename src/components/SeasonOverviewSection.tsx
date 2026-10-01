import { useState } from 'react'
import { CaretDown } from '@phosphor-icons/react'
import type { Season } from '../types'
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
      {/* Header Thẻ lớn: Tổng quan mùa giải - Tinh gọn, không icon ở tiêu đề, không lặp lại thông tin */}
      <div
        className={`flex items-center justify-between gap-3 p-4 sm:p-5 transition-all duration-300 ${
          !isCollapsed ? 'border-b border-slate-200/60 dark:border-slate-800/60' : ''
        }`}
      >
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {dict.seasonMeta.seasonOverviewTitle}
        </h2>

        {/* Nút thu gọn / mở rộng toàn bộ Thẻ lớn */}
        <button
          type="button"
          onClick={handleToggleCollapse}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer shadow-2xs select-none"
          aria-expanded={!isCollapsed}
        >
          <span>{isCollapsed ? dict.performanceTrend.expand : dict.performanceTrend.collapse}</span>
          <CaretDown
            weight="bold"
            className={`h-3.5 w-3.5 transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Body Thẻ lớn với animation collapsible-grid */}
      <div className={`collapsible-grid ${!isCollapsed ? 'is-expanded' : ''}`}>
        <div className="collapsible-inner">
          <div className="p-4 sm:p-5 space-y-6">
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

            {/* Phân mục 2: Phân tích phân bổ mùa giải */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {dict.charts.distributionTitle}
                </h3>

                {/* Nút thu gọn / mở rộng riêng cho khối Phân tích phân bổ */}
                <button
                  type="button"
                  onClick={handleToggleChartsCollapse}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer shadow-2xs select-none"
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
