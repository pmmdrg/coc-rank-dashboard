import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  X,
  Sword,
  Shield,
  Star,
  Trophy,
  Copy,
  Check,
  ArrowClockwise,
} from '@phosphor-icons/react'
import type { BattleLogEntry, Player } from '../types'
import { fetchPlayerBattleLogs } from '../lib/cocApi'
import { useI18n } from '../i18n/LanguageContext'
import { RankBadge } from './RankBadge'
import { RatingChip } from './RatingChip'

export interface BattleLogDrawerProps {
  isOpen: boolean
  onClose: () => void
  player: Player | null
  groupTag?: string
  seasonId?: string | number
  myPlayerTag?: string
}

type BattleTab = 'attacks' | 'defenses'

function formatBattleTime(isoString?: string): string {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${mins} • ${day}/${month}`
  } catch {
    return isoString
  }
}

export function BattleLogDrawer({
  isOpen,
  onClose,
  player,
  groupTag,
  seasonId,
  myPlayerTag,
}: BattleLogDrawerProps) {
  const { dict } = useI18n()
  const [activeTab, setActiveTab] = useState<BattleTab>('attacks')
  const [isLoading, setIsLoading] = useState(false)
  const [attackLogs, setAttackLogs] = useState<BattleLogEntry[]>([])
  const [defenseLogs, setDefenseLogs] = useState<BattleLogEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isCopiedTag, setIsCopiedTag] = useState(false)

  const cleanMyTag = useMemo(() => {
    return (myPlayerTag || '').toUpperCase().replace(/^#/, '')
  }, [myPlayerTag])

  const [isClosing, setIsClosing] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClose = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
    closeTimerRef.current = setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 240)
  }, [isClosing, onClose])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  // Lắng nghe phím ESC để đóng Drawer
  useEffect(() => {
    if (!isOpen || isClosing) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isClosing, handleClose])

  // Khóa cuộn trang nền khi mở Drawer
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Tải dữ liệu nhật ký chiến đấu của người chơi
  const loadLogs = useCallback(
    async (force = false) => {
      if (!player || !groupTag || !seasonId) return
      setIsLoading(true)
      setError(null)

      try {
        const logs = await fetchPlayerBattleLogs(
          groupTag,
          String(seasonId),
          player.playerTag || player.id,
          force,
        )
        setAttackLogs(logs.attackLogs)
        setDefenseLogs(logs.defenseLogs)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg || dict.battleLog.errorLoading)
      } finally {
        setIsLoading(false)
      }
    },
    [player, groupTag, seasonId, dict.battleLog.errorLoading],
  )

  useEffect(() => {
    if (isOpen && player) {
      loadLogs(false)
    } else {
      setAttackLogs([])
      setDefenseLogs([])
      setError(null)
    }
  }, [isOpen, player, loadLogs])

  const currentLogs = activeTab === 'attacks' ? attackLogs : defenseLogs

  // Tính toán chỉ số tổng hợp
  const summary = useMemo(() => {
    const total = currentLogs.length
    if (total === 0) {
      return { total: 0, avgStars: '0', avgDestruction: '0%', totalCups: 0 }
    }
    const sumStars = currentLogs.reduce((acc, log) => acc + (log.stars || 0), 0)
    const sumDestruction = currentLogs.reduce((acc, log) => acc + (log.destructionPercentage || 0), 0)
    const sumCups = currentLogs.reduce((acc, log) => acc + (log.trophies || 0), 0)

    return {
      total,
      avgStars: (sumStars / total).toFixed(2),
      avgDestruction: `${(sumDestruction / total).toFixed(1)}%`,
      totalCups: sumCups,
    }
  }, [currentLogs])

  function handleCopyTag() {
    if (!player?.playerTag) return
    navigator.clipboard.writeText(player.playerTag)
    setIsCopiedTag(true)
    setTimeout(() => setIsCopiedTag(false), 1500)
  }

  if (!isOpen || !player) return null

  const isCurrentPlayerMe = cleanMyTag && (player.playerTag || player.id).toUpperCase().replace(/^#/, '') === cleanMyTag

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 1. Backdrop làm tối & mờ nhẹ nền */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity ${
          isClosing ? 'animate-drawer-backdrop-out pointer-events-none' : 'animate-drawer-backdrop-in'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* 2. Drawer Panel trượt ra từ cạnh phải */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 pointer-events-none">
        <aside
          className={`glass-drawer pointer-events-auto relative flex w-screen max-w-md sm:max-w-lg flex-col overflow-hidden shadow-2xl ${
            isClosing ? 'animate-drawer-slide-out' : 'animate-drawer-slide-in'
          }`}
        >
          {/* Dải phản quang đỉnh Drawer - Concept TH19 Đỏ & Vàng ánh kim */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-600 via-amber-400 to-red-600 shadow-[0_0_12px_rgba(245,158,11,0.5)]" />

          {/* Header Drawer: Thông tin người chơi & nút đóng */}
          <div className="p-4 sm:p-5 border-b border-[#272226] bg-[#121114] space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <RankBadge rank={player.rank} className="shrink-0 scale-105" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 truncate">
                    <h2
                      className={`truncate text-base sm:text-lg font-black tracking-tight ${
                        isCurrentPlayerMe
                          ? 'text-red-400'
                          : 'text-white'
                      }`}
                      title={player.name}
                    >
                      {player.name}
                    </h2>
                    {isCurrentPlayerMe && (
                      <span className="shrink-0 rounded bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                        {dict.common.me}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400 truncate mt-0.5">
                    {player.playerTag && (
                      <button
                        type="button"
                        onClick={handleCopyTag}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400 hover:text-amber-400 cursor-pointer transition-colors"
                        title={dict.header.copyTagTooltip}
                      >
                        <span>{player.playerTag}</span>
                        {isCopiedTag ? (
                          <Check weight="bold" className="h-3 w-3 text-amber-500 animate-bounce" />
                        ) : (
                          <Copy weight="duotone" className="h-3 w-3 opacity-60 hover:opacity-100" />
                        )}
                      </button>
                    )}
                    {player.clanName && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="truncate">{player.clanName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Nút Đóng X */}
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#272226] bg-[#18171b] text-zinc-400 shadow-2xs hover:bg-[#201d22] hover:text-white transition-colors cursor-pointer"
                title={dict.common.close}
              >
                <X weight="bold" className="h-4 w-4" />
              </button>
            </div>

            {/* Thông số nhanh: Cúp hiện tại & Rating */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <Trophy weight="fill" className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-extrabold text-amber-400 text-sm">
                  {player.currentCups.toLocaleString()}
                </span>
                <span className="text-zinc-400 font-sans">
                  {dict.common.trophies}
                </span>
              </div>

              <div className="w-32">
                <RatingChip rating={player.rating} />
              </div>
            </div>

            {/* Bộ chuyển đổi Tab: Tấn công (Đỏ) & Phòng thủ (Vàng) */}
            <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-[#272226] bg-[#18171b] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('attacks')}
                className={`inline-flex items-center justify-center gap-2 rounded-md py-1.5 px-3 text-xs font-bold transition-all cursor-pointer select-none ${
                  activeTab === 'attacks'
                    ? 'bg-red-600 text-white shadow-xs font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sword weight="bold" className={`h-3.5 w-3.5 ${activeTab === 'attacks' ? 'text-white' : 'text-red-500'}`} />
                <span>{dict.battleLog.attacksTab}</span>
                <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === 'attacks'
                    ? 'bg-red-800/80 text-white'
                    : 'bg-[#272226] text-zinc-400'
                }`}>
                  {attackLogs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('defenses')}
                className={`inline-flex items-center justify-center gap-2 rounded-md py-1.5 px-3 text-xs font-bold transition-all cursor-pointer select-none ${
                  activeTab === 'defenses'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-xs font-black shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Shield weight="bold" className={`h-3.5 w-3.5 ${activeTab === 'defenses' ? 'text-black' : 'text-amber-500'}`} />
                <span>{dict.battleLog.defensesTab}</span>
                <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === 'defenses'
                    ? 'bg-amber-600/30 text-black font-black'
                    : 'bg-[#272226] text-zinc-400'
                }`}>
                  {defenseLogs.length}
                </span>
              </button>
            </div>
          </div>

          {/* Dải tổng hợp thông số hiệu suất (Summary Strip) */}
          {!isLoading && !error && currentLogs.length > 0 && (
            <div className="px-4 sm:px-5 py-2.5 border-b border-[#272226] bg-[#0e0d10]">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-md border border-[#272226] bg-[#121114] shadow-2xs">
                  <span className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                    {dict.battleLog.totalBattles}
                  </span>
                  <span className="font-mono text-sm font-bold text-white">
                    {summary.total}
                  </span>
                </div>
                <div className="p-2 rounded-md border border-[#272226] bg-[#121114] shadow-2xs">
                  <span className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                    {dict.battleLog.avgStars}
                  </span>
                  <span className="font-mono text-sm font-black text-amber-400">
                    {summary.avgStars}★
                  </span>
                </div>
                <div className="p-2 rounded-md border border-[#272226] bg-[#121114] shadow-2xs">
                  <span className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                    {dict.battleLog.avgDestruction}
                  </span>
                  <span className="font-mono text-sm font-bold text-red-500">
                    {summary.avgDestruction}
                  </span>
                </div>
                <div className="p-2 rounded-md border border-[#272226] bg-[#121114] shadow-2xs">
                  <span className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                    {activeTab === 'attacks' ? dict.battleLog.totalCupsWon : dict.battleLog.totalCupsDefense}
                  </span>
                  <span className="font-mono text-sm font-black text-amber-400">
                    +{summary.totalCups}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Danh sách trận đấu (Cuộn trang) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
            {/* 1. Trạng thái Đang tải (Skeleton Shimmer Wave) */}
            {isLoading && (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="h-4 w-36 rounded-md skeleton-shimmer" />
                        <div className="h-3 w-20 rounded-md skeleton-shimmer" />
                      </div>
                      <div className="h-3.5 w-16 rounded-md skeleton-shimmer" />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800/80">
                      <div className="h-4 w-20 rounded-md skeleton-shimmer" />
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-12 rounded-md skeleton-shimmer" />
                        <div className="h-4 w-10 rounded-md skeleton-shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Trạng thái Báo lỗi */}
            {!isLoading && error && (
              <div className="rounded-lg border border-red-200 bg-red-50/60 p-5 text-center dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200 space-y-3">
                <p className="text-xs">{error}</p>
                <button
                  type="button"
                  onClick={() => loadLogs(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-2xs hover:bg-red-50 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300 cursor-pointer transition-colors"
                >
                  <ArrowClockwise weight="bold" className="h-3.5 w-3.5" />
                  <span>{dict.battleLog.retry}</span>
                </button>
              </div>
            )}

            {/* 3. Trạng thái Không có trận nào (Empty) */}
            {!isLoading && !error && currentLogs.length === 0 && (
              <div className="rounded-xl border border-[#272226] bg-[#121114] p-8 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-[#272226] bg-[#18171b] text-zinc-400 shadow-2xs">
                  {activeTab === 'attacks' ? (
                    <Sword weight="bold" className="h-5 w-5 text-red-400" />
                  ) : (
                    <Shield weight="bold" className="h-5 w-5 text-amber-400" />
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  {activeTab === 'attacks' ? dict.battleLog.noAttacks : dict.battleLog.noDefenses}
                </p>
              </div>
            )}

            {/* 4. Danh sách các trận đấu thực tế */}
            {!isLoading && !error && currentLogs.length > 0 && (
              <div className="space-y-2">
                {currentLogs.map((log, index) => {
                  const cleanOpponentTag = (log.opponentPlayerTag || '').toUpperCase().replace(/^#/, '')
                  const isOpponentMe = cleanMyTag && cleanOpponentTag === cleanMyTag

                  return (
                    <div
                      key={`${log.opponentPlayerTag}-${log.creationTime || index}`}
                      className="group relative rounded-lg border border-[#272226] bg-[#121114] p-3 shadow-2xs transition-colors hover:border-[#38323a]"
                    >
                      {/* Dòng trên: Tên & Tag đối thủ, Huy hiệu đặc biệt, Thời gian */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs sm:text-sm text-white truncate">
                              {log.opponentName || log.opponentPlayerTag}
                            </span>
                            {isOpponentMe && (
                              <span className="rounded bg-red-500/15 border border-red-500/30 px-1.5 py-0.2 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                                {dict.battleLog.versusYou}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-zinc-400">
                            {log.opponentPlayerTag}
                          </span>
                        </div>

                        {log.creationTime && (
                          <span className="shrink-0 text-[11px] font-medium text-zinc-400">
                            {formatBattleTime(log.creationTime)}
                          </span>
                        )}
                      </div>

                      {/* Dòng dưới: 3 Sao (Stars), % Phá hủy, Cúp */}
                      <div className="mt-2.5 flex items-center justify-between border-t border-[#272226] pt-2">
                        {/* Biểu tượng 3 ngôi sao */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              weight={starIdx <= log.stars ? 'fill' : 'duotone'}
                              className={`h-4 w-4 ${
                                starIdx <= log.stars
                                  ? 'text-amber-400'
                                  : 'text-zinc-700'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-semibold text-zinc-300 font-mono">
                            {log.stars}/3
                          </span>
                        </div>

                        {/* % Phá hủy & Cúp thay đổi */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold font-mono ${
                              log.destructionPercentage === 100
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : log.destructionPercentage >= 70
                                  ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                  : 'bg-[#18171b] text-zinc-300 border border-[#272226]'
                            }`}
                          >
                            {log.destructionPercentage}%
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 font-mono text-xs font-black ${
                              log.trophies > 0
                                ? 'text-amber-400'
                                : 'text-zinc-500'
                            }`}
                          >
                            <Trophy weight="fill" className={`h-3.5 w-3.5 ${log.trophies > 0 ? 'text-amber-500' : 'text-zinc-600'}`} />
                            {log.trophies > 0 ? `+${log.trophies}` : '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
