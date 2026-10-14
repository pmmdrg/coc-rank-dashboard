import {
  List,
  User,
  Trophy,
  Shield,
  CircleNotch,
} from '@phosphor-icons/react'
import type { AppRoute } from '../types'
import { useI18n } from '../i18n/LanguageContext'

export interface TopBarProps {
  currentRoute: AppRoute
  onOpenMobileSidebar: () => void
  lastSyncedAt?: string
  myPlayerName?: string
  isSyncing?: boolean
}

export function TopBar({
  currentRoute,
  onOpenMobileSidebar,
  lastSyncedAt,
  isSyncing = false,
}: TopBarProps) {
  const { dict } = useI18n()

  const routeMeta = {
    personal: {
      icon: User,
      title: dict.navigation.personal,
      subtitle: dict.navigation.personalDesc,
      gradient: 'from-sky-500 to-indigo-600',
      accentGlow: 'from-sky-400 via-blue-500 to-indigo-500',
    },
    season: {
      icon: Trophy,
      title: dict.navigation.season,
      subtitle: dict.navigation.seasonDesc,
      gradient: 'from-amber-500 to-indigo-600',
      accentGlow: 'from-amber-400 via-orange-500 to-yellow-500',
    },
    clan: {
      icon: Shield,
      title: dict.navigation.clan,
      subtitle: dict.navigation.clanDesc,
      gradient: 'from-indigo-500 to-purple-600',
      accentGlow: 'from-indigo-400 via-purple-500 to-pink-500',
    },
  }[currentRoute]

  const Icon = routeMeta.icon

  return (
    <header className="glass-header !sticky top-0 z-20 relative">
      {/* Specular route indicator bar at bottom edge */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${routeMeta.accentGlow} opacity-80 shadow-xs`}
      />
      <div className="mx-auto flex max-w-[1360px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Nút Hamburger (Mobile) & Tiêu đề Route hiện tại */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="apple-btn lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/45 text-slate-700 shadow-2xs backdrop-blur-xl hover:bg-white/70 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:bg-slate-800/80"
            title="Mở menu"
          >
            <List weight="bold" className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div
              className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 dark:border-white/15 bg-gradient-to-br ${routeMeta.gradient} text-white shadow-xs backdrop-blur-md`}
            >
              <Icon weight="bold" className="h-4.5 w-4.5 drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 sm:text-base leading-tight">
                {routeMeta.title}
              </h2>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {routeMeta.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Trạng thái Đồng bộ */}
        <div className="flex items-center gap-2.5">
          {isSyncing ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/15 px-3 py-1 text-[11px] font-bold text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/15 dark:text-sky-300 shadow-2xs backdrop-blur-md">
              <CircleNotch weight="bold" className="h-3.5 w-3.5 animate-spin text-sky-600 dark:text-sky-400" />
              <span>{dict.header.syncing}</span>
            </span>
          ) : lastSyncedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300 shadow-2xs backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50" />
              <span>
                {dict.navigation.lastSynced}: {lastSyncedAt}
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </header>
  )
}
