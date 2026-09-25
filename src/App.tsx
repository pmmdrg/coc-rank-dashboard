import { useEffect, useMemo, useRef, useState } from 'react'
import { sampleSeason } from './data/sampleSeason'
import {
  attackStatusColors,
  attackStatusLabels,
  calculatePlayerRating,
  createPlayer,
  getRankingStats,
  normalizeSeason,
  ratingColors,
  ratingLabels,
} from './lib/ranking'
import { createFileSystemAdapter } from './storage/fileSystemAdapter'
import { createGoogleDriveAdapter } from './storage/googleDriveAdapter'
import type { AutoSaveStatus, Player, RatingCategory, Season, StorageDocument, StorageFormat, StorageSource } from './types'

import { ChartsSection } from './components/ChartsSection'
import { CreateSeasonModal } from './components/CreateSeasonModal'
import { GoogleDriveConfigModal } from './components/GoogleDriveConfigModal'
import { PlayerTable } from './components/PlayerTable'
import { SeasonHeader } from './components/SeasonHeader'
import { SeasonMetaForm } from './components/SeasonMetaForm'
import { StatCardsGrid } from './components/StatCardsGrid'
import { HighlightStatsTable } from './components/HighlightStatsTable'
import { Footer } from './components/Footer'
import { Analytics } from '@vercel/analytics/react'

const DRAFT_STORAGE_KEY = 'coc_rank_autosave_draft'

const comparisonColors = {
  canPass: '#f59e0b',
  below: '#10b981',
}

const ratingOptions: RatingCategory[] = ['elite', 'contested', 'danger', 'safe']

function loadInitialDocument(): StorageDocument {
  const defaultSeason = normalizeSeason(sampleSeason)

  try {
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (rawDraft) {
      const parsed = JSON.parse(rawDraft) as Partial<StorageDocument>
      const seasons = Array.isArray(parsed.seasons) && parsed.seasons.length > 0
        ? parsed.seasons.map(normalizeSeason)
        : [parsed.season ? normalizeSeason(parsed.season) : defaultSeason]

      const activeIndex = typeof parsed.activeSeasonIndex === 'number' && parsed.activeSeasonIndex < seasons.length
        ? parsed.activeSeasonIndex
        : 0

      return {
        name: parsed.name || 'rank-season.json',
        format: parsed.format || 'json',
        season: seasons[activeIndex] ?? defaultSeason,
        seasons,
        activeSeasonIndex: activeIndex,
      }
    }
  } catch {
    // Ignore draft parse error
  }

  return {
    name: 'rank-season.json',
    format: 'json',
    season: defaultSeason,
    seasons: [defaultSeason],
    activeSeasonIndex: 0,
  }
}

