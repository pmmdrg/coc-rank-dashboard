import type { ClanData, LeagueHistoryItem, RankChangesSnapshot, Season, StorageDocument } from '../types'
import { normalizeSeason } from './ranking'

export const STORAGE_KEYS = {
  PLAYER_TAG: 'coc_player_tag',
  CLAN_TAG: 'coc_clan_tag',
  CLAN_DATA: 'coc_clan_data',
  LEAGUE_HISTORY: 'coc_league_history',
  RANK_CHANGES_SNAPSHOT: 'coc_rank_changes_snapshot',
  AUTOSAVE_DRAFT: 'coc_rank_autosave_draft',
  RANK_CHANGES_COLLAPSED: 'coc_rank_changes_collapsed',
} as const

export function loadSavedPlayerTag(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.PLAYER_TAG) || ''
  } catch {
    return ''
  }
}

export function savePlayerTag(tag: string): void {
  try {
    if (tag) {
      localStorage.setItem(STORAGE_KEYS.PLAYER_TAG, tag)
    } else {
      localStorage.removeItem(STORAGE_KEYS.PLAYER_TAG)
    }
  } catch (err) {
    console.warn('Lỗi lưu player tag vào localStorage:', err)
  }
}

export function loadSavedClanTag(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.CLAN_TAG) || ''
  } catch {
    return ''
  }
}

export function saveClanTag(tag: string): void {
  try {
    if (tag) {
      localStorage.setItem(STORAGE_KEYS.CLAN_TAG, tag)
    } else {
      localStorage.removeItem(STORAGE_KEYS.CLAN_TAG)
    }
  } catch (err) {
    console.warn('Lỗi lưu clan tag vào localStorage:', err)
  }
}

export function loadSavedClanData(): ClanData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLAN_DATA)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveClanData(clan: ClanData | null): void {
  try {
    if (clan) {
      localStorage.setItem(STORAGE_KEYS.CLAN_DATA, JSON.stringify(clan))
    } else {
      localStorage.removeItem(STORAGE_KEYS.CLAN_DATA)
    }
  } catch (err) {
    console.warn('Lỗi lưu clan data vào localStorage:', err)
  }
}

export function clearPlayerData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLAYER_TAG)
    localStorage.removeItem(STORAGE_KEYS.LEAGUE_HISTORY)
    localStorage.removeItem(STORAGE_KEYS.RANK_CHANGES_SNAPSHOT)
  } catch (err) {
    console.warn('Lỗi xóa dữ liệu người chơi trong localStorage:', err)
  }
}

// 5 mùa giải trước đó từ hệ thống Supercell (tháng 7 và tháng 8/2026) được bảo tồn
export const PRESERVED_HISTORICAL_SEASONS: LeagueHistoryItem[] = [
  {
    leagueSeasonId: 1785128400,
    leagueTrophies: 599,
    leagueTierId: 105000033,
    placement: 73,
    attackWins: 18,
    attackLosses: 0,
    attackStars: 0,
    defenseWins: 0,
    defenseLosses: 16,
    defenseStars: 45,
    maxBattles: 18,
  },
  {
    leagueSeasonId: 1785733200,
    leagueTrophies: 699,
    leagueTierId: 105000033,
    placement: 57,
    attackWins: 18,
    attackLosses: 0,
    attackStars: 0,
    defenseWins: 0,
    defenseLosses: 17,
    defenseStars: 44,
    maxBattles: 18,
  },
  {
    leagueSeasonId: 1786338000,
    leagueTrophies: 695,
    leagueTierId: 105000033,
    placement: 54,
    attackWins: 18,
    attackLosses: 0,
    attackStars: 0,
    defenseWins: 1,
    defenseLosses: 16,
    defenseStars: 44,
    maxBattles: 18,
  },
  {
    leagueSeasonId: 1786942800,
    leagueTrophies: 718,
    leagueTierId: 105000033,
    placement: 42,
    attackWins: 18,
    attackLosses: 0,
    attackStars: 0,
    defenseWins: 0,
    defenseLosses: 16,
    defenseStars: 42,
    maxBattles: 18,
  },
  {
    leagueSeasonId: 1787547600,
    leagueTrophies: 636,
    leagueTierId: 105000033,
    placement: 66,
    attackWins: 18,
    attackLosses: 0,
    attackStars: 0,
    defenseWins: 0,
    defenseLosses: 17,
    defenseStars: 46,
    maxBattles: 18,
  },
]

