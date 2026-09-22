import type { Player, RankedSeason, RankingStats, RatingCategory, Season } from '../types'

export const ratingLabels: Record<RatingCategory, string> = {
  elite: 'Đỉnh',
  contested: 'Kỹ năng tốt',
  danger: 'Có tiềm năng',
  safe: 'Chưa đánh',
}

export const ratingStyles: Record<RatingCategory, string> = {
  elite: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  contested: 'bg-sky-50 text-sky-700 ring-sky-200',
  danger: 'bg-amber-50 text-amber-800 ring-amber-200',
  safe: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export const ratingColors: Record<RatingCategory, string> = {
  elite: '#10b981',
  contested: '#0284c7',
  danger: '#f59e0b',
  safe: '#64748b',
}

export function calculateMaxPossibleCups(
  currentCups: number,
  attacks: number,
  maxAttacks: number = 24,
): number {
  const remainingAttacks = Math.max(0, maxAttacks - Math.max(0, attacks))
  return Math.max(0, currentCups) + remainingAttacks * 40
}

export function calculatePlayerRating(currentCups: number, attacks: number): {
  rating: RatingCategory
  avgCupsPerAttack: number
} {
  if (attacks <= 0) {
    return { rating: 'safe', avgCupsPerAttack: 0 }
  }

  // Nếu cúp nhập theo mốc Legend League chuẩn game (>= 4000), lấy cúp kiếm thêm từ mốc 5000
  const effectiveCups = currentCups >= 4000 ? Math.max(0, currentCups - 5000) : Math.max(0, currentCups)
  const avgCupsPerAttack = effectiveCups / attacks

  if (avgCupsPerAttack >= 32) {
    return { rating: 'elite', avgCupsPerAttack }
  }
  if (avgCupsPerAttack >= 24) {
    return { rating: 'contested', avgCupsPerAttack }
  }
  return { rating: 'danger', avgCupsPerAttack }
}

export function sortAndRankPlayers(players: Player[]): Player[] {
  return [...players]
    .sort((a, b) => {
      const currentCupDiff = b.currentCups - a.currentCups
      if (currentCupDiff !== 0) return currentCupDiff

      const maxCupDiff = b.maxPossibleCups - a.maxPossibleCups
      if (maxCupDiff !== 0) return maxCupDiff

      return a.name.localeCompare(b.name)
    })
    .map((player, index) => ({ ...player, rank: index + 1 }))
}

export function formatLeagueName(league?: string): string {
  if (!league) return 'Legend 3'
  const trimmed = league.trim()
  if (trimmed.toLowerCase() === 'legend league') return 'Legend 3'
  return trimmed.replace(/\bleague\b/gi, 'League')
}

export function normalizeSeason(season: Season): RankedSeason {
  const maxAttacks = season.maxAttacks ?? 24
  const maxDefenses = season.maxDefenses ?? 24
  const promotionCount = season.promotionCount !== undefined ? season.promotionCount : 2
  const demotionCount = season.demotionCount !== undefined ? season.demotionCount : 1

  const updatedPlayers = season.players.map((p) => {
    const attacks = Math.min(maxAttacks, Math.max(0, p.attacks))
    const defenses = Math.min(maxDefenses, Math.max(0, p.defenses))
    const maxPossibleCups = calculateMaxPossibleCups(p.currentCups, attacks, maxAttacks)
    const { rating } = calculatePlayerRating(p.currentCups, attacks)

    return {
      ...p,
      attacks,
      defenses,
      maxPossibleCups,
      rating,
    }
  })

  const league = formatLeagueName(season.league)
  const seasonName =
    !season.seasonName ||
    season.seasonName === 'September 2026' ||
    season.seasonName.toLowerCase() === 'legend league'
      ? league
      : season.seasonName

  return {
    ...season,
    league,
    seasonName,
    maxAttacks,
    maxDefenses,
    promotionCount,
    demotionCount,
    players: sortAndRankPlayers(updatedPlayers),
  }
}

export function getRankingStats(season: Season): RankingStats {
  const rankedSeason = normalizeSeason(season)
  const myPlayer = rankedSeason.players.find((player) => player.id === season.myPlayerId)

  const ratingCounts = rankedSeason.players.reduce(
    (counts, player) => {
      counts[player.rating] += 1
      return counts
    },
    { safe: 0, contested: 0, danger: 0, elite: 0 } satisfies Record<RatingCategory, number>,
  )

  return {
    myPlayer,
    playersWhoCanPassMe: myPlayer
      ? rankedSeason.players.filter(
          (player) => player.id !== myPlayer.id && player.maxPossibleCups > myPlayer.maxPossibleCups,
        ).length
      : 0,
    playersDefinitelyBelowMe: myPlayer
      ? rankedSeason.players.filter(
          (player) => player.id !== myPlayer.id && player.maxPossibleCups <= myPlayer.maxPossibleCups,
        ).length
      : rankedSeason.players.length,
    lowestPossibleRank: myPlayer
      ? rankedSeason.players.filter(
          (player) => player.id !== myPlayer.id && player.maxPossibleCups > myPlayer.maxPossibleCups,
        ).length + 1
      : 0,
    ratingCounts,
  }
}

export function createPlayer(maxAttacks: number = 24): Player {
  return {
    id: crypto.randomUUID(),
    name: 'Người chơi mới',
    rank: 0,
    attacks: 0,
    defenses: 0,
    currentCups: 0,
    maxPossibleCups: maxAttacks * 40,
    rating: 'safe',
  }
}
