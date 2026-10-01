import { CaretDown } from '@phosphor-icons/react'
import { useI18n } from '../i18n/LanguageContext'

export interface CollapseToggleButtonProps {
  isCollapsed: boolean
  onToggle: () => void
  ariaLabel?: string
  className?: string
}

export function CollapseToggleButton({
  isCollapsed,
  onToggle,
  ariaLabel,
  className = '',
}: CollapseToggleButtonProps) {
  const { dict } = useI18n()

  return (
    <div className={`apple-segmented-container shrink-0 ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className="apple-segmented-item is-active flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        aria-expanded={!isCollapsed}
        aria-label={ariaLabel || (isCollapsed ? dict.performanceTrend.expand : dict.performanceTrend.collapse)}
      >
        <span className="font-semibold">
          {isCollapsed ? dict.performanceTrend.expand : dict.performanceTrend.collapse}
        </span>
        <CaretDown
          weight="bold"
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out ${
            !isCollapsed ? 'rotate-180' : ''
          }`}
        />
      </button>
    </div>
  )
}
