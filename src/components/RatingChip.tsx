import type { RatingCategory } from '../types'
import { useI18n } from '../i18n/LanguageContext'

export interface RatingChipProps {
  rating: RatingCategory
  className?: string
}

export function RatingChip({ rating, className = '' }: RatingChipProps) {
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
      <span className="truncate">{label}</span>
    </div>
  )
}
