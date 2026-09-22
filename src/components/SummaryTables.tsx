import type { RatingCategory } from '../types'
import { ratingColors, ratingLabels } from '../lib/ranking'

interface SummaryTablesProps {
  ratingCounts: Record<RatingCategory, number>
  totalPlayers: number
}

const ratingOptions: RatingCategory[] = ['elite', 'contested', 'danger', 'safe']

export function SummaryTables({ ratingCounts, totalPlayers }: SummaryTablesProps) {
  return (
    <section>
      <div className="glass-panel rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Bảng phân loại đánh giá
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Tổng cộng: <strong className="text-slate-800 dark:text-slate-200">{totalPlayers}</strong> người chơi
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <table className="w-full text-sm">
            <thead className="soft-table-head text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Phân loại đánh giá</th>
                <th className="w-32 px-4 py-2.5 text-right font-semibold">Số lượng</th>
                <th className="w-32 px-4 py-2.5 text-right font-semibold">Tỷ lệ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
              {ratingOptions.map((rating) => {
                const count = ratingCounts[rating] || 0
                const percent = totalPlayers > 0 ? ((count / totalPlayers) * 100).toFixed(1) : '0.0'

                return (
                  <tr key={rating} className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full ring-2 ring-white/40 dark:ring-slate-900/40"
                          style={{ backgroundColor: ratingColors[rating] }}
                          aria-hidden="true"
                        />
                        <span>{ratingLabels[rating]}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                          {rating === 'elite'
                            ? '(≥ 32 cup/lượt)'
                            : rating === 'contested'
                              ? '(≥ 24 cup/lượt)'
                              : rating === 'danger'
                                ? '(< 24 cup/lượt)'
                                : '(chưa đánh lượt nào)'}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-slate-50">
                      {count}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-400">
                      {percent}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
