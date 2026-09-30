import { useI18n } from '../i18n/LanguageContext'

interface ChartDataItem {
  label: string
  value: number
  color: string
}

interface ChartsSectionProps {
  comparisonData: ChartDataItem[]
  attackStatusData: ChartDataItem[]
  ratingData: ChartDataItem[]
  myPlayerName: string
  isSyncingApi?: boolean
}

function SkeletonPieChart() {
  return (
    <div className="glass-panel flex h-full flex-col rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="h-4 w-40 rounded-md skeleton-shimmer" />
        <div className="h-3 w-16 rounded-md skeleton-shimmer" />
      </div>
      <div className="my-auto flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 pt-3 sm:pt-4">
        <div className="relative flex shrink-0 items-center justify-center">
          <div className="h-32 w-32 sm:h-34 sm:w-34 rounded-full border-[8.5px] border-slate-200/90 dark:border-slate-800/90 skeleton-shimmer flex items-center justify-center">
            <div className="h-3.5 w-9 rounded-md skeleton-shimmer" />
          </div>
        </div>
        <div className="w-full min-w-0 flex-1 space-y-2.5">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full skeleton-shimmer shrink-0" />
                <div className="h-3.5 w-24 rounded-md skeleton-shimmer" />
              </div>
              <div className="h-3.5 w-12 rounded-md skeleton-shimmer shrink-0" />
            </div>
          ))}
        </div>
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
  const { dict, interpolate, language } = useI18n()
  const slices = getPieSlices(values)
  const total = values.reduce((sum, item) => sum + item.value, 0)
  const hasData = total > 0

  const formatNumber = (val: number) =>
    new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(val)

  return (
    <div className="glass-panel flex h-full flex-col rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 truncate" title={title}>
          {title}
        </h3>
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 font-medium">
          {hasData ? interpolate(dict.charts.total, { total: formatNumber(total) }) : '--'}
        </span>
      </div>

      {!hasData ? (
        <div className="my-auto flex flex-col items-center justify-center py-10 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
          {dict.common.noData}
        </div>
      ) : (
        <div className="my-auto flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 pt-3 sm:pt-4">
          <div className="relative flex shrink-0 items-center justify-center">
            <svg viewBox="0 0 42 42" className="h-32 w-32 sm:h-34 sm:w-34 -rotate-90 drop-shadow-sm">
              <circle
                cx="21"
                cy="21"
                r="15.9"
                fill="transparent"
                stroke="currentColor"
                className="text-slate-200/80 dark:text-slate-800"
                strokeWidth="8.5"
              />
              {slices.map((slice) => (
                <circle
                  key={slice.label}
                  cx="21"
                  cy="21"
                  r="15.9"
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="8.5"
                  strokeDasharray={slice.dashArray}
                  strokeDashoffset={slice.dashOffset}
                  style={{
                    transition:
                      'stroke-dasharray 450ms ease, stroke-dashoffset 450ms ease, stroke 300ms ease',
                  }}
                />
              ))}
            </svg>
            {/* Tâm Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{dict.charts.ratioCenter}</span>
              <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                100%
              </span>
            </div>
          </div>

          <div className="w-full min-w-0 flex-1 space-y-2">
            {values.map((item) => {
              const percent = ((item.value / total) * 100).toFixed(1)

              return (
                <div key={item.label} className="flex items-center justify-between gap-1.5 text-xs sm:text-[13px]">
                  <span className="flex min-w-0 items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/50 dark:ring-slate-900/50"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium" title={item.label}>{item.label}</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-50 shrink-0 whitespace-nowrap pl-1">
                    {formatNumber(item.value)}
                    {showPercentage && (
                      <span className="ml-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        ({percent}%)
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function ChartsSection({
  comparisonData,
  attackStatusData,
  ratingData,
  myPlayerName,
  isSyncingApi = false,
}: ChartsSectionProps) {
  const { dict, interpolate } = useI18n()

  const comparisonTitle =
    myPlayerName && myPlayerName !== '--'
      ? interpolate(dict.charts.opponentRatioWithMe, { name: myPlayerName })
      : dict.charts.opponentRatioMe

  if (isSyncingApi) {
    return (
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonPieChart />
        <SkeletonPieChart />
        <div className="md:col-span-2 lg:col-span-1">
          <SkeletonPieChart />
        </div>
      </section>
    )
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <PercentagePieChart
        title={comparisonTitle}
        values={comparisonData}
      />
      <PercentagePieChart
        title={dict.charts.attackCompletion}
        values={attackStatusData}
      />
      <div className="md:col-span-2 lg:col-span-1">
        <PercentagePieChart
          title={dict.charts.skillRating}
          values={ratingData}
        />
      </div>
    </section>
  )
}
