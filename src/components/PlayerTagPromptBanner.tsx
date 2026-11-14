import { useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { useI18n } from '../i18n/LanguageContext'

interface PlayerTagPromptBannerProps {
  playerTag: string
  isSyncingApi: boolean
  onSync: (tag: string) => void
}

export function PlayerTagPromptBanner({
  playerTag,
  isSyncingApi,
  onSync,
}: PlayerTagPromptBannerProps) {
  const { dict } = useI18n()
  const [inputVal, setInputVal] = useState(playerTag)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = inputVal.replace(/^#/, '').trim().toUpperCase()
    if (clean) {
      onSync(clean)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-red-600/60 bg-gradient-to-r from-red-600/15 via-red-950/20 to-amber-500/10 p-5 sm:p-6 shadow-xl shadow-red-950/20 backdrop-blur animate-fade-in dark:border-red-500/50 dark:from-red-950/60 dark:via-zinc-950/80 dark:to-amber-950/30">
      {/* Background ambient decorative glow - TH19 Đỏ & Vàng */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-red-600/20 blur-3xl dark:bg-red-600/25" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-amber-500/15 blur-3xl dark:bg-amber-500/20" />

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-red-500/20 px-3 py-1 text-xs font-extrabold text-red-600 dark:bg-red-500/20 dark:text-red-300 ring-1 ring-red-500/40">
              {dict.banner.badge}
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {dict.banner.status}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            {dict.banner.title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
            {dict.banner.description}
          </p>
        </div>

        {/* Input box & Button nổi bật */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="group relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 text-base font-black text-amber-500 transition-colors">
              #
            </span>
            <input
              type="text"
              value={inputVal.replace(/^#/, '')}
              onChange={(e) => setInputVal(e.target.value.toUpperCase().trim())}
              placeholder={dict.banner.inputPlaceholder}
              className="h-12 w-full sm:w-56 rounded-xl border-2 border-red-500/70 bg-white pl-8 pr-3 text-sm font-mono font-black tracking-wider text-zinc-950 placeholder:text-zinc-400 placeholder:font-normal caret-red-600 shadow-inner transition-all focus:border-red-600 focus:bg-white focus:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-red-500/25 dark:border-red-500/60 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:caret-white dark:focus:bg-zinc-900 dark:focus:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={!inputVal.trim() || isSyncingApi}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-6 text-sm font-black text-white shadow-lg shadow-red-950/40 transition-all hover:scale-[1.02] hover:from-red-500 hover:to-rose-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {isSyncingApi ? (
              <span className="inline-flex items-center gap-2">
                <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
                <span>{dict.banner.loadingBtn}</span>
              </span>
            ) : (
              <span>{dict.banner.submitBtn}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
