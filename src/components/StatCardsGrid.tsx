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
            <div className="mt-3 h-8 w-20 rounded bg-slate-300/80 dark:bg-slate-600/80" />
            <div className="mt-3 h-3 w-36 rounded bg-slate-200/80 dark:bg-slate-700/60" />
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Thứ hạng của tôi',
      value: hasMyPlayer ? `#${stats.myPlayer!.rank}` : '--',
      detail: hasMyPlayer
        ? `${stats.myPlayer!.name} • ${numberFormatter(stats.myPlayer!.currentCups)} cup`
        : 'Chưa có dữ liệu',
      highlightColor: 'text-blue-600 dark:text-sky-400',
    },
    {
      label: 'Số người chơi có thể vượt tôi',
      value: hasMyPlayer ? stats.playersWhoCanPassMe : '--',
      detail: hasMyPlayer
        ? `Cup tối đa của ${myPlayerName}: ${numberFormatter(stats.myPlayer!.maxPossibleCups)}`
        : 'Chưa có dữ liệu',
      highlightColor:
        hasMyPlayer && stats.playersWhoCanPassMe > 0
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Tổng người chơi',
      value: hasPlayers ? season.players.length : '--',
      detail:
        hasPlayers && (season.startsAt || season.endsAt)
          ? `${formatDate(season.startsAt)} - ${formatDate(season.endsAt)}`
          : 'Chưa có dữ liệu',
      highlightColor: 'text-slate-800 dark:text-slate-200',
    },
    {
      label: 'Rank thấp nhất có thể của tôi',
      value: hasMyPlayer && stats.lowestPossibleRank ? `#${stats.lowestPossibleRank}` : '--',
      detail: hasMyPlayer
        ? 'Nếu các đối thủ đạt trần cup vượt mức tối đa của bạn'
        : 'Chưa có dữ liệu',
      highlightColor: 'text-rose-600 dark:text-rose-400',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass-panel relative overflow-hidden rounded-xl p-5 shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {card.label}
          </p>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${card.highlightColor}`}>
            {card.value}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
            {card.detail}
          </p>
        </div>
      ))}
    </div>
  )
}
