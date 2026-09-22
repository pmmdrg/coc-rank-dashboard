import { Calendar, CalendarPlus, Trophy } from 'lucide-react'
import type { Season } from '../types'
import { formatLeagueName } from '../lib/ranking'

interface SeasonMetaFormProps {
  season: Season
  seasons: Season[]
  activeSeasonIndex: number
  onSelectSeasonIndex: (index: number) => void
  onOpenCreateModal: () => void
  onUpdateSeasonMeta?: (field: keyof Season, value: string | number) => void
}

function formatDate(value: string) {
  if (!value) return 'Chưa đặt'
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

function formatSeasonPeriod(startsAt?: string, endsAt?: string) {
  if (!startsAt && !endsAt) return ''

  const formatShort = (val?: string) => {
    if (!val) return '...'
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(val))
    } catch {
      return val
    }
  }

  if (startsAt && endsAt) {
    return `(${formatShort(startsAt)} - ${formatShort(endsAt)})`
  }
  if (startsAt) {
    return `(Từ ${formatShort(startsAt)})`
  }
  return `(Đến ${formatShort(endsAt)})`
}

export function SeasonMetaForm({
  season,
  seasons,
  activeSeasonIndex,
  onSelectSeasonIndex,
  onOpenCreateModal,
  onUpdateSeasonMeta,
}: SeasonMetaFormProps) {
  return (
    <div className="glass-panel rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Thông tin mùa giải
        </h2>
        <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Tổng cộng: {seasons.length} mùa giải
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[260px_minmax(0,1.2fr)_minmax(0,1.3fr)]">
        {/* Cột 1: Giải đấu */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/60 bg-white/40 p-3.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
              Giải đấu
            </span>
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-sky-500/10 dark:text-sky-400 shrink-0">
              Tối đa: {season.maxAttacks ?? 24} đánh • {season.maxDefenses ?? 24} thủ
            </span>
          </div>
          <div className="mt-2.5 flex h-9 items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
            <Trophy className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            {onUpdateSeasonMeta ? (
              <input
                type="text"
                value={season.league || 'Legend League'}
                onChange={(e) => onUpdateSeasonMeta('league', e.target.value)}
                className="soft-field h-9 w-full min-w-0 flex-1 rounded-lg px-2.5 text-sm font-bold text-slate-900 dark:text-slate-100"
                title="Chỉnh sửa tên giải đấu (ví dụ: Legend League, Champion 1, Master 2...)"
                placeholder="Legend League"
              />
            ) : (
              <span className="truncate text-sm font-bold tracking-tight">
                {formatLeagueName(season.league)}
              </span>
            )}
          </div>
        </div>

        {/* Cột 2: Thời gian mùa giải (có thể chỉnh sửa trực tiếp) & Vạch thăng/xuống hạng */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/60 bg-white/40 p-3.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
              Thời gian mùa giải
            </span>
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
          <div className="mt-2.5 flex items-start sm:items-center gap-2">
            <Calendar className="mt-2.5 sm:mt-0 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
            {onUpdateSeasonMeta ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0 sm:hidden">
                    Từ:
                  </span>
                  <input
                    type="date"
                    value={season.startsAt || ''}
                    onChange={(e) => onUpdateSeasonMeta('startsAt', e.target.value)}
                    className="soft-field h-9 w-full min-w-0 rounded-lg px-2 text-xs font-semibold cursor-pointer"
                    title="Chỉnh sửa ngày bắt đầu mùa giải"
                  />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0 sm:hidden">
                    Đến:
                  </span>
                  <input
                    type="date"
                    value={season.endsAt || ''}
                    onChange={(e) => onUpdateSeasonMeta('endsAt', e.target.value)}
                    className="soft-field h-9 w-full min-w-0 rounded-lg px-2 text-xs font-semibold cursor-pointer"
                    title="Chỉnh sửa ngày kết thúc mùa giải"
                  />
                </div>
              </div>
            ) : (
              <span className="truncate text-sm font-semibold tracking-tight">
                {formatDate(season.startsAt)} — {formatDate(season.endsAt)}
              </span>
            )}
          </div>
        </div>

        {/* Cột 3: Thẻ Chọn mùa giải & Nút Mùa mới */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/60 bg-white/40 p-3.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Chọn mùa giải muốn xem
            </span>
          </div>
          <div className="mt-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <select
                value={activeSeasonIndex}
                onChange={(e) => onSelectSeasonIndex(Number(e.target.value))}
                className="soft-field h-9 w-full rounded-lg px-2.5 pr-8 text-xs font-semibold truncate cursor-pointer"
              >
                {seasons.map((s, index) => (
                  <option
                    key={`${formatLeagueName(s.league)}-${index}`}
                    value={index}
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {formatLeagueName(s.league)} {formatSeasonPeriod(s.startsAt, s.endsAt)}
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
