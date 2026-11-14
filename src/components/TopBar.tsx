import { List, CircleNotch } from '@phosphor-icons/react'
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

  const routeTitles: Record<AppRoute, string> = {
    personal: dict.navigation.personal,
    season: dict.navigation.season,
    clan: dict.navigation.clan,
  }

  const title = routeTitles[currentRoute]

  return (
    <header className="glass-header !sticky top-0 z-20 border-b border-zinc-200/80 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Nút Hamburger (Mobile) & Tiêu đề Route */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="apple-btn lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-red-400 cursor-pointer"
            title="Mở menu"
          >
            <List weight="bold" className="h-4.5 w-4.5" />
          </button>

          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white sm:text-base">
            {title}
          </h2>
        </div>

        {/* Trạng thái Đồng bộ - Chuẩn TH19 */}
        <div className="flex items-center gap-2">
          {isSyncing ? (
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs text-red-600 dark:text-red-400 font-semibold">
              <CircleNotch weight="bold" className="h-3.5 w-3.5 animate-spin" />
              <span>{dict.header.syncing}</span>
            </span>
          ) : lastSyncedAt ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500 shadow-2xs" />
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
