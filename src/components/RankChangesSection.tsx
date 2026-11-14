import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { RankChangesSnapshot, RankChangeItem } from '../types'
import { useI18n } from '../i18n/LanguageContext'
import { SegmentedControl, type SegmentedControlOption } from './SegmentedControl'
import { CollapseToggleButton } from './CollapseToggleButton'
import { SearchInput } from './SearchInput'

export interface RankChangesSectionProps {
  snapshot: RankChangesSnapshot | null
  myPlayerId?: string
  myPlayerName?: string
  isSyncing?: boolean
}

type FilterType = 'all' | 'rose' | 'fell'

const EMPTY_CHANGES: RankChangeItem[] = []

function RankChangesSkeleton() {
  const { dict } = useI18n()

  return (
    <section className="glass-panel rounded-xl shadow-xs overflow-hidden border border-[#27272a]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272a] p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              {dict.rankChanges.title}
            </h2>
            <span className="inline-flex h-5 items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/60 px-2 text-[10px] font-bold text-red-400">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 animate-ping" />
              {dict.rankChanges.analyzing}
            </span>
          </div>
          <div className="mt-1.5 h-3 w-64 rounded-md skeleton-shimmer" />
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-[#27272a] bg-[#111113] p-3.5 shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="h-4 w-28 rounded-md skeleton-shimmer" />
                <div className="h-3 w-16 rounded-md skeleton-shimmer" />
              </div>
              <div className="h-7 w-16 rounded-lg skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function RankChangesSection({
  snapshot,
  myPlayerId = '',
  myPlayerName = '',
  isSyncing = false,
}: RankChangesSectionProps) {
  const { dict, interpolate } = useI18n()
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('coc_rank_changes_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const animatedWrapperRef = useRef<HTMLDivElement>(null)
  const innerContentRef = useRef<HTMLDivElement>(null)
  const lastHeightRef = useRef<number | null>(null)

  function handleToggleCollapse() {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('coc_rank_changes_collapsed', String(next))
      } catch {
        // Ignore localStorage error
      }
      return next
    })
  }

  const changes = snapshot?.changes ?? EMPTY_CHANGES
  const cleanMyTag = myPlayerId.replace(/^#/, '').trim().toUpperCase()

  // Biến động của người dùng (nếu có) - giữ nguyên thông báo của bản thân dù bị đẩy xuống thụ động (cúp không đổi)
  const myChange = useMemo(() => {
    if (!cleanMyTag) return undefined
    return changes.find(
      (c) =>
        c.isMe ||
        c.id.replace(/^#/, '').toUpperCase() === cleanMyTag ||
        (c.playerTag && c.playerTag.replace(/^#/, '').toUpperCase() === cleanMyTag),
    )
  }, [changes, cleanMyTag])

  // Chỉ liệt kê các người chơi vừa thay đổi thứ hạng LẪN có hoạt động thi đấu (thay đổi cúp hoặc lượt đánh/thủ)
  const activeChanges = useMemo(() => {
    return changes.filter(
      (c) =>
        c.rankDiff !== 0 &&
        (c.cupsDiff !== 0 || (c.attacksDiff ?? 0) !== 0 || (c.defensesDiff ?? 0) !== 0),
    )
  }, [changes])

  // Thống kê số lượng tăng và hạ (chỉ tính những người chủ động thi đấu thay đổi cúp)
  const roseChanges = useMemo(() => activeChanges.filter((c) => c.rankDiff > 0), [activeChanges])
  const fellChanges = useMemo(() => activeChanges.filter((c) => c.rankDiff < 0), [activeChanges])

  // Lọc danh sách theo tab và thanh tìm kiếm
  const filteredChanges = useMemo(() => {
    let list: RankChangeItem[] = []
    if (filter === 'rose') {
      list = roseChanges
    } else if (filter === 'fell') {
      list = fellChanges
    } else {
      list = activeChanges
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          String(c.newRank) === q ||
          String(c.oldRank) === q,
      )
    }

    return list
  }, [activeChanges, roseChanges, fellChanges, filter, searchQuery])

  const filterOptions = useMemo<SegmentedControlOption<FilterType>[]>(() => [
    {
      value: 'all',
      label: <span>{interpolate(dict.rankChanges.filterAll, { count: activeChanges.length })}</span>,
    },
    {
      value: 'rose',
      label: <span>{interpolate(dict.rankChanges.filterRose, { count: roseChanges.length })}</span>,
      activeColorClass: 'text-amber-700 dark:text-amber-300',
      hoverColorClass: 'hover:text-amber-600 dark:hover:text-amber-400',
    },
    {
      value: 'fell',
      label: <span>{interpolate(dict.rankChanges.filterFell, { count: fellChanges.length })}</span>,
      activeColorClass: 'text-red-700 dark:text-red-300',
      hoverColorClass: 'hover:text-red-600 dark:hover:text-red-400',
    },
  ], [activeChanges.length, roseChanges.length, fellChanges.length, dict.rankChanges, interpolate])

  // Animation co giãn chiều cao (Height FLIP transition) mượt mà khi nạp dữ liệu mới hoặc đổi bộ lọc
  useLayoutEffect(() => {
    if (isCollapsed) return
    const wrapper = animatedWrapperRef.current
    const inner = innerContentRef.current
    if (!wrapper || !inner) return

    const targetHeight = inner.offsetHeight

    if (lastHeightRef.current !== null && lastHeightRef.current > 0) {
      const startHeight = lastHeightRef.current
      if (Math.abs(startHeight - targetHeight) > 4) {
        wrapper.style.height = `${startHeight}px`
        wrapper.style.overflow = 'hidden'
        wrapper.style.transition = 'none'

        // Kích hoạt browser reflow
        void wrapper.offsetHeight

        wrapper.style.transition = 'height 380ms cubic-bezier(0.22, 1, 0.36, 1)'
        wrapper.style.height = `${targetHeight}px`

        const timer = setTimeout(() => {
          if (wrapper) {
            wrapper.style.height = ''
            wrapper.style.overflow = ''
            wrapper.style.transition = ''
          }
        }, 400)

        lastHeightRef.current = targetHeight
        return () => clearTimeout(timer)
      }
    }

    lastHeightRef.current = targetHeight
  }, [snapshot, filter, searchQuery, isCollapsed, filteredChanges.length])

  if (isSyncing) {
    return <RankChangesSkeleton />
  }

  if (!snapshot) return null

  const hasActiveChanges = activeChanges.length > 0
  const isFirstSync = !snapshot.previousUpdatedAt

  return (
    <section
      className={`glass-panel animate-rank-section-enter rounded-xl shadow-xs transition-opacity duration-300 overflow-hidden border border-[#27272a] ${
        isSyncing ? 'opacity-70 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272a] p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              {dict.rankChanges.title}
            </h2>
            {hasActiveChanges ? (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-extrabold text-amber-300 border border-amber-500/30">
                {interpolate(dict.rankChanges.changesCount, { count: activeChanges.length })}
              </span>
            ) : isFirstSync ? (
              <span className="rounded-full bg-[#18181b] px-2.5 py-0.5 text-xs font-medium text-zinc-400 border border-[#27272a]">
                {dict.rankChanges.firstSync}
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
                {dict.rankChanges.noChange}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            {snapshot.previousUpdatedAt
              ? interpolate(dict.rankChanges.comparedWith, { prev: snapshot.previousUpdatedAt, curr: snapshot.updatedAt })
              : interpolate(dict.rankChanges.firstSyncNotice, { time: snapshot.updatedAt })}
          </p>
        </div>

        {/* THẺ ĐẾM TÓM TẮT & NÚT THU GỌN */}
        <div className="flex items-center gap-2">
          {hasActiveChanges && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold mr-1">
              {roseChanges.length > 0 && (
                <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-amber-300 border border-amber-500/30">
                  {interpolate(dict.rankChanges.roseCount, { count: roseChanges.length })}
                </span>
              )}
              {fellChanges.length > 0 && (
                <span className="rounded-md bg-red-500/20 px-2.5 py-1 text-red-300 border border-red-500/30">
                  {interpolate(dict.rankChanges.fellCount, { count: fellChanges.length })}
                </span>
              )}
            </div>
          )}

          <CollapseToggleButton
            isCollapsed={isCollapsed}
            onToggle={handleToggleCollapse}
            ariaLabel={dict.rankChanges.title}
          />
        </div>
      </div>

      {/* BODY KHI MỞ RỘNG (VỚI ANIMATION XỔ XUỐNG / KÉO LÊN & CHUYỂN CHIỀU CAO FLIP) */}
      <div className={`collapsible-grid ${!isCollapsed ? 'is-expanded' : ''}`}>
        <div className="collapsible-inner">
          <div ref={animatedWrapperRef} className="overflow-hidden">
            <div ref={innerContentRef} className="p-4 sm:p-5 space-y-4">
              {/* 1. THẺ NỔI BẬT THỨ HẠNG CỦA TÀI KHOẢN "BẠN" */}
              {cleanMyTag && (
                <div>
                  {myChange ? (
                    <div
                      key={`my-change-${snapshot.updatedAt || 'init'}`}
                      className={`animate-change-card backdrop-blur-md rounded-xl border p-3.5 shadow-xs transition-all ${
                        myChange.rankDiff > 0
                          ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
                          : myChange.rankDiff < 0
                            ? 'border-red-500/40 bg-red-950/30 text-red-200'
                            : 'border-[#27272a] bg-[#111113] text-zinc-200'
                      }`}
                    >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold flex items-center gap-2 flex-wrap">
                        <span>
                          {myChange.rankDiff > 0
                            ? interpolate(dict.rankChanges.youClimbed, { diff: myChange.rankDiff })
                            : myChange.rankDiff < 0
                              ? interpolate(dict.rankChanges.youFell, { diff: Math.abs(myChange.rankDiff) })
                              : dict.rankChanges.yourRankKept}
                        </span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#18181b] border border-[#27272a] text-white shadow-2xs">
                          {myChange.oldRank !== myChange.newRank
                            ? `#${myChange.oldRank} ➔ #${myChange.newRank}`
                            : `#${myChange.newRank}`}
                        </span>
                      </div>
                      <p className="text-xs opacity-90 mt-0.5">
                        {myChange.rankDiff > 0
                          ? interpolate(dict.rankChanges.congratsRankImproved, { name: myPlayerName || dict.common.you, oldRank: myChange.oldRank, newRank: myChange.newRank })
                          : myChange.rankDiff < 0
                            ? interpolate(dict.rankChanges.rankDecreased, { name: myPlayerName || dict.common.you, oldRank: myChange.oldRank, newRank: myChange.newRank })
                            : interpolate(dict.rankChanges.rankMaintained, { name: myPlayerName || dict.common.you, rank: myChange.newRank })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                      {myChange.cupsDiff !== 0 && (
                        <div className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#18181b] border border-[#27272a] shadow-2xs text-amber-400">
                          {interpolate(dict.rankChanges.cupsDiff, { diff: myChange.cupsDiff > 0 ? `+${myChange.cupsDiff}` : myChange.cupsDiff })}
                        </div>
                      )}
                      {(myChange.attacksDiff !== undefined && myChange.attacksDiff !== 0) && (
                        <div
                          className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#18181b] border border-[#27272a] shadow-2xs text-amber-400"
                          title={`${dict.common.attacks}: ${myChange.oldAttacks ?? 0} ➔ ${myChange.newAttacks ?? 0}`}
                        >
                          {interpolate(dict.rankChanges.attacksDiff, { diff: (myChange.attacksDiff ?? 0) > 0 ? `+${myChange.attacksDiff}` : (myChange.attacksDiff ?? 0) })}
                          {myChange.oldAttacks !== undefined && myChange.newAttacks !== undefined && (
                            <span className="font-normal text-[11px] opacity-80 ml-1">
                              ({myChange.oldAttacks}➔{myChange.newAttacks})
                            </span>
                          )}
                        </div>
                      )}
                      {(myChange.defensesDiff !== undefined && myChange.defensesDiff !== 0) && (
                        <div
                          className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#18181b] border border-[#27272a] shadow-2xs text-red-400"
                          title={`${dict.common.defenses}: ${myChange.oldDefenses ?? 0} ➔ ${myChange.newDefenses ?? 0}`}
                        >
                          {interpolate(dict.rankChanges.defensesDiff, { diff: (myChange.defensesDiff ?? 0) > 0 ? `+${myChange.defensesDiff}` : (myChange.defensesDiff ?? 0) })}
                          {myChange.oldDefenses !== undefined && myChange.newDefenses !== undefined && (
                            <span className="font-normal text-[11px] opacity-80 ml-1">
                              ({myChange.oldDefenses}➔{myChange.newDefenses})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={`my-change-stable-${snapshot.updatedAt || 'init'}`}
                  className="animate-change-card backdrop-blur-md rounded-xl border border-[#27272a] bg-[#111113] p-3 text-xs text-zinc-400 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                      {dict.common.you}
                    </span>
                    <span>
                      {interpolate(dict.rankChanges.userRankStableNotice, { name: myPlayerName || dict.common.you })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. KHI KHÔNG CÓ THAY ĐỔI CÚP NÀO TRONG BẢNG ĐẤU */}
          {!hasActiveChanges ? (
            <div
              key={`empty-${snapshot.updatedAt || 'init'}`}
              className="animate-change-card rounded-xl border border-[#27272a] bg-[#111113] py-6 text-center px-4"
            >
              <h3 className="text-sm font-bold text-white">
                {isFirstSync ? dict.rankChanges.initialTableRecorded : dict.rankChanges.noPlayerChangedCups}
              </h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto">
                {isFirstSync
                  ? dict.rankChanges.initialSyncNotice
                  : interpolate(dict.rankChanges.noCompetitionChanges, { time: snapshot.previousUpdatedAt || snapshot.updatedAt })}
              </p>
            </div>
          ) : (
            <>
              {/* 3. THANH ĐIỀU HƯỚNG TABS & TÌM KIẾM */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <SegmentedControl<FilterType>
                  options={filterOptions}
                  value={filter}
                  onChange={setFilter}
                  ariaLabel={dict.rankChanges.title}
                />

                {activeChanges.length > 5 && (
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={dict.rankChanges.searchPlaceholder}
                    className="w-full sm:w-56"
                  />
                )}
              </div>

              {/* 4. DANH SÁCH CÁC NGƯỜI CHƠI THAY ĐỔI THỨ HẠNG */}
              {filteredChanges.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400">
                  {dict.rankChanges.noMatches}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {filteredChanges.map((item, index) => {
                    const isRose = item.rankDiff > 0
                    const isUser =
                      item.isMe ||
                      item.id.replace(/^#/, '').toUpperCase() === cleanMyTag ||
                      (item.playerTag && item.playerTag.replace(/^#/, '').toUpperCase() === cleanMyTag)

                    return (
                      <div
                        key={`${item.id}-${snapshot.updatedAt || 'init'}`}
                        style={{
                          animationDelay: `${Math.min(index * 35, 300)}ms`,
                        }}
                        className={`animate-change-card backdrop-blur-md flex flex-col justify-between rounded-xl border p-2.5 shadow-2xs transition-all hover:scale-[1.01] ${
                          isUser
                            ? 'border-red-500/60 bg-red-950/30 ring-1 ring-red-500/40'
                            : isRose
                              ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-[#111113]'
                              : 'border-red-500/30 bg-[#111113]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 truncate min-w-0 pr-1">
                            <span className="font-bold text-white text-xs sm:text-sm truncate">
                              {item.name}
                            </span>
                            {isUser && (
                              <span className="rounded bg-red-500/20 px-1 py-0.2 text-[9px] font-extrabold text-red-300 shrink-0">
                                {dict.common.you}
                              </span>
                            )}
                          </div>

                          {/* Badge tăng / hạ */}
                          <span
                            className={`inline-flex shrink-0 items-center justify-center rounded-md px-2 py-0.5 text-xs font-black select-none shadow-2xs border ${
                              isRose
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-red-500/20 text-red-300 border-red-500/30'
                            }`}
                          >
                            {isRose ? `+${item.rankDiff}` : item.rankDiff}
                          </span>
                        </div>

                        {/* Hàng chuyển đổi thứ hạng và điểm cúp */}
                        <div className="mt-2 pt-1.5 border-t border-[#27272a] flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-zinc-500 line-through">#{item.oldRank}</span>
                            <span className="text-zinc-500">➔</span>
                            <span className="font-extrabold text-white">
                              #{item.newRank}
                            </span>
                          </div>

                          <div className="font-mono font-bold text-[11px] text-amber-400">
                            {interpolate(dict.rankChanges.cupsDiff, { diff: item.cupsDiff > 0 ? `+${item.cupsDiff}` : item.cupsDiff })}
                          </div>
                        </div>

                        {/* Hàng biến động số lượt đánh và số lượt thủ */}
                        <div className="mt-1.5 pt-1.5 border-t border-[#27272a] flex items-center justify-between text-[11px]">
                          <span
                            className={`font-semibold ${
                              (item.attacksDiff ?? 0) > 0
                                ? 'text-amber-400 font-bold'
                                : 'text-zinc-500'
                            }`}
                            title={
                              item.oldAttacks !== undefined && item.newAttacks !== undefined
                                ? `${dict.common.attacks}: ${item.oldAttacks} ➔ ${item.newAttacks} (${(item.attacksDiff ?? 0) > 0 ? `+${item.attacksDiff}` : item.attacksDiff})`
                                : undefined
                            }
                          >
                            {interpolate(dict.rankChanges.attacksDiff, { diff: (item.attacksDiff ?? 0) > 0 ? `+${item.attacksDiff}` : (item.attacksDiff ?? 0) })}
                          </span>

                          <span
                            className={`font-semibold ${
                              (item.defensesDiff ?? 0) > 0
                                ? 'text-red-400 font-bold'
                                : 'text-zinc-500'
                            }`}
                            title={
                              item.oldDefenses !== undefined && item.newDefenses !== undefined
                                ? `${dict.common.defenses}: ${item.oldDefenses} ➔ ${item.newDefenses} (${(item.defensesDiff ?? 0) > 0 ? `+${item.defensesDiff}` : item.defensesDiff})`
                                : undefined
                            }
                          >
                            {interpolate(dict.rankChanges.defensesDiff, { diff: (item.defensesDiff ?? 0) > 0 ? `+${item.defensesDiff}` : (item.defensesDiff ?? 0) })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
