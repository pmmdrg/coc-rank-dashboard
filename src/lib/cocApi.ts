import type {
  Season,
  Player,
  LeagueHistoryItem,
  BattleLogEntry,
  ClanData,
  ClanMember,
  PlayerTournamentRankInfo,
} from '../types'
import { calculateMaxPossibleCups, calculatePlayerRating, getSavedLeagueRules } from './ranking'
import { getLeagueIconUrl } from './leagueIcons'
import { getRankedTierMaxAttacks, type RankedTierDefinition } from '../data/rankedTierMetadata'

export interface SyncResult {
  currentSeason: Season
  previousSeason?: Season
  playerName: string
  playerTag: string
  clanTag?: string
  clanName?: string
  groupTag: string
  seasonId: string
  membersCount: number
  leagueHistory?: LeagueHistoryItem[]
}

/**
 * Tự động xác định số lượt đánh/thủ tối đa của bảng đấu dựa theo Metadata Tier và số liệu bảng đấu
 */
export function detectMaxAttacksAndDefenses(
  members: Record<string, unknown>[],
  leagueIdentifier?: string | number,
  seasonDateInfo?: { startsAt?: string; endsAt?: string },
): {
  maxAttacks: number
  maxDefenses: number
  matchedTier?: RankedTierDefinition
} {
  let maxObservedAttacks = 0
  let maxObservedDefenses = 0

  for (const m of members) {
    const atk = (Number(m.attackWinCount) || 0) + (Number(m.attackLoseCount) || 0)
    const def = (Number(m.defenseWinCount) || 0) + (Number(m.defenseLoseCount) || 0)
    if (atk > maxObservedAttacks) maxObservedAttacks = atk
    if (def > maxObservedDefenses) maxObservedDefenses = def
  }

  const maxObserved = Math.max(maxObservedAttacks, maxObservedDefenses)

  return getRankedTierMaxAttacks(leagueIdentifier, {
    startsAt: seasonDateInfo?.startsAt,
    endsAt: seasonDateInfo?.endsAt,
    observedMaxAttacks: maxObserved,
  })
}

/**
 * Ánh xạ danh sách thành viên từ Supercell API sang danh sách Player của dashboard,
 * đồng thời đối chiếu attackLogs & defenseLogs để gắn thông tin đối đầu
 */
