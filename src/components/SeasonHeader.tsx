import { useState } from 'react'
import { Loader2, Sparkles, Copy, Check } from 'lucide-react'
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
  onOpenShareCard?: () => void
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
}: SeasonHeaderProps) {
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
            <h1 className="bg-gradient-to-r from-slate-900 via-sky-800 to-indigo-950 text-2xl font-black tracking-tight sm:text-3xl dark:from-white dark:via-sky-200 dark:to-indigo-300 bg-clip-text text-transparent">
              CoC Rank Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-300 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tournament Tracker
            </span>
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {myPlayerName && myPlayerName !== '--' ? myPlayerName : '--'}
            </span>

            {playerTag ? (
              <button
                type="button"
                onClick={handleCopyMyTag}
                className="group inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 hover:bg-emerald-500/20 active:scale-95 transition-all dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20 cursor-pointer shadow-2xs"
                title="Nhấp để sao chép Player Tag"
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
                <span>Giải đấu: --</span>
              )}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Ô nhập Player Tag */}
          <div
            className={`group relative inline-flex h-9.5 items-center rounded-lg border p-0.5 shadow-sm backdrop-blur transition-all ${
              !playerTag
                ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/70 shadow-md shadow-emerald-500/25 animate-pulse dark:border-emerald-400 dark:ring-emerald-400/80'
                : 'border-slate-300/80 bg-white/70 dark:border-slate-700/80 dark:bg-slate-900/60'
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
              placeholder="Tag: ABC123"
              title="Nhập Player Tag của bạn (nhấn Enter để tải dữ liệu)"
              className="h-7.5 w-28 sm:w-32 rounded-md bg-white pl-5 pr-7 font-mono text-xs font-black tracking-wider text-slate-950 placeholder:text-slate-400 placeholder:font-normal caret-slate-950 transition-all focus:outline-none dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:caret-white"
            />
            {isSyncingApi && (
              <span className="pointer-events-none absolute right-2 text-emerald-600 dark:text-emerald-400" title="Đang tải dữ liệu từ Supercell API...">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </span>
            )}
          </div>

          {/* Nút Chia sẻ thẻ thành tích (Hero Action) */}
          {onOpenShareCard && (
            <button
              type="button"
              onClick={onOpenShareCard}
              className="inline-flex h-9.5 items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-500 px-3.5 text-xs font-bold text-white shadow-md shadow-sky-500/25 hover:shadow-sky-500/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer select-none"
              title="Xuất thẻ ảnh thành tích chuẩn 1200x675 để chia sẻ"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Chia sẻ thẻ</span>
            </button>
          )}

          {/* Các nút Xuất file */}
          <div className="inline-flex h-9.5 items-center rounded-lg border border-slate-300/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 p-0.5 shadow-2xs backdrop-blur">
            <button
              type="button"
              onClick={() => onExport('json')}
              className="h-8 rounded-md px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Xuất sang file JSON"
            >
              JSON
            </button>
            <span className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <button
              type="button"
              onClick={() => onExport('csv')}
              className="h-8 rounded-md px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Xuất sang file CSV"
            >
              CSV
            </button>
          </div>

          {/* Nút đổi theme */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
