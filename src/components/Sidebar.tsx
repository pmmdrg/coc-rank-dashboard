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
        {/* Brand Header - Concept TH19: Đen, Đỏ, Trắng, Vàng ánh kim */}
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-lg font-black tracking-tight text-white select-none">
            <span className="text-red-500">CoC</span>
            <span>Rank</span>
            <span className="rounded-md bg-gradient-to-r from-amber-500/25 to-amber-600/15 border border-amber-400/50 px-2 py-0.5 text-[10px] font-black tracking-wider text-amber-300 uppercase shadow-[0_0_10px_rgba(245,158,11,0.25)]">
              TH19
            </span>
          </h1>

          {/* Nút đóng trên mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-[#18181b] hover:text-white"
            >
              <X weight="bold" className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* Thẻ tóm tắt người chơi & Ô đổi Player Tag */}
        <div className="rounded-xl border border-amber-500/30 bg-[#0e0e12] p-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={leagueIconUrl || getLeagueIconUrl(league)}
                alt={displayLeague}
                referrerPolicy="no-referrer"
                className="h-9 w-9 shrink-0 object-contain drop-shadow-xs"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-bold text-white">
                  {myPlayerName && myPlayerName !== '--' ? myPlayerName : dict.header.noAccount}
                </span>
                <span className="shrink-0 text-[10px] text-amber-400 font-bold">
                  {displayLeague}
                </span>
              </div>
            </div>
          </div>

          {/* Ô nhập Player Tag đổi nhanh với nút copy bên trong & icon Sync */}
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="group relative flex-1">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold text-amber-400">
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
                className="h-8 w-full rounded-lg border border-amber-500/30 bg-[#141418] pl-5 pr-7 font-mono text-[11px] font-bold tracking-wider text-white placeholder:text-zinc-500 placeholder:font-normal focus:border-amber-400 focus:outline-none"
              />
              {playerTag ? (
                <button
                  type="button"
                  onClick={handleCopyTag}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                  title={dict.header.copyTagTooltip}
                >
                  {isTagCopied ? (
                    <Check className="h-3.5 w-3.5 text-amber-500" />
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
                className="apple-btn inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/60 bg-red-600 text-white hover:bg-red-500 disabled:opacity-40 cursor-pointer shadow-xs transition-colors"
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

        {/* 3 MỤC ĐIỀU HƯỚNG CHÍNH - TINH GỌN, ĐẬM CHẤT TH19 ĐỎ & ĐEN */}
        <nav className="space-y-1" aria-label="Sidebar Navigation">
          <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
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
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'bg-red-600 text-white font-bold shadow-md shadow-red-950/60'
                    : 'text-zinc-200 hover:bg-[#141418] hover:text-white'
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
      <div className="space-y-3 pt-4 border-t border-amber-500/25">
        {/* Nút Chia sẻ thẻ thành tích - Màu Đỏ nổi bật, viền Vàng ánh kim */}
        {onOpenShareCard && (
          <button
            type="button"
            onClick={onOpenShareCard}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-red-600 hover:bg-red-500 py-2 text-xs font-bold text-white shadow-md shadow-red-950/40 transition-colors cursor-pointer select-none"
          >
            <ShareNetwork weight="bold" className="h-3.5 w-3.5 text-white" />
            <span>{dict.header.shareCard}</span>
          </button>
        )}

        {/* Nút Xuất JSON / CSV */}
        <div className="flex items-center gap-1 rounded-lg border border-amber-500/25 bg-[#0e0e12] p-0.5">
          <button
            type="button"
            onClick={() => onExport('json')}
            className="apple-btn flex-1 rounded-md py-1 text-center text-[11px] font-semibold text-white hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
          >
            JSON
          </button>
          <span className="h-3 w-px bg-amber-500/30" />
          <button
            type="button"
            onClick={() => onExport('csv')}
            className="apple-btn flex-1 rounded-md py-1 text-center text-[11px] font-semibold text-white hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
          >
            CSV
          </button>
        </div>

        {/* Nút Ngôn ngữ */}
        <div className="flex items-center justify-between px-1">
          <LanguageSwitcher />
          <span className="text-[10px] text-amber-400 font-mono font-bold">
            v{APP_VERSION}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* 1. DESKTOP SIDEBAR: Cố định bên trái màn hình */}
      <aside className="!fixed inset-y-0 left-0 hidden h-screen w-64 shrink-0 flex-col border-r border-amber-500/25 bg-[#0a0a0d] lg:flex z-30">
        {sidebarContent}
      </aside>

      {/* 2. MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs animate-fade-in"
            onClick={onCloseMobile}
          />
          <aside className="relative flex h-full w-64 flex-col border-r border-amber-500/25 bg-[#0a0a0d] shadow-2xl animate-slide-right">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
