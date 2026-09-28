import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Shield } from 'lucide-react'
import type { Player, RatingCategory } from '../types'
import { calculatePlayerRating, getCupsPerRemainingDefense, ratingLabels } from '../lib/ranking'
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
  onSelectMyPlayer: () => void
  onUpdateField: (field: keyof Player, value: string | number) => void
  onFinishEditing?: () => void
  setRowRef: (element: HTMLTableRowElement | null) => void
}

const ratingTagColors: Record<RatingCategory, string> = {
  outstanding: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  elite: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  good: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  potential: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  needs_effort: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  not_good: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  terrible: 'bg-red-600/15 text-red-700 dark:text-red-400 border-red-600/30',
  safe: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
}

function formatDestruction(val?: number): string {
  if (val === undefined || val === null || val <= 0) return ''
  return (Math.round(val * 10) / 10).toFixed(1)
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
  onSelectMyPlayer,
  onUpdateField,
  onFinishEditing,
  setRowRef,
}: PlayerRowProps) {
  const rowClass = isMyPlayer
    ? 'row-mine'
    : 'row-neutral'

  const remainingAttacks = Math.max(0, maxAttacks - player.attacks)
  const remainingDefenses = Math.max(0, maxDefenses - player.defenses)
  const cupsPerRemainingDefense = getCupsPerRemainingDefense(
    player.defenses,
    player.defenseDestruction,
  )
  const { avgCupsPerAttack, attackCups, defenseCups } = calculatePlayerRating(
    player.currentCups,
    player.attacks,
    player.attackDestruction,
    player.defenses,
  )

  const warnings = useMemo(
    () => validatePlayer(player, maxAttacks, maxDefenses),
    [player, maxAttacks, maxDefenses],
  )
  const hasAtkDestWarning = warnings.some((w) => w.field === 'attackDestruction')
  const hasDefDestWarning = warnings.some((w) => w.field === 'defenseDestruction')

  const borderClass = isMyPlayer
    ? 'border-l-4 border-l-sky-500'
    : isPromotionZone
      ? 'border-l-4 border-l-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]'
      : isDemotionZone
        ? 'border-l-4 border-l-rose-500 bg-rose-500/[0.03] dark:bg-rose-500/[0.06]'
        : 'border-l-4 border-l-transparent'

  const isAtkFocused = useRef(false)
  const isDefFocused = useRef(false)

  const [localAtkDest, setLocalAtkDest] = useState(() => formatDestruction(player.attackDestruction))
  const [localDefDest, setLocalDefDest] = useState(() => formatDestruction(player.defenseDestruction))

  useEffect(() => {
    if (!isAtkFocused.current) {
      setLocalAtkDest(formatDestruction(player.attackDestruction))
    }
  }, [player.attackDestruction])

  useEffect(() => {
    if (!isDefFocused.current) {
      setLocalDefDest(formatDestruction(player.defenseDestruction))
    }
  }, [player.defenseDestruction])

  function handleDestructionChange(field: 'attackDestruction' | 'defenseDestruction', rawValue: string) {
    let val = rawValue.replace(',', '.')

    if (val === '') {
      if (field === 'attackDestruction') setLocalAtkDest('')
      else setLocalDefDest('')
      onUpdateField(field, 0)
      return
    }

    if (!/^\d*(?:\.\d?)?$/.test(val)) {
      return
    }

    const parsed = parseFloat(val)
    if (parsed > 100) {
      val = '100'
    }

    if (field === 'attackDestruction') setLocalAtkDest(val)
    else setLocalDefDest(val)

    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      const clamped = Math.min(100, Math.max(0, parsed))
      onUpdateField(field, clamped)
    }
  }

  function handleDestructionBlur(field: 'attackDestruction' | 'defenseDestruction') {
    const currentVal = field === 'attackDestruction' ? localAtkDest : localDefDest
    if (currentVal === '') return

    const parsed = parseFloat(currentVal)
    if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed <= 0) {
      if (field === 'attackDestruction') setLocalAtkDest('')
      else setLocalDefDest('')
      onUpdateField(field, 0)
    } else {
      const rounded = Math.min(100, Math.max(0, Math.round(parsed * 10) / 10))
      const formatted = rounded.toFixed(1)
      if (field === 'attackDestruction') setLocalAtkDest(formatted)
      else setLocalDefDest(formatted)
      onUpdateField(field, rounded)
    }
  }

  type EditableField = 'attackDestruction' | 'defenseDestruction'

  const EDITABLE_FIELDS: EditableField[] = ['attackDestruction', 'defenseDestruction']

  function handleInputKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    currentField: EditableField,
  ) {
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault()
      return
    }

    const tr = e.currentTarget.closest('tr')
    if (!tr) return

    const currentIndex = EDITABLE_FIELDS.indexOf(currentField)

    const focusField = (rowEl: HTMLTableRowElement | null, field: EditableField) => {
      if (!rowEl) return false
      const targetInput = rowEl.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)
      if (targetInput) {
        targetInput.focus()
        targetInput.select()
        return true
      }
      return false
    }

    const getAdjacentRow = (direction: 'next' | 'prev'): HTMLTableRowElement | null => {
      let sibling = direction === 'next' ? tr.nextElementSibling : tr.previousElementSibling
      while (sibling) {
        if (sibling.tagName === 'TR' && !sibling.className.includes('select-none')) {
          const input = sibling.querySelector('input[data-field]')
          if (input) return sibling as HTMLTableRowElement
        }
        sibling = direction === 'next' ? sibling.nextElementSibling : sibling.previousElementSibling
      }
      return null
    }

    // 1. Phím Enter: Nhảy xuống ô tương ứng ở hàng kế tiếp (cùng cột)
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        const prevRow = getAdjacentRow('prev')
        if (prevRow) {
          focusField(prevRow, currentField)
        }
      } else {
        const nextRow = getAdjacentRow('next')
        if (nextRow) {
          focusField(nextRow, currentField)
        }
      }
      return
    }

    // 2. Phím Tab & Shift + Tab: Di chuyển giữa % Công và % Thủ
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (currentIndex > 0) {
          e.preventDefault()
          focusField(tr, EDITABLE_FIELDS[currentIndex - 1])
        } else {
          // Lùi về hàng trước (vào % Thủ)
          const prevRow = getAdjacentRow('prev')
          if (prevRow) {
            e.preventDefault()
            focusField(prevRow, EDITABLE_FIELDS[EDITABLE_FIELDS.length - 1])
          }
        }
      } else {
        if (currentIndex < EDITABLE_FIELDS.length - 1) {
          e.preventDefault()
          focusField(tr, EDITABLE_FIELDS[currentIndex + 1])
        } else {
          // Tiến sang hàng kế tiếp (vào % Công)
          const nextRow = getAdjacentRow('next')
          if (nextRow) {
            e.preventDefault()
            focusField(nextRow, EDITABLE_FIELDS[0])
          }
        }
      }
      return
    }

    // 3. Phím tắt Alt + Mũi tên (hoặc Ctrl + Mũi tên): Di chuyển 4 hướng như bảng tính Excel
    if (e.altKey || e.ctrlKey) {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (currentIndex < EDITABLE_FIELDS.length - 1) {
          focusField(tr, EDITABLE_FIELDS[currentIndex + 1])
        }
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentIndex > 0) {
          focusField(tr, EDITABLE_FIELDS[currentIndex - 1])
        }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const nextRow = getAdjacentRow('next')
        if (nextRow) {
          focusField(nextRow, currentField)
        }
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prevRow = getAdjacentRow('prev')
        if (prevRow) {
          focusField(prevRow, currentField)
        }
        return
      }
    }
  }

  return (
    <tr
      ref={setRowRef}
      className={`${rowClass} ${borderClass} ${
        isHighlighted ? 'row-jump-highlight' : ''
      } transition-colors duration-200`}
    >
      {/* Cột Rank */}
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
              className={`animate-badge-jump inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tight shadow-xs select-none ${
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
              {rankJump.fromRank > rankJump.toRank ? '▲' : '▼'} #{rankJump.fromRank} → #{rankJump.toRank}
            </span>
          ) : isPromotionZone ? (
            <span
              className="animate-fade-in inline-flex shrink-0 items-center gap-0.5 rounded-xs bg-emerald-500/20 px-1 py-0.5 text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-tighter select-none border border-emerald-500/30"
              title="Vị trí thăng hạng"
            >
              ▲ Thăng
            </span>
          ) : isDemotionZone ? (
            <span
              className="animate-fade-in inline-flex shrink-0 items-center gap-0.5 rounded-xs bg-rose-500/20 px-1 py-0.5 text-[9px] font-black text-rose-700 dark:text-rose-300 uppercase tracking-tighter select-none border border-rose-500/30"
              title="Vị trí xuống hạng"
            >
              ▼ Xuống
            </span>
          ) : null}
        </div>
      </td>

      {/* Tên người chơi */}
      <td className="w-52 min-w-[160px] max-w-[220px] px-2 py-2 align-middle">
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
            {player.playerTag ? (
              <span
                className="font-mono text-[11px] text-slate-500 dark:text-slate-400 opacity-75 truncate cursor-default"
                title={`Mã người chơi: ${player.playerTag}`}
              >
                {player.playerTag}
              </span>
            ) : null}
          </div>
          {warnings.length > 0 && (
            <span
              className="shrink-0 flex items-center text-amber-500 hover:text-amber-600 dark:text-amber-400 cursor-help"
              title={`⚠️ Cảnh báo dữ liệu (${warnings.length}):\n${warnings.map((w) => '• ' + w.message).join('\n')}`}
            >
              <AlertTriangle className="h-4 w-4 drop-shadow-xs" />
            </span>
          )}
        </div>
      </td>

      {/* Tên Clan */}
      <td className="w-40 min-w-[130px] max-w-[180px] px-2 py-2 align-middle">
        {player.clanName ? (
          <div
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate cursor-default"
            title={`Clan: ${player.clanName}`}
          >
            <span className="shrink-0 text-xs">🛡️</span>
            <span className="truncate">{player.clanName}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400/70 italic cursor-default">Không clan</span>
        )}
      </td>

      {/* Nút đánh dấu Tài khoản của tôi */}
      <td className="px-1 py-2 text-center align-middle">
        <button
          type="button"
          tabIndex={-1}
          onClick={onSelectMyPlayer}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-all ${
            isMyPlayer
              ? 'border-blue-500 bg-blue-500 text-white shadow-sm dark:bg-sky-500 dark:border-sky-400'
              : 'border-slate-300/60 bg-white/50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:border-slate-700/60 dark:bg-slate-800/50 dark:hover:text-sky-400'
          }`}
          title={isMyPlayer ? 'Tài khoản của bạn' : 'Chọn làm tài khoản của tôi'}
        >
          <Shield className="h-4 w-4" aria-hidden="true" />
        </button>
      </td>

      {/* Số lượt đánh (Đã công = thắng + thua) */}
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
                {player.attackWinCount}T{player.attackLoseCount ? `-${player.attackLoseCount}B` : ''}
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

      {/* % Phá huỷ trên mỗi lượt công */}
      <td className="px-1.5 py-2 align-middle">
        <div className="relative flex h-9 w-20 items-center">
          <input
            data-field="attackDestruction"
            type="text"
            inputMode="decimal"
            value={localAtkDest}
            placeholder="0.0"
            onFocus={(e) => {
              isAtkFocused.current = true
              e.target.select()
            }}
            onBlur={() => {
              isAtkFocused.current = false
              handleDestructionBlur('attackDestruction')
              onFinishEditing?.()
            }}
            onKeyDown={(e) => handleInputKeyDown(e, 'attackDestruction')}
            onChange={(e) => handleDestructionChange('attackDestruction', e.target.value)}
            className={`soft-field h-9 w-full rounded-md pr-5 pl-1.5 text-right text-sm font-semibold placeholder:text-slate-400/60 dark:placeholder:text-slate-500 ${
              hasAtkDestWarning ? 'border-amber-400/80 bg-amber-500/10 text-amber-700 dark:border-amber-500/60 dark:text-amber-300' : ''
            }`}
            title={`% Phá huỷ trên mỗi lượt công (0.0% - 100.0%) • Cup công: ${attackCups} cup (${player.attacks} lượt × 40 × ${player.attackDestruction || 0}% / 100) (Enter: Xuống ô dưới • Tab: Sang % Thủ)${
              hasAtkDestWarning ? '\n⚠️ ' + warnings.find((w) => w.field === 'attackDestruction')?.message : ''
            }`}
          />
          <span className="pointer-events-none absolute right-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
            %
          </span>
        </div>
      </td>

      {/* Số lượt thủ (Đã thủ = thắng + thua) */}
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
                {player.defenseWinCount ? `${player.defenseWinCount}T-` : ''}{player.defenseLoseCount}B
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

      {/* % Phá huỷ trên mỗi lượt thủ */}
      <td className="px-1.5 py-2 align-middle">
        <div className="relative flex h-9 w-20 items-center">
          <input
            data-field="defenseDestruction"
            type="text"
            inputMode="decimal"
            value={localDefDest}
            placeholder="0.0"
            onFocus={(e) => {
              isDefFocused.current = true
              e.target.select()
            }}
            onBlur={() => {
              isDefFocused.current = false
              handleDestructionBlur('defenseDestruction')
              onFinishEditing?.()
            }}
            onKeyDown={(e) => handleInputKeyDown(e, 'defenseDestruction')}
            onChange={(e) => handleDestructionChange('defenseDestruction', e.target.value)}
            className={`soft-field h-9 w-full rounded-md pr-5 pl-1.5 text-right text-sm font-semibold placeholder:text-slate-400/60 dark:placeholder:text-slate-500 ${
              hasDefDestWarning ? 'border-amber-400/80 bg-amber-500/10 text-amber-700 dark:border-amber-500/60 dark:text-amber-300' : ''
            }`}
            title={`% Phá huỷ trên mỗi lượt phòng thủ (0.0% - 100.0%) • Cup thủ: ${defenseCups >= 0 ? '+' : ''}${defenseCups} cup (Enter: Xuống ô dưới • Tab: Sang người chơi tiếp theo)${
              hasDefDestWarning ? '\n⚠️ ' + warnings.find((w) => w.field === 'defenseDestruction')?.message : ''
            }`}
          />
          <span className="pointer-events-none absolute right-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
            %
          </span>
        </div>
      </td>

      {/* Số cup hiện tại */}
      <td className="w-24 min-w-[88px] px-2 py-2 align-middle">
        <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
          {player.currentCups.toLocaleString('vi-VN')}
        </span>
      </td>

      {/* Số cup tối đa có thể đạt */}
      <td className="w-36 min-w-[120px] px-2 py-2 align-middle">
        <div
          className="flex items-center gap-1.5 font-mono text-sm font-bold cursor-default"
          title={
            player.defenses <= 0
              ? `Công thức: ${player.currentCups} cup hiện tại + (${maxAttacks} - ${player.attacks}) lượt công × 40 + (${remainingDefenses}) lượt thủ × 0 cup (chưa có trận thủ) = ${player.maxPossibleCups} cup`
              : `Công thức: ${player.currentCups} cup hiện tại + (${maxAttacks} - ${player.attacks}) lượt công × 40 + (${remainingDefenses}) lượt thủ × ${cupsPerRemainingDefense} cup (theo ${formatDestruction(player.defenseDestruction)}% thủ) = ${player.maxPossibleCups} cup`
          }
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
              className="inline-flex items-center text-amber-500 hover:text-amber-600 dark:text-amber-400 cursor-help transition-transform hover:scale-110 active:scale-95 focus:outline-hidden"
              title={`⚠️ Có thể vượt: Người này có thể đạt tối đa ${player.maxPossibleCups.toLocaleString('vi-VN')} cúp, cao hơn mốc cúp tối đa của bạn!`}
            >
              <AlertTriangle className="h-4 w-4 drop-shadow-xs" />
            </span>
          )}
        </div>
      </td>

      {/* Phân loại đánh giá (Tính tự động trực tiếp theo % công) */}
      <td className="px-2 py-2 align-middle">
        <div
          className={`flex h-9 w-full items-center justify-center rounded-md border text-xs font-bold shadow-xs select-none transition-colors ${ratingTagColors[player.rating]}`}
          title={
            player.attacks === 0
              ? 'Chưa đánh lượt nào (Đánh giá: Chưa đánh)'
              : `Đánh giá: ${ratingLabels[player.rating]} (${formatDestruction(player.attackDestruction)}% công) • ~${attackCups} cup công (${avgCupsPerAttack.toFixed(1)} cup/lượt)`
          }
        >
          {ratingLabels[player.rating]}
        </div>
      </td>
    </tr>
  )
}
