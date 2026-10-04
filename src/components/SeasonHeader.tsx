import { useState } from 'react'
import { CircleNotch, Sparkle, Copy, Check, Trophy, Shield } from '@phosphor-icons/react'
import type { AppRoute } from '../types'
import { formatLeagueName } from '../lib/ranking'
import { getLeagueIconUrl } from '../lib/leagueIcons'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useI18n } from '../i18n/LanguageContext'

interface SeasonHeaderProps {
  league: string
  leagueIconUrl?: string
  myPlayerName: string
  playerTag: string
  onPlayerTagChange: (tag: string) => void
  isSyncingApi?: boolean
  onSyncCocApi?: (tag?: string) => void
  onExport: (format: 'json' | 'csv') => void
  onOpenShareCard?: () => void
  currentRoute?: AppRoute
  onNavigate?: (route: AppRoute) => void
  clanMembersCount?: number
}

export function SeasonHeader({
  league,
  leagueIconUrl,
  myPlayerName,
  playerTag,
  onPlayerTagChange,
  isSyncingApi = false,
  onSyncCocApi,
  onExport,
  onOpenShareCard,
  currentRoute = 'personal',
  onNavigate,
  clanMembersCount,
}: SeasonHeaderProps) {
  const { dict } = useI18n()
  const [isTagCopied, setIsTagCopied] = useState(false)
  const displayLeague = formatLeagueName(league)

  function handleCopyMyTag() {
    if (!playerTag) return
    const formatted = playerTag.startsWith('#') ? playerTag : `#${playerTag}`
    navigator.clipboard.writeText(formatted)
    setIsTagCopied(true)
    setTimeout(() => setIsTagCopied(false), 1500)
  }

  return (
    <header className="glass-header sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="aurora-text text-2xl font-black tracking-tight sm:text-3xl select-none">
              CoC Rank Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-300 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {dict.header.badge}
            </span>
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {myPlayerName && myPlayerName !== '--' ? myPlayerName : dict.header.noAccount}
            </span>

            {playerTag ? (
              <button
                type="button"
                onClick={handleCopyMyTag}
                className="group inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 hover:bg-emerald-500/20 active:scale-95 transition-all dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20 cursor-pointer shadow-2xs"
                title={dict.header.copyTagTooltip}
              >
                <span>{playerTag.startsWith('#') ? playerTag : `#${playerTag}`}</span>
                {isTagCopied ? (
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                ) : (
                  <Copy className="h-3 w-3 text-emerald-600/70 dark:text-emerald-400/70 opacity-60 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            ) : null}

            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>

            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
              {league && league !== '--' ? (
                <>
                  <img
                    src={leagueIconUrl || getLeagueIconUrl(league)}
                    alt={displayLeague}
                    referrerPolicy="no-referrer"
                    className="h-5 w-5 shrink-0 object-contain drop-shadow-md"
                  />
                  <span>{displayLeague}</span>
                </>
              ) : (
                <span>{dict.seasonMeta.league}: --</span>
              )}
            </span>
          </p>
        </div>

        {/* Thanh Điều Hướng (Navigation Tabs: Dashboard vs Clan) */}
        {onNavigate && (
          <nav className="inline-flex items-center rounded-xl border border-slate-300/80 bg-white/70 p-1 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 self-start lg:self-center">
            <button
              type="button"
              onClick={() => onNavigate('personal')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'personal'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <Trophy weight={currentRoute === 'personal' ? 'fill' : 'bold'} className="h-4 w-4" />
              <span>{dict.clan.navDashboard}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('clan')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'clan'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <Shield weight={currentRoute === 'clan' ? 'fill' : 'bold'} className="h-4 w-4" />
              <span>{dict.clan.navClan}</span>
              {typeof clanMembersCount === 'number' && clanMembersCount > 0 ? (
                <span
                  className={`inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold ${
                    currentRoute === 'clan'
                      ? 'bg-white/25 text-white'
                      : 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300'
                  }`}
                >
                  {clanMembersCount}
                </span>
              ) : null}
            </button>
          </nav>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* Ô nhập Player Tag - Apple Spotlight style */}
          <div
            className={`group relative inline-flex h-9.5 items-center rounded-xl border p-0.5 shadow-2xs backdrop-blur-md transition-all ${
              !playerTag
                ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/70 shadow-md shadow-emerald-500/25 animate-pulse dark:border-emerald-400 dark:ring-emerald-400/80'
                : 'border-slate-300/70 bg-white/70 dark:border-white/10 dark:bg-slate-900/60 focus-within:border-sky-500 dark:focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-500/20'
            }`}
          >
            <span className="pointer-events-none absolute left-2.5 font-mono text-xs font-black text-slate-400 transition-colors group-focus-within:text-emerald-500 dark:text-slate-500 dark:group-focus-within:text-emerald-400">
              #
            </span>
            <input
              type="text"
              value={playerTag.replace(/^#/, '')}
              onChange={(e) => onPlayerTagChange(e.target.value.toUpperCase().trim())}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onSyncCocApi) {
                  onSyncCocApi(playerTag)
                }
              }}
              onBlur={() => {
                if (playerTag.trim().length >= 3 && onSyncCocApi) {
                  onSyncCocApi(playerTag)
                }
              }}
              placeholder={dict.header.tagPlaceholder}
              title={dict.header.syncApi}
              className="h-7.5 w-28 sm:w-32 rounded-lg bg-white/90 pl-5 pr-7 font-mono text-xs font-black tracking-wider text-slate-950 placeholder:text-slate-400 placeholder:font-normal caret-slate-950 transition-all focus:outline-none dark:bg-slate-900/90 dark:text-white dark:placeholder:text-slate-500 dark:caret-white"
            />
            {isSyncingApi && (
              <span className="pointer-events-none absolute right-2 text-emerald-600 dark:text-emerald-400" title={dict.header.syncing}>
                <CircleNotch weight="bold" className="h-3.5 w-3.5 animate-spin" />
              </span>
            )}
          </div>

          {/* Nút Chia sẻ thẻ thành tích (Apple Hero Pill Action) */}
          {onOpenShareCard && (
            <button
              type="button"
              onClick={onOpenShareCard}
              className="apple-btn inline-flex h-9.5 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-500 px-3.5 text-xs font-bold text-white shadow-xs shadow-sky-500/25 hover:shadow-md hover:shadow-sky-500/35 hover:brightness-105 transition-all cursor-pointer select-none"
              title={dict.header.shareCard}
            >
              <Sparkle weight="fill" className="h-3.5 w-3.5" />
              <span>{dict.header.shareCard}</span>
            </button>
          )}

          {/* Các nút Xuất file (Apple Segmented Style) */}
          <div className="inline-flex h-9.5 items-center rounded-xl border border-slate-300/70 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 p-0.5 shadow-2xs backdrop-blur-md">
            <button
              type="button"
              onClick={() => onExport('json')}
              className="apple-btn h-8 rounded-lg px-2.5 text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-xs dark:text-slate-200 dark:hover:bg-slate-700/80 transition-all cursor-pointer"
              title={dict.header.exportJson}
            >
              JSON
            </button>
            <span className="h-3.5 w-px bg-slate-300/80 dark:bg-white/10" />
            <button
              type="button"
              onClick={() => onExport('csv')}
              className="apple-btn h-8 rounded-lg px-2.5 text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-xs dark:text-slate-200 dark:hover:bg-slate-700/80 transition-all cursor-pointer"
              title={dict.header.exportCsv}
            >
              CSV
            </button>
          </div>

          {/* Nút Đa Ngôn Ngữ & Nút đổi theme */}
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
