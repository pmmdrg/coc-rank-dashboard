import { useMemo } from 'react'
import { Swords, ShieldCheck, Trophy, Sparkles } from 'lucide-react'
import type { Player } from '../types'

export interface HighlightStatsTableProps {
  players: Player[]
  myPlayerId?: string
}

function PlayerBadge({
  player,
  isMe,
  extraInfo,
}: {
  player: Player
  isMe: boolean
  extraInfo?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold shadow-2xs transition-all ${
        isMe
          ? 'border-sky-500/50 bg-sky-500/15 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500/30'
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
  // 1. Người chơi có % phá huỷ công cao nhất và % phá huỷ của người đó
  // Chỉ xét những người chơi đã có lượt đánh (attacks > 0) hoặc attackDestruction > 0
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

  // 2. Người chơi có % phá huỷ thủ thấp nhất và % thủ của người đó
  // Chỉ xét những người chơi đã có lượt phòng thủ (defenses > 0) hoặc defenseDestruction > 0
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

  // 3. Người chơi có cup tối đa cao nhất và số cup tối đa đó
  const topMaxCups = useMemo(() => {
    if (players.length === 0) return null
    const maxVal = Math.max(...players.map((p) => p.maxPossibleCups ?? 0))
    const tiedPlayers = players.filter((p) => (p.maxPossibleCups ?? 0) === maxVal)
    return {
      maxCups: maxVal,
      players: tiedPlayers,
    }
  }, [players])

  const allPlayersShareMaxCups =
    topMaxCups !== null &&
    players.length > 5 &&
    topMaxCups.players.length === players.length

  return (
    <section>
      <div className="glass-panel rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Thống kê nổi bật & kỷ lục mùa giải
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Tổng cộng: <strong className="text-slate-800 dark:text-slate-200">{players.length}</strong> người chơi
          </span>
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
              {/* Mục 1: % Phá huỷ công cao nhất */}
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

              {/* Mục 2: % Phá huỷ thủ thấp nhất */}
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

              {/* Mục 3: Cup tối đa cao nhất */}
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
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export const SummaryTables = HighlightStatsTable
