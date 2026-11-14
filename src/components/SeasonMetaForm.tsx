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
        <div key={i} className="rounded-lg border border-amber-500/25 bg-[#0e0e12] p-4">
          <div className="h-3 w-20 rounded skeleton-shimmer" />
          <div className="mt-3 h-6 w-32 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  )

  if (embedded) return <div>{content}</div>
  return <div className="glass-panel rounded-xl p-4 shadow-xs border border-amber-500/25">{content}</div>
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
      <div className="rounded-lg border border-amber-500/30 bg-[#0e0e12] p-4 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            {dict.seasonMeta.league}
          </span>
          {season.leagueGroupTag && (
            <span className="rounded font-mono px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              {season.leagueGroupTag}
            </span>
          )}
        </div>
        <div className="mt-2.5 flex items-center gap-2.5 text-white">
          {season.league && season.league !== '--' ? (
            <>
              <img
                src={season.leagueIconUrl || getLeagueIconUrl(season.league)}
                alt={season.league}
                referrerPolicy="no-referrer"
                className="h-8 w-8 shrink-0 object-contain drop-shadow-xs"
              />
              <span className="truncate text-base font-black tracking-tight text-white">
                {formatLeagueName(season.league) || '--'}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-zinc-500">--</span>
          )}
        </div>
      </div>

      {/* Cột 2: Thời gian mùa giải & Vạch thăng/xuống hạng */}
      <div className="rounded-lg border border-amber-500/30 bg-[#0e0e12] p-4 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            {dict.seasonMeta.seasonDuration}
          </span>
          {season.players.length > 0 && onUpdateSeasonMeta ? (
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 text-amber-300 font-bold">
                <span>{dict.seasonMeta.promote}</span>
                <input
                  type="number"
                  min="0"
                  value={season.promotionCount ?? 2}
                  onChange={(e) => onUpdateSeasonMeta('promotionCount', Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="h-5 w-8 rounded border border-amber-500/50 bg-[#141418] text-center text-xs font-bold text-white focus:border-amber-400"
                />
              </label>
              <label className="flex items-center gap-1 text-red-300 font-bold">
                <span>{dict.seasonMeta.demote}</span>
                <input
                  type="number"
                  min="0"
                  value={season.demotionCount ?? 1}
                  onChange={(e) => onUpdateSeasonMeta('demotionCount', Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="h-5 w-8 rounded border border-red-800/60 bg-[#141418] text-center text-xs font-bold text-white focus:border-red-600"
                />
              </label>
            </div>
          ) : (
            <span className="text-xs text-white">
              <span className="text-amber-300 font-bold">{dict.seasonMeta.promote} {season.promotionCount ?? 2}</span> • <span className="text-red-300 font-bold">{dict.seasonMeta.demote} {season.demotionCount ?? 1}</span>
            </span>
          )}
        </div>
        <div className="mt-2.5 text-sm sm:text-base font-black font-mono text-white">
          {currentPeriodInfo.displayPeriod || '--'}
        </div>
      </div>

      {/* Cột 3: Chọn mùa giải */}
      <div className="rounded-lg border border-amber-500/30 bg-[#0e0e12] p-4 flex flex-col justify-between relative z-30 shadow-2xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white">
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
    <div className="glass-panel relative z-20 rounded-xl p-4 shadow-xs border border-amber-500/25">
      {content}
    </div>
  )
}
