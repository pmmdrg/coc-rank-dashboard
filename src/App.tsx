import { useEffect, useMemo, useRef, useState } from 'react'
import {
  attackStatusColors,
  attackStatusLabels,
  calculateMaxPossibleCups,
  calculatePlayerRating,
  getRankingStats,
  normalizeSeason,
  ratingColors,
  ratingLabels,
  saveLeagueRules,
} from './lib/ranking'
import { seasonsToCsv } from './lib/csv'
import { fetchRankedSeasonData } from './lib/cocApi'
import type {
  LeagueHistoryItem,
  Player,
  RankChangeItem,
  RankChangesSnapshot,
  RatingCategory,
  Season,
  StorageDocument,
} from './types'

import { ChartsSection } from './components/ChartsSection'
import { CreateSeasonModal } from './components/CreateSeasonModal'
import { PlayerTable } from './components/PlayerTable'
import { SeasonHeader } from './components/SeasonHeader'
import { SeasonMetaForm } from './components/SeasonMetaForm'
import { StatCardsGrid } from './components/StatCardsGrid'
import { HighlightStatsTable } from './components/HighlightStatsTable'
import { PerformanceTrendSection } from './components/PerformanceTrendSection'
import { PlayerTagPromptBanner } from './components/PlayerTagPromptBanner'
import { RankChangesSection } from './components/RankChangesSection'
import { Footer } from './components/Footer'
import { Analytics } from '@vercel/analytics/react'

const DRAFT_STORAGE_KEY = 'coc_rank_autosave_draft'

const emptySeason: Season = {
  league: '--',
  seasonName: 'Chưa có mùa giải',
  startsAt: '',
  endsAt: '',
  maxAttacks: 24,
  maxDefenses: 24,
  promotionCount: 10,
  demotionCount: 10,
  myPlayerId: '',
  players: [],
}

const comparisonColors = {
  canPass: '#f59e0b',
  below: '#10b981',
}

