import { useMemo, useState } from 'react'
import type { RankingStats, Season } from '../types'
import { useI18n } from '../i18n/LanguageContext'
import { CollapseToggleButton } from './CollapseToggleButton'

interface StatCardsGridProps {
  stats: RankingStats
  season: Season
  myPlayerName: string
  isSyncingApi?: boolean
}

export function StatCardsGrid({ stats, season, myPlayerName: _myPlayerName, isSyncingApi = false }: StatCardsGridProps) {
  const { dict, language } = useI18n()
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'
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

  const attackStats = useMemo(() => {
    if (!hasMyPlayer) return null

    const logs =
      season.attackLogs && season.attackLogs.length > 0
        ? season.attackLogs
        : season.players.flatMap((p) => p.attackedByMe || [])

    if (logs.length > 0) {
      const totalDestruction = logs.reduce((acc, log) => acc + (log.destructionPercentage || 0), 0)
      const totalStars = logs.reduce((acc, log) => acc + (log.stars || 0), 0)
      const avgDestruction = totalDestruction / logs.length
      const avgStars = totalStars / logs.length
      return {
        avgDestruction,
        avgStars,
        count: Math.max(logs.length, stats.myPlayer?.attacks || 0),
      }
    }

    const myPlayer = stats.myPlayer!
    const attacks = myPlayer.attacks || 0
    if (attacks > 0 || (myPlayer.attackDestruction !== undefined && myPlayer.attackDestruction > 0)) {
      const avgDest = myPlayer.attackDestruction || 0
      const avgStars = avgDest >= 100 ? 3 : avgDest >= 70 ? 2.5 : avgDest >= 50 ? 2 : avgDest > 0 ? 1 : 0
      return {
        avgDestruction: avgDest,
        avgStars,
        count: attacks,
      }
    }

    return null
  }, [hasMyPlayer, season.attackLogs, season.players, stats.myPlayer])

  const defenseStats = useMemo(() => {
    if (!hasMyPlayer) return null

    const logs =
      season.defenseLogs && season.defenseLogs.length > 0
        ? season.defenseLogs
        : season.players.flatMap((p) => p.defendedAgainstMe || [])

    if (logs.length > 0) {
      const totalDestruction = logs.reduce((acc, log) => acc + (log.destructionPercentage || 0), 0)
      const totalStars = logs.reduce((acc, log) => acc + (log.stars || 0), 0)
      const avgDestruction = totalDestruction / logs.length
      const avgStars = totalStars / logs.length
      return {
        avgDestruction,
        avgStars,
        count: Math.max(logs.length, stats.myPlayer?.defenses || 0),
      }
    }

    const myPlayer = stats.myPlayer!
    const defenses = myPlayer.defenses || 0
    if (defenses > 0 || (myPlayer.defenseDestruction !== undefined && myPlayer.defenseDestruction > 0)) {
      const avgDest = myPlayer.defenseDestruction || 0
      const avgStars = avgDest >= 100 ? 3 : avgDest >= 70 ? 2.5 : avgDest >= 50 ? 2 : avgDest > 0 ? 1 : 0
      return {
        avgDestruction: avgDest,
        avgStars,
        count: defenses,
      }
    }

    return null
  }, [hasMyPlayer, season.defenseLogs, season.players, stats.myPlayer])

  if (isSyncingApi) {
    return (
      <section className="glass-panel rounded-xl shadow-xs overflow-hidden border border-[#27272a]">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-[#27272a]">
          <div className="h-4 w-40 rounded-md skeleton-shimmer" />
          <div className="h-6 w-16 rounded-md skeleton-shimmer" />
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="rounded-lg border border-[#27272a] bg-[#111113] p-4"
              >
                <div className="h-3 w-20 rounded skeleton-shimmer" />
                <div className="mt-3 h-7 w-24 rounded skeleton-shimmer" />
                <div className="mt-2 h-3 w-32 rounded skeleton-shimmer" />
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
      subtext: hasMyPlayer
        ? `${numberFormatter(stats.myPlayer!.currentCups)} ${dict.common.trophies}`
        : dict.common.noData,
      badge: myRankPercentage ? `Top ${myRankPercentage}%` : null,
      badgeType: 'gold',
      topBorder: 'border-t-2 border-t-amber-500/70',
      valueColor: 'text-amber-400 font-black',
    },
    {
      label: dict.statCards.opponentsCanPass,
      value: hasMyPlayer ? String(stats.playersWhoCanPassMe) : '--',
      subtext: hasMyPlayer
        ? `Trần: ${numberFormatter(stats.myPlayer!.maxPossibleCups)}`
        : dict.common.noData,
      badge: hasMyPlayer
        ? stats.playersWhoCanPassMe === 0
          ? dict.statCards.safe
          : `${stats.playersWhoCanPassMe} đối thủ`
        : null,
      badgeType: hasMyPlayer && stats.playersWhoCanPassMe === 0 ? 'success' : 'warning',
      topBorder: 'border-t-2 border-t-red-600/70',
      valueColor: 'text-white font-bold',
    },
    {
      label: dict.statCards.attackPerformance,
      value:
        attackStats && attackStats.count > 0
          ? `${(Math.round(attackStats.avgDestruction * 10) / 10).toFixed(1)}%`
          : '--',
      subtext:
        attackStats && attackStats.count > 0
          ? `${attackStats.count} trận đánh`
          : dict.common.noData,
      badge:
        attackStats && attackStats.count > 0
          ? `${(Math.round(attackStats.avgStars * 10) / 10).toFixed(1)}★ TB`
          : null,
      badgeType: 'neutral',
      topBorder: 'border-t-2 border-t-red-600/70',
      valueColor: 'text-white font-bold',
    },
    {
      label: dict.statCards.defensePerformance,
      value:
        defenseStats && defenseStats.count > 0
          ? `${(Math.round(defenseStats.avgDestruction * 10) / 10).toFixed(1)}%`
          : '--',
      subtext:
        defenseStats && defenseStats.count > 0
          ? `${defenseStats.count} trận thủ`
          : dict.common.noData,
      badge:
        defenseStats && defenseStats.count > 0
          ? `${(Math.round(defenseStats.avgStars * 10) / 10).toFixed(1)}★ TB`
          : null,
      badgeType: 'gold',
      topBorder: 'border-t-2 border-t-amber-500/70',
      valueColor: 'text-amber-300 font-bold',
    },
  ]

  return (
    <section className="glass-panel rounded-xl shadow-xs overflow-hidden border border-[#27272a] transition-all duration-200">
      {/* Header: Tinh gọn */}
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 transition-colors ${
          !isCollapsed ? 'border-b border-[#27272a]' : ''
        }`}
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-white">
          {dict.statCards.overviewTitle}
        </h2>

        <CollapseToggleButton
          isCollapsed={isCollapsed}
          onToggle={handleToggleCollapse}
          ariaLabel={dict.statCards.overviewTitle}
        />
      </div>

      {/* Lưới 4 thẻ chỉ số - Tinh giản, sạch sẽ */}
      <div className={`collapsible-grid ${!isCollapsed ? 'is-expanded' : ''}`}>
        <div className="collapsible-inner">
          <div className="p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className={`rounded-lg border border-[#27272a] ${card.topBorder} bg-[#111113] p-4 transition-colors shadow-2xs`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
                      {card.label}
                    </span>
                    {card.badge && (
                      <span
                        className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          card.badgeType === 'gold' || card.badgeType === 'success'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : card.badgeType === 'warning'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-[#18181b] text-zinc-300 border border-[#27272a]'
                        }`}
                      >
                        {card.badge}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`font-mono text-2xl tracking-tight ${card.valueColor}`}>
                      {card.value}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-zinc-400 truncate">
                    {card.subtext}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
