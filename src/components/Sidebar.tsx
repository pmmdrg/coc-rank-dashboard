import { useState } from 'react'
import {
  User,
  Trophy,
  Shield,
  Sparkle,
  Copy,
  Check,
  CircleNotch,
  X,
  Crown,
} from '@phosphor-icons/react'
import type { AppRoute } from '../types'
import { getLeagueIconUrl } from '../lib/leagueIcons'
import { formatLeagueName } from '../lib/ranking'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useI18n } from '../i18n/LanguageContext'

export interface SidebarProps {
  currentRoute: AppRoute
  onNavigate: (route: AppRoute) => void
  myPlayerName: string
  playerTag: string
  onPlayerTagChange: (tag: string) => void
  league: string
  leagueIconUrl?: string
  isSyncingApi?: boolean
  onSyncCocApi?: (tag?: string) => void
  onExport: (format: 'json' | 'csv') => void
  onOpenShareCard?: () => void
  clanMembersCount?: number
  seasonPlayersCount?: number
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({
  currentRoute,
  onNavigate,
  myPlayerName,
  playerTag,
  onPlayerTagChange,
  league,
  leagueIconUrl,
  isSyncingApi = false,
  onSyncCocApi,
  onExport,
  onOpenShareCard,
  clanMembersCount,
  seasonPlayersCount = 100,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { dict } = useI18n()
  const [isTagCopied, setIsTagCopied] = useState(false)
  const displayLeague = formatLeagueName(league)

  function handleCopyTag() {
    if (!playerTag) return
    const formatted = playerTag.startsWith('#') ? playerTag : `#${playerTag}`
    navigator.clipboard.writeText(formatted)
    setIsTagCopied(true)
    setTimeout(() => setIsTagCopied(false), 1500)
  }

  function handleSelectNav(route: AppRoute) {
    onNavigate(route)
    if (onCloseMobile) onCloseMobile()
  }

  const navItems = [
    {
      id: 'personal' as AppRoute,
      icon: User,
      label: dict.navigation.personal,
      desc: dict.navigation.personalDesc,
      badge: null,
    },
    {
      id: 'season' as AppRoute,
      icon: Trophy,
      label: dict.navigation.season,
      desc: dict.navigation.seasonDesc,
      badge: seasonPlayersCount > 0 ? `${seasonPlayersCount}` : null,
    },
    {
      id: 'clan' as AppRoute,
      icon: Shield,
      label: dict.navigation.clan,
      desc: dict.navigation.clanDesc,
      badge: typeof clanMembersCount === 'number' && clanMembersCount > 0 ? `${clanMembersCount}` : null,
    },
  ]

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto p-4 sm:p-5">
      {/* PHẦN TRÊN: LOGO, TÀI KHOẢN, NAVIGATION */}
      <div className="space-y-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25">
              <Crown weight="fill" className="h-5 w-5" />
            </div>
            <div>
              <h1 className="aurora-text text-lg font-black tracking-tight select-none">
                CoC Rank
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {dict.header.badge}
              </span>
            </div>
          </div>

          {/* Nút đóng trên mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X weight="bold" className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Thẻ tóm tắt người chơi & Ô đổi Player Tag */}
        <div className="rounded-xl border border-slate-200/80 bg-white/70 p-3 shadow-2xs backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <img
              src={leagueIconUrl || getLeagueIconUrl(league)}
              alt={displayLeague}
              referrerPolicy="no-referrer"
              className="h-10 w-10 shrink-0 object-contain drop-shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                  {myPlayerName && myPlayerName !== '--' ? myPlayerName : dict.header.noAccount}
                </span>
                <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {displayLeague}
                </span>
              </div>

              {playerTag ? (
                <div className="mt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleCopyTag}
                    className="group inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                    title={dict.header.copyTagTooltip}
                  >
                    <span>{playerTag.startsWith('#') ? playerTag : `#${playerTag}`}</span>
                    {isTagCopied ? (
                      <Check className="h-3 w-3 text-emerald-600 animate-bounce" />
                    ) : (
                      <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Ô nhập Player Tag đổi nhanh */}
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="group relative flex-1">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[11px] font-black text-slate-400 group-focus-within:text-sky-500">
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
                placeholder={dict.header.tagPlaceholder}
                className="h-7.5 w-full rounded-lg border border-slate-300/80 bg-white/90 pl-5 pr-2 font-mono text-[11px] font-black tracking-wider text-slate-950 placeholder:text-slate-400 placeholder:font-normal focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/90 dark:text-white"
              />
            </div>
            {onSyncCocApi && (
              <button
                type="button"
                disabled={isSyncingApi || playerTag.trim().length < 3}
                onClick={() => onSyncCocApi(playerTag)}
                className="apple-btn inline-flex h-7.5 items-center justify-center rounded-lg bg-sky-600 px-2.5 text-[11px] font-bold text-white shadow-2xs hover:bg-sky-500 disabled:opacity-50 cursor-pointer"
                title={dict.header.syncApi}
              >
                {isSyncingApi ? (
                  <CircleNotch weight="bold" className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>Sync</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 3 MỤC ĐIỀU HƯỚNG CHÍNH (NAVIGATION ITEMS) */}
        <nav className="space-y-1.5" aria-label="Sidebar Navigation">
          <div className="px-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {dict.navigation.menu}
          </div>

          {navItems.map((item) => {
            const isActive = currentRoute === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all cursor-pointer select-none ${
                  isActive
                    ? 'border border-sky-500/30 bg-gradient-to-r from-sky-500/15 to-indigo-500/15 text-sky-950 shadow-xs dark:border-sky-400/30 dark:from-sky-500/20 dark:to-indigo-500/20 dark:text-white'
                    : 'border border-transparent text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-xs shadow-sky-500/30'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700'
                    }`}
                  >
                    <Icon weight={isActive ? 'fill' : 'bold'} className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{item.label}</div>
                    <div className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                      {item.desc}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-sky-600 text-white dark:bg-sky-500'
                        : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* PHẦN DƯỚI: NÚT CHIA SẺ, XUẤT FILE, CÀI ĐẶT */}
      <div className="space-y-3 pt-5 border-t border-slate-200/80 dark:border-slate-800/80">
        {/* Nút Chia sẻ thẻ thành tích */}
        {onOpenShareCard && (
          <button
            type="button"
            onClick={onOpenShareCard}
            className="apple-btn flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-xs shadow-sky-500/25 hover:shadow-md hover:shadow-sky-500/35 hover:brightness-105 active:scale-98 transition-all cursor-pointer select-none"
          >
            <Sparkle weight="fill" className="h-4 w-4" />
            <span>{dict.header.shareCard}</span>
          </button>
        )}

        {/* Nút Xuất JSON / CSV */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/70 p-1 dark:border-slate-800/80 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => onExport('json')}
            className="apple-btn flex-1 rounded-lg py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-all cursor-pointer"
          >
            JSON
          </button>
          <span className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
          <button
            type="button"
            onClick={() => onExport('csv')}
            className="apple-btn flex-1 rounded-lg py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-all cursor-pointer"
          >
            CSV
          </button>
        </div>

        {/* Nút Ngôn ngữ & Theme */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            v1.0 • CoC Fan Tool
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* 1. DESKTOP SIDEBAR: Cố định bên trái màn hình */}
      <aside className="glass-panel sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200/80 backdrop-blur-xl lg:flex dark:border-slate-800/80 z-30">
        {sidebarContent}
      </aside>

      {/* 2. MOBILE DRAWER: Thanh trượt xuất hiện khi mở trên điện thoại */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop tối mờ */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={onCloseMobile}
          />
          {/* Panel trượt */}
          <aside className="glass-panel relative flex h-full w-72 flex-col border-r border-slate-200/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl shadow-2xl animate-slide-right">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