const ratingOptions: RatingCategory[] = [
  'dominant',
  'superior',
  'potential',
  'alarm',
]

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function loadInitialDocument(): StorageDocument {
  try {
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
    const savedPlayerTag = localStorage.getItem('coc_player_tag')

    if (rawDraft) {
      const parsed = JSON.parse(rawDraft) as Partial<StorageDocument>
      const hasOldPersonalData =
        parsed.season?.myPlayerId === '#G9GRJCRPQ' ||
        parsed.season?.players?.some((p) => p.id === '#G9GRJCRPQ')

      if (!savedPlayerTag && hasOldPersonalData) {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      } else {
        const seasons = Array.isArray(parsed.seasons) && parsed.seasons.length > 0
          ? parsed.seasons.map(normalizeSeason)
          : [parsed.season ? normalizeSeason(parsed.season) : emptySeason]

        const activeIndex = typeof parsed.activeSeasonIndex === 'number' && parsed.activeSeasonIndex < seasons.length
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

function App() {
  const [isCreateSeasonModalOpen, setIsCreateSeasonModalOpen] = useState(false)
  const [isSyncingApi, setIsSyncingApi] = useState(false)
  const [playerTag, setPlayerTag] = useState<string>(() => {
    return localStorage.getItem('coc_player_tag') || ''
  })
  const [leagueHistory, setLeagueHistory] = useState<LeagueHistoryItem[]>(() => {
    const saved = localStorage.getItem('coc_league_history')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  })
  const [rankChangesSnapshot, setRankChangesSnapshot] = useState<RankChangesSnapshot | null>(() => {
    try {
      const saved = localStorage.getItem('coc_rank_changes_snapshot')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [document, setDocument] = useState<StorageDocument>(loadInitialDocument)
  const [status, setStatus] = useState(() => {
    const savedTag = localStorage.getItem('coc_player_tag')
    return savedTag
      ? 'Đang tải dữ liệu...'
      : 'Vui lòng nhập Player Tag ở góc trên bên phải để tải dữ liệu bảng đấu.'
  })
  const [error, setError] = useState('')

  const season = document.season
  const rankedSeason = useMemo(() => normalizeSeason(season), [season])
  const stats = useMemo(() => getRankingStats(rankedSeason), [rankedSeason])
  const myPlayerName = stats.myPlayer?.name || (playerTag ? 'Tài khoản của tôi' : '--')

  const isInitialMount = useRef(true)

  // Cơ chế Tự động lưu bản nháp vào localStorage có Debounce 800ms
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (rankedSeason.players.length === 0) {
      return
    }

    const timer = setTimeout(() => {
      try {
        const nextSeasons = document.seasons.map((s, idx) =>
          idx === document.activeSeasonIndex ? rankedSeason : normalizeSeason(s),
        )

        const draftDoc: StorageDocument = {
          ...document,
          season: rankedSeason,
          seasons: nextSeasons,
        }

        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftDoc))
      } catch (err) {
        console.error('Lỗi tự động lưu bản nháp:', err)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [rankedSeason, document])

  // Đảm bảo vị trí "Tôi" trong bảng luôn được quyết định dựa vào playerTag người dùng đã nhập
  useEffect(() => {
    if (!playerTag) return
    const cleanTag = playerTag.replace(/^#/, '').trim().toUpperCase()
    const currentClean = (season.myPlayerId || '').replace(/^#/, '').trim().toUpperCase()
    if (cleanTag && currentClean !== cleanTag) {
      updateCurrentSeason({
        ...season,
        myPlayerId: `#${cleanTag}`,
      })
    }
  }, [playerTag, season])

  const comparisonChartData = [
    {
      label: `Có thể vượt ${myPlayerName}`,
      value: stats.playersWhoCanPassMe,
      color: comparisonColors.canPass,
    },
    {
      label: `Chắc chắn dưới ${myPlayerName}`,
      value: stats.playersDefinitelyBelowMe,
      color: comparisonColors.below,
    },
  ]

  const attackStatusChartData = [
    {
      label: attackStatusLabels.finished,
      value: stats.attackStatusCounts.finished,
      color: attackStatusColors.finished,
    },
    {
      label: attackStatusLabels.inProgress,
      value: stats.attackStatusCounts.inProgress,
      color: attackStatusColors.inProgress,
    },
    {
      label: attackStatusLabels.notStarted,
      value: stats.attackStatusCounts.notStarted,
      color: attackStatusColors.notStarted,
    },
  ]

  const ratingChartData = ratingOptions.map((rating) => ({
    label: ratingLabels[rating],
    value: stats.ratingCounts[rating],
    color: ratingColors[rating],
  }))

  function updateCurrentSeason(nextSeason: Season) {
    const normalized = normalizeSeason(nextSeason)
    setDocument((current) => {
      const nextSeasons = [...current.seasons]
      nextSeasons[current.activeSeasonIndex] = normalized
      return {
        ...current,
        season: normalized,
        seasons: nextSeasons,
      }
    })
  }

  function handleSelectSeasonIndex(index: number) {
    if (index >= 0 && index < document.seasons.length) {
      const targetSeason = document.seasons[index]
      setDocument((current) => ({
        ...current,
        activeSeasonIndex: index,
        season: targetSeason,
      }))
      setStatus(`Đang xem dữ liệu của: ${targetSeason.seasonName}`)
    }
  }

  function handleCreateSeason(data: {
    seasonName: string
    startsAt: string
    endsAt: string
    maxAttacks: number
    maxDefenses: number
    promotionCount: number
    demotionCount: number
    copyPlayersFromCurrent?: boolean
  }) {
    const resetPlayers: Player[] = data.copyPlayersFromCurrent
      ? rankedSeason.players.map((p) => ({
          ...p,
          attacks: 0,
          attackDestruction: 0,
          defenses: 0,
          defenseDestruction: 0,
          currentCups: 0,
          maxPossibleCups: (data.maxAttacks + data.maxDefenses) * 40,
          rating: 'alarm' as const,
        }))
      : []

    const newSeason = normalizeSeason({
      league: rankedSeason.league,
      seasonName: data.seasonName,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      maxAttacks: data.maxAttacks,
      maxDefenses: data.maxDefenses,
      promotionCount: data.promotionCount,
      demotionCount: data.demotionCount,
      myPlayerId: season.myPlayerId || resetPlayers[0]?.id || '',
      players: resetPlayers,
    })

    const nextSeasons = [...document.seasons, newSeason]
    const nextIndex = nextSeasons.length - 1

    setDocument((current) => ({
      ...current,
      seasons: nextSeasons,
      activeSeasonIndex: nextIndex,
      season: newSeason,
    }))

    setStatus(`Đã tạo thành công mùa giải mới: ${data.seasonName}`)
  }

  function handleExport(format: 'json' | 'csv') {
    const currentSeason = rankedSeason
    const allSeasons = document.seasons.map((s, idx) =>
      idx === document.activeSeasonIndex ? currentSeason : normalizeSeason(s),
    )

    const timestamp = new Date().toISOString().slice(0, 10)
    const rawLeague = currentSeason.league && currentSeason.league !== '--' ? currentSeason.league : 'coc_rank'
    const safeLeagueName = rawLeague.replace(/\s+/g, '_').toLowerCase()
    const fileName = `${safeLeagueName}_${timestamp}.${format}`

    if (format === 'json') {
      const exportDoc: StorageDocument = {
        name: fileName,
        format: 'json',
        season: currentSeason,
        seasons: allSeasons,
        activeSeasonIndex: document.activeSeasonIndex,
      }
      downloadFile(JSON.stringify(exportDoc, null, 2), fileName, 'application/json;charset=utf-8;')
      setStatus(`Đã xuất file ${fileName} thành công.`)
    } else {
      const csvData = seasonsToCsv(allSeasons)
      downloadFile(csvData, fileName, 'text/csv;charset=utf-8;')
      setStatus(`Đã xuất file ${fileName} thành công.`)
    }
  }

  function handleUpdatePlayerField(
    playerId: string,
    field: keyof Player,
    value: string | number,
  ) {
    const maxAttacks = rankedSeason.maxAttacks ?? 24
    const maxDefenses = rankedSeason.maxDefenses ?? 24
    const activeCups = rankedSeason.players.map((p) => p.currentCups).filter((c) => c > 0)
    const avgCups = activeCups.length > 0 ? Math.round(activeCups.reduce((a, b) => a + b, 0) / activeCups.length) : 0

    updateCurrentSeason({
      ...rankedSeason,
      players: rankedSeason.players.map((p) => {
        if (p.id !== playerId) return p

        let finalValue = value
        if (field === 'attacks') {
          finalValue = Math.min(maxAttacks, Math.max(0, Number(value) || 0))
        } else if (field === 'defenses') {
          finalValue = Math.min(maxDefenses, Math.max(0, Number(value) || 0))
        } else if (field === 'currentCups') {
          finalValue = Math.max(0, Number(value) || 0)
        } else if (field === 'attackDestruction' || field === 'defenseDestruction') {
          finalValue = Math.min(100, Math.max(0, Math.round(Number(value) * 10) / 10))
        }

        const updated = { ...p, [field]: finalValue }
        const attacks = field === 'attacks' ? Number(finalValue) : updated.attacks
        const defenses = field === 'defenses' ? Number(finalValue) : updated.defenses
        const attackDestruction =
          field === 'attackDestruction'
            ? Number(finalValue)
            : (updated.attackDestruction ?? 0)
        const defenseDestruction =
          field === 'defenseDestruction'
            ? Number(finalValue)
            : (updated.defenseDestruction ?? 0)
        const currentCups = field === 'currentCups' ? Number(finalValue) : updated.currentCups
        updated.maxPossibleCups = calculateMaxPossibleCups(
          currentCups,
          attacks,
          defenses,
          defenseDestruction,
          maxAttacks,
          maxDefenses,
        )
        const ratingResult = calculatePlayerRating(currentCups, attacks, attackDestruction, defenses, avgCups)
        updated.rating = ratingResult.rating
        updated.attackCups = ratingResult.attackCups
        updated.defenseCups = ratingResult.defenseCups

        return updated
      }),
    })
  }

  function handleUpdateSeasonMeta(field: keyof Season, value: string | number) {
    const updated = {
      ...rankedSeason,
      [field]: value,
    }
    updateCurrentSeason(updated)

    if (field === 'promotionCount' || field === 'demotionCount') {
      const promotionCount = field === 'promotionCount' ? Number(value) : (rankedSeason.promotionCount ?? 10)
      const demotionCount = field === 'demotionCount' ? Number(value) : (rankedSeason.demotionCount ?? 10)
      saveLeagueRules(rankedSeason.league, { promotionCount, demotionCount })
    }
  }

  function handlePlayerTagChange(tag: string) {
    const clean = tag.replace(/^#/, '').trim().toUpperCase()
    setPlayerTag(clean)
    if (clean) {
      localStorage.setItem('coc_player_tag', clean)
      const formatted = `#${clean}`
      if (rankedSeason.myPlayerId !== formatted && rankedSeason.myPlayerId !== clean) {
        updateCurrentSeason({
          ...rankedSeason,
          myPlayerId: formatted,
        })
      }
    } else {
      localStorage.removeItem('coc_player_tag')
      localStorage.removeItem('coc_league_history')
      localStorage.removeItem('coc_rank_changes_snapshot')
      setLeagueHistory([])
      setRankChangesSnapshot(null)
    }
  }

  async function handleSyncCocApi(targetTag?: string) {
    const rawTag = targetTag || playerTag || stats.myPlayer?.playerTag || stats.myPlayer?.id || ''
    const cleanTag = rawTag.replace(/^#/, '').trim()
    if (!cleanTag) {
      setStatus('Vui lòng nhập Player Tag ở góc trên bên phải để tải dữ liệu bảng đấu.')
      return
    }

    setIsSyncingApi(true)
    setError('')
    try {
      if (cleanTag !== playerTag) {
        setPlayerTag(cleanTag)
        localStorage.setItem('coc_player_tag', cleanTag)
      }
      const previousPlayers = rankedSeason.players
      const hasPreviousSnapshot = previousPlayers.length > 0 && previousPlayers.some((p) => p.rank > 0)
      const existingMap = new Map(previousPlayers.map((p) => [(p.playerTag || p.id).toUpperCase(), p]))
      const result = await fetchRankedSeasonData(cleanTag, existingMap)
      if (result.leagueHistory) {
        setLeagueHistory(result.leagueHistory)
        localStorage.setItem('coc_league_history', JSON.stringify(result.leagueHistory))
      }
      const syncedSeasons = [
        normalizeSeason(result.currentSeason),
        ...(result.previousSeason ? [normalizeSeason(result.previousSeason)] : []),
      ]

      // Tính toán danh sách thay đổi thứ hạng cho mục thông báo
      const currentNormalized = syncedSeasons[0]
      if (hasPreviousSnapshot) {
        const changes: RankChangeItem[] = []
        for (const p of currentNormalized.players) {
          const oldP = existingMap.get((p.playerTag || p.id).toUpperCase())
          if (oldP && oldP.rank > 0 && oldP.rank !== p.rank) {
            const isMe = Boolean(
              cleanTag && (
                p.playerTag?.toUpperCase().replace(/^#/, '') === cleanTag ||
                p.id.toUpperCase().replace(/^#/, '') === cleanTag
              )
            )
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

        // Sắp xếp: "Bạn" lên đầu, sau đó theo độ biến động lớn nhất
        changes.sort((a, b) => {
          if (a.isMe && !b.isMe) return -1
          if (!a.isMe && b.isMe) return 1
          return Math.abs(b.rankDiff) - Math.abs(a.rankDiff)
        })

        const newSnapshot: RankChangesSnapshot = {
          seasonId: currentNormalized.leagueSeasonId,
          groupTag: currentNormalized.leagueGroupTag,
          updatedAt: result.currentSeason.lastSyncedAt || new Date().toLocaleTimeString('vi-VN'),
          previousUpdatedAt: rankedSeason.lastSyncedAt || undefined,
          changes,
        }
        setRankChangesSnapshot(newSnapshot)
        try {
          localStorage.setItem('coc_rank_changes_snapshot', JSON.stringify(newSnapshot))
        } catch {
          // ignore
        }
      } else {
        // Lần đầu tiên đồng bộ bảng đấu này
        const initialSnapshot: RankChangesSnapshot = {
          seasonId: currentNormalized.leagueSeasonId,
          groupTag: currentNormalized.leagueGroupTag,
          updatedAt: result.currentSeason.lastSyncedAt || new Date().toLocaleTimeString('vi-VN'),
          previousUpdatedAt: undefined,
          changes: [],
        }
        setRankChangesSnapshot(initialSnapshot)
        try {
          localStorage.setItem('coc_rank_changes_snapshot', JSON.stringify(initialSnapshot))
        } catch {
          // ignore
        }
      }

      setDocument((current) => ({
        ...current,
        seasons: syncedSeasons,
        activeSeasonIndex: 0,
        season: syncedSeasons[0],
      }))
      setStatus(`Đã cập nhật dữ liệu mới nhất từ Supercell API lúc ${result.currentSeason.lastSyncedAt}!`)
    } catch (err) {
      console.warn('Tải dữ liệu Supercell API thất bại:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu từ Supercell API.')
    } finally {
      setIsSyncingApi(false)
    }
  }

  // Tự động gọi Supercell API khi truy cập trang web hoặc refresh (nếu đã có playerTag)
  useEffect(() => {
    const savedTag = localStorage.getItem('coc_player_tag') || playerTag
    if (savedTag) {
      handleSyncCocApi(savedTag)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app-surface flex min-h-screen flex-col">
      {/* Header điều khiển: Player Tag, Xuất JSON/CSV, Theme */}
      <SeasonHeader
        league={rankedSeason.league}
        leagueIconUrl={rankedSeason.leagueIconUrl}
        myPlayerName={myPlayerName}
        playerTag={playerTag}
        onPlayerTagChange={handlePlayerTagChange}
        isSyncingApi={isSyncingApi}
        onSyncCocApi={handleSyncCocApi}
        onExport={handleExport}
      />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Thông báo lỗi */}
        {error && (
          <div className="animate-fade-in rounded-xl border border-rose-300/60 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 backdrop-blur dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        )}

        {!playerTag ? (
          <PlayerTagPromptBanner
            playerTag={playerTag}
            isSyncingApi={isSyncingApi}
            onSync={handleSyncCocApi}
          />
        ) : (
          <div className="glass-panel animate-fade-in rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>{status}</span>
          </div>
        )}

        {/* PHẦN 1: CÁC THÔNG TIN RIÊNG VỀ BẢN THÂN */}
        {/* 4 Thẻ thống kê nổi bật của bản thân */}
        <StatCardsGrid
          stats={stats}
          season={rankedSeason}
          myPlayerName={myPlayerName}
        />

        {/* Thông báo biến động thứ hạng kể từ lần gần nhất lấy thứ hạng */}
        {rankChangesSnapshot && (
          <RankChangesSection
            snapshot={rankChangesSnapshot}
            myPlayerId={rankedSeason.myPlayerId}
            myPlayerName={myPlayerName}
          />
        )}

        {/* Theo dõi phong độ qua các mùa giải & Kỷ lục cá nhân */}
        <PerformanceTrendSection
          leagueHistory={leagueHistory}
          myPlayerName={myPlayerName}
          playerTag={playerTag}
        />

        {/* PHẦN 2: CÁC THÔNG TIN LIÊN QUAN TỚI BẢNG XẾP HẠNG CỦA MÙA GIẢI */}
        {/* Form thông tin mùa giải: chọn mùa giải & quy tắc thăng/xuống */}
        <SeasonMetaForm
          season={rankedSeason}
          seasons={document.seasons.map(normalizeSeason)}
          activeSeasonIndex={document.activeSeasonIndex}
          onSelectSeasonIndex={handleSelectSeasonIndex}
          onUpdateSeasonMeta={handleUpdateSeasonMeta}
        />

        {/* Khu vực biểu đồ thống kê mùa giải */}
        <ChartsSection
          comparisonData={comparisonChartData}
          attackStatusData={attackStatusChartData}
          ratingData={ratingChartData}
          myPlayerName={myPlayerName}
        />

        {/* Bảng thống kê nổi bật & kỷ lục mùa giải */}
        <HighlightStatsTable
          players={rankedSeason.players}
          myPlayerId={rankedSeason.myPlayerId}
        />

        {/* Bảng danh sách người chơi chi tiết */}
        <PlayerTable
          key={rankedSeason.seasonName}
          season={rankedSeason}
          rankedPlayers={rankedSeason.players}
          stats={stats}
          onUpdatePlayerField={handleUpdatePlayerField}
        />
      </main>

      {/* Footer & chính sách */}
      <Footer />

      {/* Modal tạo mùa giải mới */}
      <CreateSeasonModal
        isOpen={isCreateSeasonModalOpen}
        onClose={() => setIsCreateSeasonModalOpen(false)}
        onCreateSeason={handleCreateSeason}
      />

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  )
}

export default App
