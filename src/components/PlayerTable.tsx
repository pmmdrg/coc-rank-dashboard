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

function getElementDocumentTop(element: HTMLElement): number {
  let transformY = 0
  const transform = element.style.transform
  if (transform && transform !== 'none') {
    const match = transform.match(/translateY\((-?[\d.]+)px\)/)
    if (match) transformY = parseFloat(match[1])
  }
  const rect = element.getBoundingClientRect()
  const scrollY = window.scrollY || document.documentElement.scrollTop
  return rect.top + scrollY - transformY
}

interface AnimatedRowItem {
  element: HTMLElement
  deltaY: number
}

// Đường cong gia tốc sóng Sine tự nhiên (easeInOutSine): khởi đầu êm dịu, đỉnh vận tốc chỉ 1.57x, hãm phanh tự nhiên mềm mại
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function runUnifiedAnimation({
  targetScrollY,
  duration,
  rows,
  easing = easeInOutSine,
}: {
  targetScrollY?: number
  duration: number
  rows: AnimatedRowItem[]
  easing?: (t: number) => number
}): { cancel: () => void } {
  const startScrollY = window.scrollY || document.documentElement.scrollTop
  const shouldScroll = targetScrollY !== undefined && Math.abs(targetScrollY - startScrollY) >= 3
  const scrollDiff = shouldScroll ? targetScrollY - startScrollY : 0

  let isCancelled = false
  let frameId = 0
  let startTime: number | null = null

  // Gán vị trí xuất phát cho toàn bộ các hàng ngay lập tức trong layout frame (0ms delay)
  rows.forEach(({ element, deltaY }) => {
    element.style.transform = `translateY(${deltaY}px)`
    element.style.willChange = 'transform'
  })

  const cleanup = () => {
    rows.forEach(({ element }) => {
      element.style.transform = ''
      element.style.willChange = ''
    })
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchmove', cancel)
  }

  const cancel = () => {
    if (isCancelled) return
    isCancelled = true
    cancelAnimationFrame(frameId)
    cleanup()
  }

  window.addEventListener('wheel', cancel, { passive: true, once: true })
  window.addEventListener('touchmove', cancel, { passive: true, once: true })

  function step(currentTime: number) {
    if (isCancelled) return

    if (startTime === null) {
      startTime = currentTime
    }

    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = easing(progress)

    // 1. Cuộn camera đồng bộ
    if (shouldScroll) {
      window.scrollTo(0, startScrollY + scrollDiff * ease)
    }

    // 2. Di chuyển các hàng cùng 1 biến ease và 1 tick đồng hồ duy nhất
    const remaining = 1 - ease
    rows.forEach(({ element, deltaY }) => {
      const currentY = deltaY * remaining
      if (Math.abs(currentY) < 0.2) {
        element.style.transform = ''
      } else {
        element.style.transform = `translateY(${currentY}px)`
      }
    })

    if (progress < 1) {
      frameId = requestAnimationFrame(step)
    } else {
      cleanup()
    }
  }

  frameId = requestAnimationFrame(step)
  return { cancel }
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
  const previousRowTops = useRef(new Map<string, number>())
  const activeScrollAnimation = useRef<{ cancel: () => void } | null>(null)
  const pendingScrollPlayerId = useRef<string | null>(null)
  const isEditingDirty = useRef(false)
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

  // Dọn dẹp timer và animation khi unmount
  useEffect(() => {
    return () => {
      if (typingDebounceTimer.current) clearTimeout(typingDebounceTimer.current)
      if (highlightCleanupTimer.current) clearTimeout(highlightCleanupTimer.current)
      if (activeScrollAnimation.current) activeScrollAnimation.current.cancel()
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
    const currentScroll = window.scrollY || document.documentElement.scrollTop
    const nextTops = new Map<string, number>()

    rowRefs.current.forEach((element, playerId) => {
      let transformY = 0
      const transform = element.style.transform
      if (transform && transform !== 'none') {
        const match = transform.match(/translateY\((-?[\d.]+)px\)/)
        if (match) transformY = parseFloat(match[1])
      }
      const rect = element.getBoundingClientRect()
      nextTops.set(playerId, rect.top + currentScroll - transformY)
    })

    if (!prefersReducedMotion) {
      const jumpingPlayerId = pendingScrollPlayerId.current
      pendingScrollPlayerId.current = null

      // Thu thập toàn bộ các hàng có sự thay đổi vị trí
      const movingRows: AnimatedRowItem[] = []
      nextTops.forEach((currentTop, playerId) => {
        const previousTop = previousRowTops.current.get(playerId)
        const element = rowRefs.current.get(playerId)
        if (previousTop === undefined || !element) return

        const deltaY = previousTop - currentTop
        if (Math.abs(deltaY) < 1) return

        movingRows.push({ element, deltaY })
      })

      if (movingRows.length > 0) {
        let targetTop: number | undefined

        const targetRowEl = jumpingPlayerId ? rowRefs.current.get(jumpingPlayerId) : null
        if (jumpingPlayerId && targetRowEl && targetRowEl.isConnected) {
          const rowDocTop = getElementDocumentTop(targetRowEl)
          const currentScroll = window.scrollY || document.documentElement.scrollTop
          const headerOffset = 110
          const rowHeight = targetRowEl.offsetHeight || 48

          const isComfortablyVisible =
            rowDocTop >= currentScroll + headerOffset &&
            rowDocTop + rowHeight <= currentScroll + window.innerHeight - 40

          if (!isComfortablyVisible) {
            targetTop = Math.max(
              0,
              rowDocTop - (window.innerHeight / 2) + (rowHeight / 2)
            )
          }
        }

        const currentScroll = window.scrollY || document.documentElement.scrollTop
        const scrollDistance = targetTop !== undefined ? Math.abs(targetTop - currentScroll) : 0
        const maxRowDelta = Math.max(0, ...movingRows.map((r) => Math.abs(r.deltaY)))
        const maxDistance = Math.max(maxRowDelta, scrollDistance)

        // Gia tốc sóng Sine tự nhiên (easeInOutSine): khởi đầu êm dịu, không giật vọt, cập bến nhẹ nhàng
        // Thời lượng scale theo quãng đường: tối thiểu 800ms (cho 1 rank) đến tối đa 3000ms (cho bước nhảy xa kèm cuộn)
        const duration = targetTop !== undefined
          ? Math.min(3000, Math.max(2200, 1600 + maxDistance * 1.0))
          : Math.min(2000, Math.max(800, 600 + maxDistance * 1.5))

        activeScrollAnimation.current = runUnifiedAnimation({
          targetScrollY: targetTop,
          duration,
          rows: movingRows,
          easing: easeInOutSine,
        })
      }
    }

    previousRowTops.current = nextTops
  }, [displayedPlayers])

  function setPlayerRowRef(playerId: string, element: HTMLTableRowElement | null) {
    if (element) {
      rowRefs.current.set(playerId, element)
    } else {
      rowRefs.current.delete(playerId)
    }
  }

  // Thực hiện sắp xếp lại bảng (commit sort) và kích hoạt animation đồng bộ
  const commitSortAndScroll = useCallback(
    (playerId: string) => {
      // Đánh dấu đã commit xong toàn bộ thay đổi, hủy timer debounce nếu còn chạy dở
      isEditingDirty.current = false
      if (typingDebounceTimer.current) {
        clearTimeout(typingDebounceTimer.current)
        typingDebounceTimer.current = null
      }

      // 1. Lấy thứ hạng trước khi sắp xếp và thứ hạng mới nhất từ nguồn dữ liệu chuẩn (tránh stale closure)
      const fromRank = previousRanksRef.current.get(playerId)
      const currentPlayer = rankedPlayersRef.current.find((p) => p.id === playerId)
      const toRank = currentPlayer?.rank
      const didRankChange =
        fromRank !== undefined && toRank !== undefined && fromRank !== toRank

      if (didRankChange) {
        setRankJumpInfo({ playerId, fromRank, toRank })
        pendingScrollPlayerId.current = playerId
        setHighlightedPlayerId(playerId)
        if (highlightCleanupTimer.current) clearTimeout(highlightCleanupTimer.current)
        highlightCleanupTimer.current = setTimeout(() => {
          setHighlightedPlayerId(null)
          setRankJumpInfo(null)
        }, 5000)
      } else {
        setRankJumpInfo(null)
        pendingScrollPlayerId.current = null
      }

      // 2. Cập nhật lại previousRanksRef với toàn bộ thứ hạng mới nhất
      const nextRanks = new Map<string, number>()
      rankedPlayersRef.current.forEach((p) => {
        nextRanks.set(p.id, p.rank)
      })
      previousRanksRef.current = nextRanks

      // 3. Blur phần tử đang focus để ngăn trình duyệt tự động giật màn hình (instant focus snap)
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }

      // 4. Hủy animation cuộn cũ nếu đang chạy dở
      if (activeScrollAnimation.current) {
        activeScrollAnimation.current.cancel()
        activeScrollAnimation.current = null
      }

      // 5. Hủy đóng băng vị trí hàng -> cho phép danh sách sắp xếp lại theo thứ hạng thực tế
      setFrozenOrderIds(null)
    },
    [],
  )

  // Xử lý khi kết thúc chỉnh sửa (rời khỏi ô nhập hoặc bấm Enter) -> Sắp xếp lại ngay lập tức
  function handleFinishEditing(playerId: string) {
    if (typingDebounceTimer.current) {
      clearTimeout(typingDebounceTimer.current)
      typingDebounceTimer.current = null
    }

    // Nếu không có thay đổi số cup nào mới (ví dụ đã dừng gõ hơn 800ms và đã sắp xếp xong trước đó, hoặc chỉ sửa lượt đánh)
    // thì khi blur không cần phải trigger sắp xếp lại hay kích hoạt lại animation
    if (!isEditingDirty.current) {
      if (frozenOrderIds) {
        setFrozenOrderIds(null)
      }
      return
    }

    commitSortAndScroll(playerId)
  }

  // Xử lý khi đang gõ phím: CHỈ đóng băng thứ tự và debounce 800ms sắp xếp lại khi chỉnh sửa số cup
  function handleFieldChange(playerId: string, field: keyof Player, value: string | number) {
    onUpdatePlayerField(playerId, field, value)

    if (field === 'currentCups') {
      isEditingDirty.current = true
      setFrozenOrderIds((prev) => prev ?? rankedPlayers.map((p) => p.id))

      if (typingDebounceTimer.current) {
        clearTimeout(typingDebounceTimer.current)
      }
      typingDebounceTimer.current = setTimeout(() => {
        commitSortAndScroll(playerId)
      }, 800)
    }
  }

  return (
    <section className="glass-panel rounded-xl shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200/60 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Danh sách Người chơi</h2>
            <span
              className="hidden items-center gap-1.5 rounded-full border border-sky-200/60 bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-300 sm:inline-flex"
              title="Nhấn Tab hoặc Enter để sang ô tiếp theo, Shift+Tab để lùi ô, Alt + Mũi tên để di chuyển 4 hướng"
            >
              <span>⌨️</span>
              <kbd className="rounded bg-white px-1 py-0.2 shadow-xs border border-sky-300/50 dark:bg-slate-900 dark:border-sky-800">Tab</kbd> / <kbd className="rounded bg-white px-1 py-0.2 shadow-xs border border-sky-300/50 dark:bg-slate-900 dark:border-sky-800">Enter</kbd> đổi ô nhanh
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Dùng phím <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">Tab</kbd> / <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">Enter</kbd> / <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">Shift+Tab</kbd> hoặc <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">Alt + Mũi tên</kbd> để nhập liệu liền mạch không cần chuột.
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
        <table className="relative w-full min-w-[1080px] border-separate border-spacing-0 text-left text-sm">
          <thead className="soft-table-head text-xs uppercase tracking-wider">
            <tr>
              <th className="w-[136px] min-w-[136px] max-w-[136px] px-2.5 py-2.5 whitespace-nowrap">Rank</th>
              <th className="w-48 min-w-[165px] max-w-[210px] px-2 py-2.5">Tên người chơi</th>
              <th className="w-11 min-w-[40px] px-1 py-2.5 text-center">Tôi</th>
              <th className="w-24 min-w-[88px] px-2 py-2.5 whitespace-nowrap">Lượt đánh</th>
              <th className="w-22 min-w-[84px] px-1.5 py-2.5 whitespace-nowrap text-center">
                <div className="leading-tight">
                  <div>% Phá huỷ</div>
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 normal-case">(Công)</div>
                </div>
              </th>
              <th className="w-24 min-w-[88px] px-2 py-2.5 whitespace-nowrap">Lượt thủ</th>
              <th className="w-22 min-w-[84px] px-1.5 py-2.5 whitespace-nowrap text-center">
                <div className="leading-tight">
                  <div>% Phá huỷ</div>
                  <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 normal-case">(Thủ)</div>
                </div>
              </th>
              <th className="w-24 min-w-[88px] px-2 py-2.5 whitespace-nowrap">Cup hiện tại</th>
              <th className="w-48 min-w-[195px] px-2 py-2.5 whitespace-nowrap">Cup tối đa</th>
              <th className="w-24 min-w-[92px] px-2 py-2.5 whitespace-nowrap text-center">Đánh giá</th>
              <th className="w-11 min-w-[40px] px-1 py-2.5 text-center"></th>
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
                    onFinishEditing={() => handleFinishEditing(player.id)}
                    onRequestRemove={() => setPlayerToDelete(player)}
                    setRowRef={(el) => setPlayerRowRef(player.id, el)}
                  />

                  {/* Vạch Phân Cách Thăng Hạng */}
                  {isAfterPromotionLine && (
                    <tr key="divider-promotion" className="select-none animate-fade-in">
                      <td colSpan={11} className="p-0 border-y-2 border-emerald-500 bg-emerald-500/20 dark:bg-emerald-950/70">
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
                    <tr key="divider-demotion" className="select-none animate-fade-in">
                      <td colSpan={11} className="p-0 border-y-2 border-rose-500 bg-rose-500/20 dark:bg-rose-950/70">
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

      {/* Chú thích biểu tượng & trạng thái */}
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200/60 px-5 py-3 text-xs text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
        <span className="font-semibold text-slate-600 dark:text-slate-300">Chú thích:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs border-l-4 border-l-sky-500 bg-sky-400/20" />
          Tài khoản của bạn
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            ⚠ CÓ THỂ VƯỢT
          </span>
          Cup tối đa &gt; bạn
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-black bg-slate-200/60 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700/40">
            ✓ DƯỚI BẠN
          </span>
          Cup tối đa ≤ bạn
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
