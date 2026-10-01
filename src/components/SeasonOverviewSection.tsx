import { useState } from 'react'
import type { Season } from '../types'
import { useI18n } from '../i18n/LanguageContext'
import { SeasonMetaForm } from './SeasonMetaForm'
import { ChartsSection, type ChartDataItem } from './ChartsSection'
import { CollapseToggleButton } from './CollapseToggleButton'

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

  return (
    <section className="glass-panel rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
      {/* Header Thẻ lớn: Tổng quan mùa giải - Tinh gọn, không icon ở tiêu đề, không lặp lại thông tin */}
      <div
        className={`flex items-center justify-between gap-3 p-4 sm:p-5 transition-all duration-300 ${
          !isCollapsed ? 'border-b border-slate-200/60 dark:border-slate-800/60' : ''
        }`}
      >
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
          {dict.seasonMeta.seasonOverviewTitle}
        </h2>

        {/* Nút thu gọn / mở rộng toàn bộ Thẻ lớn đồng bộ style với filter */}
        <CollapseToggleButton
          isCollapsed={isCollapsed}
          onToggle={handleToggleCollapse}
          ariaLabel={dict.seasonMeta.seasonOverviewTitle}
        />
      </div>

      {/* Body Thẻ lớn với animation collapsible-grid */}
      <div className={`collapsible-grid ${!isCollapsed ? 'is-expanded' : ''}`}>
        <div className="collapsible-inner">
          <div className="p-4 sm:p-5 space-y-6">
            {/* Phân mục 1: Thông tin & Quy tắc mùa giải */}
            <div className="relative z-20">
              <SeasonMetaForm
                season={season}
                seasons={seasons}
                activeSeasonIndex={activeSeasonIndex}
                onSelectSeasonIndex={onSelectSeasonIndex}
                onUpdateSeasonMeta={onUpdateSeasonMeta}
                isSyncingApi={isSyncingApi}
                embedded={true}
              />
            </div>

            {/* Đường phân cách giữa 2 khối thông tin */}
            <div className="border-t border-slate-200/60 dark:border-slate-800/60" />

            {/* Phân mục 2: Biểu đồ phân bổ mùa giải */}
            <div className="relative z-10">
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
    </section>
  )
}