function mapMembersToPlayers(
  members: Record<string, unknown>[],
  maxAttacks: number = 24,
  maxDefenses: number = 24,
  existingPlayersMap?: Map<string, Player>,
  attackLogs: BattleLogEntry[] = [],
  defenseLogs: BattleLogEntry[] = [],
): Player[] {
  const activeCups = members.map((m) => Number(m.leagueTrophies) || 0).filter((c) => c > 0)
  const avgCups = activeCups.length > 0 ? Math.round(activeCups.reduce((a, b) => a + b, 0) / activeCups.length) : 0

  const attackMap = new Map<string, BattleLogEntry[]>()
  for (const log of attackLogs) {
    const key = (log.opponentPlayerTag || '').toUpperCase().replace(/^#/, '')
    if (!attackMap.has(key)) attackMap.set(key, [])
    attackMap.get(key)!.push(log)
  }

  const defenseMap = new Map<string, BattleLogEntry[]>()
  for (const log of defenseLogs) {
    const key = (log.opponentPlayerTag || '').toUpperCase().replace(/^#/, '')
    if (!defenseMap.has(key)) defenseMap.set(key, [])
    defenseMap.get(key)!.push(log)
  }

  return members.map((m: Record<string, unknown>, index: number) => {
    const tag = (m.playerTag as string) || `#PLAYER_${index + 1}`
    const cleanTagUpper = tag.toUpperCase().replace(/^#/, '')

    const atkWin = Number(m.attackWinCount) || 0
    const atkLose = Number(m.attackLoseCount) || 0
    const defWin = Number(m.defenseWinCount) || 0
    const defLose = Number(m.defenseLoseCount) || 0

    // Số lượt công = thắng + thua
    const attacks = atkWin + atkLose
    // Số lượt thủ = thắng + thua
    const defenses = defWin + defLose
    const currentCups = Number(m.leagueTrophies) || 0

    // Nhật ký đối đầu trực tiếp
    const attackedByMe = attackMap.get(cleanTagUpper)
    const defendedAgainstMe = defenseMap.get(cleanTagUpper)

    // Giữ nguyên % công và % thủ đã có trong bảng, hoặc tính từ nhật ký đối đầu nếu có
    const existing = existingPlayersMap?.get(tag.toUpperCase()) || existingPlayersMap?.get(tag)
    const attackDestruction = existing?.attackDestruction ?? (
      attackedByMe && attackedByMe.length > 0
        ? Math.round(attackedByMe.reduce((sum, a) => sum + (a.destructionPercentage || 0), 0) / attackedByMe.length)
        : 0
    )
    const defenseDestruction = existing?.defenseDestruction ?? (
      defendedAgainstMe && defendedAgainstMe.length > 0
        ? Math.round(defendedAgainstMe.reduce((sum, d) => sum + (d.destructionPercentage || 0), 0) / defendedAgainstMe.length)
        : 0
    )
    const prevRank = existing && existing.rank > 0 ? existing.rank : undefined

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
      id: tag,
      name: (m.playerName as string) || tag,
      playerTag: tag,
      clanTag: (m.clanTag as string) || undefined,
      clanName: (m.clanName as string) || undefined,
      rank: index + 1,
      prevRank,
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
      attackedByMe,
      defendedAgainstMe,
    }
  })
}

/**
 * Đồng bộ dữ liệu bảng đấu Ranked (mùa hiện tại & mùa ngay trước đó) từ Supercell API
 * @param inputTag Tag người chơi
 */
export async function fetchRankedSeasonData(
  inputTag: string,
  existingPlayersMap?: Map<string, Player>,
): Promise<SyncResult> {
  const cleanTag = inputTag.trim().toUpperCase()
  if (!cleanTag) {
    throw new Error('Vui lòng nhập Player Tag để tải dữ liệu bảng đấu.')
  }
  const formattedTag = cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`

  // 1. Lấy thông tin người chơi & lịch sử giải đấu song song
  const [playerRes, historyRes] = await Promise.all([
    fetch(`/api/coc?path=${encodeURIComponent(`/players/${formattedTag}`)}`),
    fetch(`/api/coc?path=${encodeURIComponent(`/players/${formattedTag}/leaguehistory`)}`).catch(() => null),
  ])

  if (!playerRes.ok) {
    const errData = await playerRes.json().catch(() => ({}))
    throw new Error(errData.error || `Không thể tải hồ sơ người chơi (${playerRes.status})`)
  }
  const playerData = await playerRes.json()

  let leagueHistory: LeagueHistoryItem[] = []
  if (historyRes?.ok) {
    const historyData = await historyRes.json().catch(() => null)
    if (Array.isArray(historyData?.items)) {
      leagueHistory = historyData.items
    }
  }

  const groupTag = playerData.currentLeagueGroupTag as string | undefined
  const seasonId = playerData.currentLeagueSeasonId ? String(playerData.currentLeagueSeasonId) : undefined

  if (!groupTag || !seasonId) {
    throw new Error(`Người chơi ${playerData.name || formattedTag} hiện chưa tham gia bảng đấu Ranked nào.`)
  }

  // 2. Lấy icon giải đấu
  const leagueTier = playerData.leagueTier as {
    id?: number
    name?: string
    iconUrls?: { small?: string; large?: string; medium?: string; tiny?: string }
  } | undefined
  const leagueName = leagueTier?.name || '--'
  const rawIconUrl =
    leagueTier?.iconUrls?.small ||
    leagueTier?.iconUrls?.large ||
    leagueTier?.iconUrls?.medium ||
    leagueTier?.iconUrls?.tiny
  const leagueIconUrl = getLeagueIconUrl(leagueName, rawIconUrl)
  const now = new Date()
  const syncedTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  // 3. Lấy dữ liệu 100 người chơi trong bảng đấu mùa hiện tại
  const groupPath = `/leaguegroup/${encodeURIComponent(groupTag)}/${encodeURIComponent(seasonId)}?playerTag=${encodeURIComponent(formattedTag)}`
  const groupRes = await fetch(`/api/coc?path=${encodeURIComponent(groupPath)}`)
  if (!groupRes.ok) {
    const errData = await groupRes.json().catch(() => ({}))
    throw new Error(errData.error || `Không thể tải bảng đấu ${groupTag} (${groupRes.status})`)
  }
  const groupData = await groupRes.json()
  const currentMembers = Array.isArray(groupData.members) ? groupData.members : []
  const currentAttackLogs: BattleLogEntry[] = Array.isArray(groupData.attackLogs) ? groupData.attackLogs : []
  const currentDefenseLogs: BattleLogEntry[] = Array.isArray(groupData.defenseLogs) ? groupData.defenseLogs : []
  const currentPeriod = parseSeasonDateRange(seasonId)
  const currentLimits = detectMaxAttacksAndDefenses(currentMembers, leagueTier?.id || leagueName, currentPeriod)
  const currentPlayers = mapMembersToPlayers(
    currentMembers,
    currentLimits.maxAttacks,
    currentLimits.maxDefenses,
    existingPlayersMap,
    currentAttackLogs,
    currentDefenseLogs,
  )

  const savedCurrentRules =
    getSavedLeagueRules(leagueName) ||
    getSavedLeagueRules(currentLimits.matchedTier?.name) ||
    getSavedLeagueRules(currentLimits.matchedTier?.id)
  const currentPromotionCount = savedCurrentRules?.promotionCount ?? 10
  const currentDemotionCount = savedCurrentRules?.demotionCount ?? 10

  const currentSeason: Season = {
    league: leagueName,
    leagueIconUrl,
    seasonName: `Mùa giải hiện tại (${currentPeriod.displayPeriod})`,
    startsAt: currentPeriod.startsAt,
    endsAt: currentPeriod.endsAt,
    maxAttacks: currentLimits.maxAttacks,
    maxDefenses: currentLimits.maxDefenses,
    promotionCount: currentPromotionCount,
    demotionCount: currentDemotionCount,
    myPlayerId: formattedTag,
    players: currentPlayers,
    leagueGroupTag: groupTag,
    leagueSeasonId: seasonId,
    lastSyncedAt: syncedTime,
    attackLogs: currentAttackLogs,
    defenseLogs: currentDefenseLogs,
  }

  // 4. Lấy dữ liệu bảng đấu mùa ngay trước đó (nếu có)
  let previousSeason: Season | undefined = undefined
  const prevGroupTag = playerData.previousLeagueGroupTag as string | undefined
  const prevSeasonId = playerData.previousLeagueSeasonId ? String(playerData.previousLeagueSeasonId) : undefined

  if (prevGroupTag && prevSeasonId) {
    try {
      const prevPath = `/leaguegroup/${encodeURIComponent(prevGroupTag)}/${encodeURIComponent(prevSeasonId)}?playerTag=${encodeURIComponent(formattedTag)}`
      const prevRes = await fetch(`/api/coc?path=${encodeURIComponent(prevPath)}`)
      if (prevRes.ok) {
        const prevData = await prevRes.json()
        const prevMembers = Array.isArray(prevData.members) ? prevData.members : []
        const prevAttackLogs: BattleLogEntry[] = Array.isArray(prevData.attackLogs) ? prevData.attackLogs : []
        const prevDefenseLogs: BattleLogEntry[] = Array.isArray(prevData.defenseLogs) ? prevData.defenseLogs : []
        const prevPeriod = parseSeasonDateRange(prevSeasonId)

        // Tra cứu tier ID chính thức của mùa trước từ lịch sử giải đấu leagueHistory
        const prevHistItem = leagueHistory.find((item) => String(item.leagueSeasonId) === String(prevSeasonId))
        const prevTierId = prevHistItem?.leagueTierId

        const prevLimits = detectMaxAttacksAndDefenses(prevMembers, prevTierId || leagueName, prevPeriod)
        const prevPlayers = mapMembersToPlayers(
          prevMembers,
          prevLimits.maxAttacks,
          prevLimits.maxDefenses,
          existingPlayersMap,
          prevAttackLogs,
          prevDefenseLogs,
        )

        const prevLeagueName =
          prevLimits.matchedTier?.name ||
          (prevTierId ? `Cấp bậc #${prevTierId}` : leagueName)
        const savedPrevRules =
          getSavedLeagueRules(prevLeagueName) ||
          getSavedLeagueRules(prevLimits.matchedTier?.name) ||
          getSavedLeagueRules(prevLimits.matchedTier?.id)
        const prevPromotionCount = savedPrevRules?.promotionCount ?? 10
        const prevDemotionCount = savedPrevRules?.demotionCount ?? 10

        previousSeason = {
          league: prevLeagueName,
          leagueIconUrl: getLeagueIconUrl(prevLeagueName),
          seasonName: `Mùa giải trước (${prevPeriod.displayPeriod})`,
          startsAt: prevPeriod.startsAt,
          endsAt: prevPeriod.endsAt,
          maxAttacks: prevLimits.maxAttacks,
          maxDefenses: prevLimits.maxDefenses,
          promotionCount: prevPromotionCount,
          demotionCount: prevDemotionCount,
          myPlayerId: formattedTag,
          players: prevPlayers,
          leagueGroupTag: prevGroupTag,
          leagueSeasonId: prevSeasonId,
          lastSyncedAt: syncedTime,
          attackLogs: prevAttackLogs,
          defenseLogs: prevDefenseLogs,
        }
      }
    } catch (err) {
      console.warn('Không thể tải bảng đấu mùa giải trước:', err)
    }
  }

  return {
    currentSeason,
    previousSeason,
    playerName: playerData.name || '',
    playerTag: formattedTag,
    clanTag: (playerData.clan?.tag as string) || undefined,
    clanName: (playerData.clan?.name as string) || undefined,
    groupTag,
    seasonId,
    membersCount: currentPlayers.length,
    leagueHistory,
  }
}

