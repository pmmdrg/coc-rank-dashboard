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
    <section className="glass-panel rounded-xl shadow-xs overflow-hidden border border-amber-500/25 border-t-2 border-t-[#8f1717] transition-all duration-200">
      {/* Header: Tinh gọn */}
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 bg-gradient-to-r from-[#200708] via-[#140708] to-[#0e0708] transition-colors ${
          !isCollapsed ? 'border-b border-red-900/40' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="h-3 w-1 rounded-full bg-[#8f1717]" />
          <h2 className="text-xs font-black uppercase tracking-wider text-white">
            {dict.seasonMeta.seasonOverviewTitle}
          </h2>
        </div>

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
