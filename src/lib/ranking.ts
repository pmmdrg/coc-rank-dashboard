import type {
  AttackStatusCategory,
  Player,
  RankedSeason,
  RankingStats,
  RatingCategory,
  Season,
} from '../types'
import { getLeagueIconUrl } from './leagueIcons'

export const ratingLabels: Record<RatingCategory, string> = {
  outstanding: 'Thống trị',
  elite: 'Dẫn đầu',
  good: 'Vượt trội',
  potential: 'Cân bằng',
  needs_effort: 'Dưới chuẩn',
  not_good: 'Nguy cơ',
  terrible: 'Báo động',
  safe: 'Chưa tham gia',
}

export const ratingColors: Record<RatingCategory, string> = {
  outstanding: '#8b5cf6',
  elite: '#059669',
  good: '#0284c7',
  potential: '#0d9488',
  needs_effort: '#f59e0b',
  not_good: '#ea580c',
  terrible: '#e11d48',
  safe: '#64748b',
}

export const attackStatusLabels: Record<AttackStatusCategory, string> = {
  finished: 'Đã đánh xong',
  inProgress: 'Chưa đánh xong',
  notStarted: 'Chưa đánh lượt nào',
}

export function formatDestruction(val?: number): string {
  if (val === undefined || val === null || val <= 0) return ''
  return (Math.round(val * 10) / 10).toFixed(1)
}

export const attackStatusColors: Record<AttackStatusCategory, string> = {
  finished: '#10b981',
  inProgress: '#f59e0b',
  notStarted: '#64748b',
}

export function getCupsPerRemainingDefense(
  _defenses: number,
  _defenseDestruction?: number,
): number {
  return 40
}

export function calculateMaxPossibleCups(
  currentCups: number,
  attacks: number,
  defenses: number = 0,
  _defenseDestruction?: number,
  maxAttacks: number = 24,
  maxDefenses: number = 24,
): number {
  const remainingAttacks = Math.max(0, maxAttacks - Math.max(0, attacks))
  const remainingDefenses = Math.max(0, maxDefenses - Math.max(0, defenses))
  // Theo quyết định người dùng: Giả định các trận thủ còn lại đều được cộng 40 cúp (thủ thành công hoàn hảo)
  return Math.max(0, currentCups) + remainingAttacks * 40 + remainingDefenses * 40
}

export function calculatePlayerRating(
  currentCups: number,
  attacks: number = 0,
  _attackDestruction: number = 0,
  _defenses: number = 0,
  avgCups: number = 0,
): {
  rating: RatingCategory
  avgCupsPerAttack: number
  attackCups: number
  defenseCups: number
  estimatedAttackCups: number
  estimatedDefenseCups: number
} {
  if (currentCups <= 0 && attacks <= 0) {
    return {
      rating: 'safe',
      avgCupsPerAttack: 0,
      attackCups: 0,
      defenseCups: 0,
      estimatedAttackCups: 0,
      estimatedDefenseCups: 0,
    }
  }

  // Đánh giá dựa theo độ chênh lệch điểm cúp so với mức cúp trung bình của cả bảng đấu
  const diff = avgCups > 0 ? currentCups - avgCups : 0
  let rating: RatingCategory = 'potential'

  if (diff >= 80) {
    rating = 'outstanding' // Thống trị (+80 cúp so với TB bảng)
  } else if (diff >= 40) {
    rating = 'elite'       // Dẫn đầu (+40 cúp so với TB bảng)
  } else if (diff >= 10) {
    rating = 'good'        // Vượt trội (+10 cúp so với TB bảng)
  } else if (diff >= -15) {
    rating = 'potential'   // Cân bằng (quanh mức TB)
  } else if (diff >= -50) {
    rating = 'needs_effort'// Dưới chuẩn (-15 đến -50 cúp)
  } else if (diff >= -90) {
    rating = 'not_good'    // Nguy cơ (-50 đến -90 cúp)
  } else {
    rating = 'terrible'    // Báo động (< -90 cúp so với TB)
  }

  const avgCupsPerAttack = attacks > 0 ? Math.round((currentCups / attacks) * 10) / 10 : 0

  return {
    rating,
    avgCupsPerAttack,
    attackCups: currentCups,
    defenseCups: 0,
    estimatedAttackCups: currentCups,
    estimatedDefenseCups: 0,
  }
}

