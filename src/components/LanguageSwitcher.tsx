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
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-slate-300/60 bg-white/60 px-2.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur transition-all hover:bg-white active:scale-95 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer select-none"
      title={`${dict.header.langToggle}: ${nextLanguageName}`}
      aria-label="Toggle language"
    >
      <Globe weight="duotone" className="h-4 w-4 text-sky-500 dark:text-sky-400 shrink-0" />
      <span className="font-mono tracking-wider font-extrabold text-[11px]">
        {language === 'vi' ? 'VIE' : 'ENG'}
      </span>
    </button>
  )
}
