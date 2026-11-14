import { useI18n } from '../i18n/LanguageContext'

export interface ChartDataItem {
  label: string
  value: number
  color: string
}

export interface ChartsSectionProps {
  comparisonData: ChartDataItem[]
  attackStatusData: ChartDataItem[]
  ratingData: ChartDataItem[]
  myPlayerName: string
  isSyncingApi?: boolean
  embedded?: boolean
}

function SkeletonPieChart() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-[#272226] bg-[#121114] p-4">
      <div className="h-3 w-32 rounded skeleton-shimmer" />
      <div className="my-auto flex items-center justify-center pt-4">
        <div className="h-28 w-28 rounded-full border-8 border-[#272226] skeleton-shimmer" />
      </div>
    </div>
  )
}

function getPieSlices(values: ChartDataItem[]) {
  const total = values.reduce((sum, item) => sum + item.value, 0)
  let accumulated = 0

  return values.map((item) => {
    const start = accumulated
    const percent = total > 0 ? item.value / total : 0
    accumulated += percent

    return {
      ...item,
      percent,
      dashArray: `${percent * 100} ${100 - percent * 100}`,
      dashOffset: 25 - start * 100,
    }
  })
}

function PercentagePieChart({
  title,
  values,
  showPercentage = true,
}: {
  title: string
  values: ChartDataItem[]
  showPercentage?: boolean
}) {
  const { dict, language } = useI18n()
  const slices = getPieSlices(values)
  const total = values.reduce((sum, item) => sum + item.value, 0)
  const hasData = total > 0

  const formatNumber = (val: number) =>
    new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(val)

  return (
    <div className="flex h-full flex-col justify-between overflow-hidden rounded-lg border border-[#272226] bg-[#121114] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {title}
        </span>
        <span className="text-[11px] text-zinc-500 font-mono">
          {total}
        </span>
      </div>

      <div className="my-auto flex flex-col sm:flex-row items-center gap-3.5 pt-3">
        {/* Vòng Donut Chart */}
        <div className="relative flex shrink-0 items-center justify-center">
          <svg className="h-28 w-28 -rotate-90 transform" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="14"
              className="stroke-[#1f1d22]"
              strokeWidth="4"
              fill="transparent"
            />
            {hasData ? (
              slices.map((slice, index) => (
                <circle
                  key={index}
                  cx="18"
                  cy="18"
                  r="14"
                  stroke={slice.color}
                  strokeWidth="4"
                  strokeDasharray={slice.dashArray}
                  strokeDashoffset={slice.dashOffset}
                  fill="transparent"
                  className="transition-all duration-300"
                />
              ))
            ) : (
              <circle
                cx="18"
                cy="18"
                r="14"
                className="stroke-[#272226]"
                strokeWidth="4"
                strokeDasharray="100 0"
                fill="transparent"
              />
            )}
          </svg>
          <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-zinc-500">
              {dict.charts.ratioCenter}
            </span>
            <span className="font-mono text-xs font-bold text-white">
              {hasData ? '100%' : '0%'}
            </span>
          </div>
        </div>

        {/* Legend chú thích */}
        <div className="w-full min-w-0 flex-1 space-y-1.5">
          {hasData ? (
            values.map((item, index) => {
              const percent = total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0
              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate pr-1">
                    <span
                      className="h-2 w-2 shrink-0 rounded-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-zinc-300">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-mono font-medium text-white shrink-0">
                    {formatNumber(item.value)}
                    {showPercentage && (
                      <span className="text-[10px] text-zinc-500 ml-1">
                        ({percent}%)
                      </span>
                    )}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="py-2 text-center text-xs text-zinc-500">
              {dict.common.noData}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ChartsSection({
  comparisonData,
  attackStatusData,
  ratingData,
  myPlayerName,
  isSyncingApi = false,
  embedded = false,
}: ChartsSectionProps) {
  const { dict, interpolate } = useI18n()

  if (isSyncingApi) {
    return (
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <SkeletonPieChart />
        <SkeletonPieChart />
        <SkeletonPieChart />
      </div>
    )
  }

  const content = (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
      <PercentagePieChart
        title={
          myPlayerName && myPlayerName !== '--'
            ? interpolate(dict.charts.opponentRatioWithMe, { name: myPlayerName })
            : dict.charts.opponentRatioMe
        }
        values={comparisonData}
      />
      <PercentagePieChart
        title={dict.charts.attackCompletion}
        values={attackStatusData}
      />
      <PercentagePieChart
        title={dict.charts.skillRating}
        values={ratingData}
      />
    </div>
  )

  if (embedded) {
    return <div className="relative z-10">{content}</div>
  }

  return (
    <div className="glass-panel relative z-10 rounded-xl p-4 shadow-xs">
      {content}
    </div>
  )
}
