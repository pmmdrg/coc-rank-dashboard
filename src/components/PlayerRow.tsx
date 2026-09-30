import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { Player, RatingCategory } from '../types'
import { ratingLabels } from '../lib/ranking'
import { validatePlayer } from '../lib/validation'

interface PlayerRowProps {
  player: Player
  maxAttacks: number
  maxDefenses: number
  isMyPlayer: boolean
  canPassMe: boolean
  isPromotionZone?: boolean
  isDemotionZone?: boolean
  isHighlighted?: boolean
  rankJump?: { fromRank: number; toRank: number } | null
  setRowRef: (element: HTMLTableRowElement | null) => void
}

const ratingTagColors: Record<RatingCategory, string> = {
  dominant: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  superior: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  potential: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  alarm: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
}

export function PlayerRow({
  player,
  maxAttacks,
  maxDefenses,
  isMyPlayer,
  canPassMe,
  isPromotionZone = false,
  isDemotionZone = false,
  isHighlighted = false,
  rankJump = null,
  setRowRef,
}: PlayerRowProps) {
  const [isTagCopied, setIsTagCopied] = useState(false)

  function handleCopyTag(e: React.MouseEvent) {
    e.stopPropagation()
    if (!player.playerTag) return
    navigator.clipboard.writeText(player.playerTag)
    setIsTagCopied(true)
    setTimeout(() => setIsTagCopied(false), 1500)
  }

  const rowClass = isMyPlayer
    ? 'row-mine'
    : 'row-neutral'

  const remainingAttacks = Math.max(0, maxAttacks - player.attacks)
  const remainingDefenses = Math.max(0, maxDefenses - player.defenses)

  const warnings = useMemo(
    () => validatePlayer(player, maxAttacks, maxDefenses),
    [player, maxAttacks, maxDefenses],
  )

  const borderClass = isMyPlayer
    ? 'border-l-4 border-l-sky-500'
    : isPromotionZone
      ? 'border-l-4 border-l-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]'
      : isDemotionZone
        ? 'border-l-4 border-l-rose-500 bg-rose-500/[0.03] dark:bg-rose-500/[0.06]'
        : 'border-l-4 border-l-transparent'

  const hasAttackedByMe = Boolean(player.attackedByMe && player.attackedByMe.length > 0)
  const hasDefendedAgainstMe = Boolean(player.defendedAgainstMe && player.defendedAgainstMe.length > 0)

  const attackSummaryText = useMemo(() => {
    if (!player.attackedByMe || player.attackedByMe.length === 0) return ''
    if (player.attackedByMe.length === 1) {
      return ` (${player.attackedByMe[0].stars}★)`
    }
    return ` (${player.attackedByMe.length})`
  }, [player.attackedByMe])

  const attackedTooltip = useMemo(() => {
    if (!player.attackedByMe || player.attackedByMe.length === 0) return ''
    return [
      `Bạn đã đánh người này (${player.attackedByMe.length} lượt):`,
      ...player.attackedByMe.map(
        (a, i) =>
          `• Trận ${i + 1}: ${a.stars}★ (${a.destructionPercentage}%)${
            a.trophies ? `, +${a.trophies} cúp` : ''
          }`,
      ),
    ].join('\n')
  }, [player.attackedByMe])

  const defenseSummaryText = useMemo(() => {
    if (!player.defendedAgainstMe || player.defendedAgainstMe.length === 0) return ''
    if (player.defendedAgainstMe.length === 1) {
      return ` (${player.defendedAgainstMe[0].stars}★)`
    }
    return ` (${player.defendedAgainstMe.length})`
  }, [player.defendedAgainstMe])

  const defendedTooltip = useMemo(() => {
    if (!player.defendedAgainstMe || player.defendedAgainstMe.length === 0) return ''
    return [
      `Người này đã đánh bạn (${player.defendedAgainstMe.length} lượt):`,
      ...player.defendedAgainstMe.map(
        (d, i) =>
          `• Trận ${i + 1}: Bị đánh ${d.stars}★ (${d.destructionPercentage}%)${
            d.trophies ? `, ${d.trophies} cúp` : ''
          }`,
      ),
    ].join('\n')
  }, [player.defendedAgainstMe])

  return (
    <tr
      ref={setRowRef}
      className={`${rowClass} ${borderClass} ${
        isHighlighted ? 'row-jump-highlight' : ''
      } transition-colors duration-200`}
    >
      {/* 1. Cột Rank */}
      <td className="w-[136px] min-w-[136px] max-w-[136px] px-2.5 py-2.5 align-middle whitespace-nowrap">
        <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
          <span
            className={`inline-flex h-9 min-w-8 shrink-0 items-center justify-center rounded-md px-2 text-xs font-bold shadow-xs backdrop-blur transition-all ${
              isPromotionZone
                ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-500/60 dark:bg-emerald-950/70 dark:text-emerald-300'
                : isDemotionZone
                  ? 'bg-rose-500/20 text-rose-800 border border-rose-500/60 dark:bg-rose-950/70 dark:text-rose-300'
                  : 'bg-white/70 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200'
            }`}
            title={
              isPromotionZone
                ? 'Vị trí Thăng hạng (Top đầu)'
                : isDemotionZone
                  ? 'Vị trí Xuống hạng (Top cuối)'
                  : `Hạng #${player.rank}`
            }
          >
            #{player.rank}
          </span>

          {/* Badge báo vị trí vừa nhảy hạng */}
          {rankJump && rankJump.fromRank !== rankJump.toRank ? (
            <span
              className={`animate-badge-jump inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tight shadow-xs select-none ${
                rankJump.fromRank > rankJump.toRank
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                  : 'bg-rose-600 text-white dark:bg-rose-500'
              }`}
              title={
                rankJump.fromRank > rankJump.toRank
                  ? `Vừa tăng ${rankJump.fromRank - rankJump.toRank} bậc (từ #${rankJump.fromRank} lên #${rankJump.toRank})`
                  : `Vừa giảm ${rankJump.toRank - rankJump.fromRank} bậc (từ #${rankJump.fromRank} xuống #${rankJump.toRank})`
              }
            >
              #{rankJump.fromRank} → #{rankJump.toRank}
            </span>
          ) : player.rankDiff !== undefined && player.rankDiff !== 0 ? (
            <span
              className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tight shadow-2xs select-none ${
                player.rankDiff > 0
                  ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-300 border border-rose-500/30'
              }`}
              title={
                player.rankDiff > 0
                  ? `Tăng ${player.rankDiff} bậc (từ #${player.prevRank} lên #${player.rank})`
                  : `Hạ ${Math.abs(player.rankDiff)} bậc (từ #${player.prevRank} xuống #${player.rank})`
              }
            >
              <span>{player.rankDiff > 0 ? `+${player.rankDiff}` : player.rankDiff}</span>
            </span>
          ) : isPromotionZone ? (
            <span
              className="animate-fade-in inline-flex shrink-0 items-center rounded-xs bg-emerald-500/20 px-1 py-0.5 text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-tighter select-none border border-emerald-500/30"
              title="Vị trí thăng hạng"
            >
              Thăng
            </span>
          ) : isDemotionZone ? (
            <span
              className="animate-fade-in inline-flex shrink-0 items-center rounded-xs bg-rose-500/20 px-1 py-0.5 text-[9px] font-black text-rose-700 dark:text-rose-300 uppercase tracking-tighter select-none border border-rose-500/30"
              title="Vị trí xuống hạng"
            >
              Xuống
            </span>
          ) : null}
        </div>
      </td>

      {/* 2. Tên người chơi */}
      <td className="w-56 min-w-[170px] max-w-[240px] px-2 py-2 align-middle">
        <div className="relative flex items-center justify-between">
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate cursor-default"
                title={player.name}
              >
                {player.name}
              </span>
              {isMyPlayer && (
                <span className="shrink-0 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-sky-400/10 dark:text-sky-400">
                  Tôi
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span
                className="truncate cursor-default font-normal"
                title={`Clan: ${player.clanName || 'Không clan'}`}
              >
                {player.clanName || 'Không clan'}
              </span>
              {player.playerTag && (
                <>
                  <span className="text-slate-300 dark:text-slate-600 select-none shrink-0">•</span>
                  <button
                    type="button"
                    onClick={handleCopyTag}
                    className="inline-flex items-center shrink-0 font-mono text-[10px] text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 cursor-pointer select-none transition-colors"
                    title="Nhấp để sao chép Player Tag"
                  >
                    {isTagCopied ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-sans font-bold">Đã chép!</span>
                    ) : (
                      player.playerTag
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Badges đối đầu từ Battle Log */}
            {(hasAttackedByMe || hasDefendedAgainstMe) && (
              <div className="mt-1 flex flex-wrap items-center gap-1 select-none">
                {hasAttackedByMe && (
                  <span
                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap"
                    title={attackedTooltip}
                  >
                    Đã đánh{attackSummaryText}
                  </span>
                )}
                {hasDefendedAgainstMe && (
                  <span
                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap"
                    title={defendedTooltip}
                  >
                    Đã đánh tôi{defenseSummaryText}
                  </span>
                )}
              </div>
            )}
          </div>
          {warnings.length > 0 && (
            <span
              className="shrink-0 flex items-center text-amber-500 hover:text-amber-600 dark:text-amber-400 cursor-default"
              title={`Cảnh báo dữ liệu (${warnings.length}):\n${warnings.map((w) => '• ' + w.message).join('\n')}`}
            >
              <AlertTriangle className="h-4 w-4 drop-shadow-xs" />
            </span>
          )}
        </div>
      </td>

      {/* 3. Số lượt đánh (Đã công = thắng + thua) */}
      <td className="px-2 py-2 align-middle">
        <div className="flex h-9 items-center gap-2">
          <div className="flex flex-col items-center justify-center min-w-[32px] rounded-md bg-slate-100/90 px-1.5 py-0.5 dark:bg-slate-800/90">
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
              {player.attacks}
            </span>
            {player.attackWinCount !== undefined && (
              <span
                className="mt-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 leading-none"
                title={`Thắng: ${player.attackWinCount} • Thua: ${player.attackLoseCount ?? 0}`}
              >
                {player.attackWinCount}W{player.attackLoseCount ? `-${player.attackLoseCount}L` : ''}
              </span>
            )}
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="select-none text-xs font-bold text-slate-500 dark:text-slate-400">
              /{maxAttacks}
            </span>
            <span
              className={`mt-1 select-none text-[10px] font-medium whitespace-nowrap ${
                remainingAttacks === 0
                  ? 'font-bold text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {remainingAttacks === 0 ? 'Hết' : `còn ${remainingAttacks}`}
            </span>
          </div>
        </div>
      </td>

      {/* 4. Số lượt thủ (Đã thủ = thắng + thua) */}
      <td className="px-2 py-2 align-middle">
        <div className="flex h-9 items-center gap-2">
          <div className="flex flex-col items-center justify-center min-w-[32px] rounded-md bg-slate-100/90 px-1.5 py-0.5 dark:bg-slate-800/90">
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
              {player.defenses}
            </span>
            {player.defenseLoseCount !== undefined && (
              <span
                className="mt-0.5 text-[9px] font-semibold text-slate-500 dark:text-slate-400 leading-none"
                title={`Thủ thành công: ${player.defenseWinCount ?? 0} • Bị phá: ${player.defenseLoseCount}`}
              >
                {player.defenseWinCount ? `${player.defenseWinCount}W-` : ''}{player.defenseLoseCount}L
              </span>
            )}
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="select-none text-xs font-bold text-slate-500 dark:text-slate-400">
              /{maxDefenses}
            </span>
            <span
              className={`mt-1 select-none text-[10px] font-medium whitespace-nowrap ${
                remainingDefenses === 0
                  ? 'font-bold text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {remainingDefenses === 0 ? 'Hết' : `còn ${remainingDefenses}`}
            </span>
          </div>
        </div>
      </td>

      {/* 5. Số cup hiện tại */}
      <td className="w-24 min-w-[88px] px-2 py-2 align-middle">
        <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
          {player.currentCups.toLocaleString('vi-VN')}
        </span>
      </td>

      {/* 6. Số cup tối đa có thể đạt (Giả định mỗi trận còn lại được +40 cúp) */}
      <td className="w-36 min-w-[120px] px-2 py-2 align-middle">
        <div
          className="flex items-center gap-1.5 font-mono text-sm font-bold cursor-default"
          title={`Công thức: ${player.currentCups} cúp hiện tại + (${remainingAttacks}) lượt công × 40 + (${remainingDefenses}) lượt thủ × 40 = ${player.maxPossibleCups.toLocaleString('vi-VN')} cúp (Giả định các trận còn lại đều hoàn thành tối đa)`}
        >
          <span
            className={
              isMyPlayer
                ? 'text-sky-600 dark:text-sky-400 font-extrabold'
                : canPassMe
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-600 dark:text-slate-300'
            }
          >
            {player.maxPossibleCups.toLocaleString('vi-VN')}
          </span>

          {canPassMe && (
            <span
              tabIndex={0}
              role="button"
              aria-label="Cảnh báo có thể vượt bạn"
              className="inline-flex items-center text-amber-500 hover:text-amber-600 dark:text-amber-400 cursor-default transition-transform hover:scale-110 active:scale-95 focus:outline-hidden"
              title={`Có thể vượt: Người này có thể đạt tối đa ${player.maxPossibleCups.toLocaleString('vi-VN')} cúp, cao hơn mốc cúp tối đa của bạn!`}
            >
              <AlertTriangle className="h-4 w-4 drop-shadow-xs" />
            </span>
          )}
        </div>
      </td>

      {/* 7. Phân loại đánh giá (Theo các mốc cúp) */}
      <td className="px-2 py-2 align-middle">
        <div
          className={`flex h-9 w-full items-center justify-center rounded-md border text-xs font-bold shadow-xs select-none transition-colors ${ratingTagColors[player.rating]}`}
          title={`Đánh giá: ${ratingLabels[player.rating]} (${
            player.rating === 'dominant'
              ? '≥ 1.200 cúp'
              : player.rating === 'superior'
                ? '1.000 - 1.199 cúp'
                : player.rating === 'potential'
                  ? '800 - 999 cúp'
                  : '< 800 cúp (Báo động nguy cơ rớt hạng)'
          })${player.attacks > 0 ? ` • ~${(player.currentCups / player.attacks).toFixed(1)} cúp/lượt` : ''}`}
        >
          {ratingLabels[player.rating]}
        </div>
      </td>
    </tr>
  )
}
