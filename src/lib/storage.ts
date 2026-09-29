import type { LeagueHistoryItem, RankChangesSnapshot, Season, StorageDocument } from '../types'
import { normalizeSeason } from './ranking'

export const STORAGE_KEYS = {
  PLAYER_TAG: 'coc_player_tag',
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

export function clearPlayerData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLAYER_TAG)
    localStorage.removeItem(STORAGE_KEYS.LEAGUE_HISTORY)
    localStorage.removeItem(STORAGE_KEYS.RANK_CHANGES_SNAPSHOT)
  } catch (err) {
    console.warn('Lỗi xóa dữ liệu người chơi trong localStorage:', err)
  }
}

export function loadSavedLeagueHistory(): LeagueHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEAGUE_HISTORY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLeagueHistory(history: LeagueHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LEAGUE_HISTORY, JSON.stringify(history))
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
