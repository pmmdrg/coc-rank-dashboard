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
    <section className="glass-panel rounded-xl shadow-xs overflow-hidden border border-slate-200/80 dark:border-slate-800/80 transition-all duration-200">
      {/* Header: Tinh gọn */}
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 transition-colors ${
          !isCollapsed ? 'border-b border-slate-200/60 dark:border-slate-800/60' : ''
        }`}
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {dict.seasonMeta.seasonOverviewTitle}
        </h2>

        <CollapseToggleButton
          isCollapsed={isCollapsed}
          onToggle={handleToggleCollapse}
          ariaLabel={dict.seasonMeta.seasonOverviewTitle}
        />
      </div>

      {/* Body Thẻ lớn */}
      <div className={`collapsible-grid ${!isCollapsed ? 'is-expanded' : ''}`}>
        <div className="collapsible-inner">
          <div className="p-4 sm:p-5 space-y-4">
            {/* Phân mục 1: Thông tin mùa giải */}
            <SeasonMetaForm
              season={season}
              seasons={seasons}
              activeSeasonIndex={activeSeasonIndex}
              onSelectSeasonIndex={onSelectSeasonIndex}
              onUpdateSeasonMeta={onUpdateSeasonMeta}
              isSyncingApi={isSyncingApi}
              embedded={true}
            />

            {/* Phân mục 2: Biểu đồ phân bổ */}
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
    </section>
  )
}
