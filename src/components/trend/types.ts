export interface ProcessedSeasonPoint {
  seasonId: number
  displayPeriod: string
  tierName: string
  tierNumber: number
  placement: number
  trophies: number
  attackWins: number
  attackLosses: number
  totalAttacks: number
  attackWinRate: number
  defenseWins: number
  defenseLosses: number
  totalDefenses: number
  defenseStars: number
  maxBattles: number
}

export interface OverallStats {
  latest: ProcessedSeasonPoint
  bestRankSeason: ProcessedSeasonPoint
  bestCupsSeason: ProcessedSeasonPoint
  totalWins: number
  totalAtks: number
  overallWinRate: number
}