function App() {
  const [storageSource, setStorageSource] = useState<StorageSource>('local')
  const [isDriveConfigOpen, setIsDriveConfigOpen] = useState(false)
  const [isCreateSeasonModalOpen, setIsCreateSeasonModalOpen] = useState(false)
  const [document, setDocument] = useState<StorageDocument>(loadInitialDocument)
  const [status, setStatus] = useState('Dữ liệu đã sẵn sàng.')
  const [error, setError] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('draft')

  const localAdapter = useMemo(() => createFileSystemAdapter(), [])
  const driveAdapter = useMemo(() => createGoogleDriveAdapter(), [])
  const currentAdapter = storageSource === 'local' ? localAdapter : driveAdapter

  const season = document.season
  const rankedSeason = useMemo(() => normalizeSeason(season), [season])
  const stats = useMemo(() => getRankingStats(rankedSeason), [rankedSeason])
  const myPlayerName = stats.myPlayer?.name || 'Tài khoản của tôi'

  const isInitialMount = useRef(true)
  const isOpeningFile = useRef(false)

  // Cơ chế Tự động lưu (Auto-save) có Debounce 800ms
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Nếu vừa mới mở file xong, không cần lưu đè ngược lại file đó ngay lập tức
    if (isOpeningFile.current) {
      isOpeningFile.current = false
      return
    }

    setAutoSaveStatus('saving')

    const timer = setTimeout(async () => {
      try {
        const nextSeasons = document.seasons.map((s, idx) =>
          idx === document.activeSeasonIndex ? rankedSeason : normalizeSeason(s),
        )

        const draftDoc: StorageDocument = {
          ...document,
          season: rankedSeason,
          seasons: nextSeasons,
        }

        // 1. Luôn lưu bản nháp an toàn vào localStorage
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftDoc))

        // 2. Nếu đã có file liên kết trên máy hoặc Drive, tự động ghi ngầm
        if (currentAdapter.hasActiveFile()) {
          // Bảo vệ an toàn: Chỉ ghi đè nếu dữ liệu người chơi hợp lệ
          if (rankedSeason.players.length > 0) {
            await currentAdapter.save(draftDoc)
            setAutoSaveStatus('saved')
            setStatus(`Đã tự động lưu vào file ${document.name} lúc ${new Date().toLocaleTimeString('vi-VN')}`)
          }
        } else {
          setAutoSaveStatus('draft')
          setStatus(`Đã tự động lưu bản nháp vào trình duyệt lúc ${new Date().toLocaleTimeString('vi-VN')}`)
        }
      } catch (err) {
        console.error('Lỗi tự động lưu:', err)
        setAutoSaveStatus('error')
        setError(err instanceof Error ? err.message : 'Tự động lưu thất bại.')
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [rankedSeason, document, currentAdapter])

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
    const targetSeason = document.seasons[index]
    if (!targetSeason) return

    setDocument((current) => ({
      ...current,
      activeSeasonIndex: index,
      season: targetSeason,
    }))
    setStatus(`Đang xem mùa giải: ${targetSeason.seasonName}`)
  }

  function handleCreateSeason(data: {
    seasonName: string
    startsAt: string
    endsAt: string
    maxAttacks: number
    maxDefenses: number
    promotionCount: number
    demotionCount: number
  }) {
    const resetPlayers: Player[] = season.players.map((p) => ({
      id: p.id,
      name: p.name,
      rank: 0,
      attacks: 0,
      defenses: 0,
      currentCups: 0,
      maxPossibleCups: 0,
      rating: 'safe' as const,
    }))

    const newSeason: Season = normalizeSeason({
      league: season.league || 'Legend 3',
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

  async function runStorageAction(action: () => Promise<StorageDocument>, successMessage: string) {
    try {
      setError('')
      const nextDocument = await action()
      setDocument(nextDocument)
      setStatus(successMessage)
      setAutoSaveStatus('saved')
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDocument))
    } catch (storageError) {
      const message = storageError instanceof Error ? storageError.message : 'Thao tác lưu trữ thất bại.'
      setError(message)
    }
  }

  async function handleOpen() {
    try {
      setError('')
      const nextDocument = await currentAdapter.open()
      isOpeningFile.current = true
      setDocument(nextDocument)
      setStatus(`Đã mở dữ liệu từ ${currentAdapter.label} thành công.`)
      setAutoSaveStatus('saved')
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDocument))
    } catch (storageError) {
      const message = storageError instanceof Error ? storageError.message : 'Thao tác lưu trữ thất bại.'
      setError(message)
    }
  }

  async function handleSave() {
    await runStorageAction(
      () => currentAdapter.save({ ...document, season: rankedSeason }),
      `Đã lưu dữ liệu vào ${document.name} (${currentAdapter.label}).`,
    )
  }

  async function handleSaveAs(format: StorageFormat) {
    await runStorageAction(
      () => currentAdapter.saveAs({ ...document, season: rankedSeason }, format),
      `Đã xuất file ${format.toUpperCase()} (${currentAdapter.label}).`,
    )
  }

  function handleUpdatePlayerField(
    playerId: string,
    field: keyof Player,
    value: string | number,
  ) {
    const maxAttacks = rankedSeason.maxAttacks ?? 24
    const maxDefenses = rankedSeason.maxDefenses ?? 24

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
        const currentCups = field === 'currentCups' ? Number(finalValue) : updated.currentCups
        const remainingAttacks = Math.max(0, maxAttacks - attacks)
        const remainingDefenses = Math.max(0, maxDefenses - defenses)
        updated.maxPossibleCups = currentCups + remainingAttacks * 40 + remainingDefenses * 15
        const ratingResult = calculatePlayerRating(currentCups, attacks, attackDestruction, defenses)
        updated.rating = ratingResult.rating
        updated.attackCups = ratingResult.attackCups
        updated.defenseCups = ratingResult.defenseCups

        return updated
      }),
    })
  }

  function handleAddPlayer() {
    const newPlayer = createPlayer(
      rankedSeason.maxAttacks ?? 24,
      rankedSeason.maxDefenses ?? 24,
    )
    updateCurrentSeason({
      ...rankedSeason,
      myPlayerId: rankedSeason.myPlayerId || newPlayer.id,
      players: [...rankedSeason.players, newPlayer],
    })
    setStatus('Đã thêm người chơi mới vào bảng.')
  }

  function handleRemovePlayer(playerId: string) {
    const remainingPlayers = rankedSeason.players.filter((p) => p.id !== playerId)
    updateCurrentSeason({
      ...rankedSeason,
      myPlayerId:
        rankedSeason.myPlayerId === playerId ? remainingPlayers[0]?.id || '' : rankedSeason.myPlayerId,
      players: remainingPlayers,
    })
    setStatus('Đã xóa người chơi và cập nhật lại thứ hạng.')
  }

  function handleSelectMyPlayer(playerId: string) {
    updateCurrentSeason({
      ...rankedSeason,
      myPlayerId: playerId,
    })
  }

  function handleUpdateSeasonMeta(field: keyof Season, value: string | number) {
    updateCurrentSeason({
      ...rankedSeason,
      [field]: value,
    })
  }

  return (
    <div className="app-surface flex min-h-screen flex-col">
      {/* Header điều khiển, Live Auto-save & đổi nguồn lưu trữ */}
      <SeasonHeader
        league={rankedSeason.league}
        myPlayerName={myPlayerName}
        storageSource={storageSource}
        autoSaveStatus={autoSaveStatus}
        hasActiveFile={currentAdapter.hasActiveFile()}
        onStorageSourceChange={setStorageSource}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onOpenDriveConfig={() => setIsDriveConfigOpen(true)}
      />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Cảnh báo trình duyệt cho Local File System */}
        {storageSource === 'local' && !localAdapter.canWriteBack ? (
          <div className="animate-fade-in rounded-xl border border-amber-300/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 backdrop-blur dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
            Trình duyệt hiện tại có thể không hỗ trợ File System Access API ghi file trực tiếp. Khuyến nghị sử dụng Google Chrome, Edge hoặc chuyển sang nguồn lưu trữ Google Drive.
          </div>
        ) : null}

        {/* Thông báo trạng thái hoặc lỗi */}
        {error ? (
          <div className="animate-fade-in rounded-xl border border-rose-300/60 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 backdrop-blur dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        ) : (
          <div className="glass-panel animate-fade-in rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>{status}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Nguồn: {currentAdapter.label}
            </span>
          </div>
        )}

        {/* Form thông tin mùa giải: chọn mùa giải & nút thêm mùa mới */}
        <SeasonMetaForm
          season={rankedSeason}
          seasons={document.seasons.map(normalizeSeason)}
          activeSeasonIndex={document.activeSeasonIndex}
          onSelectSeasonIndex={handleSelectSeasonIndex}
          onOpenCreateModal={() => setIsCreateSeasonModalOpen(true)}
          onUpdateSeasonMeta={handleUpdateSeasonMeta}
        />

        {/* 4 Thẻ thống kê nổi bật */}
        <StatCardsGrid
          stats={stats}
          season={rankedSeason}
          myPlayerName={myPlayerName}
        />

        {/* Khu vực biểu đồ thống kê */}
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
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
          onSelectMyPlayer={handleSelectMyPlayer}
          onUpdatePlayerField={handleUpdatePlayerField}
        />
      </main>

      {/* Footer bản quyền */}
      <Footer />

      {/* Modal tạo mùa giải mới */}
      <CreateSeasonModal
        isOpen={isCreateSeasonModalOpen}
        onClose={() => setIsCreateSeasonModalOpen(false)}
        onCreateSeason={handleCreateSeason}
      />

      {/* Modal cấu hình Google Drive */}
      <GoogleDriveConfigModal
        isOpen={isDriveConfigOpen}
        onClose={() => setIsDriveConfigOpen(false)}
        onConfigSaved={() => setStatus('Đã cập nhật cấu hình Google Drive.')}
      />

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  )
}

export default App
