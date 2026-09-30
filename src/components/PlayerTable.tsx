import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { Player, RankingStats, Season } from '../types'
import { PlayerRow } from './PlayerRow'
import { validatePlayer } from '../lib/validation'

interface PlayerTableProps {
  season: Season
  rankedPlayers: Player[]
  stats: RankingStats
  onUpdatePlayerField?: (playerId: string, field: keyof Player, value: string | number) => void
  targetFocusPlayerId?: string | null
  onClearTargetFocus?: () => void
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
  targetFocusPlayerId,
  onClearTargetFocus,
}: PlayerTableProps) {
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
  const previousRanksRef = useRef<Map<string, number>>(
    new Map(rankedPlayers.map((p) => [p.id, p.rank])),
  )
  const highlightCleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Dọn dẹp timer và animation khi unmount
  useEffect(() => {
    return () => {
      if (highlightCleanupTimer.current) clearTimeout(highlightCleanupTimer.current)
      if (activeScrollAnimation.current) activeScrollAnimation.current.cancel()
    }
  }, [])

  // Theo dõi sự thay đổi thứ hạng khi dữ liệu mùa giải được cập nhật từ Supercell API
  useEffect(() => {
    const prevMap = previousRanksRef.current
    let jumpingPlayer: { playerId: string; fromRank: number; toRank: number } | null = null

    for (const p of rankedPlayers) {
      const fromRank = prevMap.get(p.id)
      if (fromRank !== undefined && fromRank !== p.rank) {
        jumpingPlayer = { playerId: p.id, fromRank, toRank: p.rank }
        break
      }
    }

    if (jumpingPlayer) {
      setRankJumpInfo(jumpingPlayer)
      setHighlightedPlayerId(jumpingPlayer.playerId)
      pendingScrollPlayerId.current = jumpingPlayer.playerId

      if (highlightCleanupTimer.current) clearTimeout(highlightCleanupTimer.current)
      highlightCleanupTimer.current = setTimeout(() => {
        setHighlightedPlayerId(null)
        setRankJumpInfo(null)
      }, 5000)
    }

    const nextMap = new Map<string, number>()
    rankedPlayers.forEach((p) => nextMap.set(p.id, p.rank))
    previousRanksRef.current = nextMap
  }, [rankedPlayers])

  const displayedPlayers = rankedPlayers

  const [filterWarnedOnly, setFilterWarnedOnly] = useState(false)
  const [filterMatchupOnly, setFilterMatchupOnly] = useState(false)

  const warnedPlayerIds = useMemo(() => {
    const ids = new Set<string>()
    for (const p of rankedPlayers) {
      if (validatePlayer(p, season.maxAttacks ?? 24, season.maxDefenses ?? 24).length > 0) {
        ids.add(p.id)
      }
    }
    return ids
  }, [rankedPlayers, season.maxAttacks, season.maxDefenses])

  const matchupPlayerIds = useMemo(() => {
    const ids = new Set<string>()
    for (const p of rankedPlayers) {
      if (
        (p.attackedByMe && p.attackedByMe.length > 0) ||
        (p.defendedAgainstMe && p.defendedAgainstMe.length > 0)
      ) {
        ids.add(p.id)
      }
    }
    return ids
  }, [rankedPlayers])

  // Xử lý khi có yêu cầu chuyển hướng & focus vào một người chơi từ bên ngoài (ví dụ: bấm vào thẻ trong Hạng mục thống kê)
  useEffect(() => {
    if (!targetFocusPlayerId) return

    const cleanTarget = targetFocusPlayerId.trim().toUpperCase().replace(/^#/, '')
    const targetPlayer = rankedPlayers.find((p) => {
      const pId = (p.id || '').toUpperCase().replace(/^#/, '')
      const pTag = (p.playerTag || '').toUpperCase().replace(/^#/, '')
      return pId === cleanTarget || pTag === cleanTarget
    })

    if (!targetPlayer) return

    // Thực hiện trong micro-task / timeout ngắn để đảm bảo không chặn render ban đầu và DOM đã sẵn sàng
    const scrollTimer = setTimeout(() => {
      if (filterWarnedOnly && !warnedPlayerIds.has(targetPlayer.id)) {
        setFilterWarnedOnly(false)
      }
      if (filterMatchupOnly && !matchupPlayerIds.has(targetPlayer.id)) {
        setFilterMatchupOnly(false)
      }
      setHighlightedPlayerId(targetPlayer.id)

      const rowEl = rowRefs.current.get(targetPlayer.id)
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 40)

    if (highlightCleanupTimer.current) clearTimeout(highlightCleanupTimer.current)
    highlightCleanupTimer.current = setTimeout(() => {
      setHighlightedPlayerId(null)
      onClearTargetFocus?.()
    }, 4000)

    return () => {
      clearTimeout(scrollTimer)
    }
  }, [targetFocusPlayerId, rankedPlayers, filterWarnedOnly, filterMatchupOnly, warnedPlayerIds, matchupPlayerIds, onClearTargetFocus])

  const effectivePlayers = useMemo(() => {
    let list = displayedPlayers
    if (filterWarnedOnly) {
      list = list.filter((p) => warnedPlayerIds.has(p.id))
    }
    if (filterMatchupOnly) {
      list = list.filter((p) => matchupPlayerIds.has(p.id))
    }
    return list
  }, [displayedPlayers, filterWarnedOnly, filterMatchupOnly, warnedPlayerIds, matchupPlayerIds])

  const promotionCount = season.promotionCount !== undefined ? season.promotionCount : 2
  const demotionCount = season.demotionCount !== undefined ? season.demotionCount : 1
  const totalPlayers = effectivePlayers.length

  const isFiltered = filterWarnedOnly || filterMatchupOnly
  const showPromotionLine = !isFiltered && promotionCount > 0 && promotionCount < totalPlayers
  const showDemotionLine =
    !isFiltered &&
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

          const jumpingRowMovement = movingRows.find((r) => r.element === targetRowEl)
          const isLargeJump = jumpingRowMovement && Math.abs(jumpingRowMovement.deltaY) > 120

          // Nếu bước nhảy nhỏ (chỉ đổi chỗ 1 hàng ngay trong tầm mắt), không cần cuộn camera
          // Nếu bước nhảy xa hoặc vị trí đích ở ngoài/sát viền màn hình, luôn cuộn mượt để căn giữa
          const isComfortablyVisible =
            !isLargeJump &&
            rowDocTop >= currentScroll + headerOffset + 20 &&
            rowDocTop + rowHeight <= currentScroll + window.innerHeight - 60

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

  return (
    <section className="glass-panel rounded-xl shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200/60 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700/60">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Danh sách Người chơi</h2>
            {/* Trạng thái cập nhật */}
            <span
              className="hidden h-6 items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 text-[11px] font-medium leading-none text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300 sm:inline-flex"
              title="Dữ liệu thứ hạng, cúp và lượt đánh được tính toán tự động từ Supercell API"
            >
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tự động cập nhật theo thời gian thực</span>
            </span>

            {/* Nút lọc người chơi có cảnh báo dữ liệu nếu phát hiện */}
            {warnedPlayerIds.size > 0 && (
              <button
                type="button"
                onClick={() => setFilterWarnedOnly((prev) => !prev)}
                className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium leading-none transition-all cursor-pointer ${
                  filterWarnedOnly
                    ? 'border-amber-500 bg-amber-500 text-white shadow-xs dark:bg-amber-600'
                    : 'border-amber-400/60 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
                title="Nhấp để chỉ xem các người chơi có dữ liệu bất thường cần rà soát"
              >
                <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${filterWarnedOnly ? 'bg-white' : 'bg-amber-500'}`} />
                <span>
                  {warnedPlayerIds.size} người chơi cần rà soát {filterWarnedOnly ? '(Đang lọc)' : ''}
                </span>
              </button>
            )}

            {/* Nút lọc đối thủ đã đối đầu (đã đánh hoặc đã đánh tôi) */}
            {matchupPlayerIds.size > 0 && (
              <button
                type="button"
                onClick={() => setFilterMatchupOnly((prev) => !prev)}
                className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium leading-none transition-all cursor-pointer ${
                  filterMatchupOnly
                    ? 'border-indigo-500 bg-indigo-500 text-white shadow-xs dark:bg-indigo-600'
                    : 'border-indigo-400/60 bg-indigo-500/10 text-indigo-800 hover:bg-indigo-500/20 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-300'
                }`}
                title="Nhấp để chỉ xem các đối thủ trong bảng đấu đã có nhật ký đối đầu (bạn đã đánh hoặc đối thủ đã đánh bạn)"
              >
                <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${filterMatchupOnly ? 'bg-white' : 'bg-indigo-500'}`} />
                <span>
                  {matchupPlayerIds.size} đối thủ đã đối đầu {filterMatchupOnly ? '(Đang lọc)' : ''}
                </span>
              </button>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {season.players.length === 0
              ? 'Dữ liệu người chơi sẽ được tự động tải từ Supercell API hoặc từ file dữ liệu.'
              : 'Dữ liệu Tên, Lượt đánh, Lượt thủ, Cúp được đồng bộ trực tiếp từ Supercell API và tự động xếp hạng theo quy chuẩn giải đấu.'}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="relative w-full min-w-[1080px] border-separate border-spacing-0 text-left text-sm">
          <thead className="soft-table-head text-xs uppercase tracking-wider">
            <tr>
              <th className="w-[136px] min-w-[136px] max-w-[136px] px-2.5 py-2.5 whitespace-nowrap">Rank</th>
              <th className="w-56 min-w-[170px] max-w-[240px] px-2 py-2.5">Tên người chơi</th>
              <th className="w-24 min-w-[88px] px-2 py-2.5 whitespace-nowrap">Lượt đánh</th>
              <th className="w-24 min-w-[88px] px-2 py-2.5 whitespace-nowrap">Lượt thủ</th>
              <th className="w-24 min-w-[88px] px-2 py-2.5 whitespace-nowrap">Cup hiện tại</th>
              <th className="w-36 min-w-[120px] px-2 py-2.5 whitespace-nowrap">Cup tối đa</th>
              <th className="w-24 min-w-[92px] px-2 py-2.5 whitespace-nowrap text-center">Đánh giá</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60">
            {effectivePlayers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                  {filterWarnedOnly || filterMatchupOnly ? (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className="text-base font-semibold text-slate-700 dark:text-slate-200">
                        {filterWarnedOnly
                          ? 'Không có người chơi nào có dữ liệu bất thường!'
                          : 'Chưa có đối thủ nào trong bảng đấu đối đầu với bạn.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterWarnedOnly(false)
                          setFilterMatchupOnly(false)
                        }}
                        className="mt-1 text-xs text-blue-600 hover:underline dark:text-sky-400 cursor-pointer"
                      >
                        Quay lại xem toàn bộ danh sách
                      </button>
                    </div>
                  ) : (
                    'Chưa có dữ liệu'
                  )}
                </td>
              </tr>
            ) : (
              effectivePlayers.map((player, index) => {
                const targetMyTag = (season.myPlayerId || '').trim().toUpperCase().replace(/^#/, '')
                const isMyPlayer = Boolean(
                  targetMyTag &&
                  ((player.id || '').toUpperCase().replace(/^#/, '') === targetMyTag ||
                   (player.playerTag || '').toUpperCase().replace(/^#/, '') === targetMyTag)
                )
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
                      isPromotionZone={isPromotionZone}
                      isDemotionZone={isDemotionZone}
                      isHighlighted={highlightedPlayerId === player.id}
                      rankJump={rankJumpInfo?.playerId === player.id ? rankJumpInfo : null}
                      setRowRef={(el) => setPlayerRowRef(player.id, el)}
                    />

                    {/* Vạch Phân Cách Thăng Hạng */}
                    {isAfterPromotionLine && (
                      <tr key="divider-promotion" className="select-none animate-fade-in">
                        <td colSpan={7} className="p-0 border-y-2 border-emerald-500 bg-emerald-500/20 dark:bg-emerald-950/70">
                          <div className="flex items-center justify-between px-4 py-2 text-xs font-black text-emerald-800 dark:text-emerald-300">
                            <span className="tracking-wide">VẠCH THĂNG HẠNG (Top {promotionCount} người chơi đứng đầu)</span>
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
                        <td colSpan={7} className="p-0 border-y-2 border-rose-500 bg-rose-500/20 dark:bg-rose-950/70">
                          <div className="flex items-center justify-between px-4 py-2 text-xs font-black text-rose-800 dark:text-rose-300">
                            <span className="tracking-wide">VẠCH XUỐNG HẠNG ({demotionCount} người chơi cuối bảng)</span>
                            <span className="text-[11px] font-semibold text-rose-700/90 dark:text-rose-400">
                              Các vị trí từ #{totalPlayers - demotionCount + 1} đến #{totalPlayers} sẽ bị xuống hạng
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
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
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          Cúp tối đa có thể vượt bạn
        </span>
        {promotionCount > 0 && (
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Thăng hạng (Top {promotionCount})
          </span>
        )}
        {demotionCount > 0 && (
          <span className="inline-flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Xuống hạng ({demotionCount} người cuối)
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30">
            Đã đánh
          </span>
          Bạn đã tấn công
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 border border-amber-500/30">
            Đã đánh tôi
          </span>
          Đối thủ đã tấn công bạn
        </span>
      </div>
    </section>
  )
}
