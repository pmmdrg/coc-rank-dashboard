import type { Season } from '../types'
import { formatLeagueName } from '../lib/ranking'
import { getLeagueIconUrl } from '../lib/leagueIcons'
import { parseSeasonDateRange } from '../lib/cocApi'
import { useI18n } from '../i18n/LanguageContext'
import { CustomSelect } from './CustomSelect'

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
  const content = (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-slate-200/70 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="h-3 w-20 rounded skeleton-shimmer" />
          <div className="mt-3 h-6 w-32 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  )

  if (embedded) return <div>{content}</div>
  return <div className="glass-panel rounded-xl p-4 shadow-xs">{content}</div>
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

  const currentPeriodInfo = parseSeasonDateRange(season.leagueSeasonId, season.startsAt)

  const validSeasons = seasons.filter(
    (s) => s.players.length > 0 || (s.league && s.league !== '--') || s.leagueSeasonId,
  )
  const effectiveSeasons = validSeasons.length > 0 ? validSeasons : seasons
  const seasonOptions = (effectiveSeasons.length > 0 ? effectiveSeasons.slice(0, 2) : [{}]).map((_, idx) => ({
    index: idx,
    label: idx === 0 ? dict.seasonMeta.currentSeason : dict.seasonMeta.previousSeason,
  }))

  const content = (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
      {/* Cột 1: Giải đấu */}
      <div className="rounded-lg border border-slate-200/80 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {dict.seasonMeta.league}
          </span>
          {season.leagueGroupTag && (
            <span className="rounded font-mono px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {season.leagueGroupTag}
            </span>
          )}
        </div>
        <div className="mt-2.5 flex items-center gap-2.5 text-slate-900 dark:text-slate-100">
          {season.league && season.league !== '--' ? (
            <>
              <img
                src={season.leagueIconUrl || getLeagueIconUrl(season.league)}
                alt={season.league}
                referrerPolicy="no-referrer"
                className="h-8 w-8 shrink-0 object-contain"
              />
              <span className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {formatLeagueName(season.league) || '--'}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-slate-400">--</span>
          )}
        </div>
      </div>

      {/* Cột 2: Thời gian mùa giải & Vạch thăng/xuống hạng */}
      <div className="rounded-lg border border-slate-200/80 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {dict.seasonMeta.seasonDuration}
          </span>
          {season.players.length > 0 && onUpdateSeasonMeta ? (
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <span>{dict.seasonMeta.promote}</span>
                <input
                  type="number"
                  min="0"
                  value={season.promotionCount ?? 2}
                  onChange={(e) => onUpdateSeasonMeta('promotionCount', Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="h-5 w-8 rounded border border-slate-200 bg-white text-center text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
              <label className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                <span>{dict.seasonMeta.demote}</span>
                <input
                  type="number"
                  min="0"
                  value={season.demotionCount ?? 1}
                  onChange={(e) => onUpdateSeasonMeta('demotionCount', Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="h-5 w-8 rounded border border-slate-200 bg-white text-center text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
            </div>
          ) : (
            <span className="text-xs text-slate-500">
              {dict.seasonMeta.promote} {season.promotionCount ?? 2} • {dict.seasonMeta.demote} {season.demotionCount ?? 1}
            </span>
          )}
        </div>
        <div className="mt-2.5 text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-slate-100">
          {currentPeriodInfo.displayPeriod || '--'}
        </div>
      </div>

      {/* Cột 3: Chọn mùa giải */}
      <div className="rounded-lg border border-slate-200/80 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 flex flex-col justify-between relative z-30">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {dict.seasonMeta.selectSeason}
        </span>
        <div className="mt-2.5">
          <CustomSelect<number>
            value={activeSeasonIndex}
            options={seasonOptions.map((opt) => ({
              value: opt.index,
              label: opt.label,
            }))}
            onChange={(val) => onSelectSeasonIndex(val)}
            ariaLabel={dict.seasonMeta.selectSeason}
          />
        </div>
      </div>
    </div>
  )

  if (embedded) {
    return <div className="relative z-20">{content}</div>
  }

  return (
    <div className="glass-panel relative z-20 rounded-xl p-4 shadow-xs">
      {content}
    </div>
  )
}
