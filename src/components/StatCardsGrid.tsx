import type { RankingStats, Season } from '../types'

interface StatCardsGridProps {
  stats: RankingStats
  season: Season
  myPlayerName: string
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

export function StatCardsGrid({ stats, season, myPlayerName }: StatCardsGridProps) {
  const cards = [
    {
      label: 'Thứ hạng của tôi',
      value: stats.myPlayer ? `#${stats.myPlayer.rank}` : '--',
      detail: stats.myPlayer
        ? `${stats.myPlayer.name} • ${numberFormatter(stats.myPlayer.currentCups)} cup`
        : 'Chưa chọn tài khoản',
      highlightColor: 'text-blue-600 dark:text-sky-400',
    },
    {
      label: 'Số người chơi có thể vượt tôi',
      value: stats.playersWhoCanPassMe,
      detail: `Cup tối đa của ${myPlayerName}: ${stats.myPlayer ? numberFormatter(stats.myPlayer.maxPossibleCups) : 0}`,
      highlightColor: stats.playersWhoCanPassMe > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Tổng người chơi',
      value: season.players.length,
      detail: `${formatDate(season.startsAt)} - ${formatDate(season.endsAt)}`,
      highlightColor: 'text-slate-800 dark:text-slate-200',
    },
    {
      label: 'Rank thấp nhất có thể của tôi',
      value: stats.lowestPossibleRank ? `#${stats.lowestPossibleRank}` : '--',
      detail: 'Nếu các đối thủ đạt trần cup vượt mức tối đa của bạn',
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
