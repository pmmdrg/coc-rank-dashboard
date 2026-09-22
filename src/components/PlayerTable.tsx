import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
  const [frozenOrderIds, setFrozenOrderIds] = useState<string[] | null>(null)
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null)
  const [rankJumpInfo, setRankJumpInfo] = useState<{
    playerId: string
    fromRank: number
    toRank: number
  } | null>(null)

  const rowRefs = useRef(new Map<string, HTMLTableRowElement>())
  const previousRowRects = useRef(new Map<string, DOMRect>())
  const targetRowRects = useRef(new Map<string, DOMRect>())
  const rankedPlayersRef = useRef(rankedPlayers)
  const previousRanksRef = useRef<Map<string, number>>(
    new Map(rankedPlayers.map((p) => [p.id, p.rank])),
  )
  const typingDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const highlightCleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Đồng bộ rankedPlayersRef sau mỗi lần render để các callback bất đồng bộ luôn truy cập dữ liệu mới nhất
  useEffect(() => {
    rankedPlayersRef.current = rankedPlayers
  })

  // Dọn dẹp timer khi unmount
  useEffect(() => {
    return () => {
      if (typingDebounceTimer.current) clearTimeout(typingDebounceTimer.current)
      if (highlightCleanupTimer.current) clearTimeout(highlightCleanupTimer.current)
    }
  }, [])

  // Cập nhật previousRanksRef khi ở trạng thái nhàn rỗi (không bị đóng băng thứ tự hàng)
  useEffect(() => {
    if (!frozenOrderIds) {
      const map = new Map<string, number>()
      rankedPlayers.forEach((p) => {
        map.set(p.id, p.rank)
      })
      previousRanksRef.current = map
    }
  }, [rankedPlayers, frozenOrderIds])

  // Danh sách hiển thị:
  // - Khi KHÔNG gõ phím (frozenOrderIds === null): luôn hiển thị danh sách đã sắp xếp mới nhất.
  // - Khi ĐANG gõ phím: ĐÓNG BĂNG thứ tự các hàng (frozenOrderIds) để các hàng không bị nhảy vị trí,
  //   nhưng dữ liệu cup, lượt đánh... bên trong hàng vẫn cập nhật theo thời gian thực.
  const displayedPlayers = useMemo(() => {
    if (!frozenOrderIds || frozenOrderIds.length !== rankedPlayers.length) {
      return rankedPlayers
    }

    const playerMap = new Map(rankedPlayers.map((p) => [p.id, p]))
    return frozenOrderIds.map((id, index) => {
      const p = playerMap.get(id)
      if (!p) return rankedPlayers[index]
      return {
        ...p,
        rank: index + 1, // Giữ rank hiển thị theo vị trí chưa nhảy trong lúc đang gõ
      }
    })
  }, [rankedPlayers, frozenOrderIds])

  const promotionCount = season.promotionCount !== undefined ? season.promotionCount : 2
  const demotionCount = season.demotionCount !== undefined ? season.demotionCount : 1
  const totalPlayers = displayedPlayers.length

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
            duration: 440,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          },
        )
      })
    }

    targetRowRects.current = nextRects
    previousRowRects.current = nextRects
  }, [displayedPlayers])

  function setPlayerRowRef(playerId: string, element: HTMLTableRowElement | null) {
    if (element) {
      rowRefs.current.set(playerId, element)
    } else {
      rowRefs.current.delete(playerId)
    }
  }

  // Khi người dùng focus vào ô nhập: đóng băng thứ tự hàng hiện tại để không bị nhảy hàng khi đang gõ
  function handleStartEditing() {
    setFrozenOrderIds((prev) => prev ?? rankedPlayers.map((p) => p.id))
  }

  // Thực hiện sắp xếp lại bảng (commit sort) và cuộn màn hình tới hàng người chơi
  const commitSortAndScroll = useCallback(
    (playerId: string) => {
      // 1. Lấy thứ hạng trước khi sắp xếp và thứ hạng mới nhất từ nguồn dữ liệu chuẩn (tránh stale closure)
      const fromRank = previousRanksRef.current.get(playerId)
      const currentPlayer = rankedPlayersRef.current.find((p) => p.id === playerId)
      const toRank = currentPlayer?.rank

      if (fromRank !== undefined && toRank !== undefined && fromRank !== toRank) {
        setRankJumpInfo({ playerId, fromRank, toRank })
      } else {
        setRankJumpInfo(null)
      }

      // 2. Cập nhật lại previousRanksRef với toàn bộ thứ hạng mới nhất
      const nextRanks = new Map<string, number>()
      rankedPlayersRef.current.forEach((p) => {
        nextRanks.set(p.id, p.rank)
      })
      previousRanksRef.current = nextRanks

      // 3. Hủy đóng băng vị trí hàng -> cho phép danh sách sắp xếp lại theo thứ hạng thực tế
      setFrozenOrderIds(null)

      // 4. Chờ layout DOM cập nhật thứ tự mới, sau đó kích hoạt cuộn mượt và highlight
      setTimeout(() => {
        const rowEl = rowRefs.current.get(playerId)
        if (!rowEl) return

        setHighlightedPlayerId(playerId)
        if (highlightCleanupTimer.current) clearTimeout(highlightCleanupTimer.current)
        highlightCleanupTimer.current = setTimeout(() => {
          setHighlightedPlayerId(null)
          setRankJumpInfo(null)
        }, 3400)

        // Kiểm tra vị trí đích chuẩn của hàng xem có đang hiển thị rõ trong khung nhìn không
        const targetRect = targetRowRects.current.get(playerId) ?? rowEl.getBoundingClientRect()
        const headerOffset = 110 // Đệm tránh bị thanh header sticky che khuất
        const isComfortablyVisible =
          targetRect.top >= headerOffset && targetRect.bottom <= window.innerHeight - 40

        // Nếu hàng nhảy ra ngoài khung nhìn (lên trên hoặc xuống dưới), cuộn tới ngay
        if (!isComfortablyVisible) {
          rowEl.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      }, 70)
    },
    [],
  )

  // Xử lý khi kết thúc chỉnh sửa (rời khỏi ô nhập hoặc bấm Enter) -> Sắp xếp lại ngay lập tức
  function handleFinishEditing(playerId: string) {
    if (typingDebounceTimer.current) {
      clearTimeout(typingDebounceTimer.current)
      typingDebounceTimer.current = null
    }
    commitSortAndScroll(playerId)
  }

  // Xử lý khi đang gõ phím: giữ nguyên vị trí hàng, debounce 800ms mới sắp xếp lại
  function handleFieldChange(playerId: string, field: keyof Player, value: string | number) {
    setFrozenOrderIds((prev) => prev ?? rankedPlayers.map((p) => p.id))
    onUpdatePlayerField(playerId, field, value)

    if (typingDebounceTimer.current) {
      clearTimeout(typingDebounceTimer.current)
    }
    typingDebounceTimer.current = setTimeout(() => {
      commitSortAndScroll(playerId)
    }, 800)
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
        <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
          <thead className="soft-table-head text-xs uppercase tracking-wider">
            <tr>
              <th className="w-32 px-3.5 py-3 whitespace-nowrap">Rank</th>
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
            {displayedPlayers.map((player, index) => {
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
                    onStartEditing={handleStartEditing}
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
