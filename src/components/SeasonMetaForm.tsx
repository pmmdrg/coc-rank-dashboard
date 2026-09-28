import { Calendar, CalendarPlus, Loader2 } from 'lucide-react'
import type { Season } from '../types'
import { formatLeagueName } from '../lib/ranking'
import { getLeagueIconUrl } from '../lib/leagueIcons'
import { parseSeasonDateRange, type LeagueSeasonOption } from '../lib/cocApi'

interface SeasonMetaFormProps {
  season: Season
  seasons: Season[]
  activeSeasonIndex: number
  availableApiSeasons?: LeagueSeasonOption[]
  isLoadingSeason?: boolean
  onSelectSeasonIndex: (index: number) => void
  onSelectSeasonId?: (seasonId: string) => void
  onOpenCreateModal: () => void
  onUpdateSeasonMeta?: (field: keyof Season, value: string | number) => void
}

export function SeasonMetaForm({
  season,
  seasons,
  activeSeasonIndex,
  availableApiSeasons = [],
  isLoadingSeason = false,
  onSelectSeasonIndex,
  onSelectSeasonId,
  onOpenCreateModal,
  onUpdateSeasonMeta,
}: SeasonMetaFormProps) {
  // Thời gian mùa giải luôn hiển thị từ ngày bắt đầu đến 6 ngày sau (ví dụ 22/09/2026 - 28/09/2026)
  const currentPeriodInfo = parseSeasonDateRange(season.leagueSeasonId, season.startsAt)

  // Xây dựng danh sách các mùa giải cho select box
  // Kết hợp từ document.seasons (mùa hiện tại / bản nháp) và list season từ API (v2 trong 30 ngày)
  const combinedOptions: { id: string; label: string; isApi?: boolean; docIndex?: number }[] = []
  const seenIds = new Set<string>()

  // 1. Các mùa trong document hiện tại
  seasons.forEach((s, idx) => {
    const sId = String(s.leagueSeasonId || `doc-${idx}`)
    seenIds.add(sId)
    const { displayPeriod } = parseSeasonDateRange(s.leagueSeasonId, s.startsAt)
    let label = s.seasonName || `Mùa giải ${displayPeriod}`
    if (!label.includes(displayPeriod)) {
      label = `${label} (${displayPeriod})`
    }
    combinedOptions.push({
      id: sId,
      label,
      docIndex: idx,
    })
  })

  // 2. Các mùa giải v2 từ Supercell API (tối đa 30 ngày trước)
  availableApiSeasons.forEach((apiOpt) => {
    if (!seenIds.has(apiOpt.seasonId)) {
      seenIds.add(apiOpt.seasonId)
      combinedOptions.push({
        id: apiOpt.seasonId,
        label: apiOpt.label,
        isApi: true,
      })
    }
  })

  const currentSelectedValue = String(season.leagueSeasonId || `doc-${activeSeasonIndex}`)

  const handleSelectChange = (val: string) => {
    const opt = combinedOptions.find((o) => o.id === val)
    if (!opt) return
    if (opt.docIndex !== undefined) {
      onSelectSeasonIndex(opt.docIndex)
    } else if (opt.isApi && onSelectSeasonId) {
      onSelectSeasonId(opt.id)
    }
  }

  return (
    <div className="glass-panel rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Thông tin mùa giải
          </h2>
          {season.lastSyncedAt && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              ⚡ API: {season.lastSyncedAt}
            </span>
          )}
        </div>
        <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Tổng cộng: {combinedOptions.length} mùa giải
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[260px_minmax(0,1.2fr)_minmax(0,1.3fr)]">
        {/* Cột 1: Giải đấu */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/60 bg-white/40 p-3.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                Giải đấu
              </span>
              {season.leagueGroupTag && (
                <span className="rounded-md bg-amber-500/10 px-1.5 py-0.2 text-[10px] font-bold text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                  {season.leagueGroupTag}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2.5 flex h-9 items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
            <img
              src={season.leagueIconUrl || getLeagueIconUrl(season.league)}
              alt={season.league}
              referrerPolicy="no-referrer"
              className="h-7 w-7 shrink-0 object-contain drop-shadow-xs"
            />
            <span className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {formatLeagueName(season.league) || 'Legend League'}
            </span>
          </div>
        </div>

        {/* Cột 2: Thời gian mùa giải (chỉ hiển thị text từ ngày bắt đầu đến 6 ngày sau) & Vạch thăng/xuống hạng */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/60 bg-white/40 p-3.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                Thời gian mùa giải
              </span>
            </div>
            {onUpdateSeasonMeta ? (
              <div className="flex items-center gap-2 text-[11px] shrink-0">
                <label className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400" title="Số người thăng hạng ở top đầu">
                  <span>▲ Thăng:</span>
                  <input
                    type="number"
                    min="0"
                    value={season.promotionCount ?? 2}
                    onChange={(e) => onUpdateSeasonMeta('promotionCount', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="h-5.5 w-8 rounded-sm border border-emerald-500/40 bg-emerald-500/15 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300"
                  />
                </label>
                <label className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400" title="Số người xuống hạng ở top cuối">
                  <span>▼ Xuống:</span>
                  <input
                    type="number"
                    min="0"
                    value={season.demotionCount ?? 1}
                    onChange={(e) => onUpdateSeasonMeta('demotionCount', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="h-5.5 w-8 rounded-sm border border-rose-500/40 bg-rose-500/15 text-center text-xs font-bold text-rose-700 dark:text-rose-300"
                  />
                </label>
              </div>
            ) : (
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                Thăng: {season.promotionCount ?? 2} • Xuống: {season.demotionCount ?? 1}
              </span>
            )}
          </div>
          <div className="mt-2.5 flex h-9 items-center gap-2">
            <Calendar className="h-4.5 w-4.5 shrink-0 text-sky-500" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
              {currentPeriodInfo.displayPeriod}
            </span>
          </div>
        </div>

        {/* Cột 3: Thẻ Chọn mùa giải & Nút Mùa mới */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/60 bg-white/40 p-3.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Chọn mùa giải muốn xem
            </span>
            {isLoadingSeason && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang tải...
              </span>
            )}
          </div>
          <div className="mt-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <select
                value={currentSelectedValue}
                onChange={(e) => handleSelectChange(e.target.value)}
                disabled={isLoadingSeason}
                className="soft-field h-9 w-full rounded-lg px-2.5 pr-8 text-xs font-semibold truncate cursor-pointer disabled:opacity-60"
              >
                {combinedOptions.map((opt) => (
                  <option
                    key={opt.id}
                    value={opt.id}
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-blue-700 active:scale-95 dark:bg-sky-600 dark:hover:bg-sky-500"
              title="Tạo mùa giải mới"
            >
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Mùa mới</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
