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
    <button
      type="button"
      onClick={onToggle}
      className={`liquid-collapse-btn group shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-[13px] font-bold rounded-full select-none cursor-pointer transition-all active:scale-97 ${className}`}
      aria-expanded={!isCollapsed}
      aria-label={ariaLabel || (isCollapsed ? dict.performanceTrend.expand : dict.performanceTrend.collapse)}
    >
      <span>
        {isCollapsed ? dict.performanceTrend.expand : dict.performanceTrend.collapse}
      </span>
      <CaretDown
        weight="bold"
        className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out ${
          !isCollapsed ? 'rotate-180' : ''
        }`}
      />
    </button>
  )
}
