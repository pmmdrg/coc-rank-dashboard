import type { ProcessedSeasonPoint } from './types'

interface TrendHistoryTableProps {
  chronologicalHistory: ProcessedSeasonPoint[]
}

export function TrendHistoryTable({ chronologicalHistory }: TrendHistoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-700/70">
      <table className="w-full text-left text-xs">
        <thead className="soft-table-head uppercase tracking-wider text-[11px]">
          <tr>
            <th className="px-3.5 py-2.5 font-bold">Khoảng thời gian</th>
            <th className="px-3 py-2.5 font-bold">Cấp giải đấu</th>
            <th className="px-3 py-2.5 font-bold">Thứ hạng</th>
            <th className="px-3 py-2.5 font-bold">Điểm Cúp</th>
            <th className="px-3 py-2.5 font-bold">Tấn công</th>
            <th className="px-3 py-2.5 font-bold">Phòng thủ</th>
            <th className="px-3 py-2.5 font-bold">Số trận tối đa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60">
          {/* Hiển thị mùa mới nhất lên trên cùng của bảng */}
          {[...chronologicalHistory].reverse().map((item, idx) => {
            const isLatest = idx === 0
            return (
              <tr
                key={item.seasonId}
                className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                  isLatest ? 'bg-sky-500/[0.04] dark:bg-sky-500/[0.08]' : ''
                }`}
              >
                {/* Thời gian */}
                <td className="px-3.5 py-3 align-middle whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span>{item.displayPeriod}</span>
                    {isLatest && (
                      <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[9px] font-bold text-sky-700 dark:text-sky-300">
                        Mới nhất
                      </span>
                    )}
                  </div>
                </td>

                {/* Cấp giải đấu */}
                <td className="px-3 py-3 align-middle whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                  {item.tierName}
                </td>

                {/* Thứ hạng */}
                <td className="px-3 py-3 align-middle whitespace-nowrap font-mono font-bold text-slate-900 dark:text-slate-100">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${
                      item.placement <= 10
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    #{item.placement}
                  </span>
                </td>

                {/* Điểm Cúp */}
                <td className="px-3 py-3 align-middle whitespace-nowrap font-mono font-bold text-amber-600 dark:text-amber-400">
                  {item.trophies} cúp
                </td>

                {/* Tấn công */}
                <td className="px-3 py-3 align-middle whitespace-nowrap">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.attackWins}W - {item.attackLosses}L
                  </span>{' '}
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    ({item.attackWinRate}%)
                  </span>
                </td>

                {/* Phòng thủ */}
                <td className="px-3 py-3 align-middle whitespace-nowrap">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Mất {item.defenseStars} sao
                  </span>
                </td>

                {/* Giới hạn trận */}
                <td className="px-3 py-3 align-middle whitespace-nowrap font-mono text-slate-500 dark:text-slate-400">
                  {item.maxBattles} lượt/mùa
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
