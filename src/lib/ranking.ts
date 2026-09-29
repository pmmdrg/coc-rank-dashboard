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
  dominant: 'Thống trị',
  superior: 'Vượt trội',
  potential: 'Tiềm năng',
  alarm: 'Báo động',
}

export const ratingColors: Record<RatingCategory, string> = {
  dominant: '#8b5cf6', // Tím (Thống trị - >= 1200 cup)
  superior: '#10b981', // Xanh lục (Vượt trội - 1000 đến < 1200 cup)
  potential: '#0284c7', // Xanh lam (Tiềm năng - 800 đến < 1000 cup)
  alarm: '#e11d48',    // Đỏ hồng (Báo động - < 800 cup)
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
  _avgCups: number = 0,
): {
  rating: RatingCategory
  avgCupsPerAttack: number
  attackCups: number
  defenseCups: number
  estimatedAttackCups: number
  estimatedDefenseCups: number
} {
  // Bộ đánh giá theo đề xuất thực tế mùa giải:
  // - Nhóm từ 1200 cup đổ lên: Thống trị
  // - Nhóm từ 1000 tới dưới 1200 cup: Vượt trội
  // - Nhóm từ 800 tới dưới 1000 cup: Tiềm năng
  // - Nhóm dưới 800 cup: Báo động
  let rating: RatingCategory = 'alarm'

  if (currentCups >= 1200) {
    rating = 'dominant'
  } else if (currentCups >= 1000) {
    rating = 'superior'
  } else if (currentCups >= 800) {
    rating = 'potential'
  } else {
    rating = 'alarm'
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
    .map((player, index) => {
      const rank = index + 1
      const prevRank = player.prevRank
      const rankDiff = prevRank !== undefined && prevRank > 0 ? prevRank - rank : undefined
      return {
        ...player,
        rank,
        prevRank,
        rankDiff,
      }
    })
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
      dominant: 0,
      superior: 0,
      potential: 0,
      alarm: 0,
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

const LEAGUE_RULES_STORAGE_KEY = 'coc_league_rules'

export function getLeagueRuleKey(leagueIdentifier?: string | number): string {
  if (!leagueIdentifier) return ''
  return String(leagueIdentifier).trim().toLowerCase().replace(/\s+/g, '')
}

export function saveLeagueRules(
  leagueIdentifier: string | number,
  rules: { promotionCount: number; demotionCount: number },
) {
  const key = getLeagueRuleKey(leagueIdentifier)
  if (!key || key === '--') return
  try {
    const raw = localStorage.getItem(LEAGUE_RULES_STORAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[key] = {
      promotionCount: rules.promotionCount,
      demotionCount: rules.demotionCount,
    }
    localStorage.setItem(LEAGUE_RULES_STORAGE_KEY, JSON.stringify(map))
  } catch (err) {
    console.warn('Lỗi lưu quy tắc giải đấu vào localStorage:', err)
  }
}

export function getSavedLeagueRules(
  leagueIdentifier?: string | number,
): { promotionCount: number; demotionCount: number } | null {
  const key = getLeagueRuleKey(leagueIdentifier)
  if (!key || key === '--') return null
  try {
    const raw = localStorage.getItem(LEAGUE_RULES_STORAGE_KEY)
    if (!raw) return null
    const map = JSON.parse(raw)
    return map[key] || null
  } catch {
    return null
  }
}

