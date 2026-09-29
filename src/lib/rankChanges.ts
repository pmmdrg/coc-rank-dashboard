import type { Player, RankedSeason, RankChangeItem, RankChangesSnapshot } from '../types'

/**
 * Tính toán biến động thứ hạng và điểm cúp giữa 2 lần đồng bộ
 *
 * @param currentSeason Dữ liệu mùa giải hiện tại sau khi chuẩn hóa
 * @param previousPlayers Danh sách người chơi ở lần đồng bộ trước đó
 * @param cleanPlayerTag Mã người chơi (đã chuẩn hóa, bỏ dấu #)
 * @param previousSyncedAt Thời điểm đồng bộ trước đó
 * @returns RankChangesSnapshot chứa danh sách biến động
 */
export function calculateRankChangesSnapshot(
  currentSeason: RankedSeason,
  previousPlayers: Player[],
  cleanPlayerTag: string,
  previousSyncedAt?: string,
): RankChangesSnapshot {
  const updatedAt =
    currentSeason.lastSyncedAt ||
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const hasPreviousData = previousPlayers.length > 0 && previousPlayers.some((p) => p.rank > 0)

  if (!hasPreviousData) {
    return {
      seasonId: currentSeason.leagueSeasonId,
      groupTag: currentSeason.leagueGroupTag,
      updatedAt,
      previousUpdatedAt: undefined,
      changes: [],
    }
  }

  const existingMap = new Map(
    previousPlayers.map((p) => [(p.playerTag || p.id).toUpperCase().replace(/^#/, ''), p]),
  )

  const changes: RankChangeItem[] = []

  for (const p of currentSeason.players) {
    const rawTag = (p.playerTag || p.id).toUpperCase().replace(/^#/, '')
    const oldP = existingMap.get(rawTag)

    if (oldP && oldP.rank > 0 && oldP.rank !== p.rank) {
      const isMe = Boolean(cleanPlayerTag && rawTag === cleanPlayerTag)

      changes.push({
        id: p.id,
        name: p.name,
        playerTag: p.playerTag,
        oldRank: oldP.rank,
        newRank: p.rank,
        rankDiff: oldP.rank - p.rank, // dương: tăng bậc, âm: hạ bậc
        oldCups: oldP.currentCups,
        newCups: p.currentCups,
        cupsDiff: p.currentCups - oldP.currentCups,
        isMe,
      })
    }
  }

  // Sắp xếp: "Bạn" luôn lên đầu tiên, sau đó theo độ biến động thứ hạng lớn nhất
  changes.sort((a, b) => {
    if (a.isMe && !b.isMe) return -1
    if (!a.isMe && b.isMe) return 1
    return Math.abs(b.rankDiff) - Math.abs(a.rankDiff)
  })

  return {
    seasonId: currentSeason.leagueSeasonId,
    groupTag: currentSeason.leagueGroupTag,
    updatedAt,
    previousUpdatedAt: previousSyncedAt,
    changes,
  }
}
