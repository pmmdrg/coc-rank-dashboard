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
        className={`fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity ${
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
          {/* Header Drawer: Thông tin người chơi & nút đóng */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <RankBadge rank={player.rank} className="shrink-0 scale-105" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 truncate">
                    <h2
                      className={`truncate text-base sm:text-lg font-black tracking-tight ${
                        isCurrentPlayerMe
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                      title={player.name}
                    >
                      {player.name}
                    </h2>
                    {isCurrentPlayerMe && (
                      <span className="shrink-0 rounded bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                        {dict.common.me}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {player.playerTag && (
                      <button
                        type="button"
                        onClick={handleCopyTag}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 cursor-pointer transition-colors"
                        title={dict.header.copyTagTooltip}
                      >
                        <span>{player.playerTag}</span>
                        {isCopiedTag ? (
                          <Check weight="bold" className="h-3 w-3 text-emerald-500 animate-bounce" />
                        ) : (
                          <Copy weight="duotone" className="h-3 w-3 opacity-60 hover:opacity-100" />
                        )}
                      </button>
                    )}
                    {player.clanName && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
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
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                title={dict.common.close}
              >
                <X weight="bold" className="h-4 w-4" />
              </button>
            </div>

            {/* Thông số nhanh: Cúp hiện tại & Rating */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <Trophy weight="duotone" className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                  {player.currentCups.toLocaleString()}
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-sans">
                  {dict.common.trophies}
                </span>
              </div>

              <div className="w-32">
                <RatingChip rating={player.rating} />
              </div>
            </div>

            {/* Bộ chuyển đổi Tab: Tấn công & Phòng thủ */}
            <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/80">
              <button
                type="button"
                onClick={() => setActiveTab('attacks')}
                className={`inline-flex items-center justify-center gap-2 rounded-md py-1.5 px-3 text-xs font-semibold transition-all cursor-pointer select-none ${
                  activeTab === 'attacks'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Sword weight="bold" className={`h-3.5 w-3.5 ${activeTab === 'attacks' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>{dict.battleLog.attacksTab}</span>
                <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === 'attacks'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'bg-slate-200/60 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {attackLogs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('defenses')}
                className={`inline-flex items-center justify-center gap-2 rounded-md py-1.5 px-3 text-xs font-semibold transition-all cursor-pointer select-none ${
                  activeTab === 'defenses'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Shield weight="bold" className={`h-3.5 w-3.5 ${activeTab === 'defenses' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                <span>{dict.battleLog.defensesTab}</span>
                <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === 'defenses'
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'bg-slate-200/60 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {defenseLogs.length}
                </span>
              </button>
            </div>
          </div>

          {/* Dải tổng hợp thông số hiệu suất (Summary Strip) */}
          {!isLoading && !error && currentLogs.length > 0 && (
            <div className="px-4 sm:px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-md border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                    {dict.battleLog.totalBattles}
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                    {summary.total}
                  </span>
                </div>
                <div className="p-2 rounded-md border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                    {dict.battleLog.avgStars}
                  </span>
                  <span className="font-mono text-sm font-bold text-amber-500">
                    {summary.avgStars}★
                  </span>
                </div>
                <div className="p-2 rounded-md border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                    {dict.battleLog.avgDestruction}
                  </span>
                  <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400">
                    {summary.avgDestruction}
                  </span>
                </div>
                <div className="p-2 rounded-md border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                    {activeTab === 'attacks' ? dict.battleLog.totalCupsWon : dict.battleLog.totalCupsDefense}
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
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
                    className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="h-4 w-36 rounded-md skeleton-shimmer" />
                        <div className="h-3 w-20 rounded-md skeleton-shimmer" />
                      </div>
                      <div className="h-3.5 w-16 rounded-md skeleton-shimmer" />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800/80">
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
              <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-5 text-center dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200 space-y-3">
                <p className="text-xs">{error}</p>
                <button
                  type="button"
                  onClick={() => loadLogs(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-2xs hover:bg-rose-50 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-300 cursor-pointer transition-colors"
                >
                  <ArrowClockwise weight="bold" className="h-3.5 w-3.5" />
                  <span>{dict.battleLog.retry}</span>
                </button>
              </div>
            )}

            {/* 3. Trạng thái Không có trận nào (Empty) */}
            {!isLoading && !error && currentLogs.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/40 space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500 shadow-2xs">
                  {activeTab === 'attacks' ? (
                    <Sword weight="bold" className="h-5 w-5" />
                  ) : (
                    <Shield weight="bold" className="h-5 w-5" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
                      className="group relative rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 shadow-2xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {/* Dòng trên: Tên & Tag đối thủ, Huy hiệu đặc biệt, Thời gian */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                              {log.opponentName || log.opponentPlayerTag}
                            </span>
                            {isOpponentMe && (
                              <span className="rounded bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.2 text-[9px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                                {dict.battleLog.versusYou}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                            {log.opponentPlayerTag}
                          </span>
                        </div>

                        {log.creationTime && (
                          <span className="shrink-0 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            {formatBattleTime(log.creationTime)}
                          </span>
                        )}
                      </div>

                      {/* Dòng dưới: 3 Sao (Stars), % Phá hủy, Cúp */}
                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
                        {/* Biểu tượng 3 ngôi sao */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              weight={starIdx <= log.stars ? 'fill' : 'duotone'}
                              className={`h-4 w-4 ${
                                starIdx <= log.stars
                                  ? 'text-amber-400'
                                  : 'text-slate-200 dark:text-slate-700'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                            {log.stars}/3
                          </span>
                        </div>

                        {/* % Phá hủy & Cúp thay đổi */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold font-mono ${
                              log.destructionPercentage === 100
                                ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/20'
                                : log.destructionPercentage >= 70
                                  ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-500/20'
                                  : 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/20'
                            }`}
                          >
                            {log.destructionPercentage}%
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
                              log.trophies > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            <Trophy weight="bold" className="h-3.5 w-3.5" />
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
