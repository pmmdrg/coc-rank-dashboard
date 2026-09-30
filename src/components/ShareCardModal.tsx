import { useEffect, useRef, useState } from 'react'
import { X, DownloadSimple, Copy, Check } from '@phosphor-icons/react'
import type { Player, RankingStats, Season } from '../types'
import { formatLeagueName } from '../lib/ranking'
import { getLeagueIconUrl } from '../lib/leagueIcons'
import { useI18n } from '../i18n/LanguageContext'

interface ShareCardModalProps {
  isOpen: boolean
  onClose: () => void
  season: Season
  stats: RankingStats
}

export function ShareCardModal({ isOpen, onClose, season, stats }: ShareCardModalProps) {
  const { dict, interpolate, language } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const myPlayer: Player | undefined = stats.myPlayer
  const displayLeague = formatLeagueName(season.league)

  useEffect(() => {
    if (!isOpen) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Độ phân giải cao cho card: 1200 x 675 (tỉ lệ 16:9 chuẩn chia sẻ mạng xã hội)
    const width = 1200
    const height = 675
    canvas.width = width
    canvas.height = height

    // 1. Nền Gradient cao cấp
    const bgGradient = ctx.createLinearGradient(0, 0, width, height)
    bgGradient.addColorStop(0, '#090d16')
    bgGradient.addColorStop(0.5, '#0f172a')
    bgGradient.addColorStop(1, '#080c14')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // Ánh sáng tỏa huyền ảo (Glow Orbs)
    const glow1 = ctx.createRadialGradient(200, 150, 20, 200, 150, 450)
    glow1.addColorStop(0, 'rgba(14, 165, 233, 0.22)')
    glow1.addColorStop(1, 'rgba(14, 165, 233, 0)')
    ctx.fillStyle = glow1
    ctx.fillRect(0, 0, width, height)

    const glow2 = ctx.createRadialGradient(1000, 500, 30, 1000, 500, 500)
    glow2.addColorStop(0, 'rgba(245, 158, 11, 0.16)')
    glow2.addColorStop(1, 'rgba(245, 158, 11, 0)')
    ctx.fillStyle = glow2
    ctx.fillRect(0, 0, width, height)

    // Viền khung ngoài sang trọng
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, width - 40, height - 40)

    ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(24, 24, width - 48, height - 48)

    // 2. Header: Logo & Tên giải đấu
    ctx.fillStyle = '#94a3b8'
    ctx.font = '600 16px Roboto, sans-serif'
    ctx.fillText(dict.shareModal.cardHeader, 60, 75)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 28px Roboto, sans-serif'
    ctx.fillText(displayLeague !== '--' ? displayLeague : dict.shareModal.cardDefaultLeague, 60, 115)

    if (season.seasonName) {
      ctx.fillStyle = '#64748b'
      ctx.font = '400 16px Roboto, sans-serif'
      ctx.fillText(season.seasonName, 60, 142)
    }

    // 3. Thông tin người chơi (Profile Card)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1.5
    roundRect(ctx, 60, 175, 1080, 130, 16, true, true)

    // Tên người chơi
    const playerName = myPlayer?.name || dict.shareModal.cardYourAccount
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 38px Roboto, sans-serif'
    ctx.fillText(playerName, 90, 235)

    // Tag & Clan
    const playerTagText = myPlayer?.playerTag || season.myPlayerId || ''
    const clanText = myPlayer?.clanName ? `Clan: ${myPlayer.clanName}` : dict.shareModal.cardNoClan
    ctx.fillStyle = '#38bdf8'
    ctx.font = '700 18px "Roboto Mono", monospace'
    ctx.fillText(playerTagText, 90, 275)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '500 18px Roboto, sans-serif'
    ctx.fillText(`•   ${clanText}`, 90 + ctx.measureText(playerTagText).width + 20, 275)

    // Huy hiệu Rating góc phải
    if (myPlayer) {
      const ratingColors: Record<string, { bg: string; text: string; label: string }> = {
        dominant: { bg: 'rgba(168, 85, 247, 0.25)', text: '#c084fc', label: dict.shareModal.cardRatingDominant },
        superior: { bg: 'rgba(16, 185, 129, 0.25)', text: '#34d399', label: dict.shareModal.cardRatingSuperior },
        potential: { bg: 'rgba(14, 165, 233, 0.25)', text: '#38bdf8', label: dict.shareModal.cardRatingPotential },
        alarm: { bg: 'rgba(244, 63, 94, 0.25)', text: '#fb7185', label: dict.shareModal.cardRatingAlarm },
      }
      const rInfo = ratingColors[myPlayer.rating] || ratingColors.potential
      ctx.fillStyle = rInfo.bg
      ctx.strokeStyle = rInfo.text
      ctx.lineWidth = 1
      roundRect(ctx, 940, 210, 160, 42, 21, true, true)

      ctx.fillStyle = rInfo.text
      ctx.font = '800 15px Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(rInfo.label, 1020, 237)
      ctx.textAlign = 'left'
    }

    // 4. Bốn khối thống kê cốt lõi (Metrics Grid)
    const cardWidth = 252
    const cardHeight = 150
    const startX = 60
    const startY = 335
    const gap = 24

    const localeCode = language === 'vi' ? 'vi-VN' : 'en-US'
    const statItems = [
      {
        label: dict.shareModal.cardRank,
        value: myPlayer ? `#${myPlayer.rank}` : '--',
        sub: interpolate(dict.shareModal.cardRankSub, { total: season.players.length }),
        color: '#38bdf8',
      },
      {
        label: dict.shareModal.cardCurrentCups,
        value: myPlayer ? new Intl.NumberFormat(localeCode).format(myPlayer.currentCups) : '--',
        sub: dict.shareModal.cardCurrentCupsSub,
        color: '#fbbf24',
      },
      {
        label: dict.shareModal.cardPerformanceTitle,
        value: myPlayer
          ? `${myPlayer.attacks} ${language === 'vi' ? 'công' : 'atk'} • ${myPlayer.defenses} ${language === 'vi' ? 'thủ' : 'def'}`
          : '--',
        sub: myPlayer?.attackWinCount !== undefined
          ? interpolate(dict.shareModal.cardPerformanceSub, {
              wins: myPlayer.attackWinCount,
              percent: Math.round(((myPlayer.attackWinCount || 0) / Math.max(1, myPlayer.attacks)) * 100),
            })
          : dict.shareModal.cardPerformanceSubDefault,
        color: '#34d399',
      },
      {
        label: dict.shareModal.cardCeilingTitle,
        value: myPlayer ? new Intl.NumberFormat(localeCode).format(myPlayer.maxPossibleCups) : '--',
        sub: stats.playersWhoCanPassMe === 0
          ? dict.shareModal.cardCeilingGuaranteed
          : interpolate(dict.shareModal.cardCeilingThreats, { count: stats.playersWhoCanPassMe }),
        color: '#818cf8',
      },
    ]

    statItems.forEach((item, idx) => {
      const x = startX + idx * (cardWidth + gap)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.lineWidth = 1
      roundRect(ctx, x, startY, cardWidth, cardHeight, 14, true, true)

      ctx.fillStyle = '#94a3b8'
      ctx.font = '700 12px Roboto, sans-serif'
      ctx.fillText(item.label, x + 20, startY + 32)

      ctx.fillStyle = item.color
      ctx.font = '800 28px Roboto, sans-serif'
      ctx.fillText(item.value, x + 20, startY + 80)

      ctx.fillStyle = '#64748b'
      ctx.font = '400 13px Roboto, sans-serif'
      ctx.fillText(item.sub, x + 20, startY + 118)
    })

    // 5. Thanh so sánh năng lực & Footer watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
    roundRect(ctx, 60, 515, 1080, 54, 12, true, false)

    const otherCount = season.players.filter((p) => p.id !== myPlayer?.id).length
    const betterCount = myPlayer && otherCount > 0
      ? season.players.filter((p) => p.id !== myPlayer.id && (myPlayer.currentCups > p.currentCups)).length
      : 0
    const betterPercent = otherCount > 0 ? ((betterCount / otherCount) * 100).toFixed(1) : '100'

    ctx.fillStyle = '#38bdf8'
    ctx.font = '700 15px Roboto, sans-serif'
    ctx.fillText(
      interpolate(dict.shareModal.cardComparisonBanner, {
        percent: betterPercent,
        better: betterCount,
        total: otherCount,
      }),
      85,
      548
    )

    // Watermark dưới cùng
    const nowStr = new Date().toLocaleDateString(localeCode, { day: '2-digit', month: '2-digit', year: 'numeric' })
    ctx.fillStyle = '#475569'
    ctx.font = '500 13px Roboto, sans-serif'
    ctx.fillText(interpolate(dict.shareModal.cardWatermark, { date: nowStr }), 60, 615)

    ctx.textAlign = 'right'
    ctx.fillText('coc-rank-dashboard • github.com/pmmdrg', 1140, 615)
    ctx.textAlign = 'left'

    // Vẽ League Icon nếu có
    const iconUrl = season.leagueIconUrl || getLeagueIconUrl(season.league)
    if (iconUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = iconUrl
      img.onload = () => {
        try {
          ctx.drawImage(img, 1040, 60, 80, 80)
          setPreviewUrl(canvas.toDataURL('image/png'))
        } catch {
          setPreviewUrl(canvas.toDataURL('image/png'))
        }
      }
      img.onerror = () => {
        setPreviewUrl(canvas.toDataURL('image/png'))
      }
    } else {
      setPreviewUrl(canvas.toDataURL('image/png'))
    }
  }, [isOpen, season, stats, myPlayer, displayLeague, dict, interpolate, language])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    const fileName = `coc_rank_${(myPlayer?.name || 'player').replace(/\s+/g, '_')}.png`
    link.download = fileName
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function handleCopyImage() {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      }, 'image/png')
    } catch {
      handleDownload()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">{dict.shareModal.modalTitle}</h3>
            <p className="text-xs text-slate-400">{dict.shareModal.modalSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="apple-btn rounded-xl p-2 text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 transition-colors cursor-pointer"
            title={dict.shareModal.closeBtn}
          >
            <X weight="bold" className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Canvas Preview */}
        <div className="overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-950/50">
          <canvas ref={canvasRef} className="hidden" />
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={dict.shareModal.modalTitle}
              className="w-full max-h-[60vh] object-contain rounded-xl border border-slate-800/80 shadow-2xl"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">
              {dict.shareModal.modalGenerating}
            </div>
          )}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 px-6 py-4 bg-slate-900/90 backdrop-blur-md">
          <span className="text-xs text-slate-400">
            {dict.shareModal.modalDimensions}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyImage}
              className="apple-btn inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/90 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white shadow-sm cursor-pointer"
              title={dict.shareModal.copyBtn}
            >
              {isCopied ? (
                <>
                  <Check weight="bold" className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-300">{dict.shareModal.copiedToast}</span>
                </>
              ) : (
                <>
                  <Copy weight="duotone" className="h-4 w-4" />
                  <span>{dict.shareModal.copyBtn}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="apple-btn inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-sky-600/30 hover:from-sky-400 hover:to-blue-500 cursor-pointer"
              title={dict.shareModal.downloadBtn}
            >
              <DownloadSimple weight="bold" className="h-4 w-4" />
              <span>{dict.shareModal.downloadBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: boolean,
  stroke: boolean,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  if (fill) ctx.fill()
  if (stroke) ctx.stroke()
}
