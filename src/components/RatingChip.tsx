import type { RatingCategory } from '../types'
import { useI18n } from '../i18n/LanguageContext'

export interface RatingChipProps {
  rating: RatingCategory
  className?: string
  showDot?: boolean
}

export function RatingChip({ rating, className = '', showDot = true }: RatingChipProps) {
  const { dict } = useI18n()

  const ratingLabelsMap: Record<RatingCategory, string> = {
    dominant: dict.charts.ratingDominant,
    superior: dict.charts.ratingSuperior,
    potential: dict.charts.ratingPotential,
    alarm: dict.charts.ratingAlarm,
  }

  const label = ratingLabelsMap[rating] || rating

  return (
    <div
      className={`liquid-rating-chip liquid-rating-chip-${rating} ${className}`}
      title={`${dict.common.rating}: ${label}`}
    >
      {showDot && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-90 shadow-[0_0_6px_currentColor]" />
      )}
      <span className="truncate">{label}</span>
    </div>
  )
}
