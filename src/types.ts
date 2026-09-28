export type RatingCategory =
  | 'outstanding'
  | 'elite'
  | 'good'
  | 'potential'
  | 'needs_effort'
  | 'not_good'
  | 'terrible'
  | 'safe'

export type Player = {
  id: string
  name: string
  rank: number
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
  driveFileId?: string
}

export type StorageAdapter = {
  open: () => Promise<StorageDocument>
  save: (document: StorageDocument) => Promise<StorageDocument>
  saveAs: (document: StorageDocument, format: StorageFormat) => Promise<StorageDocument>
  hasActiveFile: () => boolean
  canWriteBack: boolean
  label: string
}

export type StorageSource = 'local' | 'google-drive'

export type AutoSaveStatus = 'saved' | 'saving' | 'draft' | 'error'
