import { useMemo, useState } from 'react'
import { Warning, Crown, Trophy, Check, Copy } from '@phosphor-icons/react'
import type { Player, RatingCategory } from '../types'
import { validatePlayer } from '../lib/validation'
import { useI18n } from '../i18n/LanguageContext'

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
  className?: string
  style?: React.CSSProperties
}

const ratingTagColors: Record<RatingCategory, string> = {
  dominant: 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40 shadow-xs shadow-purple-500/10',
  superior: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-xs shadow-emerald-500/10',
  potential: 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40 shadow-xs shadow-sky-500/10',
  alarm: 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 shadow-xs shadow-rose-500/10',
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
  className = '',
  style,
}: PlayerRowProps) {
  const { dict, interpolate, language } = useI18n()
  const [isTagCopied, setIsTagCopied] = useState(false)

  const ratingLabelsMap: Record<RatingCategory, string> = {
    dominant: dict.charts.ratingDominant,
    superior: dict.charts.ratingSuperior,
    potential: dict.charts.ratingPotential,
    alarm: dict.charts.ratingAlarm,
  }

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
    ? 'border-l-[4px] border-l-sky-500 bg-sky-500/[0.08] dark:bg-sky-500/[0.14] hover:bg-sky-500/[0.12] dark:hover:bg-sky-500/[0.20]'
    : isPromotionZone
      ? 'border-l-[4px] border-l-emerald-500 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.04] hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
      : isDemotionZone
        ? 'border-l-[4px] border-l-rose-500 bg-rose-500/[0.02] dark:bg-rose-500/[0.04] hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
        : 'border-l-[4px] border-l-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/50'

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

  const rankDiff = rankJump ? rankJump.fromRank - rankJump.toRank : 0

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
          {player.rank === 1 ? (
            <div
              className="inline-flex h-7 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 font-mono text-xs font-black text-amber-950 shadow-md shadow-amber-500/35"
              title={dict.table.podiumGold}
            >
              <Crown weight="fill" className="mr-0.5 h-3.5 w-3.5 fill-amber-950 text-amber-950 drop-shadow-xs" />
              <span>1</span>
            </div>
          ) : player.rank === 2 ? (
            <div
              className="inline-flex h-7 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 font-mono text-xs font-black text-slate-900 shadow-sm"
              title={dict.table.podiumSilver}
            >
              <span>2</span>
            </div>
          ) : player.rank === 3 ? (
            <div
              className="inline-flex h-7 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 font-mono text-xs font-black text-white shadow-sm"
              title={dict.table.podiumBronze}
            >
              <span>3</span>
            </div>
          ) : (
            <div className="inline-flex h-7 min-w-[32px] shrink-0 items-center justify-center rounded-md border border-slate-200/80 bg-slate-100/80 px-1.5 font-mono text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
              #{player.rank}
            </div>
          )}

          {/* Biến động thứ hạng nếu có */}
          {rankDiff !== 0 && (
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold leading-none ${
                rankDiff > 0
                  ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
              }`}
              title={`#${rankJump?.fromRank} ➔ #${rankJump?.toRank}`}
            >
              {rankDiff > 0 ? `▲${rankDiff}` : `▼${Math.abs(rankDiff)}`}
            </span>
          )}

          {/* Badge Vùng Thăng Hạng / Xuống Hạng */}
          {isPromotionZone ? (
            <span
              className="inline-flex shrink-0 items-center rounded-sm bg-emerald-500/15 border border-emerald-500/30 px-1 py-0.5 text-[9px] font-black uppercase tracking-tight text-emerald-700 dark:text-emerald-300 select-none shadow-2xs"
              title={dict.table.badgePromotionTooltip}
            >
              {dict.table.badgePromotion}
            </span>
          ) : isDemotionZone ? (
            <span
              className="inline-flex shrink-0 items-center rounded-sm bg-rose-500/15 border border-rose-500/30 px-1 py-0.5 text-[9px] font-black uppercase tracking-tight text-rose-700 dark:text-rose-300 select-none shadow-2xs"
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
                className={`truncate font-bold text-sm cursor-default ${
                  isMyPlayer
                    ? 'text-sky-600 dark:text-sky-400 font-black'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
                title={player.name}
              >
                {player.name}
              </span>
              {isMyPlayer && (
                <span className="shrink-0 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-2 py-0.2 text-[9px] font-black text-white shadow-xs shadow-sky-500/30 uppercase tracking-wider">
                  {dict.common.me}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              <span
                className="truncate cursor-default font-normal"
                title={`Clan: ${player.clanName || dict.table.noClan}`}
              >
                {player.clanName || dict.table.noClan}
              </span>

              {player.playerTag && (
                <>
                  <span className="text-slate-300 dark:text-slate-700 select-none shrink-0">•</span>
                  <button
                    type="button"
                    onClick={handleCopyTag}
                    className="group/tag inline-flex items-center gap-1 shrink-0 font-mono text-[10px] text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 cursor-pointer select-none transition-colors"
                    title={dict.header.copyTagTooltip}
                  >
                    <span>{player.playerTag}</span>
                    {isTagCopied ? (
                      <Check weight="bold" className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
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
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap shadow-2xs"
                    title={attackedTooltip}
                  >
                    {dict.table.attackedByMe}{attackSummaryText}
                  </span>
                )}
                {hasDefendedAgainstMe && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap shadow-2xs"
                    title={defendedTooltip}
                  >
                    {dict.table.attackedMe}{defenseSummaryText}
                  </span>
                )}
              </div>
            )}
          </div>

          {warnings.length > 0 && (
            <span
              className="shrink-0 flex items-center text-amber-500 hover:text-amber-600 dark:text-amber-400 cursor-default"
              title={`${warnings.map((w) => '• ' + w.message).join('\n')}`}
            >
              <Warning weight="duotone" className="h-4 w-4 drop-shadow-xs" />
            </span>
          )}
        </div>
      </td>

      {/* 3. Số Lượt Đánh */}
      <td className="px-2 py-2.5 align-middle">
        <div className="flex h-9 items-center gap-2">
          <div className="flex flex-col items-center justify-center min-w-[34px] rounded-md border border-slate-200/80 bg-slate-100/90 px-1.5 py-0.5 dark:border-slate-800 dark:bg-slate-800/90 shadow-2xs">
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
              {player.attacks}
            </span>
            {player.attackWinCount !== undefined && (
              <span
                className="mt-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 leading-none"
                title={`${player.attackWinCount}W${player.attackLoseCount ? `-${player.attackLoseCount}L` : ''}`}
              >
                {player.attackWinCount}W{player.attackLoseCount ? `-${player.attackLoseCount}L` : ''}
              </span>
            )}
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="select-none text-xs font-bold text-slate-400 dark:text-slate-500">
              /{maxAttacks}
            </span>
            <span
              className={`mt-1 select-none text-[10px] whitespace-nowrap ${
                remainingAttacks === 0
                  ? 'font-bold text-emerald-600 dark:text-emerald-400'
                  : 'font-medium text-slate-500 dark:text-slate-400'
              }`}
            >
              {remainingAttacks === 0
                ? dict.table.completedAttacks
                : interpolate(dict.table.remainingAttacks, { count: remainingAttacks })}
            </span>
          </div>
        </div>
      </td>

      {/* 4. Số Lượt Thủ */}
      <td className="px-2 py-2.5 align-middle">
        <div className="flex h-9 items-center gap-2">
          <div className="flex flex-col items-center justify-center min-w-[34px] rounded-md border border-slate-200/80 bg-slate-100/90 px-1.5 py-0.5 dark:border-slate-800 dark:bg-slate-800/90 shadow-2xs">
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
              {player.defenses}
            </span>
            {player.defenseLoseCount !== undefined && (
              <span
                className="mt-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 leading-none"
                title={`${player.defenseWinCount ? `${player.defenseWinCount}W-` : ''}${player.defenseLoseCount}L`}
              >
                {player.defenseWinCount ? `${player.defenseWinCount}W-` : ''}{player.defenseLoseCount}L
              </span>
            )}
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="select-none text-xs font-bold text-slate-400 dark:text-slate-500">
              /{maxDefenses}
            </span>
            <span
              className={`mt-1 select-none text-[10px] whitespace-nowrap ${
                remainingDefenses === 0
                  ? 'font-bold text-emerald-600 dark:text-emerald-400'
                  : 'font-medium text-slate-500 dark:text-slate-400'
              }`}
            >
              {remainingDefenses === 0
                ? dict.table.completedAttacks
                : interpolate(dict.table.remainingAttacks, { count: remainingDefenses })}
            </span>
          </div>
        </div>
      </td>

      {/* 5. Cúp Hiện Tại */}
      <td className="w-24 min-w-[88px] px-2 py-2.5 align-middle">
        <div className="flex items-center gap-1.5">
          <Trophy weight="duotone" className="h-3.5 w-3.5 text-amber-500 shrink-0 drop-shadow-xs" />
          <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
            {formatNumber(player.currentCups)}
          </span>
        </div>
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
                ? 'text-sky-600 dark:text-sky-400 font-black'
                : 'text-slate-600 dark:text-slate-300'
            }
          >
            {formatNumber(player.maxPossibleCups)}
          </span>

          {canPassMe && (
            <span
              className="inline-flex items-center text-amber-500 hover:text-amber-600 dark:text-amber-400"
              title={interpolate(dict.table.canPassTooltip, {
                cups: formatNumber(player.maxPossibleCups),
              })}
            >
              <Warning weight="fill" className="h-4 w-4 drop-shadow-xs text-amber-500" />
            </span>
          )}
        </div>
      </td>

      {/* 7. Phân Loại Đánh Giá */}
      <td className="px-2 py-2.5 align-middle text-center">
        <div
          className={`inline-flex h-7.5 w-full items-center justify-center rounded-full border px-2.5 text-xs font-extrabold select-none transition-all ${ratingTagColors[player.rating]}`}
          title={`${dict.common.rating}: ${ratingLabelsMap[player.rating]}`}
        >
          {ratingLabelsMap[player.rating]}
        </div>
      </td>
    </tr>
  )
}
