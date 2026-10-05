import { useEffect, useMemo, useState } from 'react'
import {
  Shield,
  Trophy,
  Users,
  Sword,
  Crown,
  Medal,
  MagnifyingGlass,
  ArrowsDownUp,
  Building,
  CircleNotch,
  ArrowClockwise,
  ArrowsClockwise,
  Info,
} from '@phosphor-icons/react'
import type { ClanData, ClanMember, ClanRole, Player, PlayerTournamentRankInfo } from '../types'
import { getLeagueIconUrl } from '../lib/leagueIcons'
import { fetchPlayerTournamentRank } from '../lib/cocApi'
import { useI18n } from '../i18n/LanguageContext'
import { CustomSelect, type SelectOption } from './CustomSelect'
import { RankBadge, RankDiffBadge } from './RankBadge'
import { SearchInput } from './SearchInput'

export interface ClanMembersSectionProps {
  clanData: ClanData | null
  isLoading?: boolean
  myPlayerTag?: string
  tournamentPlayers?: Player[]
}

type SortField = 'rank' | 'trophies' | 'th' | 'name' | 'tournamentRank'

export function ClanMembersSection({
  clanData,
  isLoading = false,
  myPlayerTag,
  tournamentPlayers,
}: ClanMembersSectionProps) {
  const { dict } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | ClanRole>('all')
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const roleOptions = useMemo<SelectOption<'all' | ClanRole>[]>(
    () => [
      { value: 'all', label: dict.clan.filterAllRoles },
      { value: 'leader', label: dict.clan.roleLeader },
      { value: 'coLeader', label: dict.clan.roleCoLeader },
      { value: 'admin', label: dict.clan.roleElder },
      { value: 'member', label: dict.clan.roleMember },
    ],
    [dict.clan],
  )

  const sortOptions = useMemo<SelectOption<SortField>[]>(
    () => [
      { value: 'rank', label: dict.clan.sortRank },
      { value: 'tournamentRank', label: dict.clan.sortTournamentRank },
      { value: 'trophies', label: dict.clan.sortTrophies },
      { value: 'th', label: dict.clan.sortTownHall },
      { value: 'name', label: dict.clan.sortName },
    ],
    [dict.clan],
  )

  // Map thứ hạng của người chơi trong bảng đấu giải hiện tại (nếu có trong bracket 100 người)
  const tournamentRankMap = useMemo(() => {
    const map = new Map<string, number>()
    if (tournamentPlayers) {
      for (const p of tournamentPlayers) {
        const cleanTag = (p.playerTag || p.id).toUpperCase().replace(/^#/, '')
        map.set(cleanTag, p.rank)
      }
    }
    return map
  }, [tournamentPlayers])

  // Lưu trữ thứ hạng bảng đấu được tra cứu riêng qua API cho từng thành viên
  const [memberRanks, setMemberRanks] = useState<Record<string, PlayerTournamentRankInfo>>(() => {
    try {
      const clanKey = clanData?.tag ? `coc_member_ranks_${clanData.tag.replace(/^#/, '')}` : ''
      if (clanKey) {
        const saved = sessionStorage.getItem(clanKey)
        if (saved) return JSON.parse(saved)
      }
    } catch {}
    return {}
  })

  const [fetchingTags, setFetchingTags] = useState<Set<string>>(new Set())
  const [isFetchingAll, setIsFetchingAll] = useState(false)

  // Lưu memberRanks vào sessionStorage để khi chuyển qua lại các tab không bị mất dữ liệu đã tra
  useEffect(() => {
    if (!clanData?.tag || Object.keys(memberRanks).length === 0) return
    try {
      const clanKey = `coc_member_ranks_${clanData.tag.replace(/^#/, '')}`
      sessionStorage.setItem(clanKey, JSON.stringify(memberRanks))
    } catch {}
  }, [clanData?.tag, memberRanks])

  // Gọi API tra cứu thứ hạng của 1 thành viên cụ thể
  const handleFetchRank = async (rawTag: string) => {
    const clean = rawTag.toUpperCase().replace(/^#/, '')
    if (fetchingTags.has(clean)) return

    setFetchingTags((prev) => new Set(prev).add(clean))
    try {
      const res = await fetchPlayerTournamentRank(rawTag)
      setMemberRanks((prev) => ({
        ...prev,
        [clean]: res,
      }))
    } finally {
      setFetchingTags((prev) => {
        const next = new Set(prev)
        next.delete(clean)
        return next
      })
    }
  }

  // Gọi API tra cứu hoặc làm mới thứ hạng cho toàn bộ thành viên trong Clan
  const handleFetchAllRanks = async (forceRefresh: boolean = false) => {
    if (!clanData?.memberList || isFetchingAll) return
    setIsFetchingAll(true)

    try {
      const toFetch = clanData.memberList.filter((m) => {
        const clean = m.tag.toUpperCase().replace(/^#/, '')
        if (forceRefresh) {
          return !tournamentRankMap.has(clean)
        }
        return !tournamentRankMap.has(clean) && !memberRanks[clean]?.rank
      })

      const chunkSize = 2
      for (let i = 0; i < toFetch.length; i += chunkSize) {
        const chunk = toFetch.slice(i, i + chunkSize)
        await Promise.all(chunk.map((m) => handleFetchRank(m.tag)))
        if (i + chunkSize < toFetch.length) {
          await new Promise((resolve) => setTimeout(resolve, 150))
        }
      }
    } finally {
      setIsFetchingAll(false)
    }
  }

  // Kiểm tra xem tất cả thành viên trong Clan đã có dữ liệu thứ hạng bảng đấu hay chưa
  const isAllRanksFetched = useMemo(() => {
    if (!clanData?.memberList || clanData.memberList.length === 0) return false
    return clanData.memberList.every((m) => {
      const clean = m.tag.toUpperCase().replace(/^#/, '')
      return tournamentRankMap.has(clean) || Boolean(memberRanks[clean]?.rank || memberRanks[clean]?.isUnranked)
    })
  }, [clanData?.memberList, tournamentRankMap, memberRanks])

  // Tự động tra cứu ngầm thứ hạng bảng đấu cho các thành viên chưa có dữ liệu khi mở Clan
  useEffect(() => {
    if (!clanData?.memberList || clanData.memberList.length === 0 || isFetchingAll) return
    const hasUnfetched = clanData.memberList.some((m) => {
      const clean = m.tag.toUpperCase().replace(/^#/, '')
      return !tournamentRankMap.has(clean) && !memberRanks[clean]
    })
    if (hasUnfetched) {
      handleFetchAllRanks(false)
    }
  }, [clanData?.tag])

  // Lọc và sắp xếp thành viên Clan
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
      } else if (sortField === 'name') {
        diff = a.name.localeCompare(b.name)
      } else if (sortField === 'tournamentRank') {
        const getRankVal = (member: ClanMember) => {
          const clean = member.tag.toUpperCase().replace(/^#/, '')
          const bracketRank = tournamentRankMap.get(clean)
          if (typeof bracketRank === 'number') return bracketRank
          const fetchedRank = memberRanks[clean]?.rank
          if (typeof fetchedRank === 'number') return fetchedRank
          return 9999
        }
        diff = getRankVal(a) - getRankVal(b)
      }
      return sortOrder === 'asc' ? diff : -diff
    })

    return list
  }, [clanData, searchQuery, roleFilter, sortField, sortOrder, tournamentRankMap, memberRanks])

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

  const cleanMyTag = (myPlayerTag || '').trim().toUpperCase().replace(/^#/, '')

  // Khi đang tải dữ liệu Clan
  if (isLoading && !clanData) {
    return (
      <div className="glass-panel rounded-2xl border border-slate-200/80 p-8 text-center backdrop-blur-xl dark:border-slate-800/80 animate-fade-in space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 shadow-inner">
          <CircleNotch weight="bold" className="h-7 w-7 animate-spin" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {dict.clan.syncingBtn || 'Đang tải thông tin Clan...'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Đang đồng bộ dữ liệu thành viên từ Supercell API.
        </p>
      </div>
    )
  }

  // Khi chưa có dữ liệu Clan (chưa nhập Player Tag hoặc người chơi không ở trong Clan)
  if (!clanData) {
    return (
      <div className="glass-panel rounded-2xl border border-slate-200/80 p-8 text-center backdrop-blur-xl dark:border-slate-800/80 animate-fade-in space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 shadow-inner">
          <Shield weight="duotone" className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {myPlayerTag ? 'Không tìm thấy thông tin Clan' : 'Chưa chọn người chơi'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {myPlayerTag
            ? 'Người chơi này hiện chưa gia nhập Clan nào hoặc Supercell API chưa cập nhật thông tin Clan.'
            : 'Vui lòng nhập Player Tag ở mục Thông tin cá nhân để xem thông tin Clan của người chơi này.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. HERO BANNER: THÔNG TIN CLAN (Đã bỏ nút copy tag, ô nhập tag và nút sync clan) */}
      <section className="glass-panel relative overflow-hidden rounded-2xl border border-slate-200/80 p-5 shadow-sm backdrop-blur-xl sm:p-6 dark:border-slate-800/80">
        {/* Họa tiết ánh sáng nền */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/15 via-sky-500/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-gradient-to-tr from-amber-500/10 via-emerald-500/10 to-transparent blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Logo & Thông tin cốt lõi Clan */}
          <div className="flex items-start gap-4 sm:items-center sm:gap-5">
            {clanData.badgeUrls?.large || clanData.badgeUrls?.medium ? (
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-sky-500/30 blur-sm" />
                <img
                  src={clanData.badgeUrls.large || clanData.badgeUrls.medium}
                  alt={clanData.name || 'Clan Badge'}
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
                  {clanData.name}
                </h2>
                {isLoading && (
                  <CircleNotch weight="bold" className="h-4 w-4 animate-spin text-indigo-500" />
                )}
                {clanData.clanLevel ? (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-0.5 text-xs font-black text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-400/15 dark:text-indigo-300">
                    <Shield weight="fill" className="h-3.5 w-3.5" />
                    {dict.clan.level} {clanData.clanLevel}
                  </span>
                ) : null}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                  {clanData.tag}
                </span>

                {clanData.warLeague?.name ? (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                      <Sword weight="bold" className="h-3.5 w-3.5 text-rose-500" />
                      {clanData.warLeague.name}
                    </span>
                  </>
                ) : null}

                {clanData.members ? (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                      <Users weight="bold" className="h-3.5 w-3.5 text-sky-500" />
                      {clanData.members} / 50 {dict.clan.membersCount}
                    </span>
                  </>
                ) : null}

                {clanData.lastSyncedAt ? (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[11px] text-slate-400">
                      Đồng bộ: {clanData.lastSyncedAt}
                    </span>
                  </>
                ) : null}
              </div>

              {clanData.description ? (
                <p className="mt-2 line-clamp-2 max-w-2xl text-xs italic text-slate-600 dark:text-slate-300">
                  &ldquo;{clanData.description}&rdquo;
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* 2. TOOLBAR TÌM KIẾM, LỌC & SẮP XẾP */}
      <section className="glass-panel relative z-20 flex flex-col gap-3 rounded-2xl border border-slate-200/80 p-4 shadow-2xs backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80">
        {/* Ô tìm kiếm */}
        <div className="flex-1 sm:max-w-xs">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={dict.clan.searchPlaceholder}
          />
        </div>

        {/* Bộ lọc vai trò, sắp xếp & nút tra cứu tất cả */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Lọc theo chức vụ (CustomSelect đồng bộ giao diện chọn mùa giải) */}
          <div className="w-full sm:w-44">
            <CustomSelect<'all' | ClanRole>
              value={roleFilter}
              options={roleOptions}
              onChange={(val) => setRoleFilter(val)}
              ariaLabel={dict.clan.filterAllRoles}
            />
          </div>

          {/* Sắp xếp theo tiêu chí (CustomSelect đồng bộ giao diện chọn mùa giải) + Đổi chiều */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="w-full sm:w-48">
              <CustomSelect<SortField>
                value={sortField}
                options={sortOptions}
                onChange={(val) => setSortField(val)}
                ariaLabel={dict.clan.sortRank}
              />
            </div>

            <button
              type="button"
              onClick={() => setSortOrder((curr) => (curr === 'asc' ? 'desc' : 'asc'))}
              className="apple-btn inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-600 hover:border-sky-500/50 hover:bg-white hover:text-slate-900 active:scale-95 transition-all shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-sky-400/50 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
              title={sortOrder === 'asc' ? 'Tăng dần (Nhấn để đổi giảm dần)' : 'Giảm dần (Nhấn để đổi tăng dần)'}
            >
              <ArrowsDownUp weight="bold" className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform duration-200`} />
            </button>
          </div>

          {/* Nút gọi API tra cứu / làm mới thứ hạng tất cả thành viên trong Clan */}
          <button
            type="button"
            onClick={() => handleFetchAllRanks(true)}
            disabled={isFetchingAll}
            className="apple-btn inline-flex h-10 items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 text-xs font-bold text-indigo-600 hover:bg-indigo-500/20 active:scale-95 disabled:opacity-50 transition-all dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-400 cursor-pointer shadow-2xs"
            title={
              isAllRanksFetched
                ? 'Gọi lại API Supercell để cập nhật thứ hạng mới nhất cho tất cả thành viên'
                : 'Tự động gọi API tra cứu thứ hạng của tất cả thành viên trong Clan'
            }
          >
            {isFetchingAll ? (
              <>
                <CircleNotch weight="bold" className="h-3.5 w-3.5 animate-spin" />
                <span>{dict.clan.fetchingAllRanks}</span>
              </>
            ) : isAllRanksFetched ? (
              <>
                <ArrowsClockwise weight="bold" className="h-3.5 w-3.5" />
                <span>{dict.clan.refreshAllRanks}</span>
              </>
            ) : (
              <>
                <Trophy weight="bold" className="h-3.5 w-3.5" />
                <span>{dict.clan.fetchAllRanks}</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* 3. BẢNG DANH SÁCH THÀNH VIÊN CLAN */}
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
                <th className="py-3 px-3 text-center w-36">
                  <div className="inline-flex items-center justify-center gap-1">
                    <span>{dict.clan.thTournamentRank}</span>
                    <span
                      className="inline-flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help"
                      title="Thứ hạng trong bảng đấu 100 người riêng của mỗi thành viên theo giải đấu của họ"
                    >
                      <Info weight="bold" className="h-3 w-3" />
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const cleanMemberTag = member.tag.toUpperCase().replace(/^#/, '')
                  const isMe = cleanMyTag && cleanMemberTag === cleanMyTag

                  const tierName =
                    member.leagueTier?.name || member.league?.name || 'Unranked'
                  const tierIcon =
                    member.leagueTier?.iconUrls?.small ||
                    member.league?.iconUrls?.small ||
                    getLeagueIconUrl(tierName)

                  const tournamentRank = tournamentRankMap.get(cleanMemberTag)

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
                          <RankBadge rank={member.clanRank} size="sm" />
                          <RankDiffBadge
                            diff={member.previousClanRank ? member.previousClanRank - member.clanRank : 0}
                            showDashIfZero={true}
                          />
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

                      {/* Cột 5: Thứ hạng trong bảng đấu giải (100 người) */}
                      <td className="py-3 px-3 text-center">
                        <div className="relative inline-flex items-center justify-center min-w-[70px]">
                          {(() => {
                            // 1. Nếu thành viên cùng bảng đấu giải với người chơi đang chọn hoặc là chính mình
                            if (typeof tournamentRank === 'number') {
                              return (
                                <div className="relative inline-flex items-center justify-center group/rank">
                                  <RankBadge
                                    rank={tournamentRank}
                                    size="sm"
                                    title={
                                      isMe
                                        ? `Thứ hạng của bạn trong bảng đấu 100 người (#${tournamentRank})`
                                        : `Hạng #${tournamentRank} (Cùng bảng đấu 100 người với bạn)`
                                    }
                                    className={isMe ? 'ring-2 ring-sky-500/70 shadow-xs' : ''}
                                  />
                                </div>
                              )
                            }

                            // 2. Nếu đang gọi API tra cứu thứ hạng cho thành viên này
                            if (fetchingTags.has(cleanMemberTag)) {
                              return (
                                <span className="inline-flex h-6.5 items-center justify-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-50/70 px-2 text-[10px] font-semibold text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-950/40 dark:text-indigo-400">
                                  <CircleNotch weight="bold" className="h-2.5 w-2.5 animate-spin" />
                                  <span>{dict.clan.fetchingRank}</span>
                                </span>
                              )
                            }

                            // 3. Nếu đã có kết quả tra cứu riêng qua API
                            const fetchedInfo = memberRanks[cleanMemberTag]
                            if (fetchedInfo) {
                              if (typeof fetchedInfo.rank === 'number') {
                                const rankNum = fetchedInfo.rank
                                const rankTitle = `Hạng #${rankNum} trong bảng đấu riêng${
                                  fetchedInfo.leagueTierName ? ` (${fetchedInfo.leagueTierName})` : ''
                                }${fetchedInfo.leagueTrophies ? ` - ${fetchedInfo.leagueTrophies} cúp` : ''}${
                                  fetchedInfo.lastCheckedAt ? ` • Cập nhật: ${fetchedInfo.lastCheckedAt}` : ''
                                }`

                                return (
                                  <div className="relative inline-flex items-center justify-center group/rank">
                                    <RankBadge rank={rankNum} size="sm" title={rankTitle} />
                                    <button
                                      type="button"
                                      onClick={() => handleFetchRank(member.tag)}
                                      className="absolute -right-5.5 opacity-0 group-hover/rank:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 cursor-pointer"
                                      title="Tra cứu lại thứ hạng"
                                    >
                                      <ArrowClockwise weight="bold" className="h-3 w-3" />
                                    </button>
                                  </div>
                                )
                              }

                              if (fetchedInfo.isUnranked) {
                                return (
                                  <div className="relative inline-flex items-center justify-center group/rank">
                                    <span
                                      className="inline-flex h-6.5 items-center justify-center rounded-lg border border-slate-200 bg-slate-100/70 px-2 font-mono text-[10px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400 select-none"
                                      title="Chưa tham gia bảng đấu giải mùa này"
                                    >
                                      {dict.clan.unrankedBadge}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleFetchRank(member.tag)}
                                      className="absolute -right-5.5 opacity-0 group-hover/rank:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 cursor-pointer"
                                      title="Tra cứu lại"
                                    >
                                      <ArrowClockwise weight="bold" className="h-3 w-3" />
                                    </button>
                                  </div>
                                )
                              }

                              if (fetchedInfo.error) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleFetchRank(member.tag)}
                                    className="inline-flex h-6.5 items-center gap-1 rounded-lg border border-rose-300/80 bg-rose-50 px-2 text-[10px] font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400 cursor-pointer"
                                    title={`${fetchedInfo.error} - Nhấn để thử lại`}
                                  >
                                    <span>Lỗi</span>
                                    <ArrowClockwise weight="bold" className="h-2.5 w-2.5" />
                                  </button>
                                )
                              }
                            }

                            // 4. Chưa tra cứu: hiển thị nút Tra cứu thứ hạng
                            return (
                              <button
                                type="button"
                                onClick={() => handleFetchRank(member.tag)}
                                className="apple-btn inline-flex h-6.5 items-center justify-center gap-1 rounded-lg border border-indigo-200/80 bg-white/90 px-2 text-[10px] font-semibold text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 active:scale-95 transition-all dark:border-indigo-900/60 dark:bg-slate-800/80 dark:text-indigo-400 dark:hover:border-indigo-400 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                                title="Gọi API Supercell để tra cứu thứ hạng bảng đấu 100 người của người chơi này"
                              >
                                <MagnifyingGlass weight="bold" className="h-2.5 w-2.5" />
                                <span>{dict.clan.fetchRank}</span>
                              </button>
                            )
                          })()}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users weight="duotone" className="h-8 w-8 text-slate-400/80" />
                      <p className="text-sm font-medium">
                        Không tìm thấy thành viên nào khớp với bộ lọc.
                      </p>
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
