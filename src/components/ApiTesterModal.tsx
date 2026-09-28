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
  Sparkles,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react'

interface ApiTesterModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTag?: string
}

type EndpointCategory =
  | 'player'
  | 'leaguegroup'
  | 'leaguetiers'
  | 'leagues'
  | 'league_seasons'
  | 'custom'

export function ApiTesterModal({ isOpen, onClose, defaultTag = 'G9GRJCRPQ' }: ApiTesterModalProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointCategory>('player')

  // Parameter states
  const [playerTag, setPlayerTag] = useState(defaultTag)
  const [groupTag, setGroupTag] = useState('')
  const [groupSeasonId, setGroupSeasonId] = useState('1789966800')
  const [groupPlayerTag, setGroupPlayerTag] = useState(defaultTag)
  const [leagueTierId, setLeagueTierId] = useState('')
  const [leagueId, setLeagueId] = useState('') // Để trống = tất cả, hoặc 29000022
  const [seasonId, setSeasonId] = useState('')
  const [customPath, setCustomPath] = useState('/leagues')

  // Request & Result states
  const [loading, setLoading] = useState(false)
  const [resultData, setResultData] = useState<Record<string, unknown> | unknown[] | null>(null)
  const [error, setError] = useState<{ message: string; details?: unknown; targetUrl?: string } | null>(null)
  const [showRawJson, setShowRawJson] = useState(true)
  const [copiedJson, setCopiedJson] = useState(false)

  // Lưu cache thông tin player vừa tra cứu để tự động nạp sang tab leaguegroup
  const [lastPlayerMeta, setLastPlayerMeta] = useState<{
    tag?: string
    name?: string
    currentLeagueGroupTag?: string
    currentLeagueSeasonId?: string
    previousLeagueGroupTag?: string
    previousLeagueSeasonId?: string
    leagueTier?: unknown
  } | null>(null)

  if (!isOpen) return null

  // Xây dựng đường dẫn endpoint tương ứng
  const buildCurrentPath = (): string => {
    switch (selectedEndpoint) {
      case 'player': {
        const clean = playerTag.trim().toUpperCase()
        const tag = clean.startsWith('#') ? clean : `#${clean}`
        return `/players/${encodeURIComponent(tag)}`
      }
      case 'leaguegroup': {
        const cleanGroup = groupTag.trim().toUpperCase()
        const tagGroup = cleanGroup.startsWith('#') ? cleanGroup : `#${cleanGroup}`
        const season = groupSeasonId.trim()
        const cleanPlayer = (groupPlayerTag.trim() || playerTag.trim()).toUpperCase()
        const tagPlayer = cleanPlayer.startsWith('#') ? cleanPlayer : `#${cleanPlayer}`
        return `/leaguegroup/${encodeURIComponent(tagGroup)}/${encodeURIComponent(season)}?playerTag=${encodeURIComponent(tagPlayer)}`
      }
      case 'leaguetiers':
        return leagueTierId.trim() ? `/leaguetiers/${encodeURIComponent(leagueTierId.trim())}` : '/leaguetiers'
      case 'leagues':
        return leagueId.trim() ? `/leagues/${encodeURIComponent(leagueId.trim())}` : '/leagues'
      case 'league_seasons': {
        const targetLeagueId = leagueId.trim() || '29000022'
        return seasonId.trim()
          ? `/leagues/${encodeURIComponent(targetLeagueId)}/seasons/${encodeURIComponent(seasonId.trim())}`
          : `/leagues/${encodeURIComponent(targetLeagueId)}/seasons`
      }
      case 'custom':
        return customPath.trim().startsWith('/') ? customPath.trim() : `/${customPath.trim()}`
    }
  }

  const handleExecute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const path = buildCurrentPath()
    if (!path) return

    setLoading(true)
    setError(null)
    setResultData(null)

    try {
      const res = await fetch(`/api/coc?path=${encodeURIComponent(path)}`)
      const data = await res.json()

      if (!res.ok) {
        setError({
          message: data.error || `Lỗi API (${res.status})`,
          details: data.details,
          targetUrl: data.targetUrl,
        })
      } else {
        setResultData(data)
        // Nếu vừa gọi player endpoint, trích xuất metadata để tiện dùng cho leaguegroup
        if (selectedEndpoint === 'player' && data && typeof data === 'object') {
          const p = data as Record<string, unknown>
          setLastPlayerMeta({
            tag: p.tag ? String(p.tag) : undefined,
            name: p.name ? String(p.name) : undefined,
            currentLeagueGroupTag: p.currentLeagueGroupTag ? String(p.currentLeagueGroupTag) : undefined,
            currentLeagueSeasonId: p.currentLeagueSeasonId ? String(p.currentLeagueSeasonId) : undefined,
            previousLeagueGroupTag: p.previousLeagueGroupTag ? String(p.previousLeagueGroupTag) : undefined,
            previousLeagueSeasonId: p.previousLeagueSeasonId ? String(p.previousLeagueSeasonId) : undefined,
            leagueTier: p.leagueTier,
          })
          if (p.currentLeagueGroupTag) {
            setGroupTag(String(p.currentLeagueGroupTag))
          }
          if (p.currentLeagueSeasonId) {
            setGroupSeasonId(String(p.currentLeagueSeasonId))
          }
          if (p.tag) {
            setGroupPlayerTag(String(p.tag))
          }
        }
      }
    } catch (err: unknown) {
      setError({
        message: 'Không thể kết nối đến máy chủ API.',
        details: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyJson = () => {
    if (!resultData) return
    navigator.clipboard.writeText(JSON.stringify(resultData, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  const autoFillFromLastPlayer = () => {
    if (lastPlayerMeta?.currentLeagueGroupTag) {
      setGroupTag(lastPlayerMeta.currentLeagueGroupTag)
    }
    if (lastPlayerMeta?.currentLeagueSeasonId) {
      setGroupSeasonId(lastPlayerMeta.currentLeagueSeasonId)
    }
    if (lastPlayerMeta?.tag) {
      setGroupPlayerTag(lastPlayerMeta.tag)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
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
                  cocproxy.royaleapi.dev
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kiểm tra các endpoint chính thức của Supercell Developer Portal
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

        {/* Endpoint Selector Tabs */}
        <div className="mt-5 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Chọn Endpoint muốn kiểm thử
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setSelectedEndpoint('player')}
              className={`rounded-xl border p-2.5 text-left text-xs font-medium transition ${
                selectedEndpoint === 'player'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-900 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-200 shadow-2xs font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] opacity-80">
                <Users className="h-3.5 w-3.5" />
                <span>Hồ sơ người chơi</span>
              </div>
              <div className="mt-1 font-mono text-[11px] truncate">/players/{'{tag}'}</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEndpoint('leaguegroup')}
              className={`relative rounded-xl border p-2.5 text-left text-xs font-medium transition ${
                selectedEndpoint === 'leaguegroup'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-900 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-200 shadow-2xs font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="absolute -top-1.5 -right-1 rounded-full bg-rose-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                Mới
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Bảng đấu Ranked</span>
              </div>
              <div className="mt-1 font-mono text-[11px] truncate">/leaguegroup/{'{tag}'}/{'{season}'}</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEndpoint('leaguetiers')}
              className={`rounded-xl border p-2.5 text-left text-xs font-medium transition ${
                selectedEndpoint === 'leaguetiers'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-900 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-200 shadow-2xs font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] opacity-80">
                <Trophy className="h-3.5 w-3.5" />
                <span>Danh sách phân hạng</span>
              </div>
              <div className="mt-1 font-mono text-[11px] truncate">/leaguetiers</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEndpoint('leagues')}
              className={`rounded-xl border p-2.5 text-left text-xs font-medium transition ${
                selectedEndpoint === 'leagues'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-900 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-200 shadow-2xs font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] opacity-80">
                <Trophy className="h-3.5 w-3.5" />
                <span>Tất cả giải đấu</span>
              </div>
              <div className="mt-1 font-mono text-[11px] truncate">/leagues</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEndpoint('league_seasons')}
              className={`rounded-xl border p-2.5 text-left text-xs font-medium transition ${
                selectedEndpoint === 'league_seasons'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-900 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-200 shadow-2xs font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] opacity-80">
                <Trophy className="h-3.5 w-3.5" />
                <span>Mùa giải Legend</span>
              </div>
              <div className="mt-1 font-mono text-[11px] truncate">/leagues/29000022/seasons</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEndpoint('custom')}
              className={`rounded-xl border p-2.5 text-left text-xs font-medium transition ${
                selectedEndpoint === 'custom'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-900 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-200 shadow-2xs font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] opacity-80">
                <Search className="h-3.5 w-3.5" />
                <span>Tùy chỉnh Endpoint</span>
              </div>
              <div className="mt-1 font-mono text-[11px] truncate">/path/tuy/y</div>
            </button>
          </div>
        </div>

        {/* Input Parameters Form */}
        <form onSubmit={handleExecute} className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850 space-y-3">
          {/* 1. Player Tag Form */}
          {selectedEndpoint === 'player' && (
            <div>
              <label htmlFor="input-player-tag" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Player Tag trong game
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-mono font-bold text-sm">#</span>
                  <input
                    id="input-player-tag"
                    type="text"
                    value={playerTag.startsWith('#') ? playerTag.slice(1) : playerTag}
                    onChange={(e) => setPlayerTag(e.target.value.toUpperCase())}
                    placeholder="G9GRJCRPQ"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 font-mono text-sm uppercase text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !playerTag.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-amber-500 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Tra cứu
                </button>
              </div>
            </div>
          )}

          {/* 2. League Group Form */}
          {selectedEndpoint === 'leaguegroup' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Thông tin Bảng đấu Ranked / Legend
                </span>
                {lastPlayerMeta?.currentLeagueGroupTag && (
                  <button
                    type="button"
                    onClick={autoFillFromLastPlayer}
                    className="text-[11px] font-semibold text-amber-600 underline hover:text-amber-700 dark:text-amber-400"
                  >
                    Dùng Group Tag của {lastPlayerMeta.name || lastPlayerMeta.tag}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">League Group Tag ({'{leagueGroupTag}'})</span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-mono font-bold text-sm">#</span>
                    <input
                      type="text"
                      value={groupTag.startsWith('#') ? groupTag.slice(1) : groupTag}
                      onChange={(e) => setGroupTag(e.target.value.toUpperCase())}
                      placeholder="8JC9LJU"
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 font-mono text-sm uppercase text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">Mùa giải ({'{leagueSeasonId}'})</span>
                  <input
                    type="text"
                    value={groupSeasonId}
                    onChange={(e) => setGroupSeasonId(e.target.value)}
                    placeholder="1789966800"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 font-mono text-sm text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">Player Tag (?playerTag=...)</span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-mono font-bold text-sm">#</span>
                    <input
                      type="text"
                      value={groupPlayerTag.startsWith('#') ? groupPlayerTag.slice(1) : groupPlayerTag}
                      onChange={(e) => setGroupPlayerTag(e.target.value.toUpperCase())}
                      placeholder="G9GRJCRPQ"
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 font-mono text-sm uppercase text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !groupTag.trim() || !groupSeasonId.trim() || !groupPlayerTag.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white shadow-xs hover:bg-amber-500 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Lấy dữ liệu Bảng đấu Ranked (100 người & Battle Logs)
              </button>
            </div>
          )}

          {/* 3. League Tiers Form */}
          {selectedEndpoint === 'leaguetiers' && (
            <div className="space-y-3">
              <div>
                <span className="block text-[11px] text-slate-500 mb-1">
                  League Tier ID (để trống để lấy danh sách tất cả các tiers, hoặc nhập Tier ID)
                </span>
                <input
                  type="text"
                  value={leagueTierId}
                  onChange={(e) => setLeagueTierId(e.target.value)}
                  placeholder="Để trống = tất cả Tiers, hoặc nhập ID ví dụ: 29000000"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 font-mono text-sm text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-amber-500 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {leagueTierId.trim() ? `Lấy chi tiết Tier #${leagueTierId.trim()}` : 'Tải danh sách tất cả Tiers'}
              </button>
            </div>
          )}

          {/* 4. Leagues List Form */}
          {selectedEndpoint === 'leagues' && (
            <div className="space-y-3">
              <div>
                <span className="block text-[11px] text-slate-500 mb-1">
                  League ID (để trống để lấy danh sách tất cả các giải đấu, hoặc nhập League ID)
                </span>
                <input
                  type="text"
                  value={leagueId}
                  onChange={(e) => setLeagueId(e.target.value)}
                  placeholder="Để trống = tất cả Leagues, hoặc nhập ID giải đấu (vd: 29000022)"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 font-mono text-sm text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-amber-500 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {leagueId.trim() ? `Lấy chi tiết League #${leagueId.trim()}` : 'Tải danh sách tất cả Leagues'}
              </button>
            </div>
          )}

          {/* 5. League Seasons Form */}
          {selectedEndpoint === 'league_seasons' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">League ID (29000022: Legend League)</span>
                  <input
                    type="text"
                    value={leagueId}
                    onChange={(e) => setLeagueId(e.target.value)}
                    placeholder="29000022"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 font-mono text-sm text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">Season ID (để trống = danh sách mùa, hoặc nhập season)</span>
                  <input
                    type="text"
                    value={seasonId}
                    onChange={(e) => setSeasonId(e.target.value)}
                    placeholder="Để trống = DS các mùa, hoặc vd: 2024-05"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 font-mono text-sm text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white shadow-xs hover:bg-amber-500 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {seasonId.trim() ? `Xem bảng xếp hạng mùa ${seasonId.trim()}` : 'Lấy danh sách các mùa giải'}
              </button>
            </div>
          )}

          {/* 6. Custom Path Form */}
          {selectedEndpoint === 'custom' && (
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Đường dẫn Endpoint tùy ý (sau /v1)
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="/locations/32000261/rankings/players"
                  className="flex-1 rounded-lg border border-slate-300 bg-white py-2 px-3 font-mono text-sm text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={loading || !customPath.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-amber-500 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Gửi yêu cầu
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Results Area */}
        <div className="mt-5 space-y-4">
          {/* Metadata Card nếu vừa lấy được player profile */}
          {selectedEndpoint === 'player' && lastPlayerMeta && (
            <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 p-3.5 text-xs dark:border-sky-900/50 dark:bg-sky-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-900 dark:text-sky-200">
                  Thông tin League Group phát hiện trong Profile của {lastPlayerMeta.name}:
                </span>
                {lastPlayerMeta.currentLeagueGroupTag && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEndpoint('leaguegroup')
                      autoFillFromLastPlayer()
                    }}
                    className="inline-flex items-center gap-1 rounded bg-sky-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-sky-500"
                  >
                    Xem bảng đấu này ➔
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                <div>currentLeagueGroupTag: <strong>{lastPlayerMeta.currentLeagueGroupTag || '(trống)'}</strong></div>
                <div>currentLeagueSeasonId: <strong>{lastPlayerMeta.currentLeagueSeasonId || '(trống)'}</strong></div>
                <div>previousLeagueGroupTag: <strong>{lastPlayerMeta.previousLeagueGroupTag || '(trống)'}</strong></div>
                <div>previousLeagueSeasonId: <strong>{lastPlayerMeta.previousLeagueSeasonId || '(trống)'}</strong></div>
              </div>
            </div>
          )}

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
                  {error.targetUrl && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      URL: {error.targetUrl}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Raw JSON View */}
          {resultData && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Kết quả trả về từ Supercell (JSON)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="inline-flex items-center gap-1 rounded bg-slate-200/80 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    {copiedJson ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedJson ? 'Đã sao chép' : 'Sao chép JSON'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showRawJson ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {showRawJson && (
                <pre className="max-h-96 overflow-y-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-emerald-400 leading-relaxed shadow-inner">
                  {JSON.stringify(resultData, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Footnote */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info className="h-3.5 w-3.5 text-amber-500" />
            <span>Đã loại trừ các endpoint về Builder Base và Capital theo yêu cầu của bạn.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
