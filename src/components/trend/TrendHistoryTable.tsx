import type { ProcessedSeasonPoint } from './types'
import { useI18n } from '../../i18n/LanguageContext'

interface TrendHistoryTableProps {
  chronologicalHistory: ProcessedSeasonPoint[]
}

export function TrendHistoryTable({ chronologicalHistory }: TrendHistoryTableProps) {
  const { dict, interpolate } = useI18n()

  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-[#27272a]">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#111113] border-b border-[#27272a] text-zinc-400 uppercase tracking-wider text-[11px]">
          <tr>
            <th className="px-3.5 py-2.5 font-bold">{dict.performanceTrend.tableColPeriod}</th>
            <th className="px-3 py-2.5 font-bold">{dict.performanceTrend.tableColTier}</th>
            <th className="px-3 py-2.5 font-bold">{dict.performanceTrend.tableColRank}</th>
            <th className="px-3 py-2.5 font-bold">{dict.performanceTrend.tableColCups}</th>
            <th className="px-3 py-2.5 font-bold">{dict.performanceTrend.tableColAttack}</th>
            <th className="px-3 py-2.5 font-bold">{dict.performanceTrend.tableColDefense}</th>
            <th className="px-3 py-2.5 font-bold">{dict.performanceTrend.tableColMaxBattles}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#27272a]">
          {/* Hiển thị mùa mới nhất lên trên cùng của bảng */}
          {[...chronologicalHistory].reverse().map((item, idx) => {
            const isLatest = idx === 0
            return (
              <tr
                key={item.seasonId}
                className={`hover:bg-[#18181b]/60 transition-colors ${
                  isLatest ? 'bg-red-950/20' : ''
                }`}
              >
                {/* Thời gian */}
                <td className="px-3.5 py-3 align-middle whitespace-nowrap font-medium text-white">
                  <div className="flex items-center gap-1.5">
                    <span>{item.displayPeriod}</span>
                    {isLatest && (
                      <span className="rounded bg-red-500/20 border border-red-500/30 px-1 py-0.2 text-[9px] font-bold text-red-300">
                        {dict.performanceTrend.latestBadge}
                      </span>
                    )}
                  </div>
                </td>

                {/* Cấp giải đấu */}
                <td className="px-3 py-3 align-middle whitespace-nowrap font-semibold text-zinc-300">
                  {item.tierName}
                </td>

                {/* Thứ hạng */}
                <td className="px-3 py-3 align-middle whitespace-nowrap font-mono font-bold text-white">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${
                      item.placement <= 10
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-[#18181b] text-zinc-300 border border-[#27272a]'
                    }`}
                  >
                    #{item.placement}
                  </span>
                </td>

                {/* Điểm Cúp */}
                <td className="px-3 py-3 align-middle whitespace-nowrap font-mono font-bold text-amber-400">
                  {item.trophies} {dict.common.trophies}
                </td>

                {/* Tấn công */}
                <td className="px-3 py-3 align-middle whitespace-nowrap">
                  <span className="font-semibold text-white">
                    {item.attackWins}W - {item.attackLosses}L
                  </span>{' '}
                  <span className="text-[11px] text-zinc-400">
                    ({item.attackWinRate}%)
                  </span>
                </td>

                {/* Phòng thủ */}
                <td className="px-3 py-3 align-middle whitespace-nowrap">
                  <span className="font-medium text-zinc-300">
                    {interpolate(dict.performanceTrend.lostStars, { stars: item.defenseStars })}
                  </span>
                </td>

                {/* Giới hạn trận */}
                <td className="px-3 py-3 align-middle whitespace-nowrap font-mono text-zinc-400">
                  {item.maxBattles} {dict.performanceTrend.battlesPerSeasonUnit}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
