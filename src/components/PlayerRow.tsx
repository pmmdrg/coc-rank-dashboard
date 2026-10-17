import { useMemo, useState } from 'react'
import { Warning, Trophy, Check, Copy, Sword } from '@phosphor-icons/react'
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
                onClick={() => onOpenBattleLog?.(player)}
                className={`truncate font-bold text-sm cursor-pointer hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
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

          <div className="flex items-center gap-1.5 shrink-0">
            {warnings.length > 0 && (
              <span
                className="shrink-0 flex items-center text-amber-500 hover:text-amber-600 dark:text-amber-400 cursor-default"
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
              className="apple-btn inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/70 px-2 py-1 text-[11px] font-bold text-slate-700 shadow-2xs backdrop-blur-md hover:border-indigo-400 hover:bg-indigo-50/90 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-indigo-400/50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 transition-all cursor-pointer select-none"
              title={dict.battleLog.viewLogTooltip}
            >
              <Sword weight="bold" className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="hidden xl:inline text-[10px]">{dict.battleLog.actionLog}</span>
            </button>
          </div>
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
        <RatingChip rating={player.rating} />
      </td>
    </tr>
  )
}
