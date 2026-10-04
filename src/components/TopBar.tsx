import {
  List,
  User,
  Trophy,
  Shield,
} from '@phosphor-icons/react'
import type { AppRoute } from '../types'
import { useI18n } from '../i18n/LanguageContext'

export interface TopBarProps {
  currentRoute: AppRoute
  onOpenMobileSidebar: () => void
  lastSyncedAt?: string
  myPlayerName?: string
}

export function TopBar({
  currentRoute,
  onOpenMobileSidebar,
  lastSyncedAt,
}: TopBarProps) {
  const { dict } = useI18n()

  const routeMeta = {
    personal: {
      icon: User,
      title: dict.navigation.personal,
      subtitle: dict.navigation.personalDesc,
      gradient: 'from-sky-500 to-indigo-600',
    },
    season: {
      icon: Trophy,
      title: dict.navigation.season,
      subtitle: dict.navigation.seasonDesc,
      gradient: 'from-amber-500 to-indigo-600',
    },
    clan: {
      icon: Shield,
      title: dict.navigation.clan,
      subtitle: dict.navigation.clanDesc,
      gradient: 'from-indigo-500 to-purple-600',
    },
  }[currentRoute]

  const Icon = routeMeta.icon

  return (
    <header className="glass-header sticky top-0 z-20 border-b border-slate-200/80 backdrop-blur-xl dark:border-slate-800/80">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Nút Hamburger (Mobile) & Tiêu đề Route hiện tại */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-600 shadow-2xs backdrop-blur-md hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            title="Mở menu"
          >
            <List weight="bold" className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div
              className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${routeMeta.gradient} text-white shadow-2xs`}
            >
              <Icon weight="bold" className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 sm:text-base leading-tight">
                {routeMeta.title}
              </h2>
              <p className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                {routeMeta.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Trạng thái Đồng bộ */}
        <div className="flex items-center gap-2.5">
          {lastSyncedAt && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {dict.navigation.lastSynced}: {lastSyncedAt}
              </span>
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
