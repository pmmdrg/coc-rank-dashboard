import type { Season, Player } from '../types'
import { calculateMaxPossibleCups, calculatePlayerRating } from './ranking'
import { getLeagueIconUrl } from './leagueIcons'

export interface SyncResult {
  season: Season
  playerName: string
  playerTag: string
  groupTag: string
  seasonId: string
  membersCount: number
}

/**
 * Đồng bộ dữ liệu bảng đấu Ranked từ Supercell API
 * @param inputTag Tag người chơi (mặc định #G9GRJCRPQ)
 */
export async function fetchRankedSeasonData(
  inputTag: string = 'G9GRJCRPQ',
  existingPlayersMap?: Map<string, Player>,
): Promise<SyncResult> {
  const cleanTag = inputTag.trim().toUpperCase()
  const formattedTag = cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`

  // 1. Lấy thông tin người chơi & group metadata
  const playerRes = await fetch(`/api/coc?path=${encodeURIComponent(`/players/${formattedTag}`)}`)
  if (!playerRes.ok) {
    const errData = await playerRes.json().catch(() => ({}))
    throw new Error(errData.error || `Không thể tải hồ sơ người chơi (${playerRes.status})`)
  }
  const playerData = await playerRes.json()

  const groupTag = playerData.currentLeagueGroupTag as string | undefined
  const seasonId = playerData.currentLeagueSeasonId ? String(playerData.currentLeagueSeasonId) : undefined

  if (!groupTag || !seasonId) {
    throw new Error(`Người chơi ${playerData.name || formattedTag} hiện chưa tham gia bảng đấu Ranked nào.`)
  }

  // 2. Lấy dữ liệu 100 người chơi trong bảng đấu
  const groupPath = `/leaguegroup/${encodeURIComponent(groupTag)}/${encodeURIComponent(seasonId)}?playerTag=${encodeURIComponent(formattedTag)}`
  const groupRes = await fetch(`/api/coc?path=${encodeURIComponent(groupPath)}`)
  if (!groupRes.ok) {
    const errData = await groupRes.json().catch(() => ({}))
    throw new Error(errData.error || `Không thể tải bảng đấu ${groupTag} (${groupRes.status})`)
  }
  const groupData = await groupRes.json()

  const maxAttacks = 24
  const maxDefenses = 24
  const members = Array.isArray(groupData.members) ? groupData.members : []

  // 3. Ánh xạ từng thành viên trong bảng đấu vào danh sách Player
  const players: Player[] = members.map((m: Record<string, unknown>, index: number) => {
    const tag = (m.playerTag as string) || `#PLAYER_${index + 1}`

    const atkWin = Number(m.attackWinCount) || 0
    const atkLose = Number(m.attackLoseCount) || 0
    const defWin = Number(m.defenseWinCount) || 0
    const defLose = Number(m.defenseLoseCount) || 0

    // Số lượt công = thắng + thua
    const attacks = atkWin + atkLose
    // Số lượt thủ = thắng + thua
    const defenses = defWin + defLose
    const currentCups = Number(m.leagueTrophies) || 0

    // Giữ nguyên % công và % thủ đã có trong bảng, không lấy từ nguồn khác làm mất data
    const existing = existingPlayersMap?.get(tag.toUpperCase()) || existingPlayersMap?.get(tag)
    const attackDestruction = existing?.attackDestruction ?? 0
    const defenseDestruction = existing?.defenseDestruction ?? 0

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
    )

    return {
      id: tag,
      name: (m.playerName as string) || tag,
      playerTag: tag,
      clanTag: (m.clanTag as string) || undefined,
      clanName: (m.clanName as string) || undefined,
      rank: index + 1,
      attacks,
      attackWinCount: atkWin,
      attackLoseCount: atkLose,
      defenses,
      defenseWinCount: defWin,
      defenseLoseCount: defLose,
      attackDestruction,
      defenseDestruction,
      currentCups,
      maxPossibleCups,
      rating,
      attackCups,
      defenseCups,
    }
  })

  // 5. Tạo đối tượng Season hoàn chỉnh với thời gian chuẩn từ Supercell API
  const leagueTier = playerData.leagueTier as {
    name?: string
    iconUrls?: { small?: string; large?: string; medium?: string; tiny?: string }
  } | undefined
  const leagueName = leagueTier?.name || 'Legend III'
  const rawIconUrl =
    leagueTier?.iconUrls?.small ||
    leagueTier?.iconUrls?.large ||
    leagueTier?.iconUrls?.medium ||
    leagueTier?.iconUrls?.tiny
  const leagueIconUrl = getLeagueIconUrl(leagueName, rawIconUrl)
  const seasonName = `Bảng đấu ${leagueName} (${groupTag})`
  const now = new Date()
  const syncedTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  // Phân tích thời gian mùa giải: ngày kết thúc luôn bằng ngày bắt đầu + 6 ngày
  const { startsAt, endsAt, displayPeriod } = parseSeasonDateRange(seasonId)

  const season: Season = {
    league: leagueName,
    leagueIconUrl,
    seasonName: seasonName || `Mùa giải ${displayPeriod}`,
    startsAt,
    endsAt,
    maxAttacks,
    maxDefenses,
    promotionCount: 10,
    demotionCount: 10,
    myPlayerId: formattedTag,
    players,
    leagueGroupTag: groupTag,
    leagueSeasonId: seasonId,
    lastSyncedAt: syncedTime,
  }

  return {
    season,
    playerName: playerData.name || 'Manax',
    playerTag: formattedTag,
    groupTag,
    seasonId,
    membersCount: players.length,
  }
}

