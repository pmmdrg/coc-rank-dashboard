export type RatingCategory =
  | 'dominant'   // Từ 1200 cup đổ lên: Thống trị
  | 'superior'   // Từ 1000 tới dưới 1200 cup: Vượt trội
  | 'potential'  // Từ 800 tới dưới 1000 cup: Tiềm năng
  | 'alarm'      // Dưới 800 cup: Báo động

export interface LeagueHistoryItem {
  leagueSeasonId: number
  leagueTrophies: number
  leagueTierId: number
  placement: number
  attackWins: number
  attackLosses: number
  attackStars?: number
  defenseWins: number
  defenseLosses: number
  defenseStars?: number
  maxBattles: number
}

export interface BattleLogEntry {
  opponentPlayerTag: string
  opponentName?: string
  stars: number
  destructionPercentage: number
  trophies: number
  creationTime?: string
}

export type Player = {
  id: string
  name: string
  rank: number
  prevRank?: number
  rankDiff?: number // rankDiff = prevRank - rank (dương: tăng bậc, âm: hạ bậc)
  attacks: number
  defenses: number
  attackDestruction?: number
  defenseDestruction?: number
  currentCups: number
  maxPossibleCups: number
  rating: RatingCategory
  attackCups?: number
  defenseCups?: number
  // Thông tin từ CoC API
  playerTag?: string
  clanTag?: string
  clanName?: string
  attackWinCount?: number
  attackLoseCount?: number
  defenseWinCount?: number
  defenseLoseCount?: number
  // Nhật ký đối đầu trực tiếp (Battle logs)
  attackedByMe?: BattleLogEntry[]
  defendedAgainstMe?: BattleLogEntry[]
}

export interface RankChangeItem {
  id: string
  name: string
  playerTag?: string
  oldRank: number
  newRank: number
  rankDiff: number // oldRank - newRank (dương: tăng bậc, âm: hạ bậc)
  oldCups: number
  newCups: number
  cupsDiff: number
  oldAttacks?: number
  newAttacks?: number
  attacksDiff?: number
  oldDefenses?: number
  newDefenses?: number
  defensesDiff?: number
  isMe: boolean
}

export interface RankChangesSnapshot {
  seasonId?: string | number
  groupTag?: string
  updatedAt: string
  previousUpdatedAt?: string
  changes: RankChangeItem[]
}

export type Season = {
  league: string
  leagueIconUrl?: string
  seasonName: string
  startsAt: string
  endsAt: string
  maxAttacks?: number
  maxDefenses?: number
  promotionCount?: number
  demotionCount?: number
  myPlayerId: string
  players: Player[]
  // Thông tin bảng đấu CoC API
  leagueGroupTag?: string
  leagueSeasonId?: string | number
  lastSyncedAt?: string
  // Nhật ký đối đầu trực tiếp mùa giải
  attackLogs?: BattleLogEntry[]
  defenseLogs?: BattleLogEntry[]
}

export type AttackStatusCategory = 'finished' | 'inProgress' | 'notStarted'

export type RankingStats = {
  myPlayer?: Player
  playersWhoCanPassMe: number
  playersDefinitelyBelowMe: number
  lowestPossibleRank: number
  ratingCounts: Record<RatingCategory, number>
  attackStatusCounts: Record<AttackStatusCategory, number>
}

export type RankedSeason = Season & {
  players: Player[]
}

export type StorageFormat = 'json' | 'csv'

export type StorageDocument = {
  name: string
  format: StorageFormat
  season: Season
  seasons: Season[]
  activeSeasonIndex: number
}
