import { useI18n } from '../i18n/LanguageContext'
import { APP_VERSION } from '../version'

export function Footer() {
  const { dict } = useI18n()

  return (
    <footer className="glass-footer relative mt-12 overflow-hidden">
      {/* Liquid Glass top specular accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400/50 via-purple-500/40 to-amber-400/50 opacity-80 shadow-xs" />
      <div className="mx-auto max-w-[1360px] px-4 pt-8 pb-20 sm:px-6 sm:pb-24 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Brand & Project Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="aurora-text font-bold tracking-tight">
                CoC Rank Dashboard
              </span>
              <span className="rounded-full border border-slate-300/60 bg-slate-200/50 px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-2xs backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300">
                v{APP_VERSION}
              </span>
              <span className="rounded-full border border-sky-400/40 bg-sky-400/15 px-2 py-0.5 text-[11px] font-semibold text-sky-700 shadow-2xs backdrop-blur-md dark:border-sky-500/30 dark:bg-sky-500/20 dark:text-sky-300">
                Fan Tool
              </span>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {dict.footer.author} <span className="font-semibold text-slate-900 dark:text-slate-100">Man Pham (Manax)</span>.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dict.footer.subtitle}
            </p>
          </div>

          {/* Links & Contact */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <a
              href="https://github.com/pmmdrg/coc-rank-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="apple-btn inline-flex items-center rounded-xl border border-white/60 bg-white/45 px-3.5 py-2 font-semibold text-slate-700 shadow-2xs backdrop-blur-md transition hover:border-white/90 hover:bg-white/75 hover:text-slate-950 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-slate-700/80 dark:hover:text-white"
            >
              <span>GitHub</span>
            </a>

            <a
              href="mailto:pmmdrg2605@gmail.com"
              className="apple-btn inline-flex items-center rounded-xl border border-white/60 bg-white/45 px-3.5 py-2 font-semibold text-slate-700 shadow-2xs backdrop-blur-md transition hover:border-white/90 hover:bg-white/75 hover:text-slate-950 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-slate-700/80 dark:hover:text-white"
            >
              <span>{dict.footer.contactFeedback}</span>
            </a>

            <div className="hidden sm:inline-flex items-center rounded-xl border border-white/50 bg-white/35 px-3.5 py-2 text-slate-600 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-300">
              <span>{dict.footer.developer}: <strong className="font-semibold text-slate-800 dark:text-slate-200">Manax</strong></span>
            </div>
          </div>
        </div>

        {/* Divider & Disclaimer */}
        <div className="mt-6 flex flex-col gap-3 border-t border-white/60 pt-4 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-slate-400">
          <p>
            {dict.footer.designAndDev} <span className="font-medium text-slate-700 dark:text-slate-300">Man Pham</span>
          </p>
          <p className="max-w-2xl text-center sm:text-right leading-relaxed">
            {dict.footer.fanPolicyNotice}{' '}
            <a
              href="https://supercell.com/en/fan-content-policy/vi/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
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