export function mergeLeagueHistories(
  existing: LeagueHistoryItem[] = [],
  incoming: LeagueHistoryItem[] = [],
): LeagueHistoryItem[] {
  const map = new Map<number, LeagueHistoryItem>()
  for (const item of PRESERVED_HISTORICAL_SEASONS) {
    map.set(item.leagueSeasonId, item)
  }
  for (const item of existing) {
    map.set(item.leagueSeasonId, { ...map.get(item.leagueSeasonId), ...item })
  }
  for (const item of incoming) {
    map.set(item.leagueSeasonId, { ...map.get(item.leagueSeasonId), ...item })
  }
  return Array.from(map.values()).sort((a, b) => a.leagueSeasonId - b.leagueSeasonId)
}

export function loadSavedLeagueHistory(): LeagueHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEAGUE_HISTORY)
    const parsed = raw ? JSON.parse(raw) : []
    const existing = Array.isArray(parsed) ? parsed : []
    return mergeLeagueHistories([], existing)
  } catch {
    return PRESERVED_HISTORICAL_SEASONS
  }
}

export function saveLeagueHistory(history: LeagueHistoryItem[]): void {
  try {
    const currentSaved = loadSavedLeagueHistory()
    const merged = mergeLeagueHistories(currentSaved, history)
    localStorage.setItem(STORAGE_KEYS.LEAGUE_HISTORY, JSON.stringify(merged))
  } catch (err) {
    console.warn('Lỗi lưu lịch sử giải đấu vào localStorage:', err)
  }
}

export function loadRankChangesSnapshot(): RankChangesSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RANK_CHANGES_SNAPSHOT)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveRankChangesSnapshot(snapshot: RankChangesSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RANK_CHANGES_SNAPSHOT, JSON.stringify(snapshot))
  } catch (err) {
    console.warn('Lỗi lưu snapshot biến động thứ hạng vào localStorage:', err)
  }
}

export function loadDraftDocument(emptySeason: Season): StorageDocument {
  try {
    const rawDraft = localStorage.getItem(STORAGE_KEYS.AUTOSAVE_DRAFT)
    const savedPlayerTag = localStorage.getItem(STORAGE_KEYS.PLAYER_TAG)

    if (rawDraft) {
      const parsed = JSON.parse(rawDraft) as Partial<StorageDocument>
      const hasOldPersonalData =
        parsed.season?.myPlayerId === '#G9GRJCRPQ' ||
        parsed.season?.players?.some((p) => p.id === '#G9GRJCRPQ')

      if (!savedPlayerTag && hasOldPersonalData) {
        localStorage.removeItem(STORAGE_KEYS.AUTOSAVE_DRAFT)
      } else {
        const seasons =
          Array.isArray(parsed.seasons) && parsed.seasons.length > 0
            ? parsed.seasons.map(normalizeSeason)
            : [parsed.season ? normalizeSeason(parsed.season) : emptySeason]

        const activeIndex =
          typeof parsed.activeSeasonIndex === 'number' && parsed.activeSeasonIndex < seasons.length
            ? parsed.activeSeasonIndex
            : 0

        const currentSeason = seasons[activeIndex] ?? emptySeason

        return {
          name: parsed.name || 'rank-season.json',
          format: parsed.format || 'json',
          season: currentSeason,
          seasons: seasons.slice(0, 2),
          activeSeasonIndex: activeIndex,
        }
      }
    }
  } catch {
    // Ignore draft parse error
  }

  return {
    name: 'rank-season.json',
    format: 'json',
    season: emptySeason,
    seasons: [emptySeason],
    activeSeasonIndex: 0,
  }
}

export function saveDraftDocument(doc: StorageDocument): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTOSAVE_DRAFT, JSON.stringify(doc))
  } catch (err) {
    console.warn('Lỗi tự động lưu bản nháp vào localStorage:', err)
  }
}
