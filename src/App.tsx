import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  attackStatusColors,
  calculateMaxPossibleCups,
  calculatePlayerRating,
  getRankingStats,
  normalizeSeason,
  ratingColors,
  saveLeagueRules,
} from './lib/ranking'
import { seasonsToCsv } from './lib/csv'
import { fetchRankedSeasonData, fetchClanData } from './lib/cocApi'
import { calculateRankChangesSnapshot } from './lib/rankChanges'
import {
  clearPlayerData,
  loadDraftDocument,
  loadRankChangesSnapshot,
  loadSavedLeagueHistory,
  loadSavedPlayerTag,
  loadSavedClanTag,
  saveClanTag,
  loadSavedClanData,
  saveClanData,
  saveDraftDocument,
  saveLeagueHistory,
  savePlayerTag,
  saveRankChangesSnapshot,
} from './lib/storage'
import type {
  AppRoute,
  ClanData,
  LeagueHistoryItem,
  Player,
  RankChangesSnapshot,
  RatingCategory,
  Season,
  StorageDocument,
} from './types'

import { useI18n } from './i18n/LanguageContext'
import { SeasonOverviewSection } from './components/SeasonOverviewSection'
import { PlayerTable } from './components/PlayerTable'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { StatCardsGrid } from './components/StatCardsGrid'
import { HighlightStatsTable } from './components/HighlightStatsTable'
import { PerformanceTrendSection } from './components/PerformanceTrendSection'
import { PlayerTagPromptBanner } from './components/PlayerTagPromptBanner'
import { RankChangesSection } from './components/RankChangesSection'
import { ClanMembersSection } from './components/ClanMembersSection'
import { Footer } from './components/Footer'
import { ShareCardModal } from './components/ShareCardModal'
import { AuroraBackground } from './components/AuroraBackground'
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
  const { dict, interpolate } = useI18n()
  const [isSyncingApi, setIsSyncingApi] = useState(false)
  const [isShareCardOpen, setIsShareCardOpen] = useState(false)
  const [playerTag, setPlayerTag] = useState<string>(() => loadSavedPlayerTag())
  const [leagueHistory, setLeagueHistory] = useState<LeagueHistoryItem[]>(() => loadSavedLeagueHistory())
  const [rankChangesSnapshot, setRankChangesSnapshot] = useState<RankChangesSnapshot | null>(() =>
    loadRankChangesSnapshot(),
  )
  const [document, setDocument] = useState<StorageDocument>(() => loadDraftDocument(emptySeason))
  function getRouteFromHash(): AppRoute {
    const hash = window.location.hash.toLowerCase()
    if (hash === '#/season' || hash === '#season') return 'season'
    if (hash === '#/clan' || hash === '#clan') return 'clan'
    return 'personal'
  }

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getRouteFromHash)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [clanTag, setClanTag] = useState<string>(() => loadSavedClanTag() || '')
  const [clanData, setClanData] = useState<ClanData | null>(() => loadSavedClanData())
  const [isSyncingClan, setIsSyncingClan] = useState(false)
  const [clanError, setClanError] = useState('')

  async function handleSyncClan(targetClanTag?: string) {
    const raw = targetClanTag || clanTag
    const clean = raw.trim()
    if (!clean) return

    setIsSyncingClan(true)
    setClanError('')
    try {
      const data = await fetchClanData(clean)
      setClanData(data)
      saveClanData(data)
      setClanTag(data.tag)
      saveClanTag(data.tag)
    } catch (err) {
      console.warn('Tải dữ liệu Clan thất bại:', err)
      setClanError(err instanceof Error ? err.message : 'Không thể tải thông tin Clan.')
    } finally {
      setIsSyncingClan(false)
    }
  }

  const [error, setError] = useState('')
  const [targetFocusPlayerId, setTargetFocusPlayerId] = useState<string | null>(null)

  const season = document.season
  const rankedSeason = useMemo(() => normalizeSeason(season), [season])
  const stats = useMemo(() => getRankingStats(rankedSeason), [rankedSeason])
  const myPlayerName = stats.myPlayer?.name || (playerTag ? dict.common.me : '--')

  // Lưu thời điểm fetch gần nhất cho từng route để tránh spam request liên tục
  const lastSyncRouteTimeRef = useRef<Record<string, number>>({})

  // Tự động fetch lại API tương ứng khi truy cập hoặc chuyển tab
  const triggerRouteSync = useCallback(
    (route: AppRoute) => {
      const now = Date.now()
      const lastTime = lastSyncRouteTimeRef.current[route] || 0
      // Cooldown 2s: Nếu vừa fetch dữ liệu cho route này cách đây dưới 2 giây thì không gọi lặp
      if (now - lastTime < 2000) {
        return
      }
      lastSyncRouteTimeRef.current[route] = now

      const activeTag = playerTag || stats.myPlayer?.playerTag || rankedSeason.myPlayerId
      if (route === 'personal' || route === 'season') {
        if (activeTag && !isSyncingApi) {
          handleSyncCocApi(activeTag)
        }
      } else if (route === 'clan') {
        const activeClan = clanTag || clanData?.tag
        if (activeClan && !isSyncingClan) {
          handleSyncClan(activeClan)
        } else if (activeTag && !isSyncingApi) {
          handleSyncCocApi(activeTag)
        }
      }
    },
    [playerTag, stats.myPlayer?.playerTag, rankedSeason.myPlayerId, isSyncingApi, clanTag, clanData?.tag, isSyncingClan],
  )

  const handleNavigate = (route: AppRoute) => {
    window.location.hash = `#/${route}`
    setCurrentRoute(route)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    triggerRouteSync(route)
  }

  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = getRouteFromHash()
      setCurrentRoute(newRoute)
      triggerRouteSync(newRoute)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [triggerRouteSync])

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
      label: interpolate(dict.charts.canPassMe, { name: myPlayerName }),
      value: stats.playersWhoCanPassMe,
      color: comparisonColors.canPass,
    },
    {
      label: interpolate(dict.charts.belowMe, { name: myPlayerName }),
      value: stats.playersDefinitelyBelowMe,
      color: comparisonColors.below,
    },
  ]

  const attackStatusChartData = [
    {
      label: dict.charts.statusFinished,
      value: stats.attackStatusCounts.finished,
      color: attackStatusColors.finished,
    },
    {
      label: dict.charts.statusInProgress,
      value: stats.attackStatusCounts.inProgress,
      color: attackStatusColors.inProgress,
    },
    {
      label: dict.charts.statusNotStarted,
      value: stats.attackStatusCounts.notStarted,
      color: attackStatusColors.notStarted,
    },
  ]

  const ratingLabelMap: Record<RatingCategory, string> = {
    dominant: dict.charts.ratingDominant,
    superior: dict.charts.ratingSuperior,
    potential: dict.charts.ratingPotential,
    alarm: dict.charts.ratingAlarm,
  }

  const ratingChartData = ratingOptions.map((rating) => ({
    label: ratingLabelMap[rating],
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
    } else {
      const csvData = seasonsToCsv(allSeasons)
      downloadFile(csvData, fileName, 'text/csv;charset=utf-8;')
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
      saveClanTag('')
      saveClanData(null)
      setClanTag('')
      setClanData(null)
      setLeagueHistory([])
      setRankChangesSnapshot(null)
    }
  }

  async function handleSyncCocApi(targetTag?: string) {
    const rawTag = targetTag || playerTag || stats.myPlayer?.playerTag || stats.myPlayer?.id || ''
    const cleanTag = rawTag.replace(/^#/, '').trim()
    if (!cleanTag) {
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

      if (result.clanTag) {
        setClanTag(result.clanTag)
        saveClanTag(result.clanTag)
        if (!clanData || clanData.tag !== result.clanTag) {
          handleSyncClan(result.clanTag)
        }
      } else {
        setClanTag('')
        setClanData(null)
        saveClanTag('')
        saveClanData(null)
      }

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
      const savedClan = loadSavedClanTag() || clanTag
      if (savedClan && !clanData) {
        handleSyncClan(savedClan)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app-surface relative flex min-h-screen overflow-x-hidden">
      {/* Nền hiệu ứng Cực quang (Aurora Borealis) */}
      <AuroraBackground />

      {/* Thanh Navigation Bên Trái (Desktop Fixed Sidebar & Mobile Drawer) */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        myPlayerName={myPlayerName}
        playerTag={playerTag}
        onPlayerTagChange={handlePlayerTagChange}
        league={rankedSeason.league}
        leagueIconUrl={rankedSeason.leagueIconUrl}
        isSyncingApi={isSyncingApi}
        onSyncCocApi={handleSyncCocApi}
        onExport={handleExport}
        onOpenShareCard={() => setIsShareCardOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Khu vực Nội dung chính bên phải */}
      <div className="relative z-10 flex flex-1 flex-col min-w-0 lg:pl-72">
        {/* Top Contextual Bar */}
        <TopBar
          currentRoute={currentRoute}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          lastSyncedAt={rankedSeason.lastSyncedAt || clanData?.lastSyncedAt}
          myPlayerName={myPlayerName}
          isSyncing={isSyncingApi || isSyncingClan}
        />

        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          {/* Thông báo lỗi */}
          {(error || (currentRoute === 'clan' && clanError)) && (
            <div className="animate-fade-in rounded-xl border border-rose-300/60 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 backdrop-blur dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
              {currentRoute === 'clan' && clanError ? clanError : error}
            </div>
          )}

          {/* MỤC 1: THÔNG TIN CÁ NHÂN */}
          {currentRoute === 'personal' && (
            <div className="space-y-6 animate-fade-in">
              {!playerTag && (
                <PlayerTagPromptBanner
                  playerTag={playerTag}
                  isSyncingApi={isSyncingApi}
                  onSync={handleSyncCocApi}
                />
              )}

              {/* 4 Thẻ chỉ số tổng quan cá nhân */}
              <StatCardsGrid
                stats={stats}
                season={rankedSeason}
                myPlayerName={myPlayerName}
                isSyncingApi={isSyncingApi}
              />

              {/* Theo dõi phong độ qua các mùa giải & Kỷ lục cá nhân */}
              <PerformanceTrendSection
                leagueHistory={leagueHistory}
                myPlayerName={myPlayerName}
                playerTag={playerTag}
                isSyncingApi={isSyncingApi}
              />
            </div>
          )}

          {/* MỤC 2: THÔNG TIN MÙA GIẢI */}
          {currentRoute === 'season' && (
            <div className="space-y-6 animate-fade-in">
              {/* Thẻ lớn: Tổng quan mùa giải (Thông tin giải đấu, thiết lập & 3 Biểu đồ phân bổ phân tích) */}
              <SeasonOverviewSection
                season={rankedSeason}
                seasons={document.seasons.map(normalizeSeason)}
                activeSeasonIndex={document.activeSeasonIndex}
                onSelectSeasonIndex={handleSelectSeasonIndex}
                onUpdateSeasonMeta={handleUpdateSeasonMeta}
                comparisonData={comparisonChartData}
                attackStatusData={attackStatusChartData}
                ratingData={ratingChartData}
                myPlayerName={myPlayerName}
                isSyncingApi={isSyncingApi}
              />

              {/* Bảng thống kê nổi bật & kỷ lục mùa giải */}
              <HighlightStatsTable
                players={rankedSeason.players}
                myPlayerId={rankedSeason.myPlayerId}
                onSelectPlayer={setTargetFocusPlayerId}
                isSyncingApi={isSyncingApi}
              />

              {/* Biến động thứ hạng gần nhất trong mùa giải */}
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
                targetFocusPlayerId={targetFocusPlayerId}
                onClearTargetFocus={() => setTargetFocusPlayerId(null)}
                isSyncingApi={isSyncingApi}
              />
            </div>
          )}

          {/* MỤC 3: THÔNG TIN CLAN */}
          {currentRoute === 'clan' && (
            <div className="animate-fade-in">
              <ClanMembersSection
                clanData={clanData}
                isLoading={isSyncingClan}
                myPlayerTag={playerTag || stats.myPlayer?.playerTag || rankedSeason.myPlayerId}
                tournamentPlayers={rankedSeason.players}
              />
            </div>
          )}
        </main>

        {/* Footer & chính sách */}
        <Footer />
      </div>

      {/* Modal Chia sẻ thẻ thành tích dạng ảnh Canvas */}
      <ShareCardModal
        isOpen={isShareCardOpen}
        onClose={() => setIsShareCardOpen(false)}
        season={rankedSeason}
        stats={stats}
      />

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  )
}

export default App
