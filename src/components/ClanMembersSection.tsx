import { useMemo, useState } from 'react'
import {
  Shield,
  Trophy,
  Users,
  Sword,
  Crown,
  Medal,
  MagnifyingGlass,
  ArrowUp,
  ArrowDown,
  ArrowsDownUp,
  CircleNotch,
  Copy,
  Check,
  Eye,
  Gift,
  Building,
} from '@phosphor-icons/react'
import type { ClanData, ClanRole } from '../types'
import { getLeagueIconUrl } from '../lib/leagueIcons'
import { useI18n } from '../i18n/LanguageContext'

export interface ClanMembersSectionProps {
  clanData: ClanData | null
  isLoading?: boolean
  clanTag: string
  onClanTagChange: (tag: string) => void
  onSyncClan: (tag?: string) => void
  myPlayerTag?: string
  onSelectPlayerForDashboard?: (playerTag: string) => void
}

type SortField = 'rank' | 'trophies' | 'th' | 'donations' | 'name'

export function ClanMembersSection({
  clanData,
  isLoading = false,
  clanTag,
  onClanTagChange,
  onSyncClan,
  myPlayerTag,
  onSelectPlayerForDashboard,
}: ClanMembersSectionProps) {
  const { dict } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | ClanRole>('all')
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isCopiedTag, setIsCopiedTag] = useState(false)

  // Copy Clan Tag
  function handleCopyClanTag() {
    if (!clanData?.tag) return
    navigator.clipboard.writeText(clanData.tag)
    setIsCopiedTag(true)
    setTimeout(() => setIsCopiedTag(false), 1500)
  }

  // Thống kê tổng hợp Clan
  const stats = useMemo(() => {
    if (!clanData || !clanData.memberList || clanData.memberList.length === 0) return null

    const totalMembers = clanData.memberList.length
    const maxCapacity = 50
    const fillPercent = Math.round((totalMembers / maxCapacity) * 100)
    const totalTrophies = clanData.clanPoints || clanData.memberList.reduce((acc, m) => acc + m.trophies, 0)
    const avgTrophies = totalMembers > 0 ? Math.round(totalTrophies / totalMembers) : 0
    const totalDonations = clanData.memberList.reduce((acc, m) => acc + m.donations, 0)
    const totalDonationsReceived = clanData.memberList.reduce((acc, m) => acc + m.donationsReceived, 0)

    // Cấp TH cao nhất trong clan
    const maxTH = clanData.memberList.reduce((max, m) => Math.max(max, m.townHallLevel), 0)
    const maxTHCount = clanData.memberList.filter((m) => m.townHallLevel === maxTH).length

    // Bậc giải đấu cao nhất trong clan
    const topTierMember = [...clanData.memberList].sort((a, b) => {
      const aTierId = a.leagueTier?.id || 0
      const bTierId = b.leagueTier?.id || 0
      if (bTierId !== aTierId) return bTierId - aTierId
      return b.trophies - a.trophies
    })[0]

    return {
      totalMembers,
      maxCapacity,
      fillPercent,
      totalTrophies,
      avgTrophies,
      totalDonations,
      totalDonationsReceived,
      maxTH,
      maxTHCount,
      topTierName: topTierMember?.leagueTier?.name || topTierMember?.league?.name || '--',
      topTierIcon:
        topTierMember?.leagueTier?.iconUrls?.small ||
        topTierMember?.league?.iconUrls?.small ||
        getLeagueIconUrl(topTierMember?.leagueTier?.name),
    }
  }, [clanData])

  // Lọc và sắp xếp thành viên
  const filteredMembers = useMemo(() => {
    if (!clanData || !clanData.memberList) return []

    let list = [...clanData.memberList]

    // 1. Tìm kiếm theo tên hoặc tag
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase().replace(/^#/, '')
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.tag.toLowerCase().replace(/^#/, '').includes(q))
    }

    // 2. Lọc theo chức vụ
    if (roleFilter !== 'all') {
      list = list.filter((m) => m.role === roleFilter)
    }

    // 3. Sắp xếp
    list.sort((a, b) => {
      let diff = 0
      if (sortField === 'rank') {
        diff = a.clanRank - b.clanRank
      } else if (sortField === 'trophies') {
        diff = b.trophies - a.trophies
      } else if (sortField === 'th') {
        diff = b.townHallLevel - a.townHallLevel
      } else if (sortField === 'donations') {
        diff = b.donations - a.donations
      } else if (sortField === 'name') {
        diff = a.name.localeCompare(b.name)
      }
      return sortOrder === 'asc' ? diff : -diff
    })

    return list
  }, [clanData, searchQuery, roleFilter, sortField, sortOrder])

  // Badge màu cho từng vai trò trong Clan
  function getRoleBadge(role: ClanRole) {
    switch (role) {
      case 'leader':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-300">
            <Crown weight="fill" className="h-3 w-3 text-amber-500" />
            {dict.clan.roleLeader}
          </span>
        )
      case 'coLeader':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/40 bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:border-purple-400/40 dark:bg-purple-400/15 dark:text-purple-300">
            <Shield weight="fill" className="h-3 w-3 text-purple-500" />
            {dict.clan.roleCoLeader}
          </span>
        )
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:border-sky-400/40 dark:bg-sky-400/15 dark:text-sky-300">
            <Medal weight="fill" className="h-3 w-3 text-sky-500" />
            {dict.clan.roleElder}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-300/60 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-400">
            {dict.clan.roleMember}
          </span>
        )
    }
  }

  // Huy hiệu thứ hạng Top 1, 2, 3
  function getRankBadge(rank: number) {
    if (rank === 1) {
      return (
        <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 font-mono text-xs font-black text-slate-950 shadow-xs shadow-amber-500/40">
          1
        </span>
      )
    }
    if (rank === 2) {
      return (
        <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-gradient-to-br from-slate-200 to-slate-400 font-mono text-xs font-black text-slate-900 shadow-xs shadow-slate-400/30">
          2
        </span>
      )
    }
    if (rank === 3) {
      return (
        <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-gradient-to-br from-amber-700 to-amber-800 font-mono text-xs font-black text-amber-100 shadow-xs shadow-amber-700/30">
          3
        </span>
      )
    }
    return (
      <span className="inline-flex h-6.5 min-w-6.5 items-center justify-center rounded-md font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
        #{rank}
      </span>
    )
  }

  // Biến động hạng trong clan (clanRank vs previousClanRank)
  function getRankDiffBadge(clanRank: number, prevClanRank?: number) {
    if (!prevClanRank || clanRank === prevClanRank) {
      return <span className="text-[11px] font-bold text-slate-400 select-none">-</span>
    }
    const diff = prevClanRank - clanRank
    if (diff > 0) {
      return (
        <span className="inline-flex items-center text-[10px] font-black text-emerald-600 dark:text-emerald-400">
          <ArrowUp weight="bold" className="h-2.5 w-2.5" />
          {diff}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center text-[10px] font-black text-rose-600 dark:text-rose-400">
        <ArrowDown weight="bold" className="h-2.5 w-2.5" />
        {Math.abs(diff)}
      </span>
    )
  }

  const cleanMyTag = (myPlayerTag || '').trim().toUpperCase().replace(/^#/, '')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. HERO BANNER: THÔNG TIN CLAN */}
      <section className="glass-panel relative overflow-hidden rounded-2xl border border-slate-200/80 p-5 shadow-sm backdrop-blur-xl sm:p-6 dark:border-slate-800/80">
        {/* Họa tiết ánh sáng nền */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/15 via-sky-500/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-gradient-to-tr from-amber-500/10 via-emerald-500/10 to-transparent blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Logo & Thông tin cốt lõi Clan */}
          <div className="flex items-start gap-4 sm:items-center sm:gap-5">
            {clanData?.badgeUrls?.large || clanData?.badgeUrls?.medium ? (
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-sky-500/30 blur-sm" />
                <img
                  src={clanData.badgeUrls.large || clanData.badgeUrls.medium}
                  alt={clanData?.name || 'Clan Badge'}
                  referrerPolicy="no-referrer"
                  className="relative h-18 w-18 sm:h-20 sm:w-20 rounded-2xl object-contain drop-shadow-md"
                />
              </div>
            ) : (
              <div className="flex h-18 w-18 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-500 shadow-inner">
                <Shield weight="duotone" className="h-10 w-10" />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="aurora-text text-xl font-black tracking-tight sm:text-2xl lg:text-3xl">
                  {clanData?.name || 'Clan Members'}
                </h2>
                {clanData?.clanLevel ? (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-0.5 text-xs font-black text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-400/15 dark:text-indigo-300">
                    <Shield weight="fill" className="h-3.5 w-3.5" />
                    {dict.clan.level} {clanData.clanLevel}
                  </span>
                ) : null}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                {clanData?.tag ? (
                  <button
                    type="button"
                    onClick={handleCopyClanTag}
                    className="group inline-flex items-center gap-1.5 rounded-md border border-slate-300/60 bg-white/60 px-2 py-0.5 font-mono font-bold text-slate-700 hover:border-indigo-400 hover:text-indigo-600 active:scale-95 transition-all dark:border-slate-700/70 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300 cursor-pointer shadow-2xs"
                    title="Sao chép Clan Tag"
                  >
                    <span>{clanData.tag}</span>
                    {isCopiedTag ? (
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                    ) : (
                      <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                ) : null}

                {clanData?.warLeague?.name ? (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                      <Sword weight="bold" className="h-3.5 w-3.5 text-rose-500" />
                      {clanData.warLeague.name}
                    </span>
                  </>
                ) : null}

                {clanData?.members ? (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                      <Users weight="bold" className="h-3.5 w-3.5 text-sky-500" />
                      {clanData.members} / 50 {dict.clan.membersCount}
                    </span>
                  </>
                ) : null}

                {clanData?.lastSyncedAt ? (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[11px] text-slate-400">
                      Đồng bộ: {clanData.lastSyncedAt}
                    </span>
                  </>
                ) : null}
              </div>

              {clanData?.description ? (
                <p className="mt-2 line-clamp-2 max-w-2xl text-xs italic text-slate-600 dark:text-slate-300">
                  &ldquo;{clanData.description}&rdquo;
                </p>
              ) : null}
            </div>
          </div>

          {/* Ô nhập Clan Tag & Nút đồng bộ */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <div className="group relative inline-flex h-9.5 items-center rounded-xl border border-slate-300/70 bg-white/70 p-0.5 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 focus-within:border-sky-500 dark:focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-500/20">
              <span className="pointer-events-none absolute left-2.5 font-mono text-xs font-black text-slate-400 transition-colors group-focus-within:text-sky-500 dark:text-slate-500">
                #
              </span>
              <input
                type="text"
                value={clanTag.replace(/^#/, '')}
                onChange={(e) => onClanTagChange(e.target.value.toUpperCase().trim())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSyncClan(clanTag)
                  }
                }}
                placeholder="Clan Tag..."
                className="h-7.5 w-28 sm:w-32 rounded-lg bg-white/90 pl-5 pr-3 font-mono text-xs font-black tracking-wider text-slate-950 placeholder:text-slate-400 placeholder:font-normal caret-slate-950 transition-all focus:outline-none dark:bg-slate-900/90 dark:text-white dark:placeholder:text-slate-500 dark:caret-white"
              />
            </div>

            <button
              type="button"
              disabled={isLoading || !clanTag.trim()}
              onClick={() => onSyncClan(clanTag)}
              className="apple-btn inline-flex h-9.5 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-xs shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/30 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <CircleNotch weight="bold" className="h-3.5 w-3.5 animate-spin" />
                  <span>{dict.clan.syncingBtn}</span>
                </>
              ) : (
                <>
                  <Shield weight="bold" className="h-3.5 w-3.5" />
                  <span>{dict.clan.syncBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 2. BỐN THẺ THỐNG KÊ TỔNG QUAN CLAN */}
      {stats && (
        <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {/* Thẻ 1: Tổng thành viên */}
          <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 p-4 shadow-2xs backdrop-blur-md dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {dict.clan.statTotalMembers}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300">
                <Users weight="bold" className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100">
                  {stats.totalMembers}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-400">
                  / {stats.maxCapacity}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                  style={{ width: `${stats.fillPercent}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                Tỉ lệ lấp đầy: <span className="font-bold text-slate-700 dark:text-slate-200">{stats.fillPercent}%</span>
              </p>
            </div>
          </div>

          {/* Thẻ 2: Điểm Cúp Clan */}
          <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 p-4 shadow-2xs backdrop-blur-md dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {dict.clan.statTotalTrophies}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300">
                <Trophy weight="bold" className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-mono text-2xl font-black text-amber-600 dark:text-amber-400">
                {stats.totalTrophies.toLocaleString()}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                Trung bình:{' '}
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                  {stats.avgTrophies.toLocaleString()} 🏆
                </span>
              </p>
            </div>
          </div>

          {/* Thẻ 3: Bậc giải đấu cao nhất */}
          <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 p-4 shadow-2xs backdrop-blur-md dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {dict.clan.statTopTier}
              </span>
              {stats.topTierIcon ? (
                <img
                  src={stats.topTierIcon}
                  alt={stats.topTierName}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 object-contain drop-shadow-sm"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300">
                  <Medal weight="bold" className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="mt-3">
              <div className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
                {stats.topTierName}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                Cấp TH cao nhất:{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  TH {stats.maxTH} ({stats.maxTHCount} người)
                </span>
              </p>
            </div>
          </div>

          {/* Thẻ 4: Tổng quân viện trợ */}
          <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 p-4 shadow-2xs backdrop-blur-md dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {dict.clan.statDonations}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300">
                <Gift weight="bold" className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.totalDonations.toLocaleString()}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                Đã nhận:{' '}
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                  {stats.totalDonationsReceived.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3. TOOLBAR TÌM KIẾM, LỌC & SẮP XẾP */}
      <section className="glass-panel flex flex-col gap-3 rounded-xl border border-slate-200/80 p-4 shadow-2xs backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80">
        {/* Ô tìm kiếm */}
        <div className="relative flex-1 sm:max-w-xs">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={dict.clan.searchPlaceholder}
            className="h-9 w-full rounded-lg border border-slate-300/80 bg-white/80 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
          />
        </div>

        {/* Bộ lọc vai trò & sắp xếp */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc theo chức vụ */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | ClanRole)}
            className="h-9 rounded-lg border border-slate-300/80 bg-white/80 px-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">{dict.clan.filterAllRoles}</option>
            <option value="leader">{dict.clan.filterLeader}</option>
            <option value="coLeader">{dict.clan.filterCoLeader}</option>
            <option value="admin">{dict.clan.filterElder}</option>
            <option value="member">{dict.clan.filterMember}</option>
          </select>

          {/* Sắp xếp theo tiêu chí */}
          <div className="inline-flex items-center rounded-lg border border-slate-300/80 bg-white/80 p-0.5 dark:border-slate-700 dark:bg-slate-900/80">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="h-7.5 rounded-md bg-transparent px-2 text-xs font-semibold text-slate-700 focus:outline-none dark:text-slate-200 cursor-pointer"
            >
              <option value="rank">{dict.clan.sortRank}</option>
              <option value="trophies">{dict.clan.sortTrophies}</option>
              <option value="th">{dict.clan.sortTownHall}</option>
              <option value="donations">{dict.clan.sortDonations}</option>
              <option value="name">{dict.clan.sortName}</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder((curr) => (curr === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
              title="Đổi chiều sắp xếp"
            >
              <ArrowsDownUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. BẢNG DANH SÁCH THÀNH VIÊN CLAN */}
      <section className="glass-panel overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 dark:border-slate-800/80 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 pl-4 pr-2 text-center w-14 sm:w-16">
                  {dict.clan.thRank}
                </th>
                <th className="py-3 px-3">
                  {dict.clan.thMember}
                </th>
                <th className="py-3 px-3">
                  {dict.clan.thLeague}
                </th>
                <th className="py-3 px-3 text-right">
                  {dict.clan.thTrophies}
                </th>
                <th className="py-3 px-3 text-center sm:text-right">
                  {dict.clan.thDonations}
                </th>
                {onSelectPlayerForDashboard && (
                  <th className="py-3 pl-2 pr-4 text-center w-24">
                    {dict.clan.thAction}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const isMe =
                    cleanMyTag && member.tag.toUpperCase().replace(/^#/, '') === cleanMyTag

                  const tierName =
                    member.leagueTier?.name || member.league?.name || 'Unranked'
                  const tierIcon =
                    member.leagueTier?.iconUrls?.small ||
                    member.league?.iconUrls?.small ||
                    getLeagueIconUrl(tierName)

                  return (
                    <tr
                      key={member.tag}
                      className={`group transition-colors ${
                        isMe
                          ? 'bg-indigo-50/70 font-semibold dark:bg-indigo-950/40'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Cột 1: Hạng trong clan & Biến động */}
                      <td className="py-3 pl-4 pr-2 text-center">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          {getRankBadge(member.clanRank)}
                          {getRankDiffBadge(member.clanRank, member.previousClanRank)}
                        </div>
                      </td>

                      {/* Cột 2: Thông tin thành viên */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 sm:text-sm">
                              {member.name}
                            </span>

                            {isMe && (
                              <span className="inline-flex items-center rounded-full bg-indigo-500/15 px-2 py-0.2 text-[9px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                {dict.clan.you}
                              </span>
                            )}

                            {/* Badge Cấp Town Hall */}
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                              <Building weight="bold" className="h-2.5 w-2.5" />
                              TH{member.townHallLevel}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                              {member.tag}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            {getRoleBadge(member.role)}
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Giải đấu / League Tier */}
                      <td className="py-3 px-3">
                        <div className="inline-flex items-center gap-2">
                          <img
                            src={tierIcon}
                            alt={tierName}
                            referrerPolicy="no-referrer"
                            className="h-6 w-6 shrink-0 object-contain drop-shadow-xs"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {tierName}
                          </span>
                        </div>
                      </td>

                      {/* Cột 4: Số Cúp (Trophies) */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                            {member.trophies.toLocaleString()}
                          </span>
                          <Trophy weight="fill" className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        </div>
                      </td>

                      {/* Cột 5: Quân viện trợ (Cho / Nhận) */}
                      <td className="py-3 px-3 text-center sm:text-right">
                        <div className="flex flex-col items-center sm:items-end gap-0.5 font-mono text-[11px]">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                            <ArrowUp weight="bold" className="h-2.5 w-2.5" />
                            {member.donations.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                            <ArrowDown weight="bold" className="h-2.5 w-2.5" />
                            {member.donationsReceived.toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Cột 6: Hành động xem cá nhân */}
                      {onSelectPlayerForDashboard && (
                        <td className="py-3 pl-2 pr-4 text-center">
                          <button
                            type="button"
                            onClick={() => onSelectPlayerForDashboard(member.tag)}
                            className="apple-btn inline-flex items-center gap-1.5 rounded-lg border border-slate-300/80 bg-white/80 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 active:scale-95 transition-all dark:border-slate-700 dark:bg-slate-800/80 dark:text-indigo-400 dark:hover:border-indigo-400 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                            title={dict.clan.viewPlayerTooltip}
                          >
                            <Eye weight="bold" className="h-3 w-3" />
                            <span>{dict.clan.viewPlayer}</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td
                    colSpan={onSelectPlayerForDashboard ? 6 : 5}
                    className="py-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users weight="duotone" className="h-8 w-8 text-slate-400/80" />
                      <p className="text-sm font-medium">
                        {clanData
                          ? 'Không tìm thấy thành viên nào khớp với bộ lọc.'
                          : dict.clan.noClanPrompt}
                      </p>
                      {!clanData && (
                        <p className="text-xs text-slate-400">
                          {dict.clan.noClanSub}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
