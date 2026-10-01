import { useState } from 'react'
import { Trophy, Sword, Users, ShieldWarning, CaretDown } from '@phosphor-icons/react'
import type { RankingStats, Season } from '../types'
import { useI18n } from '../i18n/LanguageContext'

interface StatCardsGridProps {
  stats: RankingStats
  season: Season
  myPlayerName: string
  isSyncingApi?: boolean
}

export function StatCardsGrid({ stats, season, myPlayerName, isSyncingApi = false }: StatCardsGridProps) {
  const { dict, interpolate, language } = useI18n()
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'
  const hasPlayers = season.players.length > 0
  const hasMyPlayer = Boolean(stats.myPlayer)

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('coc_stat_cards_collapsed') === 'true'
    } catch {
      return false
    }
  })

  function handleToggleCollapse() {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('coc_stat_cards_collapsed', String(next))
      } catch {
        // Ignore localStorage errors
      }
      return next
    })
  }

  function numberFormatter(value: number) {
    return new Intl.NumberFormat(locale).format(value)
  }

  function formatDate(value: string) {
    if (!value) return '--'
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value))
    } catch {
      return value
    }
  }

  if (isSyncingApi) {
    return (
      <section className="glass-panel rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="h-5 w-48 rounded-md skeleton-shimmer" />
          <div className="h-7 w-20 rounded-lg skeleton-shimmer" />
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/60 p-4 sm:p-4.5 shadow-2xs dark:border-white/10 dark:bg-slate-900/50"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-24 rounded-md skeleton-shimmer" />
                  <div className="h-4 w-12 rounded-full skeleton-shimmer" />
                </div>
                <div className="mt-3.5 h-8 w-20 rounded-lg skeleton-shimmer" />
                <div className="mt-2.5 h-3 w-32 rounded-md skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const myRankPercentage =
    hasMyPlayer && season.players.length > 0
      ? Math.round((stats.myPlayer!.rank / season.players.length) * 100)
      : null

  const cards = [
    {
      label: dict.statCards.myRank,
      value: hasMyPlayer ? `#${stats.myPlayer!.rank}` : '--',
      detail: hasMyPlayer
        ? `${stats.myPlayer!.name} • ${numberFormatter(stats.myPlayer!.currentCups)} ${dict.common.trophies}`
        : dict.common.noData,
      badge: myRankPercentage ? interpolate(dict.statCards.topPercentage, { percent: myRankPercentage }) : null,
      badgeColor: 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 border-sky-500/30',
      accentGradient: 'from-sky-400 via-blue-500 to-indigo-500',
      tonalGlow: 'rgba(14, 165, 233, 0.08)',
      valueColor: 'text-sky-600 dark:text-sky-400',
      icon: Trophy,
      iconColor: 'text-sky-500',
    },
    {
      label: dict.statCards.opponentsCanPass,
      value: hasMyPlayer ? stats.playersWhoCanPassMe : '--',
      detail: hasMyPlayer
        ? interpolate(dict.statCards.ceilingText, { name: myPlayerName, cups: numberFormatter(stats.myPlayer!.maxPossibleCups) })
        : dict.common.noData,
      badge: hasMyPlayer
        ? stats.playersWhoCanPassMe === 0
          ? dict.statCards.safe
          : interpolate(dict.statCards.threats, { count: stats.playersWhoCanPassMe })
        : null,
      badgeColor:
        hasMyPlayer && stats.playersWhoCanPassMe === 0
          ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 border-emerald-500/30'
          : 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 border-amber-500/30',
      accentGradient:
        hasMyPlayer && stats.playersWhoCanPassMe === 0
          ? 'from-emerald-400 via-teal-500 to-cyan-500'
          : 'from-amber-400 via-orange-500 to-red-500',
      tonalGlow:
        hasMyPlayer && stats.playersWhoCanPassMe === 0
          ? 'rgba(16, 185, 129, 0.08)'
          : 'rgba(245, 158, 11, 0.08)',
      valueColor:
        hasMyPlayer && stats.playersWhoCanPassMe === 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-amber-600 dark:text-amber-400',
      icon: Sword,
      iconColor: stats.playersWhoCanPassMe === 0 ? 'text-emerald-500' : 'text-amber-500',
    },
    {
      label: dict.statCards.totalPlayers,
      value: hasPlayers ? season.players.length : '--',
      detail:
        hasPlayers && (season.startsAt || season.endsAt)
          ? `${formatDate(season.startsAt)} - ${formatDate(season.endsAt)}`
          : dict.common.noData,
      badge: hasPlayers ? dict.statCards.competing : null,
      badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 border-emerald-500/30',
      accentGradient: 'from-emerald-400 via-teal-500 to-indigo-500',
      tonalGlow: 'rgba(20, 184, 166, 0.08)',
      valueColor: 'text-slate-800 dark:text-slate-100',
      icon: Users,
      iconColor: 'text-emerald-500',
    },
    {
      label: dict.statCards.estFinish,
      value: hasMyPlayer && stats.lowestPossibleRank ? `#${stats.lowestPossibleRank}` : '--',
      detail: hasMyPlayer
        ? (stats.myPlayer!.attacks >= (season.maxAttacks ?? 24) && stats.myPlayer!.defenses >= (season.maxDefenses ?? 24)
            ? dict.statCards.finished
            : interpolate(dict.statCards.remainingBattles, {
                attacks: Math.max(0, (season.maxAttacks ?? 24) - stats.myPlayer!.attacks),
                defenses: Math.max(0, (season.maxDefenses ?? 24) - stats.myPlayer!.defenses),
              }))
        : dict.common.noData,
      badge: hasMyPlayer ? dict.statCards.myStats : null,
      badgeColor: 'bg-rose-500/10 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300 border-rose-500/30',
      accentGradient: 'from-rose-500 via-pink-500 to-purple-600',
      tonalGlow: 'rgba(244, 63, 94, 0.08)',
      valueColor: 'text-rose-600 dark:text-rose-400',
      icon: ShieldWarning,
      iconColor: 'text-rose-500',
    },
  ]

  return (
    <section className="glass-panel rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
      {/* Header Thẻ lớn: Chỉ số tổng quan cá nhân - Tinh gọn, không icon ở tiêu đề, không lặp lại thông tin */}
      <div
        className={`flex items-center justify-between gap-3 p-4 sm:p-5 transition-all duration-300 ${
          !isCollapsed ? 'border-b border-slate-200/60 dark:border-slate-800/60' : ''
        }`}
      >
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
          {dict.statCards.overviewTitle}
        </h2>

        {/* Nút thu gọn / mở rộng */}
        <button
          type="button"
          onClick={handleToggleCollapse}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer shadow-2xs select-none"
          aria-expanded={!isCollapsed}
        >
          <span>{isCollapsed ? dict.performanceTrend.expand : dict.performanceTrend.collapse}</span>
          <CaretDown
            weight="bold"
            className={`h-3.5 w-3.5 transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Lưới 4 thẻ chỉ số con bên trong với animation collapsible-grid */}
      <div className={`collapsible-grid ${!isCollapsed ? 'is-expanded' : ''}`}>
        <div className="collapsible-inner">
          <div className="p-4 sm:p-5">
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => {
                const IconComponent = card.icon
                return (
                  <div
                    key={card.label}
                    className="hero-stat-card group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/60 p-4 sm:p-4.5 shadow-2xs dark:border-white/10 dark:bg-slate-900/50 backdrop-blur-md transition-all hover:border-slate-300 dark:hover:border-white/20 cursor-default"
                    style={{
                      backgroundImage: `radial-gradient(circle at 100% 100%, ${card.tonalGlow}, transparent 70%)`,
                    }}
                  >
                    {/* Vạch Accent Glow ở mép trên kiểu Apple Specular Bar */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${card.accentGradient} opacity-85 group-hover:h-[4px] group-hover:opacity-100 transition-all`}
                    />

                    {/* Icon lớn mờ chìm nghệ thuật ở góc thẻ */}
                    <IconComponent
                      weight="duotone"
                      className={`pointer-events-none absolute -bottom-3 -right-3 h-24 w-24 opacity-[0.08] dark:opacity-[0.14] transition-transform duration-300 group-hover:scale-115 ${card.iconColor}`}
                    />

                    <div className="relative z-10 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {card.label}
                      </p>
                      {card.badge && (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight select-none shadow-2xs ${card.badgeColor}`}
                        >
                          {card.badge}
                        </span>
                      )}
                    </div>

                    <p className={`relative z-10 mt-2 font-mono text-3xl font-black tracking-tight ${card.valueColor}`}>
                      {card.value}
                    </p>

                    <p className="relative z-10 mt-1.5 text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                      {card.detail}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
