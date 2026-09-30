import { useState } from 'react'
import { Moon, Sun } from '@phosphor-icons/react'
import { useI18n } from '../i18n/LanguageContext'

type Theme = 'light' | 'dark'

export function ThemeToggle() {
  const { dict } = useI18n()
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  })

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    document.documentElement.classList.toggle('light', nextTheme === 'light')
    try {
      localStorage.setItem('coc_rank_theme', nextTheme)
    } catch {
      // Ignore localStorage errors
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="apple-btn inline-flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-slate-300/70 bg-white/70 text-slate-700 shadow-2xs backdrop-blur-md transition-all hover:bg-white hover:shadow-xs dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700/80 cursor-pointer select-none"
      title={theme === 'dark' ? dict.header.themeToggleLight : dict.header.themeToggleDark}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun weight="duotone" className="h-4.5 w-4.5 text-amber-400 transition-transform duration-300 hover:rotate-45" aria-hidden="true" />
      ) : (
        <Moon weight="duotone" className="h-4.5 w-4.5 text-indigo-500 transition-transform duration-300 hover:-rotate-12" aria-hidden="true" />
      )}
    </button>
  )
}