function sortAndRankPlayers(players: Player[]): Player[] {
  return [...players]
    .sort((a, b) => {
      // 1. Cúp hiện tại (cao hơn đứng trên)
      const currentCupDiff = b.currentCups - a.currentCups
      if (currentCupDiff !== 0) return currentCupDiff

      // 2. Tie-break: Thắng công nhiều hơn (nếu có dữ liệu CoC API)
      const aAtkWins = a.attackWinCount ?? 0
      const bAtkWins = b.attackWinCount ?? 0
      if (bAtkWins !== aAtkWins) return bAtkWins - aAtkWins

      // 3. Tie-break: Đánh ít trận hơn (hiệu suất cúp cao hơn)
      if (a.attacks !== b.attacks) return a.attacks - b.attacks

      // 4. Tên theo bảng chữ cái A-Z
      const nameDiff = a.name.localeCompare(b.name)
      if (nameDiff !== 0) return nameDiff

      return a.id.localeCompare(b.id)
    })
    .map((player, index) => ({ ...player, rank: index + 1 }))
}

export function formatLeagueName(league?: string): string {
  if (!league || league === '--') return '--'
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
  const activeCups = playersList
    .map((p) => Math.max(0, Number(p.currentCups) || 0))
    .filter((c) => c > 0)
  const avgCups =
    activeCups.length > 0
      ? Math.round(activeCups.reduce((a, b) => a + b, 0) / activeCups.length)
      : 0

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
      defenseDestruction,
      maxAttacks,
      maxDefenses,
    )
    const { rating, attackCups, defenseCups } = calculatePlayerRating(
      currentCups,
      attacks,
      attackDestruction,
      defenses,
      avgCups,
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
    leagueIconUrl: getLeagueIconUrl(league, safeSeason.leagueIconUrl),
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
  const maxAttacks = rankedSeason.maxAttacks ?? 24
  const targetMyTag = (season.myPlayerId || '').trim().toUpperCase().replace(/^#/, '')
  const myPlayer = rankedSeason.players.find((player) => {
    const pId = (player.id || '').toUpperCase().replace(/^#/, '')
    const pTag = (player.playerTag || '').toUpperCase().replace(/^#/, '')
    return Boolean(targetMyTag && (pId === targetMyTag || pTag === targetMyTag))
  })

  const ratingCounts = rankedSeason.players.reduce(
    (counts, player) => {
      counts[player.rating] += 1
      return counts
    },
    {
      outstanding: 0,
      elite: 0,
      good: 0,
      potential: 0,
      needs_effort: 0,
      not_good: 0,
      terrible: 0,
      safe: 0,
    } satisfies Record<RatingCategory, number>,
  )

  const attackStatusCounts = rankedSeason.players.reduce(
    (counts, player) => {
      if (player.attacks <= 0) {
        counts.notStarted += 1
      } else if (player.attacks >= maxAttacks) {
        counts.finished += 1
      } else {
        counts.inProgress += 1
      }
      return counts
    },
    { finished: 0, inProgress: 0, notStarted: 0 } satisfies Record<AttackStatusCategory, number>,
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
    attackStatusCounts,
  }
}

export function createPlayer(maxAttacks: number = 24, _maxDefenses: number = 24): Player {
  return {
    id: crypto.randomUUID(),
    name: 'Người chơi mới',
    rank: 0,
    attacks: 0,
    defenses: 0,
    attackDestruction: 0,
    defenseDestruction: 0,
    currentCups: 0,
    maxPossibleCups: maxAttacks * 40,
    rating: 'safe',
    attackCups: 0,
    defenseCups: 0,
  }
}
