import { Globe } from '@phosphor-icons/react'
import { useI18n } from '../i18n/LanguageContext'

export function LanguageSwitcher() {
  const { language, setLanguage, dict } = useI18n()

  function handleToggle() {
    setLanguage(language === 'vi' ? 'en' : 'vi')
  }

  const nextLanguageName = language === 'vi' ? 'English (ENG)' : 'Tiếng Việt (VIE)'

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="apple-btn inline-flex h-9.5 items-center justify-center gap-1.5 rounded-xl border border-slate-300/70 bg-white/70 px-2.5 text-xs font-bold text-slate-700 shadow-2xs backdrop-blur-md transition-all hover:bg-white hover:shadow-xs dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700/80 cursor-pointer select-none"
      title={`${dict.header.langToggle}: ${nextLanguageName}`}
      aria-label="Toggle language"
    >
      <Globe weight="duotone" className="h-4 w-4 text-sky-500 dark:text-sky-400 shrink-0 transition-transform duration-300 hover:rotate-180" />
      <span className="font-mono tracking-wider font-extrabold text-[11px]">
        {language === 'vi' ? 'VIE' : 'ENG'}
      </span>
    </button>
  )
}