/**
 * Lấy dữ liệu chi tiết Clan và danh sách thành viên từ Supercell API
 * @param inputClanTag Tag của Clan (ví dụ: #QVGJR2C9 hoặc QVGJR2C9)
 */
export async function fetchClanData(inputClanTag: string): Promise<ClanData> {
  const cleanTag = inputClanTag.trim().toUpperCase()
  if (!cleanTag) {
    throw new Error('Vui lòng nhập Clan Tag để tải thông tin.')
  }
  const formattedTag = cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`
  const encodedTag = encodeURIComponent(formattedTag)
  const res = await fetch(`/api/coc?path=${encodeURIComponent(`/clans/${encodedTag}`)}`)
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Không thể tải thông tin Clan ${formattedTag} (${res.status})`)
  }
  const data = (await res.json()) as Record<string, any>

  const now = new Date()
  const syncedTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const memberList: ClanMember[] = Array.isArray(data.memberList)
    ? data.memberList.map((m: any, idx: number) => ({
        tag: m.tag || `#MEMBER_${idx + 1}`,
        name: m.name || 'Member',
        role: m.role || 'member',
        townHallLevel: Number(m.townHallLevel) || 1,
        expLevel: Number(m.expLevel) || 1,
        clanRank: Number(m.clanRank) || idx + 1,
        previousClanRank: Number(m.previousClanRank) || Number(m.clanRank) || idx + 1,
        trophies: Number(m.trophies) || 0,
        builderBaseTrophies: Number(m.builderBaseTrophies) || 0,
        donations: Number(m.donations) || 0,
        donationsReceived: Number(m.donationsReceived) || 0,
        league: m.league,
        leagueTier: m.leagueTier,
      }))
    : []

  // Đảm bảo danh sách được sắp xếp theo clanRank tăng dần (#1 -> #50)
  memberList.sort((a, b) => a.clanRank - b.clanRank)

  return {
    tag: data.tag || formattedTag,
    name: data.name || 'Clan',
    type: data.type || '',
    description: data.description,
    clanLevel: Number(data.clanLevel) || 1,
    clanPoints: Number(data.clanPoints) || 0,
    clanBuilderBasePoints: Number(data.clanBuilderBasePoints) || 0,
    clanCapitalPoints: Number(data.clanCapitalPoints) || 0,
    members: Number(data.members) || memberList.length,
    badgeUrls: data.badgeUrls || {},
    warLeague: data.warLeague,
    memberList,
    lastSyncedAt: syncedTime,
  }
}