/**
 * Phân tích ngày bắt đầu và kết thúc (kết thúc = bắt đầu + 6 ngày)
 */
export function parseSeasonDateRange(
  seasonId?: string | number,
  fallbackStartsAt?: string,
): { startsAt: string; endsAt: string; displayPeriod: string } {
  let startDate: Date | null = null

  if (fallbackStartsAt) {
    const parts = fallbackStartsAt.split('-').map(Number)
    if (parts.length === 3 && parts[0] > 2000) {
      startDate = new Date(parts[0], parts[1] - 1, parts[2])
    } else {
      const parsed = new Date(fallbackStartsAt)
      if (!isNaN(parsed.getTime())) startDate = parsed
    }
  }

  if (!startDate && seasonId) {
    const idStr = String(seasonId).trim()
    if (idStr.startsWith('v2-')) {
      const parsed = new Date(idStr.slice(3))
      if (!isNaN(parsed.getTime())) startDate = parsed
    } else {
      const numSec = Number(idStr)
      if (!isNaN(numSec) && numSec > 1000000000) {
        startDate = new Date(numSec * 1000)
      } else {
        const parsed = new Date(idStr)
        if (!isNaN(parsed.getTime())) startDate = parsed
      }
    }
  }

  if (!startDate || isNaN(startDate.getTime())) {
    startDate = new Date()
  }

  // Ngày kết thúc luôn là 6 ngày sau ngày bắt đầu (ví dụ 22/09 thì kết thúc là 28/09)
  const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)

  const formatIso = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatVn = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const startsAt = formatIso(startDate)
  const endsAt = formatIso(endDate)
  const displayPeriod = `${formatVn(startDate)} - ${formatVn(endDate)}`

  return { startsAt, endsAt, displayPeriod }
}

export interface LeagueSeasonOption {
  seasonId: string
  label: string
  startsAt: string
  endsAt: string
  displayPeriod: string
}

/**
 * Lấy danh sách mùa giải từ Supercell API (/leagues/29000022/seasons),
 * lọc theo tiền tố "v2" và tối đa 30 ngày trước.
 */
