import type { Player, RankedSeason, RankingStats, RatingCategory, Season } from '../types'

export const ratingLabels: Record<RatingCategory, string> = {
  elite: 'Đỉnh',
  contested: 'Kỹ năng tốt',
  danger: 'Có tiềm năng',
  safe: 'Chưa đánh',
}

export const ratingColors: Record<RatingCategory, string> = {
  elite: '#10b981',
  contested: '#0284c7',
  danger: '#f59e0b',
  safe: '#64748b',
}

function calculateMaxPossibleCups(
  currentCups: number,
  attacks: number,
  defenses: number = 0,
  maxAttacks: number = 24,
  maxDefenses: number = 24,
): number {
  const remainingAttacks = Math.max(0, maxAttacks - Math.max(0, attacks))
  const remainingDefenses = Math.max(0, maxDefenses - Math.max(0, defenses))
  return Math.max(0, currentCups) + remainingAttacks * 40 + remainingDefenses * 15
}

export function calculatePlayerRating(
  currentCups: number,
  attacks: number,
  attackDestruction: number = 0,
  _defenses: number = 0,
): {
  rating: RatingCategory
  avgCupsPerAttack: number
  attackCups: number
  defenseCups: number
  estimatedAttackCups: number
  estimatedDefenseCups: number
} {
  const effectiveCups = currentCups >= 4000 ? Math.max(0, currentCups - 5000) : Math.max(0, currentCups)

  if (attacks <= 0) {
    return {
      rating: 'safe',
      avgCupsPerAttack: 0,
      attackCups: 0,
      defenseCups: effectiveCups,
      estimatedAttackCups: 0,
      estimatedDefenseCups: effectiveCups,
    }
  }

  // Công thức: cup công = lượt công * 40 * % công / 100
  const rawAtkDest = Math.max(0, attackDestruction || 0)
  const attackCups = Math.round(attacks * 40 * (rawAtkDest / 100))

  // Công thức: cup thủ = cup hiện tại - cup công
  const defenseCups = effectiveCups - attackCups

  // Đánh giá được tính dựa theo số cup đánh chia cho số lượt đánh
  const avgCupsPerAttack = attacks > 0 ? attackCups / attacks : 0

  let rating: RatingCategory = 'danger'
  if (avgCupsPerAttack >= 32) {
    rating = 'elite'
  } else if (avgCupsPerAttack >= 24) {
    rating = 'contested'
  }

  return {
    rating,
    avgCupsPerAttack,
    attackCups,
    defenseCups,
    estimatedAttackCups: attackCups,
    estimatedDefenseCups: defenseCups,
  }
}

function sortAndRankPlayers(players: Player[]): Player[] {
  return [...players]
    .sort((a, b) => {
      // 1. Cúp hiện tại (cao hơn đứng trên)
      const currentCupDiff = b.currentCups - a.currentCups
      if (currentCupDiff !== 0) return currentCupDiff

      // 2. Tie-break: % Phá huỷ công (cao hơn đứng trên)
      const aAtkDest = a.attackDestruction ?? 0
      const bAtkDest = b.attackDestruction ?? 0
      const atkDestDiff = bAtkDest - aAtkDest
      if (Math.abs(atkDestDiff) >= 0.05) return atkDestDiff

      // 3. Tie-break: % Phá huỷ thủ (thấp hơn đứng trên - thủ tốt hơn)
      const aDefDest = a.defenseDestruction ?? 0
      const bDefDest = b.defenseDestruction ?? 0
      const defDestDiff = aDefDest - bDefDest
      if (Math.abs(defDestDiff) >= 0.05) return defDestDiff

      // 4. Tên theo bảng chữ cái A-Z
      const nameDiff = a.name.localeCompare(b.name)
      if (nameDiff !== 0) return nameDiff

      return a.id.localeCompare(b.id)
    })
    .map((player, index) => ({ ...player, rank: index + 1 }))
}

export function formatLeagueName(league?: string): string {
  if (!league) return 'Legend League'
  const trimmed = league.trim()
  return trimmed.replace(/\bleague\b/gi, 'League')
}

export function normalizeSeason(season: Season): RankedSeason {
  const safeSeason = season || ({} as Season)
  const maxAttacks = safeSeason.maxAttacks ?? 24
  const maxDefenses = safeSeason.maxDefenses ?? 24
  const promotionCount = safeSeason.promotionCount !== undefined ? safeSeason.promotionCount : 2
  const demotionCount = safeSeason.demotionCount !== undefined ? safeSeason.demotionCount : 1

  const playersList = Array.isArray(safeSeason.players) ? safeSeason.players : []
  const updatedPlayers = playersList.map((p, idx) => {
    const attacks = Math.min(maxAttacks, Math.max(0, Number(p.attacks) || 0))
    const defenses = Math.min(maxDefenses, Math.max(0, Number(p.defenses) || 0))
    const rawAtkDest = Number(p.attackDestruction)
    const attackDestruction = Number.isFinite(rawAtkDest)
      ? Math.min(100, Math.max(0, Math.round(rawAtkDest * 10) / 10))
      : 0
    const rawDefDest = Number(p.defenseDestruction)
    const defenseDestruction = Number.isFinite(rawDefDest)
      ? Math.min(100, Math.max(0, Math.round(rawDefDest * 10) / 10))
      : 0
    const currentCups = Math.max(0, Number(p.currentCups) || 0)
    const maxPossibleCups = calculateMaxPossibleCups(
      currentCups,
      attacks,
      defenses,
      maxAttacks,
      maxDefenses,
    )
    const { rating, attackCups, defenseCups } = calculatePlayerRating(
      currentCups,
      attacks,
      attackDestruction,
      defenses,
    )

    return {
      ...p,
      id: p.id || `p-${idx + 1}`,
      name: p.name || `Người chơi ${idx + 1}`,
      attacks,
      defenses,
      attackDestruction,
      defenseDestruction,
      currentCups,
      maxPossibleCups,
      rating,
      attackCups,
      defenseCups,
    }
  })

  const league = formatLeagueName(safeSeason.league)
  const seasonName = safeSeason.seasonName || league

  return {
    ...safeSeason,
    league,
    seasonName,
    maxAttacks,
    maxDefenses,
    promotionCount,
    demotionCount,
    myPlayerId: safeSeason.myPlayerId || updatedPlayers[0]?.id || '',
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

export function createPlayer(maxAttacks: number = 24, maxDefenses: number = 24): Player {
  return {
    id: crypto.randomUUID(),
    name: 'Người chơi mới',
    rank: 0,
    attacks: 0,
    defenses: 0,
    attackDestruction: 0,
    defenseDestruction: 0,
    currentCups: 0,
    maxPossibleCups: maxAttacks * 40 + maxDefenses * 15,
    rating: 'safe',
    attackCups: 0,
    defenseCups: 0,
  }
}
