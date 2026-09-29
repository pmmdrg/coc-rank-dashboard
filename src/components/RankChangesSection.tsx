import { useMemo, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  Swords,
  Shield,
} from 'lucide-react'
import type { RankChangesSnapshot, RankChangeItem } from '../types'

export interface RankChangesSectionProps {
  snapshot: RankChangesSnapshot | null
  myPlayerId?: string
  myPlayerName?: string
}

type FilterType = 'all' | 'rose' | 'fell'

const EMPTY_CHANGES: RankChangeItem[] = []

export function RankChangesSection({
  snapshot,
  myPlayerId = '',
  myPlayerName = '',
}: RankChangesSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('coc_rank_changes_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

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

  if (!snapshot) return null

  const hasActiveChanges = activeChanges.length > 0
  const isFirstSync = !snapshot.previousUpdatedAt

  return (
    <section className="glass-panel rounded-xl shadow-xs transition-all overflow-hidden border border-slate-200/80 dark:border-slate-800/80">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 p-4 sm:p-5 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
            <ArrowUpDown className="h-5 w-5 drop-shadow-xs" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Biến động thứ hạng gần nhất
              </h2>
              {hasActiveChanges ? (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-extrabold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                  {activeChanges.length} thay đổi
                </span>
              ) : isFirstSync ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Khởi tạo bảng
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                  Không đổi
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {snapshot.previousUpdatedAt
                  ? `So với lần đồng bộ lúc ${snapshot.previousUpdatedAt} • Cập nhật lúc ${snapshot.updatedAt}`
                  : `Đồng bộ lần đầu lúc ${snapshot.updatedAt}`}
              </span>
            </p>
          </div>
        </div>

        {/* THẺ ĐẾM TÓM TẮT & NÚT THU GỌN */}
        <div className="flex items-center gap-2">
          {hasActiveChanges && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold mr-1">
              {roseChanges.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {roseChanges.length} tăng
                </span>
              )}
              {fellChanges.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                  <TrendingDown className="h-3.5 w-3.5" />
                  {fellChanges.length} hạ
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleToggleCollapse}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
            aria-expanded={!isCollapsed}
          >
            <span>{isCollapsed ? 'Mở rộng' : 'Thu gọn'}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* BODY KHI MỞ RỘNG (VỚI ANIMATION XỔ XUỐNG / KÉO LÊN) */}
      <div className={`collapsible-grid ${!isCollapsed ? 'is-expanded' : ''}`}>
        <div className="collapsible-inner">
          <div className="p-4 sm:p-5 space-y-4">
          {/* 1. THẺ NỔI BẬT THỨ HẠNG CỦA TÀI KHOẢN "BẠN" */}
          {cleanMyTag && (
            <div>
              {myChange ? (
                <div
                  className={`rounded-xl border p-3.5 shadow-2xs transition-all ${
                    myChange.rankDiff > 0
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : myChange.rankDiff < 0
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200'
                        : 'border-sky-500/40 bg-sky-500/10 text-sky-900 dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          myChange.rankDiff > 0
                            ? 'bg-emerald-500 text-white'
                            : myChange.rankDiff < 0
                              ? 'bg-rose-500 text-white'
                              : 'bg-sky-500 text-white'
                        }`}
                      >
                        {myChange.rankDiff > 0 ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : myChange.rankDiff < 0 ? (
                          <TrendingDown className="h-5 w-5" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-extrabold flex items-center gap-2 flex-wrap">
                          <span>
                            {myChange.rankDiff > 0
                              ? `Bạn đã tăng ${myChange.rankDiff} bậc!`
                              : myChange.rankDiff < 0
                                ? `Bạn đã hạ ${Math.abs(myChange.rankDiff)} bậc.`
                                : 'Thứ hạng của bạn giữ nguyên!'}
                          </span>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/60 shadow-2xs">
                            {myChange.oldRank !== myChange.newRank
                              ? `#${myChange.oldRank} ➔ #${myChange.newRank}`
                              : `#${myChange.newRank}`}
                          </span>
                        </div>
                        <p className="text-xs opacity-90 mt-0.5">
                          {myChange.rankDiff > 0
                            ? `Xin chúc mừng ${myPlayerName || 'bạn'}! Thứ hạng đã được cải thiện từ #${myChange.oldRank} lên #${myChange.newRank}.`
                            : myChange.rankDiff < 0
                              ? `Thứ hạng của ${myPlayerName || 'bạn'} đã chuyển từ #${myChange.oldRank} xuống #${myChange.newRank}.`
                              : `Thứ hạng của ${myPlayerName || 'bạn'} tiếp tục duy trì ổn định ở vị trí #${myChange.newRank}.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                      {myChange.cupsDiff !== 0 && (
                        <div className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/70 shadow-2xs text-amber-600 dark:text-amber-400">
                          {myChange.cupsDiff > 0 ? `+${myChange.cupsDiff}` : myChange.cupsDiff} cúp
                        </div>
                      )}
                      {(myChange.attacksDiff !== undefined && myChange.attacksDiff !== 0) && (
                        <div
                          className="flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/70 shadow-2xs text-emerald-600 dark:text-emerald-400"
                          title={`Số lượt đánh: ${myChange.oldAttacks ?? 0} ➔ ${myChange.newAttacks ?? 0}`}
                        >
                          <Swords className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {(myChange.attacksDiff ?? 0) > 0 ? `+${myChange.attacksDiff}` : myChange.attacksDiff} đánh
                            {myChange.oldAttacks !== undefined && myChange.newAttacks !== undefined && (
                              <span className="font-normal text-[11px] opacity-80 ml-1">
                                ({myChange.oldAttacks}➔{myChange.newAttacks})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {(myChange.defensesDiff !== undefined && myChange.defensesDiff !== 0) && (
                        <div
                          className="flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/70 shadow-2xs text-sky-600 dark:text-sky-400"
                          title={`Số lượt thủ: ${myChange.oldDefenses ?? 0} ➔ ${myChange.newDefenses ?? 0}`}
                        >
                          <Shield className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {(myChange.defensesDiff ?? 0) > 0 ? `+${myChange.defensesDiff}` : myChange.defensesDiff} thủ
                            {myChange.oldDefenses !== undefined && myChange.newDefenses !== undefined && (
                              <span className="font-normal text-[11px] opacity-80 ml-1">
                                ({myChange.oldDefenses}➔{myChange.newDefenses})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                      BẠN
                    </span>
                    <span>
                      Thứ hạng của <strong>{myPlayerName || 'bạn'}</strong> giữ nguyên ổn định so với lần lấy dữ liệu trước.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. KHI KHÔNG CÓ THAY ĐỔI CÚP NÀO TRONG BẢNG ĐẤU */}
          {!hasActiveChanges ? (
            <div className="rounded-xl border border-slate-200/70 bg-white/30 py-6 text-center px-4 dark:border-slate-800 dark:bg-slate-900/30">
              <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500/80 drop-shadow-xs" />
              <h3 className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                {isFirstSync ? 'Đã ghi nhận dữ liệu bảng đấu ban đầu' : 'Không có người chơi nào thay đổi điểm cúp hoặc lượt đấu'}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {isFirstSync
                  ? 'Đây là lần lấy dữ liệu đầu tiên của bảng đấu này. Mọi biến động tăng / hạ bậc sẽ được ghi nhận và thông báo ở các lần cập nhật tiếp theo.'
                  : `Không có biến động thứ hạng do thi đấu (thay đổi cúp hoặc lượt đánh/thủ) so với thời điểm đồng bộ lúc ${snapshot.previousUpdatedAt || snapshot.updatedAt}.`}
              </p>
            </div>
          ) : (
            <>
              {/* 3. THANH ĐIỀU HƯỚNG TABS & TÌM KIẾM */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div className="inline-flex rounded-lg border border-slate-200/80 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={`rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                      filter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-slate-100'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Tất cả ({activeChanges.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('rose')}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                      filter === 'rose'
                        ? 'bg-emerald-500 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400'
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Tăng ({roseChanges.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('fell')}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                      filter === 'fell'
                        ? 'bg-rose-500 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400'
                    }`}
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span>Hạ ({fellChanges.length})</span>
                  </button>
                </div>

                {activeChanges.length > 5 && (
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm tên người chơi..."
                      className="w-full rounded-lg border border-slate-200 bg-white/70 pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* 4. DANH SÁCH CÁC NGƯỜI CHƠI THAY ĐỔI THỨ HẠNG */}
              {filteredChanges.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Không tìm thấy người chơi nào phù hợp với bộ lọc.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {filteredChanges.map((item) => {
                    const isRose = item.rankDiff > 0
                    const isUser =
                      item.isMe ||
                      item.id.replace(/^#/, '').toUpperCase() === cleanMyTag ||
                      (item.playerTag && item.playerTag.replace(/^#/, '').toUpperCase() === cleanMyTag)

                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col justify-between rounded-xl border p-2.5 shadow-2xs transition-all hover:scale-[1.01] ${
                          isUser
                            ? 'border-sky-400/60 bg-sky-50/70 dark:border-sky-500/40 dark:bg-sky-950/30 ring-1 ring-sky-400/40'
                            : isRose
                              ? 'border-emerald-200/80 bg-white/70 dark:border-emerald-900/40 dark:bg-slate-900/60'
                              : 'border-rose-200/80 bg-white/70 dark:border-rose-900/40 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 truncate min-w-0 pr-1">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                              {item.name}
                            </span>
                            {isUser && (
                              <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[9px] font-extrabold text-sky-700 dark:text-sky-300 shrink-0">
                                BẠN
                              </span>
                            )}
                          </div>

                          {/* Badge tăng / hạ */}
                          <span
                            className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-black select-none shadow-2xs ${
                              isRose
                                ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300'
                                : 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-300'
                            }`}
                          >
                            {isRose ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            <span>
                              {isRose ? `+${item.rankDiff}` : item.rankDiff}
                            </span>
                          </span>
                        </div>

                        {/* Hàng chuyển đổi thứ hạng và điểm cúp */}
                        <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-slate-400 line-through">#{item.oldRank}</span>
                            <span className="text-slate-400">➔</span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100">
                              #{item.newRank}
                            </span>
                          </div>

                          <div className="font-mono font-bold text-[11px] text-amber-600 dark:text-amber-400">
                            {item.cupsDiff > 0 ? `+${item.cupsDiff}` : item.cupsDiff} cúp
                          </div>
                        </div>

                        {/* Hàng biến động số lượt đánh và số lượt thủ */}
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              (item.attacksDiff ?? 0) > 0
                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                            title={
                              item.oldAttacks !== undefined && item.newAttacks !== undefined
                                ? `Lượt đánh: ${item.oldAttacks} ➔ ${item.newAttacks} (${(item.attacksDiff ?? 0) > 0 ? `+${item.attacksDiff}` : item.attacksDiff})`
                                : undefined
                            }
                          >
                            <Swords className="h-3 w-3 shrink-0" />
                            <span>
                              {(item.attacksDiff ?? 0) > 0 ? `+${item.attacksDiff}` : (item.attacksDiff ?? 0)} đánh
                            </span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              (item.defensesDiff ?? 0) > 0
                                ? 'text-sky-600 dark:text-sky-400 font-bold'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                            title={
                              item.oldDefenses !== undefined && item.newDefenses !== undefined
                                ? `Lượt thủ: ${item.oldDefenses} ➔ ${item.newDefenses} (${(item.defensesDiff ?? 0) > 0 ? `+${item.defensesDiff}` : item.defensesDiff})`
                                : undefined
                            }
                          >
                            <Shield className="h-3 w-3 shrink-0" />
                            <span>
                              {(item.defensesDiff ?? 0) > 0 ? `+${item.defensesDiff}` : (item.defensesDiff ?? 0)} thủ
                            </span>
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
  </section>
)
}
