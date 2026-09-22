import { useState } from 'react'
import { CalendarPlus, Info, X } from 'lucide-react'

interface CreateSeasonModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateSeason: (data: {
    seasonName: string
    startsAt: string
    endsAt: string
    maxAttacks: number
    maxDefenses: number
    promotionCount: number
    demotionCount: number
  }) => void
}

export function CreateSeasonModal({
  isOpen,
  onClose,
  onCreateSeason,
}: CreateSeasonModalProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [seasonName, setSeasonName] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [maxAttacks, setMaxAttacks] = useState<number | ''>(24)
  const [maxDefenses, setMaxDefenses] = useState<number | ''>(24)
  const [promotionCount, setPromotionCount] = useState<number | ''>(2)
  const [demotionCount, setDemotionCount] = useState<number | ''>(1)
  const [error, setError] = useState('')

  if (!isOpen) return null

  function handleClose() {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!seasonName.trim()) {
      setError('Vui lòng nhập tên mùa giải mới.')
      return
    }

    const attacks = typeof maxAttacks === 'number' && maxAttacks > 0 ? maxAttacks : 24
    const defenses = typeof maxDefenses === 'number' && maxDefenses > 0 ? maxDefenses : 24
    const promo = typeof promotionCount === 'number' && promotionCount >= 0 ? promotionCount : 0
    const demo = typeof demotionCount === 'number' && demotionCount >= 0 ? demotionCount : 0

    onCreateSeason({
      seasonName: seasonName.trim(),
      startsAt,
      endsAt,
      maxAttacks: attacks,
      maxDefenses: defenses,
      promotionCount: promo,
      demotionCount: demo,
    })

    setSeasonName('')
    setStartsAt('')
    setEndsAt('')
    setMaxAttacks(24)
    setMaxDefenses(24)
    setPromotionCount(2)
    setDemotionCount(1)
    setError('')
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop mờ dần khi mở và tắt dần khi đóng */}
      <div
        className={`${
          isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
        } fixed inset-0 bg-slate-950/60 backdrop-blur-sm`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog với animation vào và ra mượt mà */}
      <div
        className={`glass-panel ${
          isClosing ? 'animate-modal-dialog-out' : 'animate-modal-dialog'
        } relative w-full max-w-md rounded-2xl p-6 shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200/50 pb-4 dark:border-slate-700/50">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <CalendarPlus className="h-5 w-5 text-sky-500" />
            Tạo Mùa giải mới
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200/50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-rose-300/60 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 backdrop-blur dark:border-rose-500/30 dark:bg-rose-950/50 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tên mùa giải <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: October 2026, Mùa 10..."
              value={seasonName}
              onChange={(e) => {
                setSeasonName(e.target.value)
                if (error) setError('')
              }}
              className="soft-field mt-1.5 h-10 w-full rounded-lg px-3 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="soft-field mt-1.5 h-10 w-full rounded-lg px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="soft-field mt-1.5 h-10 w-full rounded-lg px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Lượt đánh tối đa <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={maxAttacks}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value
                  setMaxAttacks(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1))
                }}
                className="soft-field mt-1.5 h-10 w-full rounded-lg px-3 text-sm font-semibold"
                placeholder="24"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Lượt thủ tối đa <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={maxDefenses}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value
                  setMaxDefenses(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1))
                }}
                className="soft-field mt-1.5 h-10 w-full rounded-lg px-3 text-sm font-semibold"
                placeholder="24"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Thăng hạng (Top đầu)
              </label>
              <input
                type="number"
                min="0"
                value={promotionCount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value
                  setPromotionCount(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0))
                }}
                className="soft-field mt-1.5 h-10 w-full rounded-lg px-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                placeholder="2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Xuống hạng (Top cuối)
              </label>
              <input
                type="number"
                min="0"
                value={demotionCount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value
                  setDemotionCount(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0))
                }}
                className="soft-field mt-1.5 h-10 w-full rounded-lg px-3 text-sm font-semibold text-rose-600 dark:text-rose-400"
                placeholder="1"
              />
            </div>
          </div>

          {/* Ghi chú về việc làm mới dữ liệu cho mùa mới */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50/50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
            <Info className="h-4 w-4 shrink-0 text-sky-500" />
            <span>
              Khi tạo mùa mới, số cup và số lượt đánh/thủ sẽ reset về 0. Bảng xếp hạng sẽ tự động hiển thị vạch thăng hạng cho Top {promotionCount || 0} và vạch xuống hạng cho {demotionCount || 0} người cuối bảng.
            </span>
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-300/70 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur transition-all hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 dark:bg-sky-600 dark:hover:bg-sky-500"
            >
              <CalendarPlus className="h-4 w-4" />
              Tạo mùa giải
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
