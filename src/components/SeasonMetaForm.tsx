import type { Season } from '../types'
import { formatLeagueName } from '../lib/ranking'
import { getLeagueIconUrl } from '../lib/leagueIcons'
import { parseSeasonDateRange } from '../lib/cocApi'
import { useI18n } from '../i18n/LanguageContext'

interface SeasonMetaFormProps {
  season: Season
  seasons: Season[]
  activeSeasonIndex: number
  onSelectSeasonIndex: (index: number) => void
  onUpdateSeasonMeta?: (field: keyof Season, value: string | number) => void
  isSyncingApi?: boolean
  embedded?: boolean
}

function SeasonMetaSkeleton({ embedded = false }: { embedded?: boolean }) {
  const { dict } = useI18n()

  const content = (
    <>
      {!embedded && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {dict.seasonMeta.title}
            </h2>
            <span className="inline-flex h-5 items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 text-[10px] font-bold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 animate-ping" />
              {dict.common.loading}
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Cột 1 */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/60 bg-white/40 p-4 dark:border-slate-800 dark:bg-slate-900/40 shadow-xs h-26">
          <div className="h-3 w-16 rounded-md skeleton-shimmer" />
          <div className="mt-2 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full skeleton-shimmer shrink-0" />
            <div className="h-6 w-36 rounded-md skeleton-shimmer" />
          </div>
        </div>

        {/* Cột 2 */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/60 bg-white/40 p-4 dark:border-slate-800 dark:bg-slate-900/40 shadow-xs h-26">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 rounded-md skeleton-shimmer" />
            <div className="h-3 w-20 rounded-md skeleton-shimmer" />
          </div>
          <div className="mt-2 h-6 w-48 rounded-md skeleton-shimmer" />
        </div>

        {/* Cột 3 */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/60 bg-white/40 p-4 dark:border-slate-800 dark:bg-slate-900/40 shadow-xs h-26">
          <div className="h-3 w-24 rounded-md skeleton-shimmer" />
          <div className="mt-2 h-8 w-full rounded-lg skeleton-shimmer" />
        </div>
      </div>
    </>
  )

  if (embedded) {
    return <div>{content}</div>
  }

  return (
    <div className="glass-panel rounded-xl p-4 sm:p-5 shadow-sm">
      {content}
    </div>
  )
}

export function SeasonMetaForm({
  season,
  seasons,
  activeSeasonIndex,
  onSelectSeasonIndex,
  onUpdateSeasonMeta,
  isSyncingApi = false,
  embedded = false,
}: SeasonMetaFormProps) {
  const { dict } = useI18n()

  if (isSyncingApi) {
    return <SeasonMetaSkeleton embedded={embedded} />
  }
  // Thời gian mùa giải luôn hiển thị từ ngày bắt đầu đến 6 ngày sau (ví dụ 22/09/2026 - 28/09/2026)
  const currentPeriodInfo = parseSeasonDateRange(season.leagueSeasonId, season.startsAt)

  // Select box chỉ có đúng 2 giá trị: Mùa giải hiện tại và Mùa giải ngay trước đó (không hiển thị thời gian vì đã có card bên cạnh)
  const validSeasons = seasons.filter(
    (s) => s.players.length > 0 || (s.league && s.league !== '--') || s.leagueSeasonId,
  )
  const effectiveSeasons = validSeasons.length > 0 ? validSeasons : seasons
  const seasonOptions = (effectiveSeasons.length > 0 ? effectiveSeasons.slice(0, 2) : [{}]).map((_, idx) => ({
    index: idx,
    label: idx === 0 ? dict.seasonMeta.currentSeason : dict.seasonMeta.previousSeason,
  }))

  const content = (
    <>
      {!embedded && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {dict.seasonMeta.title}
            </h2>
            {season.lastSyncedAt && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                {dict.seasonMeta.apiPrefix} {season.lastSyncedAt}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Cột 1: Giải đấu (Phóng to Icon và Text) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/60 p-4.5 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/50 shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                {dict.seasonMeta.league}
              </span>
              {season.leagueGroupTag && (
                <span className="rounded-md bg-amber-500/10 px-1.5 py-0.2 text-[10px] font-bold text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                  {season.leagueGroupTag}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-3 font-semibold text-slate-900 dark:text-slate-100">
            {season.league && season.league !== '--' ? (
              <>
                <img
                  src={season.leagueIconUrl || getLeagueIconUrl(season.league)}
                  alt={season.league}
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 object-contain drop-shadow-md transition-transform hover:scale-105"
                />
                <span className="truncate text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  {formatLeagueName(season.league) || '--'}
                </span>
              </>
            ) : (
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-400 dark:text-slate-500">
                --
              </span>
            )}
          </div>
        </div>

        {/* Cột 2: Thời gian mùa giải & Vạch thăng/xuống hạng */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/60 p-4.5 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/50 shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
              {dict.seasonMeta.seasonDuration}
            </span>
            {season.players.length === 0 ? (
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {dict.seasonMeta.promote} -- • {dict.seasonMeta.demote} --
              </span>
            ) : onUpdateSeasonMeta ? (
              <div className="flex items-center gap-2 text-[11px] shrink-0">
                <label className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400" title="Số người thăng hạng ở top đầu">
                  <span>{dict.seasonMeta.promote}</span>
                  <input
                    type="number"
                    min="0"
                    value={season.promotionCount ?? 2}
                    onChange={(e) => onUpdateSeasonMeta('promotionCount', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="h-6 w-9 rounded-md border border-emerald-500/40 bg-emerald-500/15 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300"
                  />
                </label>
                <label className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400" title="Số người xuống hạng ở top cuối">
                  <span>{dict.seasonMeta.demote}</span>
                  <input
                    type="number"
                    min="0"
                    value={season.demotionCount ?? 1}
                    onChange={(e) => onUpdateSeasonMeta('demotionCount', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="h-6 w-9 rounded-md border border-rose-500/40 bg-rose-500/15 text-center text-xs font-bold text-rose-700 dark:text-rose-300"
                  />
                </label>
              </div>
            ) : (
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                {dict.seasonMeta.promote} {season.promotionCount ?? 2} • {dict.seasonMeta.demote} {season.demotionCount ?? 1}
              </span>
            )}
          </div>
          <div className="mt-2.5 flex items-center">
            <span className="text-sm sm:text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {currentPeriodInfo.displayPeriod || '--'}
            </span>
          </div>
        </div>

        {/* Cột 3: Select box chỉ gồm đúng 2 giá trị: Mùa giải hiện tại và Mùa giải ngay trước đó */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/60 p-4.5 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/50 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {dict.seasonMeta.selectSeason}
            </span>
          </div>
          <div className="mt-2.5 flex items-center">
            <select
              value={activeSeasonIndex}
              onChange={(e) => onSelectSeasonIndex(Number(e.target.value))}
              className="soft-field h-10 w-full rounded-xl px-3.5 pr-8 text-sm font-bold text-slate-800 dark:text-slate-100 truncate cursor-pointer transition-all hover:border-sky-500/50 focus:border-sky-500"
            >
              {seasonOptions.map((opt) => (
                <option
                  key={opt.index}
                  value={opt.index}
                  className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  )

  if (embedded) {
    return <div>{content}</div>
  }

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xs">
      {content}
    </div>
  )
}
