import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Info,
  Loader2,
  Search,
  Trophy,
  X,
  Zap,
} from 'lucide-react'

interface ApiTesterModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTag?: string
}

interface CoCPlayerData {
  name: string
  tag: string
  townHallLevel: number
  expLevel: number
  trophies: number
  bestTrophies: number
  warStars: number
  attackWins: number
  defenseWins: number
  builderHallLevel?: number
  clan?: {
    tag: string
    name: string
    clanLevel: number
    badgeUrls?: {
      small?: string
      medium?: string
      large?: string
    }
  }
  league?: {
    id: number
    name: string
    iconUrls?: {
      small?: string
      medium?: string
    }
  }
  legendStatistics?: {
    currentSeason?: {
      rank?: number
      trophies?: number
    }
    previousSeason?: {
      rank?: number
      trophies?: number
    }
    bestSeason?: {
      rank?: number
      trophies?: number
    }
  }
  [key: string]: unknown
}

export function ApiTesterModal({ isOpen, onClose, defaultTag = '' }: ApiTesterModalProps) {
  const [tag, setTag] = useState(defaultTag)
  const [loading, setLoading] = useState(false)
  const [playerData, setPlayerData] = useState<CoCPlayerData | null>(null)
  const [error, setError] = useState<{ message: string; details?: unknown } | null>(null)
  const [showRawJson, setShowRawJson] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)

  if (!isOpen) return null

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanTag = tag.trim().toUpperCase()
    if (!cleanTag) return

    setLoading(true)
    setError(null)
    setPlayerData(null)

    const formattedTag = cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`

    try {
      const res = await fetch(`/api/player?tag=${encodeURIComponent(formattedTag)}`)
      const data = await res.json()

      if (!res.ok) {
        setError({
          message: data.error || `Lỗi API (${res.status})`,
          details: data.details,
        })
      } else {
        setPlayerData(data)
      }
    } catch (err: unknown) {
      setError({
        message: 'Không thể kết nối đến endpoint /api/player trên website.',
        details: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyJson = () => {
    if (!playerData) return
    navigator.clipboard.writeText(JSON.stringify(playerData, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Thử Nghiệm API Clash of Clans
                </h2>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                  Vercel Serverless
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gọi qua Serverless Endpoint <code className="font-mono text-[11px] text-amber-600 dark:text-amber-400">/api/player</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSearch} className="mt-5 space-y-4">
          <div>
            <label htmlFor="player-tag" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Player Tag trong Clash of Clans
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-mono font-bold text-sm">
                  #
                </span>
                <input
                  id="player-tag"
                  type="text"
                  value={tag.startsWith('#') ? tag.slice(1) : tag}
                  onChange={(e) => setTag(e.target.value.toUpperCase())}
                  placeholder="2PP982L9"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-8 pr-4 font-mono text-sm uppercase text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-amber-400 dark:focus:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !tag.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang gọi API...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Tra cứu
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Status / Results */}
        <div className="mt-5 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-rose-300/80 bg-rose-50/90 p-4 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-semibold">{error.message}</p>
                  {Boolean(error.details) && (
                    <div className="mt-2">
                      <span className="text-[10px] font-semibold text-rose-800 dark:text-rose-300">
                        Chi tiết phản hồi từ máy chủ:
                      </span>
                      <pre className="mt-1 max-h-24 overflow-auto rounded-lg bg-rose-950/20 p-2 font-mono text-[10px] text-rose-900 dark:text-rose-200">
                        {JSON.stringify(error.details, null, 2)}
                      </pre>
                    </div>
                  )}
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
                    💡 <strong>Gợi ý kiểm tra:</strong> Hãy chắc chắn bạn đã cấu hình biến môi trường{' '}
                    <code className="rounded bg-rose-200/60 px-1 py-0.5 font-mono text-[10px] dark:bg-rose-900/60">
                      COC_API_TOKEN
                    </code>{' '}
                    và đã whitelist IP proxy{' '}
                    <code className="rounded bg-rose-200/60 px-1 py-0.5 font-mono text-[10px] dark:bg-rose-900/60">
                      45.79.218.79
                    </code>{' '}
                    trên cổng Supercell Developer Portal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Player Card */}
          {playerData && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-4 animate-fade-in">
              {/* Profile Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-700/80">
                <div className="flex items-center gap-3">
                  {playerData.clan?.badgeUrls?.small && (
                    <img
                      src={playerData.clan.badgeUrls.small}
                      alt={playerData.clan.name}
                      className="h-10 w-10 object-contain drop-shadow-sm"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {playerData.name}
                      </span>
                      <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {playerData.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {playerData.clan ? (
                        <span>Clan: <strong>{playerData.clan.name}</strong> (Lv.{playerData.clan.clanLevel})</span>
                      ) : (
                        <span>Chưa gia nhập Clan</span>
                      )}
                      {playerData.league?.name && <span> • Giải: {playerData.league.name}</span>}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Trophy className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {playerData.trophies?.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">cúp</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Kỷ lục cao nhất: {playerData.bestTrophies?.toLocaleString()} cúp
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 text-center">
                <div className="rounded-lg bg-white p-2.5 shadow-2xs dark:bg-slate-900/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Nhà Chính</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    TH {playerData.townHallLevel}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2.5 shadow-2xs dark:bg-slate-900/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Cấp độ EXP</span>
                  <p className="text-sm font-bold text-sky-600 dark:text-sky-400">
                    Lv. {playerData.expLevel}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2.5 shadow-2xs dark:bg-slate-900/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Thắng Công Mùa</span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {playerData.attackWins} trận
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2.5 shadow-2xs dark:bg-slate-900/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Thắng Thủ Mùa</span>
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {playerData.defenseWins} trận
                  </p>
                </div>
              </div>

              {/* Raw JSON toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {showRawJson ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {showRawJson ? 'Ẩn phản hồi JSON' : 'Xem toàn bộ dữ liệu JSON trả về từ Supercell'}
                </button>

                {showRawJson && (
                  <div className="mt-2 relative">
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className="absolute top-2 right-2 inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700"
                    >
                      {copiedJson ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedJson ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                    <pre className="max-h-60 overflow-y-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-emerald-400 leading-relaxed">
                      {JSON.stringify(playerData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Setup Instructions Card */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
              <Info className="h-4 w-4" />
              <span>Hướng dẫn cấu hình biến môi trường:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed opacity-90">
              <li>
                <strong>Trên Vercel:</strong> Vào <em>Project Settings ➔ Environment Variables</em>, thêm{' '}
                <code className="font-mono font-bold text-amber-700 dark:text-amber-300">COC_API_TOKEN</code> bằng chuỗi Token của bạn.
              </li>
              <li>
                <strong>Whitelist IP Proxy:</strong> Trên cổng Supercell Developer Portal, đảm bảo key của bạn có IP{' '}
                <code className="font-mono font-bold text-amber-700 dark:text-amber-300">45.79.218.79</code> (RoyaleAPI Proxy).
              </li>
              <li>
                <strong>Khi test ở máy cục bộ (localhost):</strong> Bạn có thể tạo file{' '}
                <code className="font-mono font-bold">.env.local</code> ở thư mục gốc và dán{' '}
                <code className="font-mono font-bold">COC_API_TOKEN=chuỗi_token_của_bạn</code>.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
