import type { Season, Player } from '../types'
import { calculateMaxPossibleCups, calculatePlayerRating } from './ranking'
import { getLeagueIconUrl } from './leagueIcons'

export interface SyncResult {
  currentSeason: Season
  previousSeason?: Season
  season: Season // Giữ tương thích ngược với code cũ
  playerName: string
  playerTag: string
  groupTag: string
  seasonId: string
  membersCount: number
}

/**
 * Tự động xác định số lượt đánh/thủ tối đa của bảng đấu:
 * Trong Clash of Clans Ranked Battles:
 * - Supercell API KHÔNG có field nào trực tiếp cung cấp maxAttacks hay maxDefenses.
 * - Thay vào đó, số lượt tối đa phụ thuộc vào cấp giải đấu (League Tier) của bảng đấu đó:
 *   + Legend I: 48 lượt (hoặc 8 lượt/ngày)
 *   + Legend II: 30 lượt (5 lượt/ngày)
 *   + Legend III: 24 lượt (4 lượt/ngày)
 *   + Các rank trung cấp (Titan, Dragon, Electro, ...): 18 lượt (3 lượt/ngày)
 *   + Các rank thấp hơn (P.E.K.K.A, Witch, Valkyrie, ...): 12 hoặc 6 lượt
 * Dashboard tự động nhận diện dựa trên số lượt đánh cao nhất quan sát được của 100 thành viên và tên cấp giải đấu.
 */
export function detectMaxAttacksAndDefenses(
  members: Record<string, unknown>[],
  leagueName?: string,
): { maxAttacks: number; maxDefenses: number } {
  let maxObservedAttacks = 0
  let maxObservedDefenses = 0

  for (const m of members) {
    const atk = (Number(m.attackWinCount) || 0) + (Number(m.attackLoseCount) || 0)
    const def = (Number(m.defenseWinCount) || 0) + (Number(m.defenseLoseCount) || 0)
    if (atk > maxObservedAttacks) maxObservedAttacks = atk
    if (def > maxObservedDefenses) maxObservedDefenses = def
  }

  const maxObserved = Math.max(maxObservedAttacks, maxObservedDefenses)

  // 1. Nếu số lượt thực tế quan sát được trong bảng đã có người đạt tới các mốc chuẩn:
  if (maxObserved > 24) {
    return { maxAttacks: 30, maxDefenses: 30 }
  }
  if (maxObserved > 18) {
    return { maxAttacks: 24, maxDefenses: 24 }
  }
  if (maxObserved > 12) {
    return { maxAttacks: 18, maxDefenses: 18 }
  }
  if (maxObserved > 6) {
    return { maxAttacks: 12, maxDefenses: 12 }
  }

  // 2. Nếu mùa giải mới tinh (chưa ai đánh nhiều), suy luận theo tên League Tier:
  const clean = (leagueName || '').toLowerCase()
  if (clean.includes('legend i') || clean.includes('legend 1')) {
    return { maxAttacks: 48, maxDefenses: 48 }
  }
  if (clean.includes('legend ii') || clean.includes('legend 2')) {
    return { maxAttacks: 30, maxDefenses: 30 }
  }
  if (clean.includes('legend iii') || clean.includes('legend 3') || clean.includes('legend')) {
    return { maxAttacks: 24, maxDefenses: 24 }
  }
  if (clean.includes('electro') || clean.includes('dragon') || clean.includes('titan')) {
    return { maxAttacks: 18, maxDefenses: 18 }
  }
  if (clean.includes('pekka') || clean.includes('p.e.k.k.a') || clean.includes('golem') || clean.includes('witch') || clean.includes('valkyrie')) {
    return { maxAttacks: 12, maxDefenses: 12 }
  }
  if (clean.includes('wizard') || clean.includes('archer') || clean.includes('barbarian') || clean.includes('skeleton')) {
    return { maxAttacks: 6, maxDefenses: 6 }
  }

  // 3. Fallback: nếu maxObserved > 0 dùng maxObserved, ngược lại mặc định 24
  if (maxObserved > 0) {
    return { maxAttacks: maxObserved, maxDefenses: maxObserved }
  }

  return { maxAttacks: 24, maxDefenses: 24 }
}

/**
 * Ánh xạ danh sách thành viên từ Supercell API sang danh sách Player của dashboard
 */
function mapMembersToPlayers(
  members: Record<string, unknown>[],
  maxAttacks: number = 24,
  maxDefenses: number = 24,
  existingPlayersMap?: Map<string, Player>,
): Player[] {

  return members.map((m: Record<string, unknown>, index: number) => {
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

  // 2. Lấy icon giải đấu
  const leagueTier = playerData.leagueTier as {
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
  const currentLimits = detectMaxAttacksAndDefenses(currentMembers, leagueName)
  const currentPlayers = mapMembersToPlayers(
    currentMembers,
    currentLimits.maxAttacks,
    currentLimits.maxDefenses,
    existingPlayersMap,
  )
  const currentPeriod = parseSeasonDateRange(seasonId)

  const currentSeason: Season = {
    league: leagueName,
    leagueIconUrl,
    seasonName: `Mùa giải hiện tại (${currentPeriod.displayPeriod})`,
    startsAt: currentPeriod.startsAt,
    endsAt: currentPeriod.endsAt,
    maxAttacks: currentLimits.maxAttacks,
    maxDefenses: currentLimits.maxDefenses,
    promotionCount: 10,
    demotionCount: 10,
    myPlayerId: formattedTag,
    players: currentPlayers,
    leagueGroupTag: groupTag,
    leagueSeasonId: seasonId,
    lastSyncedAt: syncedTime,
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
        const prevLimits = detectMaxAttacksAndDefenses(prevMembers, leagueName)
        const prevPlayers = mapMembersToPlayers(
          prevMembers,
          prevLimits.maxAttacks,
          prevLimits.maxDefenses,
          existingPlayersMap,
        )
        const prevPeriod = parseSeasonDateRange(prevSeasonId)

        previousSeason = {
          league: leagueName,
          leagueIconUrl,
          seasonName: `Mùa giải trước (${prevPeriod.displayPeriod})`,
          startsAt: prevPeriod.startsAt,
          endsAt: prevPeriod.endsAt,
          maxAttacks: prevLimits.maxAttacks,
          maxDefenses: prevLimits.maxDefenses,
          promotionCount: 10,
          demotionCount: 10,
          myPlayerId: formattedTag,
          players: prevPlayers,
          leagueGroupTag: prevGroupTag,
          leagueSeasonId: prevSeasonId,
          lastSyncedAt: syncedTime,
        }
      }
    } catch (err) {
      console.warn('Không thể tải bảng đấu mùa giải trước:', err)
    }
  }

  return {
    season: currentSeason,
    currentSeason,
    previousSeason,
    playerName: playerData.name || '',
    playerTag: formattedTag,
    groupTag,
    seasonId,
    membersCount: currentPlayers.length,
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
