import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Warning, MagnifyingGlass, X } from '@phosphor-icons/react'
import type { Player, RankingStats, Season } from '../types'
import { PlayerRow } from './PlayerRow'
import { validatePlayer } from '../lib/validation'
import { useI18n } from '../i18n/LanguageContext'

export type FilterTab = 'all' | 'promotion' | 'demotion' | 'matchup' | 'canPass' | 'warned'

interface PlayerTableProps {
  season: Season
  rankedPlayers: Player[]
  stats: RankingStats
  onUpdatePlayerField?: (playerId: string, field: keyof Player, value: string | number) => void
  targetFocusPlayerId?: string | null
  onClearTargetFocus?: () => void
  isSyncingApi?: boolean
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
  isSyncingApi = false,
}: PlayerTableProps) {
  const { dict, interpolate } = useI18n()
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null)
  const [rankJumpInfo, setRankJumpInfo] = useState<{
    playerId: string
    fromRank: number
    toRank: number
  } | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [showJumper, setShowJumper] = useState(false)
  const tableSectionRef = useRef<HTMLElement | null>(null)
  const tableContainerRef = useRef<HTMLDivElement | null>(null)
  const tableRef = useRef<HTMLTableElement | null>(null)
  const theadRef = useRef<HTMLTableSectionElement | null>(null)

  const [isStickyHeaderVisible, setIsStickyHeaderVisible] = useState(false)
  const [stickyTop, setStickyTop] = useState(72)
  const [stickyBounds, setStickyBounds] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const [tableScrollLeft, setTableScrollLeft] = useState(0)
  const [tableWidth, setTableWidth] = useState(1080)
  const [colWidths, setColWidths] = useState<number[]>([])

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

  const canPassPlayerIds = useMemo(() => {
    const ids = new Set<string>()
    if (!stats.myPlayer) return ids
    const targetMyTag = (season.myPlayerId || '').trim().toUpperCase().replace(/^#/, '')

    for (const p of rankedPlayers) {
      const pId = (p.id || '').toUpperCase().replace(/^#/, '')
      const pTag = (p.playerTag || '').toUpperCase().replace(/^#/, '')
      const isMyPlayer = Boolean(targetMyTag && (pId === targetMyTag || pTag === targetMyTag))
      if (!isMyPlayer && p.maxPossibleCups > stats.myPlayer.maxPossibleCups) {
        ids.add(p.id)
      }
    }
    return ids
  }, [rankedPlayers, stats.myPlayer, season.myPlayerId])

  const promotionCount = season.promotionCount !== undefined ? season.promotionCount : 2
  const demotionCount = season.demotionCount !== undefined ? season.demotionCount : 1

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

    const scrollTimer = setTimeout(() => {
      setFilterTab('all')
      setSearchQuery('')
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
  }, [targetFocusPlayerId, rankedPlayers, onClearTargetFocus])

  // Lắng nghe cuộn trang và co giãn để đồng bộ Sticky Table Header và Floating Zone Jumper
  useEffect(() => {
    const updateScrollState = () => {
      const sectionEl = tableSectionRef.current
      const containerEl = tableContainerRef.current
      const tableEl = tableRef.current
      const theadEl = theadRef.current
      if (!sectionEl || !containerEl || !tableEl) return

      const sectionRect = sectionEl.getBoundingClientRect()
      const containerRect = containerEl.getBoundingClientRect()
      const tableRect = tableEl.getBoundingClientRect()

      // Lấy chiều cao thực tế của SeasonHeader (sticky ở đỉnh trang)
      const appHeader = document.querySelector('header.glass-header')
      const headerBottom = appHeader ? appHeader.getBoundingClientRect().bottom : 72
      setStickyTop(headerBottom)

      // Hiển thị thanh jumper khi đã cuộn qua khỏi đầu bảng và còn trong bảng
      const inView = sectionRect.top < 0 && sectionRect.bottom > 280
      setShowJumper(inView)

      // Điều kiện hiển thị Sticky Table Header:
      // Khi thead gốc của bảng đã cuộn lên trên headerBottom
      // VÀ mép dưới của table vẫn còn ở dưới headerBottom ít nhất 60px
      const theadTriggerTop = theadEl ? theadEl.getBoundingClientRect().top : containerRect.top
      const shouldShowStickyHeader = theadTriggerTop <= headerBottom && tableRect.bottom > headerBottom + 60

      setIsStickyHeaderVisible(shouldShowStickyHeader)
      if (shouldShowStickyHeader) {
        setStickyBounds({
          left: containerRect.left,
          width: containerRect.width,
        })
        setTableScrollLeft(containerEl.scrollLeft)
        setTableWidth(tableEl.offsetWidth || 1080)

        // Lấy chiều rộng chính xác của từng cột từ thead gốc
        if (theadEl) {
          const ths = theadEl.querySelectorAll('th')
          if (ths.length > 0) {
            const widths = Array.from(ths).map((th) => th.getBoundingClientRect().width)
            setColWidths(widths)
          }
        }
      }
    }

    window.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState, { passive: true })
    updateScrollState()

    return () => {
      window.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [])

  function handleTableContainerScroll() {
    if (tableContainerRef.current) {
      setTableScrollLeft(tableContainerRef.current.scrollLeft)
    }
  }

  const effectivePlayers = useMemo(() => {
    let list = rankedPlayers

    // 1. Lọc theo tab
    if (filterTab === 'promotion') {
      list = list.filter((p) => promotionCount > 0 && p.rank <= promotionCount)
    } else if (filterTab === 'demotion') {
      list = list.filter((p) => demotionCount > 0 && p.rank > rankedPlayers.length - demotionCount)
    } else if (filterTab === 'matchup') {
      list = list.filter((p) => matchupPlayerIds.has(p.id))
    } else if (filterTab === 'canPass') {
      list = list.filter((p) => canPassPlayerIds.has(p.id))
    } else if (filterTab === 'warned') {
      list = list.filter((p) => warnedPlayerIds.has(p.id))
    }

    // 2. Lọc theo từ khóa tìm kiếm (Tên, Clan, Player Tag)
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((p) => {
        const nameMatch = (p.name || '').toLowerCase().includes(q)
        const clanMatch = (p.clanName || '').toLowerCase().includes(q)
        const tagMatch = (p.playerTag || p.id || '').toLowerCase().includes(q)
        return nameMatch || clanMatch || tagMatch
      })
    }

    return list
  }, [
    rankedPlayers,
    filterTab,
    searchQuery,
    promotionCount,
    demotionCount,
    matchupPlayerIds,
    canPassPlayerIds,
    warnedPlayerIds,
  ])

  const totalPlayers = effectivePlayers.length
  const isFiltered = filterTab !== 'all' || searchQuery.trim().length > 0

  const showPromotionLine = !isFiltered && promotionCount > 0 && promotionCount < totalPlayers
  const showDemotionLine =
    !isFiltered &&
    demotionCount > 0 &&
    demotionCount < totalPlayers &&
    totalPlayers - demotionCount >= promotionCount

  function jumpToMyPlayer() {
    if (!stats.myPlayer) return
    if (isFiltered) {
      setFilterTab('all')
      setSearchQuery('')
    }
    setTimeout(() => {
      const el = rowRefs.current.get(stats.myPlayer!.id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlightedPlayerId(stats.myPlayer!.id)
        setTimeout(() => setHighlightedPlayerId(null), 3000)
      }
    }, 50)
  }

  function jumpToPromotion() {
    if (isFiltered) {
      setFilterTab('all')
      setSearchQuery('')
    }
    setTimeout(() => {
      const targetRank = Math.min(promotionCount, rankedPlayers.length)
      const targetPlayer = rankedPlayers.find((p) => p.rank === targetRank)
      if (targetPlayer) {
        const el = rowRefs.current.get(targetPlayer.id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 50)
  }

  function jumpToDemotion() {
    if (isFiltered) {
      setFilterTab('all')
      setSearchQuery('')
    }
    setTimeout(() => {
      const targetRank = Math.max(1, rankedPlayers.length - demotionCount + 1)
      const targetPlayer = rankedPlayers.find((p) => p.rank === targetRank)
      if (targetPlayer) {
        const el = rowRefs.current.get(targetPlayer.id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 50)
  }

  function jumpToTop() {
    if (tableSectionRef.current) {
      tableSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

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
  }, [effectivePlayers])

  function setPlayerRowRef(playerId: string, element: HTMLTableRowElement | null) {
    if (element) {
      rowRefs.current.set(playerId, element)
    } else {
      rowRefs.current.delete(playerId)
    }
  }

  return (
    <section ref={tableSectionRef} className="glass-panel relative rounded-xl shadow-sm">
      {/* 1. Header tiêu đề & trạng thái */}
      <div className="flex flex-col gap-3 border-b border-slate-200/80 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-2xs">
                ★
              </span>
              <h2 className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-lg font-black tracking-tight text-transparent">
                {dict.table.title}
              </h2>
            </div>

            {/* Trạng thái cập nhật */}
            {isSyncingApi ? (
              <span
                className="inline-flex h-6 items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 text-[11px] font-bold leading-none text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 shadow-2xs"
                title={dict.table.syncingApi}
              >
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 animate-ping" />
                <span>{dict.table.syncingApi}</span>
              </span>
            ) : (
              <span
                className="hidden h-6 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[11px] font-bold leading-none text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 sm:inline-flex shadow-2xs"
                title={dict.table.realtime}
              >
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
                <span>{dict.table.realtime}</span>
              </span>
            )}

            {isFiltered && (
              <span className="inline-flex h-6 items-center rounded-full bg-sky-500/10 px-2.5 text-[11px] font-bold leading-none text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 border border-sky-500/30 shadow-2xs">
                {interpolate(dict.table.showingCount, { shown: effectivePlayers.length, total: rankedPlayers.length })}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {season.players.length === 0
              ? dict.table.tableSubtitleNoPlayers
              : dict.table.tableSubtitleWithPlayers}
          </p>
        </div>
      </div>

      {/* 2. Thanh Tìm kiếm & Bộ lọc nhanh (Quick Filter Bar) */}
      <div className="flex flex-col gap-3 border-b border-slate-200/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/25">
        {/* Ô Tìm kiếm người chơi / Clan */}
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass weight="bold" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={dict.table.searchPlaceholder}
            className="w-full h-8 rounded-lg border border-slate-300/80 bg-white pl-8.5 pr-7 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title={dict.table.clearSearchTooltip}
            >
              <X weight="bold" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Các Tab lọc nhanh */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`inline-flex h-7.5 items-center rounded-full px-3.5 text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-md shadow-slate-900/20 dark:shadow-white/10'
                : 'bg-white/80 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            {interpolate(dict.table.filterAll, { count: rankedPlayers.length })}
          </button>

          {promotionCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterTab(filterTab === 'promotion' ? 'all' : 'promotion')}
              className={`inline-flex h-7.5 items-center rounded-full px-3.5 text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                filterTab === 'promotion'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              {interpolate(dict.table.filterPromotion, { count: Math.min(promotionCount, rankedPlayers.length) })}
            </button>
          )}

          {demotionCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterTab(filterTab === 'demotion' ? 'all' : 'demotion')}
              className={`inline-flex h-7.5 items-center rounded-full px-3.5 text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                filterTab === 'demotion'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
              }`}
            >
              {interpolate(dict.table.filterDemotion, { count: Math.min(demotionCount, rankedPlayers.length) })}
            </button>
          )}

          {matchupPlayerIds.size > 0 && (
            <button
              type="button"
              onClick={() => setFilterTab(filterTab === 'matchup' ? 'all' : 'matchup')}
              className={`inline-flex h-7.5 items-center rounded-full px-3.5 text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                filterTab === 'matchup'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20'
              }`}
            >
              {interpolate(dict.table.filterMatchup, { count: matchupPlayerIds.size })}
            </button>
          )}

          {canPassPlayerIds.size > 0 && (
            <button
              type="button"
              onClick={() => setFilterTab(filterTab === 'canPass' ? 'all' : 'canPass')}
              className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium transition-all cursor-pointer ${
                filterTab === 'canPass'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {interpolate(dict.table.filterCanPass, { count: canPassPlayerIds.size })}
            </button>
          )}

          {warnedPlayerIds.size > 0 && (
            <button
              type="button"
              onClick={() => setFilterTab(filterTab === 'warned' ? 'all' : 'warned')}
              className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium transition-all cursor-pointer ${
                filterTab === 'warned'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {interpolate(dict.table.filterWarned, { count: warnedPlayerIds.size })}
            </button>
          )}

          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setFilterTab('all')
                setSearchQuery('')
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline ml-1 cursor-pointer"
            >
              {dict.table.clearFilter}
            </button>
          )}
        </div>
      </div>

      {/* 2.5 Thanh Sticky Table Header ghim cố định đồng bộ khi cuộn qua bảng */}
      {isStickyHeaderVisible && (
        <div
          className="fixed z-30 overflow-hidden backdrop-blur-md bg-amber-50/95 dark:bg-slate-900/95 border-b border-amber-200/60 dark:border-slate-800 shadow-md transition-opacity duration-150 pointer-events-none"
          style={{
            top: `${stickyTop}px`,
            left: `${stickyBounds.left}px`,
            width: `${stickyBounds.width}px`,
          }}
        >
          <div
            style={{
              transform: `translateX(-${tableScrollLeft}px)`,
              width: `${tableWidth}px`,
              minWidth: '1080px',
            }}
          >
            <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-amber-900 dark:text-slate-200">
                <tr>
                  <th
                    className="px-2.5 py-2.5 whitespace-nowrap bg-inherit"
                    style={colWidths[0] ? { width: `${colWidths[0]}px`, minWidth: `${colWidths[0]}px`, maxWidth: `${colWidths[0]}px` } : { width: '136px', minWidth: '136px', maxWidth: '136px' }}
                  >
                    {dict.table.colRank}
                  </th>
                  <th
                    className="px-2 py-2.5 bg-inherit"
                    style={colWidths[1] ? { width: `${colWidths[1]}px`, minWidth: `${colWidths[1]}px`, maxWidth: `${colWidths[1]}px` } : { width: '224px', minWidth: '170px', maxWidth: '240px' }}
                  >
                    {dict.table.colName}
                  </th>
                  <th
                    className="px-2 py-2.5 whitespace-nowrap bg-inherit"
                    style={colWidths[2] ? { width: `${colWidths[2]}px`, minWidth: `${colWidths[2]}px`, maxWidth: `${colWidths[2]}px` } : { width: '96px', minWidth: '88px' }}
                  >
                    {dict.table.colAttacks}
                  </th>
                  <th
                    className="px-2 py-2.5 whitespace-nowrap bg-inherit"
                    style={colWidths[3] ? { width: `${colWidths[3]}px`, minWidth: `${colWidths[3]}px`, maxWidth: `${colWidths[3]}px` } : { width: '96px', minWidth: '88px' }}
                  >
                    {dict.table.colDefenses}
                  </th>
                  <th
                    className="px-2 py-2.5 whitespace-nowrap bg-inherit"
                    style={colWidths[4] ? { width: `${colWidths[4]}px`, minWidth: `${colWidths[4]}px`, maxWidth: `${colWidths[4]}px` } : { width: '96px', minWidth: '88px' }}
                  >
                    {dict.table.colCurrentCups}
                  </th>
                  <th
                    className="px-2 py-2.5 whitespace-nowrap bg-inherit"
                    style={colWidths[5] ? { width: `${colWidths[5]}px`, minWidth: `${colWidths[5]}px`, maxWidth: `${colWidths[5]}px` } : { width: '144px', minWidth: '120px' }}
                  >
                    {dict.table.colMaxCups}
                  </th>
                  <th
                    className="px-2 py-2.5 whitespace-nowrap text-center bg-inherit"
                    style={colWidths[6] ? { width: `${colWidths[6]}px`, minWidth: `${colWidths[6]}px`, maxWidth: `${colWidths[6]}px` } : { width: '96px', minWidth: '92px' }}
                  >
                    {dict.table.colRating}
                  </th>
                </tr>
              </thead>
            </table>
          </div>
        </div>
      )}

      {/* 3. Bảng dữ liệu người chơi */}
      <div
        ref={tableContainerRef}
        onScroll={handleTableContainerScroll}
        className="overflow-x-auto"
      >
        <table ref={tableRef} className="relative w-full min-w-[1080px] border-separate border-spacing-0 text-left text-sm">
          <thead ref={theadRef} className="bg-amber-50/95 dark:bg-slate-900/95 border-b border-amber-200/60 dark:border-slate-800 text-xs uppercase tracking-wider text-amber-900 dark:text-slate-200 shadow-2xs">
            <tr>
              <th className="w-[136px] min-w-[136px] max-w-[136px] px-2.5 py-2.5 whitespace-nowrap bg-inherit">{dict.table.colRank}</th>
              <th className="w-56 min-w-[170px] max-w-[240px] px-2 py-2.5 bg-inherit">{dict.table.colName}</th>
              <th className="w-24 min-w-[88px] px-2 py-2.5 whitespace-nowrap bg-inherit">{dict.table.colAttacks}</th>
              <th className="w-24 min-w-[88px] px-2 py-2.5 whitespace-nowrap bg-inherit">{dict.table.colDefenses}</th>
              <th className="w-24 min-w-[88px] px-2 py-2.5 whitespace-nowrap bg-inherit">{dict.table.colCurrentCups}</th>
              <th className="w-36 min-w-[120px] px-2 py-2.5 whitespace-nowrap bg-inherit">{dict.table.colMaxCups}</th>
              <th className="w-24 min-w-[92px] px-2 py-2.5 whitespace-nowrap text-center bg-inherit">{dict.table.colRating}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60">
            {isSyncingApi ? (
              // Skeleton loading rows khi đang đồng bộ dữ liệu từ Supercell API
              [
                { wName: 'w-32', wTag: 'w-16', wCups: 'w-14' },
                { wName: 'w-40', wTag: 'w-20', wCups: 'w-16' },
                { wName: 'w-28', wTag: 'w-14', wCups: 'w-12' },
                { wName: 'w-36', wTag: 'w-24', wCups: 'w-16' },
                { wName: 'w-44', wTag: 'w-18', wCups: 'w-14' },
                { wName: 'w-32', wTag: 'w-20', wCups: 'w-16' },
                { wName: 'w-24', wTag: 'w-16', wCups: 'w-12' },
                { wName: 'w-36', wTag: 'w-22', wCups: 'w-14' },
              ].map((row, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-slate-200/40 dark:border-slate-800/40">
                  <td className="px-2.5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-8 rounded-md skeleton-shimmer" />
                      <div className="h-4 w-4 rounded-full skeleton-shimmer" />
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className={`h-4 ${row.wName} rounded-md skeleton-shimmer`} />
                    <div className={`mt-1.5 h-3 ${row.wTag} rounded-md skeleton-shimmer`} />
                  </td>
                  <td className="px-2 py-3"><div className="h-6 w-14 rounded-lg skeleton-shimmer" /></td>
                  <td className="px-2 py-3"><div className="h-6 w-14 rounded-lg skeleton-shimmer" /></td>
                  <td className="px-2 py-3"><div className={`h-6 ${row.wCups} rounded-md skeleton-shimmer`} /></td>
                  <td className="px-2 py-3"><div className={`h-6 ${row.wCups} rounded-md skeleton-shimmer`} /></td>
                  <td className="px-2 py-3 text-center"><div className="h-6 w-20 mx-auto rounded-full skeleton-shimmer" /></td>
                </tr>
              ))
            ) : effectivePlayers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                  {isFiltered ? (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className="text-base font-semibold text-slate-700 dark:text-slate-200">
                        {dict.table.noResultsTitle}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {searchQuery ? interpolate(dict.table.noResultsKeyword, { keyword: searchQuery }) : dict.table.noResultsEmpty}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterTab('all')
                          setSearchQuery('')
                        }}
                        className="mt-2 inline-flex h-8 items-center rounded-lg bg-sky-600 px-3.5 text-xs font-semibold text-white hover:bg-sky-500 cursor-pointer shadow-xs transition-all"
                      >
                        {dict.table.backToAll}
                      </button>
                    </div>
                  ) : (
                    dict.common.noData
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
                        <td colSpan={7} className="p-0 laser-line-emerald">
                          <div className="flex items-center justify-between px-5 py-2 text-xs font-black text-emerald-800 dark:text-emerald-300">
                            <span className="flex items-center gap-2 tracking-wider uppercase">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-xs">▲</span>
                              <span>{interpolate(dict.table.laserPromotionTitle, { count: promotionCount })}</span>
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              {dict.table.laserPromotionSub}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Vạch Phân Cách Xuống Hạng */}
                    {isBeforeDemotionLine && (
                      <tr key="divider-demotion" className="select-none animate-fade-in">
                        <td colSpan={7} className="p-0 laser-line-rose">
                          <div className="flex items-center justify-between px-5 py-2 text-xs font-black text-rose-800 dark:text-rose-300">
                            <span className="flex items-center gap-2 tracking-wider uppercase">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-black shadow-xs">▼</span>
                              <span>{interpolate(dict.table.laserDemotionTitle, { count: demotionCount })}</span>
                            </span>
                            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                              {dict.table.laserDemotionSub}
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

      {/* 4. Chú thích biểu tượng & trạng thái */}
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200/80 px-5 py-3 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
        <span className="font-bold text-slate-700 dark:text-slate-200">{dict.table.legendTitle}</span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="h-3 w-3 rounded-xs border-l-[3px] border-l-sky-500 bg-sky-400/20" />
          {dict.table.legendMine}
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Warning weight="fill" className="h-3.5 w-3.5 text-amber-500" />
          {dict.table.legendCanPass}
        </span>
        {promotionCount > 0 && (
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            {interpolate(dict.table.legendPromotion, { count: promotionCount })}
          </span>
        )}
        {demotionCount > 0 && (
          <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50" />
            {interpolate(dict.table.legendDemotion, { count: demotionCount })}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30">
            {dict.table.attackedByMe}
          </span>
          {dict.table.legendYouAttacked}
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30">
            {dict.table.attackedMe}
          </span>
          {dict.table.legendOpponentAttacked}
        </span>
      </div>

      {/* 5. Floating Zone Jumper - Điều hướng nhanh Gaming Capsule */}
      {showJumper && (
        <div className="fixed bottom-6 right-6 z-40 animate-fade-in">
          <div className="flex items-center gap-1.5 p-1 rounded-full border border-slate-700/60 bg-slate-900/90 dark:bg-slate-950/95 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
            {stats.myPlayer && (
              <button
                type="button"
                onClick={jumpToMyPlayer}
                className="inline-flex h-7 items-center rounded-full bg-sky-500/25 px-3 text-xs font-black text-sky-300 hover:bg-sky-500/40 shadow-xs shadow-sky-500/30 transition-all cursor-pointer select-none active:scale-90"
                title={dict.table.jumpMyTooltip}
              >
                {interpolate(dict.table.jumpMe, { rank: stats.myPlayer.rank })}
              </button>
            )}
            {promotionCount > 0 && (
              <button
                type="button"
                onClick={jumpToPromotion}
                className="inline-flex h-7 items-center rounded-full bg-emerald-500/20 px-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/35 transition-all cursor-pointer select-none active:scale-90"
                title={interpolate(dict.table.jumpPromotionTooltip, { count: promotionCount })}
              >
                {dict.table.jumpPromotion}
              </button>
            )}
            {demotionCount > 0 && (
              <button
                type="button"
                onClick={jumpToDemotion}
                className="inline-flex h-7 items-center rounded-full bg-rose-500/20 px-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/35 transition-all cursor-pointer select-none active:scale-90"
                title={interpolate(dict.table.jumpDemotionTooltip, { rank: rankedPlayers.length - demotionCount + 1 })}
              >
                {dict.table.jumpDemotion}
              </button>
            )}
            <button
              type="button"
              onClick={jumpToTop}
              className="inline-flex h-7 items-center rounded-full bg-slate-800 px-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer select-none active:scale-90"
              title={dict.table.jumpTopTooltip}
            >
              {dict.table.jumpTop}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
