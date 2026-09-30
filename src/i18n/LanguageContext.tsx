import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Language, TranslationDictionary } from './types'
import { vi } from './locales/vi'
import { en } from './locales/en'

const dictionaries: Record<Language, TranslationDictionary> = {
  vi,
  en,
}

const STORAGE_KEY = 'coc_rank_lang'

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'vi'
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null
    if (saved === 'vi' || saved === 'en') return saved
    // Tự động phát hiện ngôn ngữ trình duyệt nếu chưa từng lưu
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith('vi')) return 'vi'
    return 'en'
  } catch {
    return 'vi'
  }
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  dict: TranslationDictionary
  interpolate: (template: string, params: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  function setLanguage(lang: Language) {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
      document.documentElement.lang = lang
    } catch {
      // Ignore localStorage errors
    }
  }

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function interpolate(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      return params[key] !== undefined ? String(params[key]) : `{${key}}`
    })
  }

  const dict = dictionaries[language]

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dict, interpolate }}>
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useI18n must be used within a LanguageProvider')
  }
  return context
}
