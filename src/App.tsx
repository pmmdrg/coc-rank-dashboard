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
import { calculateRankChangesSnapshot } from './lib/rankChanges'
import {
  clearPlayerData,
  loadDraftDocument,
  loadRankChangesSnapshot,
  loadSavedLeagueHistory,
  loadSavedPlayerTag,
  saveDraftDocument,
  saveLeagueHistory,
  savePlayerTag,
  saveRankChangesSnapshot,
} from './lib/storage'
import type {
  LeagueHistoryItem,
  Player,
  RankChangesSnapshot,
  RatingCategory,
  Season,
  StorageDocument,
} from './types'

import { ChartsSection } from './components/ChartsSection'
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

function App() {
  const [isSyncingApi, setIsSyncingApi] = useState(false)
  const [playerTag, setPlayerTag] = useState<string>(() => loadSavedPlayerTag())
  const [leagueHistory, setLeagueHistory] = useState<LeagueHistoryItem[]>(() => loadSavedLeagueHistory())
  const [rankChangesSnapshot, setRankChangesSnapshot] = useState<RankChangesSnapshot | null>(() =>
    loadRankChangesSnapshot(),
  )
  const [document, setDocument] = useState<StorageDocument>(() => loadDraftDocument(emptySeason))
  const [status, setStatus] = useState(() => {
    const savedTag = loadSavedPlayerTag()
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
      const nextSeasons = document.seasons.map((s, idx) =>
        idx === document.activeSeasonIndex ? rankedSeason : normalizeSeason(s),
      )

      const draftDoc: StorageDocument = {
        ...document,
        season: rankedSeason,
        seasons: nextSeasons,
      }

      saveDraftDocument(draftDoc)
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
      savePlayerTag(clean)
      const formatted = `#${clean}`
      if (rankedSeason.myPlayerId !== formatted && rankedSeason.myPlayerId !== clean) {
        updateCurrentSeason({
          ...rankedSeason,
          myPlayerId: formatted,
        })
      }
    } else {
      clearPlayerData()
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
        savePlayerTag(cleanTag)
      }
      const previousPlayers = rankedSeason.players
      const existingMap = new Map(previousPlayers.map((p) => [(p.playerTag || p.id).toUpperCase(), p]))
      const result = await fetchRankedSeasonData(cleanTag, existingMap)

      if (result.leagueHistory) {
        setLeagueHistory(result.leagueHistory)
        saveLeagueHistory(result.leagueHistory)
      }

      const syncedSeasons = [
        normalizeSeason(result.currentSeason),
        ...(result.previousSeason ? [normalizeSeason(result.previousSeason)] : []),
      ]

      // Tính toán và lưu trữ snapshot biến động thứ hạng qua rankChanges module
      const currentNormalized = syncedSeasons[0]
      const newSnapshot = calculateRankChangesSnapshot(
        currentNormalized,
        previousPlayers,
        cleanTag,
        rankedSeason.lastSyncedAt,
      )
      setRankChangesSnapshot(newSnapshot)
      saveRankChangesSnapshot(newSnapshot)

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
    const savedTag = loadSavedPlayerTag() || playerTag
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

        {/* Thông báo biến động thứ hạng kể từ lần gần nhất lấy thứ hạng */}
        {rankChangesSnapshot && (
          <RankChangesSection
            snapshot={rankChangesSnapshot}
            myPlayerId={rankedSeason.myPlayerId}
            myPlayerName={myPlayerName}
            isSyncing={isSyncingApi}
          />
        )}

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

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  )
}

export default App
