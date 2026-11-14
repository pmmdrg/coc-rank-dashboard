import { useI18n } from '../i18n/LanguageContext'
import { APP_VERSION } from '../version'

export function Footer() {
  const { dict } = useI18n()

  return (
    <footer className="glass-footer relative mt-12 overflow-hidden border-t border-[#272226]">
      <div className="mx-auto max-w-[1360px] px-4 pt-8 pb-20 sm:px-6 sm:pb-24 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Brand & Project Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold tracking-tight">
                CoC Rank Dashboard
              </span>
              <span className="rounded-full border border-[#272226] bg-[#18171b] px-2 py-0.5 text-[11px] font-semibold text-zinc-300 shadow-2xs">
                v{APP_VERSION}
              </span>
              <span className="rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-300 shadow-2xs">
                Fan Tool
              </span>
            </div>
            <p className="text-sm font-medium text-zinc-300">
              {dict.footer.author} <span className="font-semibold text-white">Man Pham (Manax)</span>.
            </p>
            <p className="text-xs text-zinc-400">
              {dict.footer.subtitle}
            </p>
          </div>

          {/* Links & Contact */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <a
              href="https://github.com/pmmdrg/coc-rank-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl border border-[#272226] bg-[#18171b] px-3.5 py-2 font-semibold text-zinc-200 shadow-2xs transition hover:border-red-500/40 hover:bg-[#221f24] hover:text-white"
            >
              <span>GitHub</span>
            </a>

            <a
              href="mailto:pmmdrg2605@gmail.com"
              className="inline-flex items-center rounded-xl border border-[#272226] bg-[#18171b] px-3.5 py-2 font-semibold text-zinc-200 shadow-2xs transition hover:border-red-500/40 hover:bg-[#221f24] hover:text-white"
            >
              <span>{dict.footer.contactFeedback}</span>
            </a>
          </div>
        </div>

        {/* Divider & Disclaimer */}
        <div className="mt-6 flex flex-col gap-3 border-t border-[#272226] pt-4 text-[11px] text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {dict.footer.designAndDev} <span className="font-medium text-zinc-200">Man Pham</span>
          </p>
          <p className="max-w-2xl text-center sm:text-right leading-relaxed">
            {dict.footer.fanPolicyNotice}{' '}
            <a
              href="https://supercell.com/en/fan-content-policy/vi/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-300 underline underline-offset-2 hover:text-red-400"
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
