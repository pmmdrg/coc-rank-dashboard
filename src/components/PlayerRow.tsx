import { useMemo, useState } from 'react'
import { Warning, Check, Copy } from '@phosphor-icons/react'
import type { Player } from '../types'
import { validatePlayer } from '../lib/validation'
import { useI18n } from '../i18n/LanguageContext'
import { RankBadge, RankDiffBadge } from './RankBadge'
import { RatingChip } from './RatingChip'

interface PlayerRowProps {
  player: Player
  maxAttacks: number
  maxDefenses: number
  isMyPlayer: boolean
  canPassMe: boolean
  isPromotionZone?: boolean
  isDemotionZone?: boolean
  isHighlighted?: boolean
  setRowRef: (element: HTMLTableRowElement | null) => void
  onOpenBattleLog?: (player: Player) => void
  className?: string
  style?: React.CSSProperties
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
  setRowRef,
  onOpenBattleLog,
  className = '',
  style,
}: PlayerRowProps) {
  const { dict, interpolate, language } = useI18n()
  const [isTagCopied, setIsTagCopied] = useState(false)



  function handleCopyTag(e: React.MouseEvent) {
    e.stopPropagation()
    if (!player.playerTag) return
    navigator.clipboard.writeText(player.playerTag)
    setIsTagCopied(true)
    setTimeout(() => setIsTagCopied(false), 1500)
  }

  const remainingAttacks = Math.max(0, maxAttacks - player.attacks)
  const remainingDefenses = Math.max(0, maxDefenses - player.defenses)

  const warnings = useMemo(
    () => validatePlayer(player, maxAttacks, maxDefenses),
    [player, maxAttacks, maxDefenses],
  )

  const borderClass = isMyPlayer
    ? 'border-l-[4px] border-l-red-600 bg-red-950/20 hover:bg-red-950/30'
    : isPromotionZone
      ? 'border-l-[4px] border-l-amber-500 bg-amber-950/10 hover:bg-zinc-900/60'
      : isDemotionZone
        ? 'border-l-[4px] border-l-red-600 bg-red-950/10 hover:bg-zinc-900/60'
        : 'border-l-[4px] border-l-transparent hover:bg-zinc-900/40'

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
    return player.attackedByMe
      .map((log) => `${log.stars}★, ${log.destructionPercentage}%`)
      .join('\n')
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
    return player.defendedAgainstMe
      .map((log) => `${log.stars}★, ${log.destructionPercentage}%`)
      .join('\n')
  }, [player.defendedAgainstMe])

  const rankDiff = player.rankDiff ?? 0

  const formatNumber = (val: number) =>
    val.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')

  return (
    <tr
      ref={setRowRef}
      style={style}
      className={`group transition-colors duration-150 ${className} ${borderClass} ${
        isHighlighted
          ? 'bg-amber-500/20 ring-2 ring-amber-500/50 dark:bg-amber-400/20 dark:ring-amber-400/50'
          : ''
      }`}
    >
      {/* 1. Cột Thứ Hạng (Rank) */}
      <td className="w-[136px] min-w-[136px] max-w-[136px] px-2.5 py-2.5 align-middle">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {/* Badge Thứ Hạng: Podium Top 1-2-3 hoặc Normal */}
          <RankBadge
            rank={player.rank}
            title={
              player.rank === 1
                ? dict.table.podiumGold
                : player.rank === 2
                  ? dict.table.podiumSilver
                  : player.rank === 3
                    ? dict.table.podiumBronze
                    : `#${player.rank}`
            }
          />

          {/* Biến động thứ hạng nếu có */}
          <RankDiffBadge
            diff={rankDiff}
            fromRank={player.prevRank}
            toRank={player.rank}
          />

          {/* Badge Vùng Thăng Hạng / Xuống Hạng - Chuẩn TH19 */}
          {isPromotionZone ? (
            <span
              className="inline-flex shrink-0 items-center rounded-sm bg-amber-500/15 border border-amber-500/35 px-1 py-0.5 text-[9px] font-black uppercase tracking-tight text-amber-700 dark:text-amber-300 select-none shadow-2xs"
              title={dict.table.badgePromotionTooltip}
            >
              {dict.table.badgePromotion}
            </span>
          ) : isDemotionZone ? (
            <span
              className="inline-flex shrink-0 items-center rounded-sm bg-red-500/15 border border-red-500/35 px-1 py-0.5 text-[9px] font-black uppercase tracking-tight text-red-700 dark:text-red-300 select-none shadow-2xs"
              title={dict.table.badgeDemotionTooltip}
            >
              {dict.table.badgeDemotion}
            </span>
          ) : null}
        </div>
      </td>

      {/* 2. Cột Tên Người Chơi & Clan */}
      <td className="w-56 min-w-[170px] max-w-[240px] px-2 py-2.5 align-middle">
        <div className="relative flex items-center justify-between">
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <div className="flex items-center gap-1.5 truncate">
              <span
                onClick={() => onOpenBattleLog?.(player)}
                className={`truncate font-bold text-sm cursor-pointer hover:underline hover:text-red-600 dark:hover:text-red-400 transition-colors ${
                  isMyPlayer
                    ? 'text-red-600 dark:text-red-400 font-black'
                    : 'text-zinc-900 dark:text-white'
                }`}
                title={player.name}
              >
                {player.name}
              </span>
              {isMyPlayer && (
                <span className="shrink-0 rounded bg-red-500/15 border border-red-500/30 px-1.5 py-0.2 text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  {dict.common.me}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              <span
                className="truncate cursor-default font-normal"
                title={`Clan: ${player.clanName || dict.table.noClan}`}
              >
                {player.clanName || dict.table.noClan}
              </span>

              {player.playerTag && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-700 select-none shrink-0">•</span>
                  <button
                    type="button"
                    onClick={handleCopyTag}
                    className="group/tag inline-flex items-center gap-1 shrink-0 font-mono text-[10px] text-zinc-400 hover:text-amber-500 dark:text-zinc-500 dark:hover:text-amber-400 cursor-pointer select-none transition-colors"
                    title={dict.header.copyTagTooltip}
                  >
                    <span>{player.playerTag}</span>
                    {isTagCopied ? (
                      <Check weight="bold" className="h-2.5 w-2.5 text-amber-500 animate-bounce" />
                    ) : (
                      <Copy weight="duotone" className="h-2.5 w-2.5 opacity-0 group-hover/tag:opacity-100 transition-opacity" />
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Badges Đối Đầu từ Battle Log */}
            {(hasAttackedByMe || hasDefendedAgainstMe) && (
              <div className="mt-1 flex flex-wrap items-center gap-1 select-none">
                {hasAttackedByMe && (
                  <span
                    className="inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap shadow-2xs"
                    title={attackedTooltip}
                  >
                    {dict.table.attackedByMe}{attackSummaryText}
                  </span>
                )}
                {hasDefendedAgainstMe && (
                  <span
                    className="inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 whitespace-nowrap shadow-2xs"
                    title={defendedTooltip}
                  >
                    {dict.table.attackedMe}{defenseSummaryText}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {warnings.length > 0 && (
              <span
                className="shrink-0 flex items-center text-amber-400 hover:text-amber-300 cursor-default"
                title={`${warnings.map((w) => '• ' + w.message).join('\n')}`}
              >
                <Warning weight="duotone" className="h-4 w-4 drop-shadow-xs" />
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenBattleLog?.(player)
              }}
              className="inline-flex items-center rounded-md border border-[#272226] bg-[#18171b] px-2 py-0.5 text-[11px] font-medium text-zinc-300 hover:border-red-500/50 hover:bg-[#201d22] hover:text-white transition-colors cursor-pointer select-none shadow-2xs"
              title={dict.battleLog.viewLogTooltip}
            >
              <span>{dict.battleLog.actionLog}</span>
            </button>
          </div>
        </div>
      </td>

      {/* 3. Số Lượt Đánh */}
      <td className="px-2.5 py-2.5 align-middle">
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-baseline gap-0.5 font-mono text-sm">
            <span className="font-bold text-white">{player.attacks}</span>
            <span className="text-xs text-zinc-500">/{maxAttacks}</span>
          </div>
          <div className="text-[10px] text-zinc-500">
            {player.attackWinCount !== undefined ? (
              <span className="text-amber-400 font-semibold">
                {player.attackWinCount}W{player.attackLoseCount ? `-${player.attackLoseCount}L` : ''}
              </span>
            ) : (
              <span className={remainingAttacks === 0 ? 'text-amber-400 font-medium' : ''}>
                {remainingAttacks === 0 ? dict.table.completedAttacks : `${remainingAttacks} left`}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 4. Số Lượt Thủ */}
      <td className="px-2.5 py-2.5 align-middle">
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-baseline gap-0.5 font-mono text-sm">
            <span className="font-bold text-white">{player.defenses}</span>
            <span className="text-xs text-zinc-500">/{maxDefenses}</span>
          </div>
          <div className="text-[10px] text-zinc-500">
            {player.defenseLoseCount !== undefined ? (
              <span>
                {player.defenseWinCount ? `${player.defenseWinCount}W-` : ''}{player.defenseLoseCount}L
              </span>
            ) : (
              <span className={remainingDefenses === 0 ? 'text-amber-400 font-medium' : ''}>
                {remainingDefenses === 0 ? dict.table.completedAttacks : `${remainingDefenses} left`}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 5. Cúp Hiện Tại */}
      <td className="w-24 min-w-[88px] px-2 py-2.5 align-middle">
        <span className="font-mono text-sm font-bold text-white">
          {formatNumber(player.currentCups)}
        </span>
      </td>

      {/* 6. Cúp Tối Đa Có Thể Đạt */}
      <td className="w-36 min-w-[120px] px-2 py-2.5 align-middle">
        <div
          className="flex items-center gap-1.5 font-mono text-sm font-bold cursor-default"
          title={interpolate(dict.table.maxCupsFormulaTooltip, {
            current: formatNumber(player.currentCups),
            attacks: remainingAttacks,
            defenses: remainingDefenses,
            max: formatNumber(player.maxPossibleCups),
          })}
        >
          <span
            className={
              isMyPlayer
                ? 'text-red-400 font-black'
                : 'text-zinc-300'
            }
          >
            {formatNumber(player.maxPossibleCups)}
          </span>

          {canPassMe && (
            <span
              className="inline-flex items-center text-amber-400 hover:text-amber-300"
              title={interpolate(dict.table.canPassTooltip, {
                cups: formatNumber(player.maxPossibleCups),
              })}
            >
              <Warning weight="fill" className="h-4 w-4 drop-shadow-xs text-amber-400" />
            </span>
          )}
        </div>
      </td>

      {/* 7. Phân Loại Đánh Giá */}
      <td className="px-2 py-2.5 align-middle text-center">
        <RatingChip rating={player.rating} />
      </td>
    </tr>
  )
}