/**
 * Gọi API tra cứu riêng thông tin thứ hạng bảng đấu của một người chơi trong Clan
 * mà không làm thay đổi thông tin dashboard hiện tại.
 */
export async function fetchPlayerTournamentRank(
  rawPlayerTag: string,
): Promise<PlayerTournamentRankInfo> {
  const cleanTag = rawPlayerTag.trim().toUpperCase()
  if (!cleanTag) {
    return { tag: cleanTag, error: 'Tag không hợp lệ' }
  }
  const formattedTag = cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`
  const encodedPlayerTag = encodeURIComponent(formattedTag)

  try {
    // 1. Lấy thông tin người chơi
    const playerRes = await fetch(`/api/coc?path=${encodeURIComponent(`/players/${encodedPlayerTag}`)}`)
    if (!playerRes.ok) {
      const errData = await playerRes.json().catch(() => ({}))
      return {
        tag: formattedTag,
        error: errData.error || `Lỗi tải thông tin (${playerRes.status})`,
      }
    }

    const playerData = await playerRes.json()
    const groupTag = playerData.currentLeagueGroupTag as string | undefined
    const seasonId = playerData.currentLeagueSeasonId ? String(playerData.currentLeagueSeasonId) : undefined
    const leagueTier = playerData.leagueTier as {
      name?: string
      iconUrls?: { small?: string; medium?: string; large?: string }
    } | undefined

    if (!groupTag || !seasonId) {
      return {
        tag: formattedTag,
        isUnranked: true,
        leagueTierName: leagueTier?.name,
        leagueTierIconUrl: leagueTier?.iconUrls?.small || leagueTier?.iconUrls?.medium,
        lastCheckedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }
    }

    // 2. Lấy dữ liệu bảng đấu của người chơi đó
    const groupPath = `/leaguegroup/${encodeURIComponent(groupTag)}/${encodeURIComponent(seasonId)}?playerTag=${encodedPlayerTag}`
    const groupRes = await fetch(`/api/coc?path=${encodeURIComponent(groupPath)}`)
    if (!groupRes.ok) {
      return {
        tag: formattedTag,
        leagueTierName: leagueTier?.name,
        error: 'Không thể tải bảng đấu',
      }
    }

    const groupData = await groupRes.json()
    const members = Array.isArray(groupData.members) ? groupData.members : []
    const cleanUpper = formattedTag.replace(/^#/, '')

    const memberIdx = members.findIndex(
      (m: any) => (m.playerTag || '').toUpperCase().replace(/^#/, '') === cleanUpper,
    )

    if (memberIdx === -1) {
      return {
        tag: formattedTag,
        leagueTierName: leagueTier?.name,
        isUnranked: true,
        lastCheckedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }
    }

    const memberItem = members[memberIdx]
    const currentCups = Number(memberItem.leagueTrophies) || 0

    return {
      tag: formattedTag,
      rank: memberIdx + 1,
      leagueTierName: leagueTier?.name,
      leagueTierIconUrl: leagueTier?.iconUrls?.small || leagueTier?.iconUrls?.medium,
      leagueTrophies: currentCups,
      lastCheckedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }
  } catch (err) {
    return {
      tag: formattedTag,
      error: err instanceof Error ? err.message : 'Lỗi kết nối',
    }
  }
}

/**
 * Phân tích ngày bắt đầu và kết thúc (kết thúc luôn bằng ngày bắt đầu + 6 ngày)
 */
export function parseSeasonDateRange(
  seasonId?: string | number,
  fallbackStartsAt?: string,
): { startsAt: string; endsAt: string; displayPeriod: string } {
  if (!seasonId && !fallbackStartsAt) {
    return { startsAt: '', endsAt: '', displayPeriod: '--' }
  }

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
    const num = Number(seasonId)
    if (!isNaN(num) && num > 1000000000) {
      // 1789966800 là mốc mùa hiện tại (22/09/2026), 1789362000 là mốc mùa trước (15/09/2026)
      const refTime = 1789966800
      const refDate = new Date(2026, 8, 22) // 22/09/2026
      const diffSec = num - refTime
      const diffDays = Math.round(diffSec / 86400)
      startDate = new Date(refDate.getTime() + diffDays * 86400000)
    } else {
      const parsed = new Date(String(seasonId))
      if (!isNaN(parsed.getTime())) startDate = parsed
    }
  }

  if (!startDate || isNaN(startDate.getTime())) {
    return { startsAt: '', endsAt: '', displayPeriod: '--' }
  }

  // Ngày kết thúc luôn bằng ngày bắt đầu + 6 ngày (ví dụ 22/09 -> 28/09, 15/09 -> 21/09)
  const endDate = new Date(startDate.getTime() + 6 * 86400000)

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
