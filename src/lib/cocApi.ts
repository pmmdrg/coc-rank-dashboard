import type { Season, Player } from '../types'
import { calculateMaxPossibleCups, calculatePlayerRating } from './ranking'

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

  // 5. Tạo đối tượng Season hoàn chỉnh
  const leagueName = (playerData.leagueTier?.name as string) || 'Legend III'
  const seasonName = `Bảng đấu ${leagueName} (${groupTag})`
  const now = new Date()
  const syncedTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const season: Season = {
    league: leagueName,
    seasonName,
    startsAt: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    endsAt: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
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
