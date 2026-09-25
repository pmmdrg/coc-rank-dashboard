import { useMemo, useState } from 'react'
import { Swords, ShieldCheck, Trophy, Sparkles, TrendingDown, ShieldAlert, Award, AlertTriangle } from 'lucide-react'
import type { Player } from '../types'

export interface HighlightStatsTableProps {
  players: Player[]
  myPlayerId?: string
}

type FilterMode = 'all' | 'best' | 'worst'

function PlayerBadge({
  player,
  isMe,
  extraInfo,
  variant = 'default',
}: {
  player: Player
  isMe: boolean
  extraInfo?: string
  variant?: 'default' | 'danger'
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold shadow-2xs transition-all ${
        isMe
          ? 'border-sky-500/50 bg-sky-500/15 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500/30'
          : variant === 'danger'
            ? 'border-rose-200/80 bg-rose-50/70 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
            : 'border-slate-200/80 bg-white/80 text-slate-800 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200'
      }`}
    >
      <span className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500">
        #{player.rank}
      </span>
      <span className="font-semibold">{player.name}</span>
      {isMe && (
        <span className="rounded bg-sky-500/25 px-1 py-0.2 text-[9px] font-extrabold tracking-wide text-sky-700 dark:text-sky-300">
          BẠN
        </span>
      )}
      {extraInfo && (
        <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
          ({extraInfo})
        </span>
      )}
    </span>
  )
}

export function HighlightStatsTable({ players, myPlayerId }: HighlightStatsTableProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  // --- 1. NHÓM TẤN CÔNG (Công cao nhất & Công thấp nhất) ---
  const candidateAttacks = useMemo(() => {
    return players.filter((p) => (p.attacks ?? 0) > 0 || (p.attackDestruction ?? 0) > 0)
  }, [players])

  const topAttack = useMemo(() => {
    if (candidateAttacks.length === 0) return null
    const maxVal = Math.max(...candidateAttacks.map((p) => p.attackDestruction ?? 0))
    const tiedPlayers = candidateAttacks.filter((p) => (p.attackDestruction ?? 0) === maxVal)
    return {
      destruction: maxVal,
      players: tiedPlayers,
    }
  }, [candidateAttacks])

  const worstAttack = useMemo(() => {
    if (candidateAttacks.length === 0) return null
    const minVal = Math.min(...candidateAttacks.map((p) => p.attackDestruction ?? 0))
    const tiedPlayers = candidateAttacks.filter((p) => (p.attackDestruction ?? 0) === minVal)
    return {
      destruction: minVal,
      players: tiedPlayers,
    }
  }, [candidateAttacks])

  // --- 2. NHÓM PHÒNG THỦ (Thủ thấp nhất - tốt nhất & Thủ cao nhất - tệ nhất) ---
  const candidateDefenses = useMemo(() => {
    return players.filter((p) => (p.defenses ?? 0) > 0 || (p.defenseDestruction ?? 0) > 0)
  }, [players])

  const bestDefense = useMemo(() => {
    if (candidateDefenses.length === 0) return null
    const minVal = Math.min(...candidateDefenses.map((p) => p.defenseDestruction ?? 0))
    const tiedPlayers = candidateDefenses.filter((p) => (p.defenseDestruction ?? 0) === minVal)
    return {
      destruction: minVal,
      players: tiedPlayers,
    }
  }, [candidateDefenses])

  const worstDefense = useMemo(() => {
    if (candidateDefenses.length === 0) return null
    const maxVal = Math.max(...candidateDefenses.map((p) => p.defenseDestruction ?? 0))
    const tiedPlayers = candidateDefenses.filter((p) => (p.defenseDestruction ?? 0) === maxVal)
    return {
      destruction: maxVal,
      players: tiedPlayers,
    }
  }, [candidateDefenses])

  // --- 3. NHÓM CUP TỐI ĐA (Cup tối đa cao nhất & Cup tối đa thấp nhất) ---
  const topMaxCups = useMemo(() => {
    if (players.length === 0) return null
    const maxVal = Math.max(...players.map((p) => p.maxPossibleCups ?? 0))
    const tiedPlayers = players.filter((p) => (p.maxPossibleCups ?? 0) === maxVal)
    return {
      maxCups: maxVal,
      players: tiedPlayers,
    }
  }, [players])

  const worstMaxCups = useMemo(() => {
    if (players.length === 0) return null
    const minVal = Math.min(...players.map((p) => p.maxPossibleCups ?? 0))
    const tiedPlayers = players.filter((p) => (p.maxPossibleCups ?? 0) === minVal)
    return {
      maxCups: minVal,
      players: tiedPlayers,
    }
  }, [players])

  const allPlayersShareMaxCups =
    topMaxCups !== null &&
    players.length > 5 &&
    topMaxCups.players.length === players.length

  const allPlayersShareMinCups =
    worstMaxCups !== null &&
    players.length > 5 &&
    worstMaxCups.players.length === players.length

  const showBest = filterMode === 'all' || filterMode === 'best'
  const showWorst = filterMode === 'all' || filterMode === 'worst'

  return (
    <section>
      <div className="glass-panel rounded-xl p-5 shadow-sm">
        {/* Header với Tiêu đề, Bộ lọc nhanh & Tổng số người chơi */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Thống kê nổi bật & kỷ lục mùa giải
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Bộ lọc nhanh: Tất cả / Tốt nhất / Tệ nhất */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800/70">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Tất cả (6)
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('best')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                  filterMode === 'best'
                    ? 'bg-emerald-600 text-white shadow-2xs dark:bg-emerald-500'
                    : 'text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400'
                }`}
              >
                <Award className="h-3 w-3" />
                <span>Tốt nhất (3)</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('worst')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                  filterMode === 'worst'
                    ? 'bg-rose-600 text-white shadow-2xs dark:bg-rose-500'
                    : 'text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400'
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Tệ nhất (3)</span>
              </button>
            </div>

            <span className="hidden text-xs text-slate-500 sm:inline dark:text-slate-400">
              Tổng cộng: <strong className="text-slate-800 dark:text-slate-200">{players.length}</strong> người chơi
            </span>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <table className="w-full text-sm">
            <thead className="soft-table-head text-xs uppercase tracking-wider">
              <tr>
                <th className="w-64 min-w-[200px] px-4 py-2.5 text-left font-semibold">
                  Hạng mục thống kê
                </th>
                <th className="w-44 min-w-[150px] px-4 py-2.5 text-center font-semibold">
                  Kỷ lục / Chỉ số
                </th>
                <th className="px-4 py-2.5 text-left font-semibold">
                  Người chơi nắm giữ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
              {/* ==================== PHẦN 1: HẠNG MỤC TỐT NHẤT ==================== */}
              {showBest && (
                <>
                  {filterMode === 'all' && (
                    <tr className="bg-emerald-500/10 dark:bg-emerald-500/15">
                      <td
                        colSpan={3}
                        className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5" />
                          Hạng mục thành tích tốt nhất
                        </span>
                      </td>
                    </tr>
                  )}

                  {/* 1.1: % Phá huỷ công cao nhất */}
                  <tr className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs">
                          <Swords className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            % Phá huỷ công cao nhất
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Sát thương công kích trung bình đỉnh nhất
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      {topAttack !== null ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
                          {topAttack.destruction.toFixed(1)} %
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400 dark:text-slate-500">
                          Chưa có dữ liệu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {topAttack && topAttack.players.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                          {topAttack.players.map((player) => (
                            <PlayerBadge
                              key={player.id}
                              player={player}
                              isMe={player.id === myPlayerId}
                              extraInfo={`${player.attacks} lượt`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Chưa có người chơi nào thực hiện lượt đánh
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* 1.2: % Phá huỷ thủ thấp nhất */}
                  <tr className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            % Phá huỷ thủ thấp nhất
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Phòng thủ kiên cố nhất (chịu ít thiệt hại nhất)
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      {bestDefense !== null ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                          {bestDefense.destruction.toFixed(1)} %
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400 dark:text-slate-500">
                          Chưa có dữ liệu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {bestDefense && bestDefense.players.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                          {bestDefense.players.map((player) => (
                            <PlayerBadge
                              key={player.id}
                              player={player}
                              isMe={player.id === myPlayerId}
                              extraInfo={`${player.defenses} lượt`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Chưa có người chơi nào nhận lượt thủ
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* 1.3: Cup tối đa cao nhất */}
                  <tr className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-2xs">
                          <Trophy className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            Cup tối đa cao nhất
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Trần cúp lý thuyết cao nhất mùa giải
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      {topMaxCups !== null ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-sm font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs">
                          {new Intl.NumberFormat('vi-VN').format(topMaxCups.maxCups)} cup
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400 dark:text-slate-500">
                          Chưa có dữ liệu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {topMaxCups && topMaxCups.players.length > 0 ? (
                        allPlayersShareMaxCups ? (
                          <div className="flex flex-col gap-1.5 py-0.5">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              Tất cả <strong className="text-indigo-600 dark:text-indigo-400">{players.length}</strong> người chơi đều đang cùng mức trần cao nhất
                            </span>
                            <div className="flex max-h-28 flex-wrap items-center gap-1.5 overflow-y-auto pr-1">
                              {topMaxCups.players.map((player) => (
                                <PlayerBadge
                                  key={player.id}
                                  player={player}
                                  isMe={player.id === myPlayerId}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                            {topMaxCups.players.map((player) => (
                              <PlayerBadge
                                key={player.id}
                                player={player}
                                isMe={player.id === myPlayerId}
                              />
                            ))}
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Chưa có dữ liệu người chơi
                        </span>
                      )}
                    </td>
                  </tr>
                </>
              )}

              {/* ==================== PHẦN 2: HẠNG MỤC TỆ NHẤT ==================== */}
              {showWorst && (
                <>
                  {filterMode === 'all' && (
                    <tr className="bg-rose-500/10 dark:bg-rose-500/15">
                      <td
                        colSpan={3}
                        className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Hạng mục thành tích tệ nhất / Cần cải thiện
                        </span>
                      </td>
                    </tr>
                  )}

                  {/* 2.1: % Phá huỷ công thấp nhất */}
                  <tr className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-2xs">
                          <TrendingDown className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            % Phá huỷ công thấp nhất
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Sát thương công kích trung bình thấp nhất
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      {worstAttack !== null ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-sm font-bold text-rose-700 dark:text-rose-300 shadow-2xs">
                          {worstAttack.destruction.toFixed(1)} %
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400 dark:text-slate-500">
                          Chưa có dữ liệu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {worstAttack && worstAttack.players.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                          {worstAttack.players.map((player) => (
                            <PlayerBadge
                              key={player.id}
                              player={player}
                              isMe={player.id === myPlayerId}
                              variant="danger"
                              extraInfo={`${player.attacks} lượt`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Chưa có người chơi nào thực hiện lượt đánh
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* 2.2: % Phá huỷ thủ cao nhất */}
                  <tr className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-2xs">
                          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            % Phá huỷ thủ cao nhất
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Phòng thủ chịu nhiều thiệt hại nhất
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      {worstDefense !== null ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-sm font-bold text-rose-700 dark:text-rose-300 shadow-2xs">
                          {worstDefense.destruction.toFixed(1)} %
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400 dark:text-slate-500">
                          Chưa có dữ liệu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {worstDefense && worstDefense.players.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                          {worstDefense.players.map((player) => (
                            <PlayerBadge
                              key={player.id}
                              player={player}
                              isMe={player.id === myPlayerId}
                              variant="danger"
                              extraInfo={`${player.defenses} lượt`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Chưa có người chơi nào nhận lượt thủ
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* 2.3: Cup tối đa thấp nhất */}
                  <tr className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400 shadow-2xs">
                          <TrendingDown className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            Cup tối đa thấp nhất
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Trần cúp lý thuyết thấp nhất mùa giải
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      {worstMaxCups !== null ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/30 bg-slate-500/15 px-3 py-1 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
                          {new Intl.NumberFormat('vi-VN').format(worstMaxCups.maxCups)} cup
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400 dark:text-slate-500">
                          Chưa có dữ liệu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {worstMaxCups && worstMaxCups.players.length > 0 ? (
                        allPlayersShareMinCups ? (
                          <div className="flex flex-col gap-1.5 py-0.5">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              Tất cả <strong className="text-slate-600 dark:text-slate-400">{players.length}</strong> người chơi đều đang cùng mức trần thấp nhất
                            </span>
                            <div className="flex max-h-28 flex-wrap items-center gap-1.5 overflow-y-auto pr-1">
                              {worstMaxCups.players.map((player) => (
                                <PlayerBadge
                                  key={player.id}
                                  player={player}
                                  isMe={player.id === myPlayerId}
                                  variant="danger"
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                            {worstMaxCups.players.map((player) => (
                              <PlayerBadge
                                key={player.id}
                                player={player}
                                isMe={player.id === myPlayerId}
                                variant="danger"
                              />
                            ))}
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Chưa có dữ liệu người chơi
                        </span>
                      )}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export const SummaryTables = HighlightStatsTable
