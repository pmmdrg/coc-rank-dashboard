import { useState } from 'react'
import {
  User,
  Trophy,
  Shield,
  Copy,
  Check,
  ArrowsClockwise,
  X,
  ShareNetwork,
} from '@phosphor-icons/react'
import type { AppRoute } from '../types'
import { getLeagueIconUrl } from '../lib/leagueIcons'
import { formatLeagueName } from '../lib/ranking'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useI18n } from '../i18n/LanguageContext'
import { APP_VERSION } from '../version'

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
    },
    {
      id: 'season' as AppRoute,
      icon: Trophy,
      label: dict.navigation.season,
    },
    {
      id: 'clan' as AppRoute,
      icon: Shield,
      label: dict.navigation.clan,
    },
  ]

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto p-4 sm:p-5">
      {/* PHẦN TRÊN: LOGO, TÀI KHOẢN, NAVIGATION */}
      <div className="space-y-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 select-none">
            CoC Rank
          </h1>

          {/* Nút đóng trên mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X weight="bold" className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* Thẻ tóm tắt người chơi & Ô đổi Player Tag */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <img
              src={leagueIconUrl || getLeagueIconUrl(league)}
              alt={displayLeague}
              referrerPolicy="no-referrer"
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {myPlayerName && myPlayerName !== '--' ? myPlayerName : dict.header.noAccount}
                </span>
                <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                  {displayLeague}
                </span>
              </div>
            </div>
          </div>

          {/* Ô nhập Player Tag đổi nhanh với nút copy bên trong & icon Sync */}
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="group relative flex-1">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold text-slate-400 group-focus-within:text-sky-500">
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
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-5 pr-7 font-mono text-[11px] font-semibold tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
              />
              {playerTag ? (
                <button
                  type="button"
                  onClick={handleCopyTag}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  title={dict.header.copyTagTooltip}
                >
                  {isTagCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : null}
            </div>
            {onSyncCocApi && (
              <button
                type="button"
                disabled={isSyncingApi || playerTag.trim().length < 3}
                onClick={() => onSyncCocApi(playerTag)}
                className="apple-btn inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title={dict.header.syncApi}
              >
                <ArrowsClockwise
                  weight="bold"
                  className={`h-3.5 w-3.5 ${isSyncingApi ? 'animate-spin' : ''}`}
                />
              </button>
            )}
          </div>
        </div>

        {/* 3 MỤC ĐIỀU HƯỚNG CHÍNH - TINH GỌN, KHÔNG DÒNG PHỤ THỪA */}
        <nav className="space-y-1" aria-label="Sidebar Navigation">
          <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                }`}
              >
                <Icon
                  weight={isActive ? 'fill' : 'regular'}
                  className="h-4 w-4 shrink-0"
                />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* PHẦN DƯỚI: NÚT CHIA SẺ, XUẤT FILE, CÀI ĐẶT */}
      <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        {/* Nút Chia sẻ thẻ thành tích - Thanh lịch, không lòe loẹt */}
        {onOpenShareCard && (
          <button
            type="button"
            onClick={onOpenShareCard}
            className="apple-btn flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer select-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ShareNetwork weight="bold" className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>{dict.header.shareCard}</span>
          </button>
        )}

        {/* Nút Xuất JSON / CSV */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50/60 p-0.5 dark:border-slate-800 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => onExport('json')}
            className="apple-btn flex-1 rounded-md py-1 text-center text-[11px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            JSON
          </button>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={() => onExport('csv')}
            className="apple-btn flex-1 rounded-md py-1 text-center text-[11px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
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
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            v{APP_VERSION}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* 1. DESKTOP SIDEBAR: Cố định bên trái màn hình */}
      <aside className="!fixed inset-y-0 left-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/90 backdrop-blur-md lg:flex dark:border-slate-800/80 dark:bg-slate-950/90 z-30">
        {sidebarContent}
      </aside>

      {/* 2. MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs animate-fade-in"
            onClick={onCloseMobile}
          />
          <aside className="relative flex h-full w-64 flex-col border-r border-slate-200 bg-white shadow-xl animate-slide-right dark:border-slate-800 dark:bg-slate-950">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