export async function fetchLeagueSeasonList(leagueId: string = '29000022'): Promise<LeagueSeasonOption[]> {
  const res = await fetch(`/api/coc?path=${encodeURIComponent(`/leagues/${leagueId}/seasons`)}`)
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Không thể tải danh sách mùa giải (${res.status})`)
  }
  const data = await res.json()
  const items = Array.isArray(data.items) ? data.items : []

  // Lọc các mùa giải có tiền tố v2
  const v2Items = items.filter((item: { id?: string }) => typeof item.id === 'string' && item.id.startsWith('v2'))

  const now = new Date()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  const thirtyDaysAgo = new Date(now.getTime() - thirtyDaysMs)

  // Lọc tối đa 30 ngày trước (tức ngày bắt đầu >= thirtyDaysAgo)
  const filtered = v2Items.filter((item: { id: string }) => {
    const dateStr = item.id.replace(/^v2-/, '')
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return false
    return d.getTime() >= thirtyDaysAgo.getTime()
  })

  // Nếu không có mùa nào trong 30 ngày qua, lấy mùa v2 gần nhất để không bị rỗng
  const finalItems = filtered.length > 0 ? filtered : v2Items.slice(-2)

  return finalItems
    .map((item: { id: string }) => {
      const { startsAt, endsAt, displayPeriod } = parseSeasonDateRange(item.id)
      return {
        seasonId: item.id,
        label: `Mùa giải ${displayPeriod}`,
        startsAt,
        endsAt,
        displayPeriod,
      }
    })
    .reverse()
}

/**
 * Tải bảng xếp hạng người chơi của mùa giải theo seasonId (/leagues/29000022/seasons/{seasonId})
 */
export async function fetchSeasonRankings(
  seasonId: string,
  leagueId: string = '29000022',
  myPlayerTag?: string,
): Promise<Season> {
  const res = await fetch(`/api/coc?path=${encodeURIComponent(`/leagues/${leagueId}/seasons/${seasonId}?limit=100`)}`)
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Không thể tải bảng xếp hạng mùa giải ${seasonId} (${res.status})`)
  }
  const data = await res.json()
  const items = Array.isArray(data.items) ? data.items : []

  const { startsAt, endsAt, displayPeriod } = parseSeasonDateRange(seasonId)
  const maxAttacks = 24
  const maxDefenses = 24

  const players: Player[] = items.map((m: Record<string, unknown>, index: number) => {
    const tag = (m.tag as string) || `#PLAYER_${index + 1}`
    const attacks = Number(m.attackWins) || 0
    const defenses = Number(m.defenseWins) || 0
    const currentCups = Number(m.trophies) || 0
    const attackDestruction = 0
    const defenseDestruction = 0

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
    )

    const clan = m.clan as { tag?: string; name?: string } | undefined

    return {
      id: tag,
      name: (m.name as string) || tag,
      playerTag: tag,
      clanTag: clan?.tag,
      clanName: clan?.name,
      rank: Number(m.rank) || index + 1,
      attacks,
      attackWinCount: attacks,
      attackLoseCount: 0,
      defenses,
      defenseWinCount: defenses,
      defenseLoseCount: 0,
      attackDestruction,
      defenseDestruction,
      currentCups,
      maxPossibleCups,
      rating,
      attackCups,
      defenseCups,
    }
  })

  const firstTier = items[0]?.leagueTier as { name?: string; iconUrls?: { small?: string; large?: string } } | undefined
  const leagueName = firstTier?.name || 'Legend League'
  const leagueIconUrl = getLeagueIconUrl(leagueName, firstTier?.iconUrls?.small || firstTier?.iconUrls?.large)

  return {
    league: leagueName,
    leagueIconUrl,
    seasonName: `Mùa giải ${displayPeriod}`,
    startsAt,
    endsAt,
    maxAttacks,
    maxDefenses,
    promotionCount: 10,
    demotionCount: 10,
    myPlayerId: myPlayerTag || '',
    players,
    leagueSeasonId: seasonId,
    lastSyncedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }
}
