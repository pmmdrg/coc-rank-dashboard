import { Trophy, CalendarBlank, ClockCounterClockwise } from '@phosphor-icons/react'
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
        <div className="hero-stat-card flex flex-col justify-between rounded-2xl p-4.5 shadow-2xs h-26">
          <div className="h-3 w-16 rounded-md skeleton-shimmer" />
          <div className="mt-2 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full skeleton-shimmer shrink-0" />
            <div className="h-6 w-36 rounded-md skeleton-shimmer" />
          </div>
        </div>

        {/* Cột 2 */}
        <div className="hero-stat-card flex flex-col justify-between rounded-2xl p-4.5 shadow-2xs h-26">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 rounded-md skeleton-shimmer" />
            <div className="h-3 w-20 rounded-md skeleton-shimmer" />
          </div>
          <div className="mt-2 h-6 w-48 rounded-md skeleton-shimmer" />
        </div>

        {/* Cột 3 */}
        <div className="hero-stat-card flex flex-col justify-between rounded-2xl p-4.5 shadow-2xs h-26">
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
        <div className="hero-stat-card group relative overflow-hidden rounded-2xl p-4.5 shadow-2xs backdrop-blur-md transition-all cursor-default flex flex-col justify-between">
          {/* Tonal radial glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background: 'radial-gradient(circle at 100% 100%, rgba(245, 158, 11, 0.08), transparent 70%)',
            }}
          />

          {/* Vạch Accent Glow ở mép trên kiểu Apple Specular Bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 opacity-85 group-hover:h-[4px] group-hover:opacity-100 transition-all" />

          {/* Icon lớn mờ chìm nghệ thuật ở góc thẻ */}
          <Trophy
            weight="duotone"
            className="pointer-events-none absolute -bottom-3 -right-3 h-24 w-24 opacity-15 dark:opacity-[0.10] text-amber-500 transition-transform duration-300 group-hover:scale-115"
          />

          <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 shrink-0">
                {dict.seasonMeta.league}
              </span>
              {season.leagueGroupTag && (
                <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {season.leagueGroupTag}
                </span>
              )}
            </div>
          </div>
          <div className="relative z-10 mt-2.5 flex items-center gap-3 font-semibold text-slate-900 dark:text-slate-100">
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
        <div className="hero-stat-card group relative overflow-hidden rounded-2xl p-4.5 shadow-2xs backdrop-blur-md transition-all cursor-default flex flex-col justify-between">
          {/* Tonal radial glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background: 'radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.08), transparent 70%)',
            }}
          />

          {/* Vạch Accent Glow ở mép trên kiểu Apple Specular Bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 opacity-85 group-hover:h-[4px] group-hover:opacity-100 transition-all" />

          {/* Icon lớn mờ chìm nghệ thuật ở góc thẻ */}
          <CalendarBlank
            weight="duotone"
            className="pointer-events-none absolute -bottom-3 -right-3 h-24 w-24 opacity-15 dark:opacity-[0.10] text-emerald-500 transition-transform duration-300 group-hover:scale-115"
          />

          <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 shrink-0">
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
              <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {dict.seasonMeta.promote} {season.promotionCount ?? 2} • {dict.seasonMeta.demote} {season.demotionCount ?? 1}
              </span>
            )}
          </div>
          <div className="relative z-10 mt-2.5 flex items-center">
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {currentPeriodInfo.displayPeriod || '--'}
            </span>
          </div>
        </div>

        {/* Cột 3: Select box chỉ gồm đúng 2 giá trị: Mùa giải hiện tại và Mùa giải ngay trước đó */}
        <div className="hero-stat-card group relative !overflow-visible rounded-2xl p-4.5 shadow-2xs backdrop-blur-md transition-all z-30 flex flex-col justify-between">
          {/* Lớp nền hiệu ứng bên trong giữ overflow-hidden để không cắt dropdown select */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background: 'radial-gradient(circle at 100% 100%, rgba(14, 165, 233, 0.08), transparent 70%)',
              }}
            />
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 opacity-85 group-hover:h-[4px] group-hover:opacity-100 transition-all" />
            <ClockCounterClockwise
              weight="duotone"
              className="absolute -bottom-3 -right-3 h-24 w-24 opacity-15 dark:opacity-[0.10] text-sky-500 transition-transform duration-300 group-hover:scale-115"
            />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {dict.seasonMeta.selectSeason}
            </span>
          </div>
          <div className="relative z-10 mt-2.5 flex items-center">
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
    </>
  )

  if (embedded) {
    return <div className="relative z-20">{content}</div>
  }

  return (
    <div className="glass-panel relative z-20 rounded-2xl p-5 shadow-xs">
      {content}
    </div>
  )
}
