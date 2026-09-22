import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import type { Player, RankingStats, Season } from '../types'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { PlayerRow } from './PlayerRow'

interface PlayerTableProps {
  season: Season
  rankedPlayers: Player[]
  stats: RankingStats
  onAddPlayer: () => void
  onRemovePlayer: (playerId: string) => void
  onSelectMyPlayer: (playerId: string) => void
  onUpdatePlayerField: (playerId: string, field: keyof Player, value: string | number) => void
}

export function PlayerTable({
  season,
  rankedPlayers,
  stats,
  onAddPlayer,
  onRemovePlayer,
  onSelectMyPlayer,
  onUpdatePlayerField,
}: PlayerTableProps) {
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null)
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null)
  const [rankJumpInfo, setRankJumpInfo] = useState<{
    playerId: string
    fromRank: number
    toRank: number
  } | null>(null)

  const rowRefs = useRef(new Map<string, HTMLTableRowElement>())
  const previousRowRects = useRef(new Map<string, DOMRect>())
  const initialEditRanks = useRef<Map<string, number>>(new Map())
  const typingDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const highlightCleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (typingDebounceTimer.current) clearTimeout(typingDebounceTimer.current)
      if (highlightCleanupTimer.current) clearTimeout(highlightCleanupTimer.current)
    }
  }, [])

  const promotionCount = season.promotionCount !== undefined ? season.promotionCount : 2
  const demotionCount = season.demotionCount !== undefined ? season.demotionCount : 1
  const totalPlayers = rankedPlayers.length

  const showPromotionLine = promotionCount > 0 && promotionCount < totalPlayers
  const showDemotionLine =
    demotionCount > 0 &&
    demotionCount < totalPlayers &&
    totalPlayers - demotionCount >= promotionCount

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nextRects = new Map<string, DOMRect>()

    rowRefs.current.forEach((element, playerId) => {
      nextRects.set(playerId, element.getBoundingClientRect())
    })

    if (!prefersReducedMotion) {
      nextRects.forEach((rect, playerId) => {
        const previousRect = previousRowRects.current.get(playerId)
        const element = rowRefs.current.get(playerId)
        if (!previousRect || !element) return

        const deltaY = previousRect.top - rect.top
        if (Math.abs(deltaY) < 1) return

        element.animate(
          [{ transform: `translateY(${deltaY}px)` }, { transform: 'translateY(0)' }],
          {
            duration: 260,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
          },
        )
      })
    }

    previousRowRects.current = nextRects
  }, [rankedPlayers])

  function setPlayerRowRef(playerId: string, element: HTMLTableRowElement | null) {
    if (element) {
      rowRefs.current.set(playerId, element)
    } else {
      rowRefs.current.delete(playerId)
    }
  }

  // Ghi nhận thứ hạng của người chơi lúc người dùng bắt đầu chạm/focus vào ô nhập
  function handleStartEditing(playerId: string, currentRank: number) {
    if (!initialEditRanks.current.has(playerId)) {
      initialEditRanks.current.set(playerId, currentRank)
    }
  }

  // Tự động cuộn màn hình mượt mà tới vị trí hàng người chơi và bật hiệu ứng highlight
  const scrollToPlayerRow = useCallback(
    (playerId: string) => {
      const rowEl = rowRefs.current.get(playerId)
      if (!rowEl) return

      const fromRank = initialEditRanks.current.get(playerId)
      const currentPlayer = rankedPlayers.find((p) => p.id === playerId)
      const toRank = currentPlayer?.rank

      if (fromRank !== undefined && toRank !== undefined && fromRank !== toRank) {
        setRankJumpInfo({ playerId, fromRank, toRank })
      }

      setHighlightedPlayerId(playerId)
      if (highlightCleanupTimer.current) clearTimeout(highlightCleanupTimer.current)
      highlightCleanupTimer.current = setTimeout(() => {
        setHighlightedPlayerId(null)
        setRankJumpInfo(null)
        initialEditRanks.current.delete(playerId)
      }, 3000)

      // Kiểm tra vị trí của hàng xem có đang hiển thị rõ trong khung nhìn không
      const rect = rowEl.getBoundingClientRect()
      const headerOffset = 110 // Đệm tránh bị thanh header sticky che khuất
      const isComfortablyVisible =
        rect.top >= headerOffset && rect.bottom <= window.innerHeight - 40

      // Nếu hàng nhảy ra ngoài khung nhìn (lên trên hoặc xuống dưới), cuộn tới ngay
      if (!isComfortablyVisible) {
        rowEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    },
    [rankedPlayers],
  )

  // Xử lý khi kết thúc chỉnh sửa (rời khỏi ô nhập hoặc bấm Enter)
  function handleFinishEditing(playerId: string) {
    if (typingDebounceTimer.current) {
      clearTimeout(typingDebounceTimer.current)
      typingDebounceTimer.current = null
    }
    setTimeout(() => {
      scrollToPlayerRow(playerId)
    }, 100)
  }

  // Xử lý khi đang gõ phím (tự động cuộn sau 850ms nếu dừng tay mà không blur)
  function handleFieldChange(playerId: string, field: keyof Player, value: string | number) {
    onUpdatePlayerField(playerId, field, value)

    if (typingDebounceTimer.current) {
      clearTimeout(typingDebounceTimer.current)
    }
    typingDebounceTimer.current = setTimeout(() => {
      scrollToPlayerRow(playerId)
    }, 850)
  }

  return (
    <section className="glass-panel rounded-xl shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200/60 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700/60">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Danh sách Người chơi</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Chỉnh sửa số cup hoặc lượt đánh sẽ tự động sắp xếp lại thứ hạng và cập nhật thống kê ngay lập tức.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddPlayer}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-blue-700 hover:shadow-md active:scale-95 dark:bg-sky-600 dark:hover:bg-sky-500"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Thêm người chơi
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1060px] border-collapse text-left text-sm">
          <thead className="soft-table-head text-xs uppercase tracking-wider">
            <tr>
              <th className="w-20 px-3.5 py-3">Rank</th>
              <th className="px-3.5 py-3">Tên người chơi</th>
              <th className="w-16 px-3.5 py-3 text-center">Tôi</th>
              <th className="w-36 px-3.5 py-3">Lượt đánh</th>
              <th className="w-36 px-3.5 py-3">Lượt thủ</th>
              <th className="w-36 px-3.5 py-3">Cup hiện tại</th>
              <th className="w-36 px-3.5 py-3">Cup tối đa</th>
              <th className="w-36 px-3.5 py-3">Đánh giá</th>
              <th className="w-14 px-3.5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60">
            {rankedPlayers.map((player, index) => {
              const isMyPlayer = player.id === season.myPlayerId
              const canPassMe = Boolean(
                stats.myPlayer &&
                  !isMyPlayer &&
                  player.maxPossibleCups > stats.myPlayer.maxPossibleCups,
              )
              const isPromotionZone = promotionCount > 0 && player.rank <= promotionCount
              const isDemotionZone =
                demotionCount > 0 && player.rank > totalPlayers - demotionCount

              const isAfterPromotionLine = showPromotionLine && index === promotionCount - 1
              const isBeforeDemotionLine =
                showDemotionLine && index === totalPlayers - demotionCount - 1

              return (
                <Fragment key={player.id}>
                  <PlayerRow
                    player={player}
                    maxAttacks={season.maxAttacks ?? 24}
                    maxDefenses={season.maxDefenses ?? 24}
                    isMyPlayer={isMyPlayer}
                    canPassMe={canPassMe}
                    isRemoving={removingPlayerId === player.id}
                    isPromotionZone={isPromotionZone}
                    isDemotionZone={isDemotionZone}
                    isHighlighted={highlightedPlayerId === player.id}
                    rankJump={rankJumpInfo?.playerId === player.id ? rankJumpInfo : null}
                    onSelectMyPlayer={() => onSelectMyPlayer(player.id)}
                    onUpdateField={(field, value) => handleFieldChange(player.id, field, value)}
                    onStartEditing={() => handleStartEditing(player.id, player.rank)}
                    onFinishEditing={() => handleFinishEditing(player.id)}
                    onRequestRemove={() => setPlayerToDelete(player)}
                    setRowRef={(el) => setPlayerRowRef(player.id, el)}
                  />

                  {/* Vạch Phân Cách Thăng Hạng */}
                  {isAfterPromotionLine && (
                    <tr key="divider-promotion" className="select-none">
                      <td colSpan={9} className="p-0 border-y-2 border-emerald-500 bg-emerald-500/20 dark:bg-emerald-950/70">
                        <div className="flex items-center justify-between px-4 py-2 text-xs font-black text-emerald-800 dark:text-emerald-300">
                          <div className="flex items-center gap-2">
                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                              ▲
                            </span>
                            <span className="tracking-wide">VẠCH THĂNG HẠNG (Top {promotionCount} người chơi đứng đầu)</span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-700/90 dark:text-emerald-400">
                            Các vị trí từ #1 đến #{promotionCount} sẽ được thăng hạng
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Vạch Phân Cách Xuống Hạng */}
                  {isBeforeDemotionLine && (
                    <tr key="divider-demotion" className="select-none">
                      <td colSpan={9} className="p-0 border-y-2 border-rose-500 bg-rose-500/20 dark:bg-rose-950/70">
                        <div className="flex items-center justify-between px-4 py-2 text-xs font-black text-rose-800 dark:text-rose-300">
                          <div className="flex items-center gap-2">
                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                              ▼
                            </span>
                            <span className="tracking-wide">VẠCH XUỐNG HẠNG ({demotionCount} người chơi cuối bảng)</span>
                          </div>
                          <span className="text-[11px] font-semibold text-rose-700/90 dark:text-rose-400">
                            Các vị trí từ #{totalPlayers - demotionCount + 1} đến #{totalPlayers} sẽ bị xuống hạng
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend hướng dẫn màu */}
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200/60 px-5 py-3 text-xs text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
        <span className="font-semibold text-slate-600 dark:text-slate-300">Chú thích hàng:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs border border-sky-400/40 bg-sky-400/30" />
          Tài khoản của bạn
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs border border-rose-400/40 bg-rose-400/30" />
          Có thể vượt bạn (Cup tối đa &gt; Cup tối đa của bạn)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs border border-emerald-400/40 bg-emerald-400/30" />
          Chắc chắn xếp dưới bạn (Cup tối đa ≤ Cup tối đa của bạn)
        </span>
        {promotionCount > 0 && (
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            ▲ Thăng hạng (Top {promotionCount})
          </span>
        )}
        {demotionCount > 0 && (
          <span className="inline-flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            ▼ Xuống hạng ({demotionCount} người cuối)
          </span>
        )}
      </div>

      {/* Modal xác nhận xóa người chơi */}
      <ConfirmDeleteModal
        player={playerToDelete}
        onClose={() => setPlayerToDelete(null)}
        onConfirm={() => {
          if (!playerToDelete) return
          const id = playerToDelete.id
          setPlayerToDelete(null)
          setRemovingPlayerId(id)
          setTimeout(() => {
            onRemovePlayer(id)
            setRemovingPlayerId(null)
          }, 230)
        }}
      />
    </section>
  )
}
