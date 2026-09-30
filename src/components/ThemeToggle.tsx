import { useState } from 'react'
import { Moon, Sun } from '@phosphor-icons/react'

type Theme = 'light' | 'dark'

export function ThemeToggle() {
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300/60 bg-white/60 text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
      title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun weight="duotone" className="h-4.5 w-4.5 text-amber-400" aria-hidden="true" />
      ) : (
        <Moon weight="duotone" className="h-4.5 w-4.5 text-indigo-600" aria-hidden="true" />
      )}
    </button>
  )
}
