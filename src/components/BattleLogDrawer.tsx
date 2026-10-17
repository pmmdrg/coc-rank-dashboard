import { useCallback, useEffect, useMemo, useState } from 'react'
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

  // Lắng nghe phím ESC để đóng Drawer
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Drawer Panel trượt ra từ cạnh phải */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <aside className="glass-drawer animate-drawer-slide-in relative flex w-screen max-w-md sm:max-w-lg flex-col overflow-hidden shadow-2xl">
          {/* Dải phản quang đỉnh Drawer */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 opacity-90" />

          {/* Header Drawer: Thông tin người chơi & nút đóng */}
          <div className="p-4 sm:p-5 border-b border-white/60 dark:border-white/10 space-y-3.5">
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
                      <span className="shrink-0 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-2 py-0.5 text-[9px] font-black text-white shadow-xs uppercase tracking-wider">
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
                onClick={onClose}
                className="apple-btn inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/60 bg-white/40 text-slate-500 shadow-2xs backdrop-blur-md hover:bg-white/70 hover:text-slate-900 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-700/80 dark:hover:text-white"
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
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('attacks')}
                className={`apple-btn flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer select-none ${
                  activeTab === 'attacks'
                    ? 'border border-indigo-500/50 bg-gradient-to-r from-indigo-500/15 to-sky-500/15 text-indigo-700 shadow-xs dark:border-indigo-400/40 dark:text-indigo-300'
                    : 'border border-white/60 bg-white/30 text-slate-600 hover:bg-white/60 dark:border-white/10 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-800/80'
                }`}
              >
                <Sword weight="bold" className="h-3.5 w-3.5 text-indigo-500" />
                <span>{dict.battleLog.attacksTab}</span>
                <span className="rounded-full bg-slate-500/10 px-1.5 py-0.2 text-[10px] font-extrabold dark:bg-slate-400/10">
                  {attackLogs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('defenses')}
                className={`apple-btn flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer select-none ${
                  activeTab === 'defenses'
                    ? 'border border-purple-500/50 bg-gradient-to-r from-purple-500/15 to-pink-500/15 text-purple-700 shadow-xs dark:border-purple-400/40 dark:text-purple-300'
                    : 'border border-white/60 bg-white/30 text-slate-600 hover:bg-white/60 dark:border-white/10 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-800/80'
                }`}
              >
                <Shield weight="bold" className="h-3.5 w-3.5 text-purple-500" />
                <span>{dict.battleLog.defensesTab}</span>
                <span className="rounded-full bg-slate-500/10 px-1.5 py-0.2 text-[10px] font-extrabold dark:bg-slate-400/10">
                  {defenseLogs.length}
                </span>
              </button>
            </div>
          </div>

          {/* Dải tổng hợp thông số hiệu suất (Summary Strip) */}
          {!isLoading && !error && currentLogs.length > 0 && (
            <div className="px-4 sm:px-5 py-3 border-b border-white/60 bg-white/20 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/30">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-1.5 rounded-lg border border-white/40 bg-white/30 dark:border-white/5 dark:bg-slate-800/40">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tight font-bold">
                    {dict.battleLog.totalBattles}
                  </span>
                  <span className="font-mono text-sm font-black text-slate-800 dark:text-slate-200">
                    {summary.total}
                  </span>
                </div>
                <div className="p-1.5 rounded-lg border border-white/40 bg-white/30 dark:border-white/5 dark:bg-slate-800/40">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tight font-bold">
                    {dict.battleLog.avgStars}
                  </span>
                  <span className="font-mono text-sm font-black text-amber-500">
                    {summary.avgStars}★
                  </span>
                </div>
                <div className="p-1.5 rounded-lg border border-white/40 bg-white/30 dark:border-white/5 dark:bg-slate-800/40">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tight font-bold">
                    {dict.battleLog.avgDestruction}
                  </span>
                  <span className="font-mono text-sm font-black text-sky-600 dark:text-sky-400">
                    {summary.avgDestruction}
                  </span>
                </div>
                <div className="p-1.5 rounded-lg border border-white/40 bg-white/30 dark:border-white/5 dark:bg-slate-800/40">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tight font-bold">
                    {activeTab === 'attacks' ? dict.battleLog.totalCupsWon : dict.battleLog.totalCupsDefense}
                  </span>
                  <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                    +{summary.totalCups}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Danh sách trận đấu (Cuộn trang) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {/* 1. Trạng thái Đang tải (Skeleton Shimmer Wave) */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="glass-panel relative overflow-hidden rounded-xl border border-white/60 p-3.5 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-slate-900/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="h-4 w-36 rounded-md skeleton-shimmer" />
                        <div className="h-3 w-20 rounded-md skeleton-shimmer" />
                      </div>
                      <div className="h-3.5 w-16 rounded-md skeleton-shimmer" />
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-200/50 pt-2.5 dark:border-white/5">
                      <div className="h-5 w-24 rounded-md skeleton-shimmer" />
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-14 rounded-md skeleton-shimmer" />
                        <div className="h-5 w-12 rounded-md skeleton-shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Trạng thái Báo lỗi */}
            {!isLoading && error && (
              <div className="rounded-xl border border-rose-300/60 bg-rose-50/80 p-5 text-center backdrop-blur dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200 space-y-3">
                <p className="text-xs">{error}</p>
                <button
                  type="button"
                  onClick={() => loadLogs(true)}
                  className="apple-btn inline-flex items-center gap-1.5 rounded-xl border border-rose-400/50 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-500/20 dark:text-rose-300 cursor-pointer"
                >
                  <ArrowClockwise weight="bold" className="h-3.5 w-3.5" />
                  <span>{dict.battleLog.retry}</span>
                </button>
              </div>
            )}

            {/* 3. Trạng thái Không có trận nào (Empty) */}
            {!isLoading && !error && currentLogs.length === 0 && (
              <div className="rounded-2xl border border-white/60 bg-white/30 p-8 text-center backdrop-blur-md dark:border-white/10 dark:bg-slate-900/40 space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-100/70 text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500 shadow-2xs">
                  {activeTab === 'attacks' ? (
                    <Sword weight="duotone" className="h-6 w-6" />
                  ) : (
                    <Shield weight="duotone" className="h-6 w-6" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeTab === 'attacks' ? dict.battleLog.noAttacks : dict.battleLog.noDefenses}
                </p>
              </div>
            )}

            {/* 4. Danh sách các trận đấu thực tế */}
            {!isLoading && !error && currentLogs.length > 0 && (
              <div className="space-y-2.5">
                {currentLogs.map((log, index) => {
                  const cleanOpponentTag = (log.opponentPlayerTag || '').toUpperCase().replace(/^#/, '')
                  const isOpponentMe = cleanMyTag && cleanOpponentTag === cleanMyTag

                  return (
                    <div
                      key={`${log.opponentPlayerTag}-${log.creationTime || index}`}
                      className="glass-panel group relative overflow-hidden rounded-xl border border-white/60 p-3.5 shadow-2xs backdrop-blur-md transition-all hover:border-indigo-400/50 hover:shadow-xs dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-indigo-500/40"
                    >
                      {/* Dòng trên: Tên & Tag đối thủ, Huy hiệu đặc biệt, Thời gian */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {log.opponentName || log.opponentPlayerTag}
                            </span>
                            {isOpponentMe && (
                              <span className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 px-2 py-0.5 text-[9px] font-black text-white shadow-xs uppercase tracking-wider">
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
                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/50 pt-2.5 dark:border-white/5">
                        {/* Biểu tượng 3 ngôi sao */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              weight={starIdx <= log.stars ? 'fill' : 'duotone'}
                              className={`h-4.5 w-4.5 ${
                                starIdx <= log.stars
                                  ? 'text-amber-400 drop-shadow-xs'
                                  : 'text-slate-300 dark:text-slate-700'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                            {log.stars}/3
                          </span>
                        </div>

                        {/* % Phá hủy & Cúp thay đổi */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-black shadow-2xs font-mono ${
                              log.destructionPercentage === 100
                                ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 border border-emerald-500/30'
                                : log.destructionPercentage >= 70
                                  ? 'bg-sky-500/15 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 border border-sky-500/30'
                                  : 'bg-rose-500/15 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {log.destructionPercentage}%
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${
                              log.trophies > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            <Trophy weight="duotone" className="h-3.5 w-3.5" />
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
