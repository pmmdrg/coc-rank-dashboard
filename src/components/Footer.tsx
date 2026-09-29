export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200/80 bg-white/40 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/40">
      <div className="mx-auto max-w-[1320px] px-4 pt-8 pb-20 sm:px-6 sm:pb-24 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Brand & Project Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 dark:text-slate-100">
                CoC Rank Dashboard
              </span>
              <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-400/10 dark:text-slate-400">
                Fan Tool
              </span>
              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-600 dark:bg-sky-400/10 dark:text-sky-400">
                Ranked
              </span>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Dự án cộng đồng người chơi được phát triển bởi <span className="font-semibold text-slate-900 dark:text-slate-100">Man Pham (Manax)</span>.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hệ thống theo dõi cúp, quản lý mùa giải và bảng xếp hạng cá nhân hóa cho Clash of Clans.
            </p>
          </div>

          {/* Links & Contact */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <a
              href="https://github.com/pmmdrg/coc-rank-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white/70 px-3 py-2 font-medium text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              <span>GitHub</span>
            </a>

            <a
              href="mailto:pmmdrg2605@gmail.com"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white/70 px-3 py-2 font-medium text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              <span>Liên hệ đóng góp</span>
            </a>

            <div className="hidden sm:inline-flex items-center rounded-lg border border-slate-200/60 bg-slate-100/60 px-3 py-2 text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-400">
              <span>Người phát triển: <strong>Manax</strong></span>
            </div>
          </div>
        </div>

        {/* Divider & Disclaimer */}
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200/60 pt-4 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/60 dark:text-slate-500">
          <p>
            Thiết kế & phát triển bởi <span className="font-medium text-slate-600 dark:text-slate-400">Man Pham</span>
          </p>
          <p className="max-w-2xl text-center sm:text-right leading-relaxed">
            Đây là tư liệu không chính thức và không được bảo trợ bởi Supercell. Để biết thêm thông tin chi tiết, vui lòng xem Chính sách Nội dung tạo bởi Người hâm mộ của Supercell tại:{' '}
            <a
              href="https://supercell.com/en/fan-content-policy/vi/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              www.supercell.com/fan-content-policy
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}
