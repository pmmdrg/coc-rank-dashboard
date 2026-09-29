import { Loader2 } from 'lucide-react'
import { formatLeagueName } from '../lib/ranking'
import { getLeagueIconUrl } from '../lib/leagueIcons'
import { ThemeToggle } from './ThemeToggle'

interface SeasonHeaderProps {
  league: string
  leagueIconUrl?: string
  myPlayerName: string
  playerTag: string
  onPlayerTagChange: (tag: string) => void
  isSyncingApi?: boolean
  onSyncCocApi?: (tag?: string) => void
  onExport: (format: 'json' | 'csv') => void
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
}: SeasonHeaderProps) {
  const displayLeague = formatLeagueName(league)

  return (
    <header className="glass-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
              CoC Rank Dashboard
            </h1>
            <span className="rounded-md border border-slate-300/80 bg-slate-100/80 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
              Fan Tool
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {myPlayerName && myPlayerName !== '--' ? myPlayerName : '--'}
            </span>
            {playerTag ? (
              <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                ({playerTag.startsWith('#') ? playerTag : `#${playerTag}`})
              </span>
            ) : null}
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
              {league && league !== '--' ? (
                <>
                  <img
                    src={leagueIconUrl || getLeagueIconUrl(league)}
                    alt={displayLeague}
                    referrerPolicy="no-referrer"
                    className="h-5 w-5 shrink-0 object-contain drop-shadow-xs"
                  />
                  <span>{displayLeague}</span>
                </>
              ) : (
                <span>Giải đấu: --</span>
              )}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Ô nhập Player Tag */}
          <div
            className={`group relative inline-flex h-10 items-center rounded-md border p-0.5 shadow-sm backdrop-blur transition-all ${
              !playerTag
                ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/70 shadow-md shadow-emerald-500/25 animate-pulse dark:border-emerald-400 dark:ring-emerald-400/80'
                : 'border-emerald-400/80 bg-emerald-500/10 dark:border-emerald-500/40 dark:bg-emerald-400/10'
            }`}
          >
            <span className="pointer-events-none absolute left-2.5 text-xs font-bold text-slate-400 transition-colors group-focus-within:text-slate-900 dark:text-slate-500 dark:group-focus-within:text-white">
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
              placeholder="Ví dụ: ABC123"
              title="Nhập Player Tag của bạn (nhấn Enter để tải dữ liệu)"
              className="h-8 w-28 sm:w-32 rounded bg-white pl-5 pr-7 font-mono text-xs font-black tracking-wider text-slate-950 placeholder:text-slate-400 placeholder:font-normal caret-slate-950 transition-all focus:bg-white focus:text-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:caret-white dark:focus:bg-slate-900 dark:focus:text-white"
            />
            {isSyncingApi && (
              <span className="pointer-events-none absolute right-2 text-emerald-600 dark:text-emerald-400" title="Đang tải dữ liệu từ Supercell API...">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </span>
            )}
          </div>

          {/* Các nút Xuất file */}
          <button
            type="button"
            onClick={() => onExport('json')}
            className="inline-flex h-10 items-center rounded-md border border-slate-300/60 bg-white/60 px-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Xuất sang file JSON"
          >
            JSON
          </button>

          <button
            type="button"
            onClick={() => onExport('csv')}
            className="inline-flex h-10 items-center rounded-md border border-slate-300/60 bg-white/60 px-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Xuất sang file CSV"
          >
            CSV
          </button>

          {/* Nút đổi theme */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
