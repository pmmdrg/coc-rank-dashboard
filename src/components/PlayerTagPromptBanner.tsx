import { useState } from 'react'
import { ArrowRight, Loader2, Sparkles, FolderOpen } from 'lucide-react'

interface PlayerTagPromptBannerProps {
  playerTag: string
  isSyncingApi: boolean
  onSync: (tag: string) => void
  onOpenLocalFile: () => void
}

export function PlayerTagPromptBanner({
  playerTag,
  isSyncingApi,
  onSync,
  onOpenLocalFile,
}: PlayerTagPromptBannerProps) {
  const [inputVal, setInputVal] = useState(playerTag)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = inputVal.replace(/^#/, '').trim().toUpperCase()
    if (clean) {
      onSync(clean)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-sky-500/15 p-5 sm:p-6 shadow-xl shadow-emerald-500/10 backdrop-blur animate-fade-in dark:border-emerald-400/50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-sky-950/50">
      {/* Background ambient decorative glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/20" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-sky-400/25 blur-3xl dark:bg-sky-500/20" />

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300 ring-1 ring-emerald-500/40">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
              BƯỚC ĐẦU TIÊN
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Chưa liên kết tài khoản
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Nhập Player Tag để xem bảng đấu của bạn
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Hệ thống sẽ kết nối trực tiếp với Supercell API để tự động tải bảng đấu Ranked, thứ hạng các người chơi trong bảng và tính toán tỷ lệ thăng/xuống hạng theo thời gian thực.
          </p>
        </div>

        {/* Input box & Button nổi bật */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 text-base font-black text-emerald-600 dark:text-emerald-400">
              #
            </span>
            <input
              type="text"
              value={inputVal.replace(/^#/, '')}
              onChange={(e) => setInputVal(e.target.value.toUpperCase().trim())}
              placeholder="Ví dụ: ABC123"
              className="h-12 w-full sm:w-52 rounded-xl border-2 border-emerald-400/90 bg-white/95 pl-8 pr-3 text-sm font-mono font-bold tracking-wider text-slate-900 shadow-inner transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/25 dark:border-emerald-500/60 dark:bg-slate-900/95 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={!inputVal.trim() || isSyncingApi}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 px-6 text-sm font-black text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] hover:shadow-emerald-600/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:from-emerald-500 dark:via-teal-500 dark:to-sky-500"
          >
            {isSyncingApi ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tải...</span>
              </>
            ) : (
              <>
                <span>Xem bảng đấu</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-emerald-500/25 pt-3">
        <span>💡 Hoặc nếu bạn đã có file dữ liệu trước đó:</span>
        <button
          type="button"
          onClick={onOpenLocalFile}
          className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
          Mở file dữ liệu (.json / .csv)
        </button>
      </div>
    </div>
  )
}
