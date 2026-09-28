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
export async function fetchRankedSeasonData(inputTag: string = 'G9GRJCRPQ'): Promise<SyncResult> {
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

  // 2. Lấy dữ liệu 100 người chơi & Battle Logs trong bảng đấu
  const groupPath = `/leaguegroup/${encodeURIComponent(groupTag)}/${encodeURIComponent(seasonId)}?playerTag=${encodeURIComponent(formattedTag)}`
  const groupRes = await fetch(`/api/coc?path=${encodeURIComponent(groupPath)}`)
  if (!groupRes.ok) {
    const errData = await groupRes.json().catch(() => ({}))
    throw new Error(errData.error || `Không thể tải bảng đấu ${groupTag} (${groupRes.status})`)
  }
  const groupData = await groupRes.json()

  // 3. Tính toán tỉ lệ % phá huỷ trung bình công & thủ cho tài khoản của tôi từ Battle Logs
  let myAvgAtkDest = 0
  if (Array.isArray(groupData.attackLogs) && groupData.attackLogs.length > 0) {
    const totalDest = groupData.attackLogs.reduce(
      (sum: number, log: { destructionPercentage?: number }) => sum + (log.destructionPercentage || 0),
      0,
    )
    myAvgAtkDest = Math.round((totalDest / groupData.attackLogs.length) * 10) / 10
  }

  let myAvgDefDest = 0
  if (Array.isArray(groupData.defenseLogs) && groupData.defenseLogs.length > 0) {
    const totalDest = groupData.defenseLogs.reduce(
      (sum: number, log: { destructionPercentage?: number }) => sum + (log.destructionPercentage || 0),
      0,
    )
    myAvgDefDest = Math.round((totalDest / groupData.defenseLogs.length) * 10) / 10
  }

  const maxAttacks = 24
  const maxDefenses = 24
  const members = Array.isArray(groupData.members) ? groupData.members : []

  // 4. Ánh xạ từng thành viên trong bảng đấu vào danh sách Player
  const players: Player[] = members.map((m: Record<string, unknown>, index: number) => {
    const tag = (m.playerTag as string) || `#PLAYER_${index + 1}`
    const isMe = tag.toUpperCase() === formattedTag.toUpperCase()

    const atkWin = Number(m.attackWinCount) || 0
    const atkLose = Number(m.attackLoseCount) || 0
    const defWin = Number(m.defenseWinCount) || 0
    const defLose = Number(m.defenseLoseCount) || 0

    // Số lượt công = thắng + thua
    const attacks = atkWin + atkLose
    // Số lượt thủ = thắng + thua
    const defenses = defWin + defLose
    const currentCups = Number(m.leagueTrophies) || 0

    const attackDestruction = isMe ? myAvgAtkDest : 0
    const defenseDestruction = isMe ? myAvgDefDest : 0

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
