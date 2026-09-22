import type { Season } from '../types'

function getDefaultSeasonDates(): { startsAt: string; endsAt: string; seasonName: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed

  const y = year
  const m = String(month + 1).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()

  return {
    startsAt: `${y}-${m}-01`,
    endsAt: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
    seasonName: `Tháng ${month + 1}/${year}`,
  }
}

const defaultDates = getDefaultSeasonDates()

export const sampleSeason: Season = {
  league: 'Legend League',
  seasonName: defaultDates.seasonName,
  startsAt: defaultDates.startsAt,
  endsAt: defaultDates.endsAt,
  maxAttacks: 24,
  maxDefenses: 24,
  promotionCount: 2,
  demotionCount: 1,
  myPlayerId: 'p-01',
  players: [
    {
      id: 'p-01',
      name: 'Tài khoản của tôi',
      rank: 1,
      attacks: 0,
      defenses: 0,
      currentCups: 5000,
      maxPossibleCups: 5960,
      rating: 'safe',
    },
  ],
}
