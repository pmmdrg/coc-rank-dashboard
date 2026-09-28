import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Layers,
  Loader2,
  Play,
  X,
  Zap,
} from 'lucide-react'

interface ApiTesterModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTag?: string
}

type EndpointCategory =
  | 'leaguegroup'
  | 'league_seasons'
  | 'season_rankings'

export function ApiTesterModal({ isOpen, onClose, defaultTag = '' }: ApiTesterModalProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointCategory>('leaguegroup')

  // Parameter states
  const [groupTag, setGroupTag] = useState('#8JC9LJU')
  const [groupSeasonId, setGroupSeasonId] = useState('1789966800')
  const [groupPlayerTag, setGroupPlayerTag] = useState(defaultTag)

  const [leagueId, setLeagueId] = useState('29000022')
  const [seasonsLimit, setSeasonsLimit] = useState('10')

  const [rankingsLeagueId, setRankingsLeagueId] = useState('29000022')
  const [rankingSeasonId, setRankingSeasonId] = useState('v2-2026-08-31T05:00:00Z')
  const [rankingsLimit, setRankingsLimit] = useState('100')

  // Request & Result states
  const [loading, setLoading] = useState(false)
  const [resultData, setResultData] = useState<Record<string, unknown> | unknown[] | null>(null)
  const [error, setError] = useState<{ message: string; details?: unknown; targetUrl?: string } | null>(null)
  const [showRawJson, setShowRawJson] = useState(true)
  const [showFieldDocs, setShowFieldDocs] = useState(true)
  const [copiedJson, setCopiedJson] = useState(false)

  if (!isOpen) return null

  // Xây dựng đường dẫn endpoint tương ứng
  const buildCurrentPath = (): string => {
    switch (selectedEndpoint) {
      case 'leaguegroup': {
        const cleanGroup = groupTag.trim().toUpperCase()
        const tagGroup = cleanGroup.startsWith('#') ? cleanGroup : `#${cleanGroup}`
        const season = groupSeasonId.trim()
        const cleanPlayer = groupPlayerTag.trim().toUpperCase()
        const tagPlayer = cleanPlayer.startsWith('#') ? cleanPlayer : `#${cleanPlayer}`
        return `/leaguegroup/${encodeURIComponent(tagGroup)}/${encodeURIComponent(season)}?playerTag=${encodeURIComponent(tagPlayer)}`
      }
      case 'league_seasons': {
        const targetLeagueId = leagueId.trim() || '29000022'
        const limitParam = seasonsLimit.trim() ? `?limit=${encodeURIComponent(seasonsLimit.trim())}` : ''
        return `/leagues/${encodeURIComponent(targetLeagueId)}/seasons${limitParam}`
      }
      case 'season_rankings': {
        const targetLeagueId = rankingsLeagueId.trim() || '29000022'
        const targetSeasonId = rankingSeasonId.trim() || 'v2-2026-08-31T05:00:00Z'
        const limitParam = rankingsLimit.trim() ? `?limit=${encodeURIComponent(rankingsLimit.trim())}` : ''
        return `/leagues/${encodeURIComponent(targetLeagueId)}/seasons/${encodeURIComponent(targetSeasonId)}${limitParam}`
      }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Thử Nghiệm API Clash of Clans (Supercell)
                </h2>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                  3 Endpoints cốt lõi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thử nghiệm trực tiếp & xem phân tích ý nghĩa các trường dữ liệu trả về
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 3 Endpoint Tabs matching User's request */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chọn Endpoint (Theo tài liệu Supercell)
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {/* Tab 1: /leaguegroup/{leagueGroupTag}/{leagueSeasonId} */}
              <button
                type="button"
                onClick={() => {
                  setSelectedEndpoint('leaguegroup')
                  setResultData(null)
                  setError(null)
                }}
                className={`relative rounded-xl border p-3 text-left transition cursor-pointer ${
                  selectedEndpoint === 'leaguegroup'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-200 shadow-xs ring-1 ring-blue-500/50'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white uppercase">
                    GET
                  </span>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                    Bảng đấu Ranked
                  </span>
                </div>
                <div className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 break-all leading-tight">
                  /leaguegroup/{'{leagueGroupTag}'}/{'{leagueSeasonId}'}
                </div>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  Get ranked battle league group information for season and player
                </p>
              </button>

              {/* Tab 2: /leagues/{leagueId}/seasons */}
              <button
                type="button"
                onClick={() => {
                  setSelectedEndpoint('league_seasons')
                  setResultData(null)
                  setError(null)
                }}
                className={`relative rounded-xl border p-3 text-left transition cursor-pointer ${
                  selectedEndpoint === 'league_seasons'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-200 shadow-xs ring-1 ring-blue-500/50'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white uppercase">
                    GET
                  </span>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                    Danh sách Mùa giải
                  </span>
                </div>
                <div className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 break-all leading-tight">
                  /leagues/{'{leagueId}'}/seasons
                </div>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  Get league seasons
                </p>
              </button>

              {/* Tab 3: /leagues/{leagueId}/seasons/{seasonId} */}
              <button
                type="button"
                onClick={() => {
                  setSelectedEndpoint('season_rankings')
                  setResultData(null)
                  setError(null)
                }}
                className={`relative rounded-xl border p-3 text-left transition cursor-pointer ${
                  selectedEndpoint === 'season_rankings'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-200 shadow-xs ring-1 ring-blue-500/50'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white uppercase">
                    GET
                  </span>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                    Xếp hạng Mùa giải
                  </span>
                </div>
                <div className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 break-all leading-tight">
                  /leagues/{'{leagueId}'}/seasons/{'{seasonId}'}
                </div>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  Get league season rankings
                </p>
              </button>
            </div>
          </div>

          {/* Form Parameters */}
          <form onSubmit={handleExecute} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
            {/* Form for Tab 1: leaguegroup */}
            {selectedEndpoint === 'leaguegroup' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tham số Bảng đấu Ranked
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bắt buộc kèm playerTag để Supercell xác thực quyền truy cập bảng
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      leagueGroupTag
                    </label>
                    <input
                      type="text"
                      value={groupTag}
                      onChange={(e) => setGroupTag(e.target.value.toUpperCase())}
                      placeholder="#8JC9LJU"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs uppercase text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      leagueSeasonId (Unix giây)
                    </label>
                    <input
                      type="text"
                      value={groupSeasonId}
                      onChange={(e) => setGroupSeasonId(e.target.value)}
                      placeholder="1789966800"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      playerTag (?playerTag=...)
                    </label>
                    <input
                      type="text"
                      value={groupPlayerTag}
                      onChange={(e) => setGroupPlayerTag(e.target.value.toUpperCase())}
                      placeholder="#Ví dụ: #ABC123"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs uppercase text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form for Tab 2: league_seasons */}
            {selectedEndpoint === 'league_seasons' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tham số Danh sách Mùa giải
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mặc định Legend League (ID: 29000022)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      leagueId
                    </label>
                    <input
                      type="text"
                      value={leagueId}
                      onChange={(e) => setLeagueId(e.target.value)}
                      placeholder="29000022"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Giới hạn (limit)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={seasonsLimit}
                      onChange={(e) => setSeasonsLimit(e.target.value)}
                      placeholder="10"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form for Tab 3: season_rankings */}
            {selectedEndpoint === 'season_rankings' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tham số Bảng xếp hạng Mùa giải
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Lưu ý Supercell yêu cầu limit tối thiểu 100
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      leagueId
                    </label>
                    <input
                      type="text"
                      value={rankingsLeagueId}
                      onChange={(e) => setRankingsLeagueId(e.target.value)}
                      placeholder="29000022"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      seasonId
                    </label>
                    <input
                      type="text"
                      value={rankingSeasonId}
                      onChange={(e) => setRankingSeasonId(e.target.value)}
                      placeholder="v2-2026-08-31T05:00:00Z hoặc 2020-05"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      limit (100 - 25000)
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="25000"
                      value={rankingsLimit}
                      onChange={(e) => setRankingsLimit(e.target.value)}
                      placeholder="100"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate max-w-[400px]">
                {buildCurrentPath()}
              </span>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 dark:bg-sky-600 dark:hover:bg-sky-500 cursor-pointer"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                Gửi yêu cầu GET
              </button>
            </div>
          </form>

          {/* Phân tích trường dữ liệu (Field Breakdown) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600 dark:text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Phân tích cấu trúc trường dữ liệu ({selectedEndpoint === 'leaguegroup' ? 'Bảng đấu Ranked' : selectedEndpoint === 'league_seasons' ? 'Danh sách Mùa giải' : 'Xếp hạng Mùa giải'})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFieldDocs(!showFieldDocs)}
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-sky-400 flex items-center gap-1 cursor-pointer"
              >
                {showFieldDocs ? 'Thu gọn' : 'Xem chi tiết'}
                {showFieldDocs ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {showFieldDocs && (
              <div className="space-y-3 text-xs">
                {selectedEndpoint === 'leaguegroup' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                          members[]
                        </span>
                        <span>100 thành viên trong bảng</span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <li>• <code className="font-bold text-slate-800 dark:text-slate-200">playerTag</code> / <code className="font-bold text-slate-800 dark:text-slate-200">playerName</code>: Tag (#...) và Tên người chơi.</li>
                        <li>• <code className="font-bold text-slate-800 dark:text-slate-200">clanTag</code> / <code className="font-bold text-slate-800 dark:text-slate-200">clanName</code>: Tag và tên Clan trực thuộc.</li>
                        <li>• <code className="font-bold text-slate-800 dark:text-slate-200">leagueTrophies</code>: Số cúp Ranked hiện tại trong tuần thi đấu.</li>
                        <li>• <code className="font-bold text-slate-800 dark:text-slate-200">attackWinCount</code> / <code className="font-bold text-slate-800 dark:text-slate-200">attackLoseCount</code>: Số trận đánh thắng / thua (Tổng lượt đánh = Win + Lose).</li>
                        <li>• <code className="font-bold text-slate-800 dark:text-slate-200">defenseWinCount</code> / <code className="font-bold text-slate-800 dark:text-slate-200">defenseLoseCount</code>: Số trận thủ thắng / thua (Tổng lượt thủ = Win + Lose).</li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">
                          attackLogs[] & defenseLogs[]
                        </span>
                        <span>Lịch sử trận đánh</span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <li>• <code className="font-bold text-slate-800 dark:text-slate-200">opponentPlayerTag</code> / <code className="font-bold text-slate-800 dark:text-slate-200">opponentName</code>: Thông tin đối thủ giáp mặt.</li>
                        <li>• <code className="font-bold text-slate-800 dark:text-slate-200">stars</code>: Số sao ghi được (0 - 3 sao).</li>
                        <li>• <code className="font-bold text-slate-800 dark:text-slate-200">destructionPercentage</code>: Tỉ lệ % phá huỷ công trình đạt được.</li>
                        <li>• <code className="font-bold text-slate-800 dark:text-slate-200">trophies</code>: Cúp thưởng hoặc trừ sau trận.</li>
                        <li>• <code className="font-bold text-slate-800 dark:text-slate-200">creationTime</code>: Thời điểm diễn ra trận đánh theo chuẩn UTC.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedEndpoint === 'league_seasons' && (
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                      <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-mono text-blue-600 dark:text-sky-400">
                        items[]
                      </span>
                      <span>Mã định danh các mùa giải</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                      <li>• <code className="font-bold text-slate-800 dark:text-slate-200">id</code>: Chuỗi định danh mùa giải. Các mùa gần đây có định dạng <code className="text-amber-600 dark:text-amber-400">v2-YYYY-MM-DDTHH:MM:SSZ</code> (mốc reset mùa giải lúc 05:00 UTC), các mùa cũ là <code className="text-slate-600 dark:text-slate-400">YYYY-MM</code> (ví dụ: <code className="font-mono">2020-05</code>).</li>
                      <li>• <code className="font-bold text-slate-800 dark:text-slate-200">paging.cursors.after</code>: Token con trỏ để truy vấn các mùa giải tiếp theo.</li>
                    </ul>
                  </div>
                )}

                {selectedEndpoint === 'season_rankings' && (
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                      <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-mono text-purple-600 dark:text-purple-400">
                        items[]
                      </span>
                      <span>Bảng xếp hạng Top Thế giới kết thúc mùa giải</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                      <li>• <code className="font-bold text-slate-800 dark:text-slate-200">rank</code>: Thứ hạng toàn cầu (Top 1, 2, 3...).</li>
                      <li>• <code className="font-bold text-slate-800 dark:text-slate-200">tag</code> / <code className="font-bold text-slate-800 dark:text-slate-200">name</code>: Tag và tên người chơi.</li>
                      <li>• <code className="font-bold text-slate-800 dark:text-slate-200">trophies</code>: Số cúp kết thúc mùa giải của người chơi.</li>
                      <li>• <code className="font-bold text-slate-800 dark:text-slate-200">attackWins</code> / <code className="font-bold text-slate-800 dark:text-slate-200">defenseWins</code>: Tổng số trận công thắng và thủ thành công trong cả mùa.</li>
                      <li>• <code className="font-bold text-slate-800 dark:text-slate-200">clan</code>: Thông tin Clan (<code className="font-mono">tag, name, badgeUrls.small/large</code>).</li>
                      <li>• <code className="font-bold text-slate-800 dark:text-slate-200">leagueTier</code>: Cấp độ bậc giải đấu (<code className="font-mono">id, name, iconUrls.small/large</code>).</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="space-y-3">
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
                          Chi tiết phản hồi từ máy chủ Supercell:
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
                    Kết quả trả về từ Supercell API (JSON)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className="inline-flex items-center gap-1 rounded bg-slate-200/80 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      {copiedJson ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedJson ? 'Đã sao chép' : 'Sao chép JSON'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRawJson(!showRawJson)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
          </div>
        </div>
      </div>
    </div>
  )
}
