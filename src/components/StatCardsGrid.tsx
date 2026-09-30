import { Trophy, Sword, Users, ShieldWarning } from '@phosphor-icons/react'
import type { RankingStats, Season } from '../types'

interface StatCardsGridProps {
  stats: RankingStats
  season: Season
  myPlayerName: string
  isSyncingApi?: boolean
}

function numberFormatter(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatDate(value: string) {
  if (!value) return 'Chưa đặt'
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

export function StatCardsGrid({ stats, season, myPlayerName, isSyncingApi = false }: StatCardsGridProps) {
  const hasPlayers = season.players.length > 0
  const hasMyPlayer = Boolean(stats.myPlayer)

  if (isSyncingApi) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass-panel relative overflow-hidden rounded-xl p-5 shadow-sm animate-pulse"
          >
            <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-700/80" />
            <div className="mt-3 h-9 w-24 rounded bg-slate-300/80 dark:bg-slate-600/80" />
            <div className="mt-3 h-3 w-36 rounded bg-slate-200/80 dark:bg-slate-700/60" />
          </div>
        ))}
      </div>
    )
  }

  const myRankPercentage =
    hasMyPlayer && season.players.length > 0
      ? Math.round((stats.myPlayer!.rank / season.players.length) * 100)
      : null

  const cards = [
    {
      label: 'Thứ hạng của tôi',
      value: hasMyPlayer ? `#${stats.myPlayer!.rank}` : '--',
      detail: hasMyPlayer
        ? `${stats.myPlayer!.name} • ${numberFormatter(stats.myPlayer!.currentCups)} cup`
        : 'Chưa có dữ liệu',
      badge: myRankPercentage ? `Top ${myRankPercentage}%` : null,
      badgeColor: 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 border-sky-500/30',
      accentGradient: 'from-sky-400 via-blue-500 to-indigo-500',
      valueColor: 'text-sky-600 dark:text-sky-400',
      icon: Trophy,
      iconColor: 'text-sky-500',
    },
    {
      label: 'Đối thủ có thể vượt tôi',
      value: hasMyPlayer ? stats.playersWhoCanPassMe : '--',
      detail: hasMyPlayer
        ? `Trần cup của ${myPlayerName}: ${numberFormatter(stats.myPlayer!.maxPossibleCups)}`
        : 'Chưa có dữ liệu',
      badge: hasMyPlayer
        ? stats.playersWhoCanPassMe === 0
          ? 'An toàn'
          : `${stats.playersWhoCanPassMe} nguy cơ`
        : null,
      badgeColor:
        hasMyPlayer && stats.playersWhoCanPassMe === 0
          ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 border-emerald-500/30'
          : 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 border-amber-500/30',
      accentGradient:
        hasMyPlayer && stats.playersWhoCanPassMe === 0
          ? 'from-emerald-400 via-teal-500 to-cyan-500'
          : 'from-amber-400 via-orange-500 to-red-500',
      valueColor:
        hasMyPlayer && stats.playersWhoCanPassMe === 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-amber-600 dark:text-amber-400',
      icon: Sword,
      iconColor: stats.playersWhoCanPassMe === 0 ? 'text-emerald-500' : 'text-amber-500',
    },
    {
      label: 'Tổng người chơi',
      value: hasPlayers ? season.players.length : '--',
      detail:
        hasPlayers && (season.startsAt || season.endsAt)
          ? `${formatDate(season.startsAt)} - ${formatDate(season.endsAt)}`
          : 'Chưa có dữ liệu',
      badge: hasPlayers ? 'Đang tranh tài' : null,
      badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 border-emerald-500/30',
      accentGradient: 'from-emerald-400 via-teal-500 to-indigo-500',
      valueColor: 'text-slate-800 dark:text-slate-100',
      icon: Users,
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Rank thấp nhất có thể',
      value: hasMyPlayer && stats.lowestPossibleRank ? `#${stats.lowestPossibleRank}` : '--',
      detail: hasMyPlayer
        ? 'Nếu các đối thủ đạt mốc trần cup tối đa'
        : 'Chưa có dữ liệu',
      badge: hasMyPlayer ? 'Kịch bản xấu nhất' : null,
      badgeColor: 'bg-rose-500/10 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300 border-rose-500/30',
      accentGradient: 'from-rose-500 via-pink-500 to-purple-600',
      valueColor: 'text-rose-600 dark:text-rose-400',
      icon: ShieldWarning,
      iconColor: 'text-rose-500',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const IconComponent = card.icon
        return (
          <div
            key={card.label}
            className="hero-stat-card glass-panel group relative overflow-hidden rounded-xl border border-slate-200/80 p-5 shadow-sm dark:border-slate-800/80 cursor-default"
          >
            {/* Vạch Accent Glow ở mép trên */}
            <div
              className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${card.accentGradient} opacity-85 group-hover:h-[4px] group-hover:opacity-100 transition-all`}
            />

            {/* Icon lớn mờ chìm nghệ thuật ở góc thẻ */}
            <IconComponent
              weight="duotone"
              className={`pointer-events-none absolute -bottom-3 -right-3 h-24 w-24 opacity-[0.09] dark:opacity-[0.14] transition-transform duration-300 group-hover:scale-115 ${card.iconColor}`}
            />

            <div className="relative z-10 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              {card.badge && (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight select-none ${card.badgeColor}`}
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
  )
}
