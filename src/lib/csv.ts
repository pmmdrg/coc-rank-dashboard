import type { Player, Season } from '../types'
import { normalizeSeason } from './ranking'

const csvColumns = [
  'league',
  'seasonName',
  'startsAt',
  'endsAt',
  'maxAttacks',
  'maxDefenses',
  'promotionCount',
  'demotionCount',
  'myPlayerId',
  'id',
  'name',
  'rank',
  'attacks',
  'attackDestruction',
  'defenses',
  'defenseDestruction',
  'currentCups',
  'maxPossibleCups',
  'rating',
] as const

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let insideQuotes = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    const nextChar = csv[index + 1]

    if (char === '"' && insideQuotes && nextChar === '"') {
      field += '"'
      index += 1
      continue
    }

    if (char === '"') {
      insideQuotes = !insideQuotes
      continue
    }

    if (char === ',' && !insideQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') index += 1
      row.push(field)
      if (row.some((value) => value.trim() !== '')) rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  row.push(field)
  if (row.some((value) => value.trim() !== '')) rows.push(row)

  return rows
}

function escapeCsv(value: string | number): string {
  const stringValue = String(value)
  return /[",\n\r]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue
}

function parseNumber(value: string): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function seasonsToCsv(seasons: Season[]): string {
  const allRows: string[] = [csvColumns.join(',')]

  seasons.forEach((season) => {
    const rankedSeason = normalizeSeason(season)
    rankedSeason.players.forEach((player) => {
      allRows.push(
        [
          rankedSeason.league,
          rankedSeason.seasonName,
          rankedSeason.startsAt,
          rankedSeason.endsAt,
          rankedSeason.maxAttacks ?? 24,
          rankedSeason.maxDefenses ?? 24,
          rankedSeason.promotionCount ?? 0,
          rankedSeason.demotionCount ?? 0,
          rankedSeason.myPlayerId,
          player.id,
          player.name,
          player.rank,
          player.attacks,
          (player.attackDestruction ?? 0).toFixed(1),
          player.defenses,
          (player.defenseDestruction ?? 0).toFixed(1),
          player.currentCups,
          player.maxPossibleCups,
          player.rating,
        ]
          .map(escapeCsv)
          .join(','),
      )
    })
  })

  return `${allRows.join('\n')}\n`
}

export function csvToSeasons(csv: string): Season[] {
  const rows = parseCsvRows(csv)
  const [headers, ...records] = rows
  if (!headers) {
    throw new Error('CSV không có header.')
  }

  // Nhóm người chơi theo seasonName
  const seasonMap = new Map<string, {
    league: string
    seasonName: string
    startsAt: string
    endsAt: string
    maxAttacks: number
    maxDefenses: number
    promotionCount: number
    demotionCount: number
    myPlayerId: string
    players: Player[]
  }>()

  records.forEach((record) => {
    const entry = Object.fromEntries(headers.map((header, index) => [header, record[index] ?? '']))
    const seasonName = entry.seasonName || 'Season'
    const league = entry.league || 'Legend 3'
    const startsAt = entry.startsAt || ''
    const endsAt = entry.endsAt || ''
    const maxAttacks = entry.maxAttacks ? parseNumber(entry.maxAttacks) : 24
    const maxDefenses = entry.maxDefenses ? parseNumber(entry.maxDefenses) : 24
    const promotionCount = entry.promotionCount ? parseNumber(entry.promotionCount) : 0
    const demotionCount = entry.demotionCount ? parseNumber(entry.demotionCount) : 0
    const myPlayerId = entry.myPlayerId || ''

    if (!seasonMap.has(seasonName)) {
      seasonMap.set(seasonName, {
        league,
        seasonName,
        startsAt,
        endsAt,
        maxAttacks,
        maxDefenses,
        promotionCount,
        demotionCount,
        myPlayerId,
        players: [],
      })
    }

    const currentSeason = seasonMap.get(seasonName)!
    const id = entry.id || crypto.randomUUID()

    const rawAtkDest = entry.attackDestruction ? parseNumber(entry.attackDestruction) : 0
    const attackDestruction = Math.min(100, Math.max(0, Math.round(rawAtkDest * 10) / 10))
    const rawDefDest = entry.defenseDestruction ? parseNumber(entry.defenseDestruction) : 0
    const defenseDestruction = Math.min(100, Math.max(0, Math.round(rawDefDest * 10) / 10))

    currentSeason.players.push({
      id,
      name: entry.name || 'Unnamed player',
      rank: parseNumber(entry.rank),
      attacks: parseNumber(entry.attacks),
      defenses: parseNumber(entry.defenses),
      attackDestruction,
      defenseDestruction,
      currentCups: parseNumber(entry.currentCups),
      maxPossibleCups: parseNumber(entry.maxPossibleCups),
      rating: ['safe', 'contested', 'danger', 'elite'].includes(entry.rating)
        ? (entry.rating as Player['rating'])
        : 'safe',
    })
  })

  if (seasonMap.size === 0) {
    throw new Error('Không tìm thấy dữ liệu mùa giải nào trong file CSV.')
  }

  return Array.from(seasonMap.values()).map((s) =>
    normalizeSeason({
      ...s,
      myPlayerId: s.myPlayerId || s.players[0]?.id || '',
    }),
  )
}
