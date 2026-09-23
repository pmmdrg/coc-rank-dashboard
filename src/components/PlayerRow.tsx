import { useEffect, useRef, useState } from 'react'
import { Shield, Trash2 } from 'lucide-react'
import type { Player, RatingCategory } from '../types'
import { calculatePlayerRating, ratingLabels } from '../lib/ranking'

interface PlayerRowProps {
  player: Player
  maxAttacks: number
  maxDefenses: number
  isMyPlayer: boolean
  canPassMe: boolean
  isRemoving?: boolean
  isPromotionZone?: boolean
  isDemotionZone?: boolean
  isHighlighted?: boolean
  rankJump?: { fromRank: number; toRank: number } | null
  onSelectMyPlayer: () => void
  onUpdateField: (field: keyof Player, value: string | number) => void
  onFinishEditing?: () => void
  onRequestRemove: () => void
  setRowRef: (element: HTMLTableRowElement | null) => void
}

const ratingTagColors: Record<RatingCategory, string> = {
  elite: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  contested: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  danger: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  safe: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
}

function handleNumberChange(
  val: string,
  field: keyof Player,
  onUpdateField: (field: keyof Player, val: number) => void,
  maxLimit?: number,
) {
  if (val === '') {
    onUpdateField(field, 0)
    return
  }
  const parsed = parseInt(val, 10)
  if (Number.isNaN(parsed)) {
    onUpdateField(field, 0)
    return
  }
  let num = Math.max(0, parsed)
  if (maxLimit !== undefined && num > maxLimit) {
    num = maxLimit
  }
  onUpdateField(field, num)
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
  isRemoving = false,
  isPromotionZone = false,
  isDemotionZone = false,
  isHighlighted = false,
  rankJump = null,
  onSelectMyPlayer,
  onUpdateField,
  onFinishEditing,
  onRequestRemove,
  setRowRef,
}: PlayerRowProps) {
  const rowClass = isMyPlayer
    ? 'row-mine'
    : 'row-neutral'

  const remainingAttacks = Math.max(0, maxAttacks - player.attacks)
  const remainingDefenses = Math.max(0, maxDefenses - player.defenses)
  const { avgCupsPerAttack } = calculatePlayerRating(player.currentCups, player.attacks)

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

  type EditableField =
    | 'name'
    | 'attacks'
    | 'attackDestruction'
    | 'defenses'
    | 'defenseDestruction'
    | 'currentCups'

  const EDITABLE_FIELDS: EditableField[] = [
    'name',
    'attacks',
    'attackDestruction',
    'defenses',
    'defenseDestruction',
    'currentCups',
  ]

  function handleInputKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    currentField: EditableField,
  ) {
    if (['attacks', 'defenses', 'currentCups'].includes(currentField)) {
      if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
        e.preventDefault()
        return
      }
    }
    if (['attackDestruction', 'defenseDestruction'].includes(currentField)) {
      if (['-', '+', 'e', 'E'].includes(e.key)) {
        e.preventDefault()
        return
      }
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

    // 1. Phím Enter: Chuyển sang trường tiếp theo trên cùng hàng; tại currentCups thì hoàn tất và sắp xếp
    if (e.key === 'Enter') {
      e.preventDefault()
      if (currentField === 'currentCups') {
        e.currentTarget.blur()
      } else {
        const nextField = EDITABLE_FIELDS[currentIndex + 1]
        focusField(tr, nextField)
      }
      return
    }

    // 2. Phím Tab & Shift + Tab: Di chuyển trực tiếp giữa các textfield (bỏ qua nút bấm / readonly)
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (currentIndex > 0) {
          e.preventDefault()
          focusField(tr, EDITABLE_FIELDS[currentIndex - 1])
        } else {
          // Lùi về hàng trước (vào ô currentCups)
          const prevRow = getAdjacentRow('prev')
          if (prevRow) {
            e.preventDefault()
            focusField(prevRow, 'currentCups')
          }
        }
      } else {
        if (currentIndex < EDITABLE_FIELDS.length - 1) {
          e.preventDefault()
          focusField(tr, EDITABLE_FIELDS[currentIndex + 1])
        } else {
          // Tiến sang hàng kế tiếp (vào ô attacks)
          const nextRow = getAdjacentRow('next')
          if (nextRow) {
            e.preventDefault()
            focusField(nextRow, 'attacks')
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
        isRemoving ? 'animate-row-exit' : ''
      } ${isHighlighted ? 'row-jump-highlight' : ''} transition-colors duration-200`}
    >
      {/* Cột Rank */}
      <td className="px-2.5 py-2.5 align-middle whitespace-nowrap">
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
      <td className="w-48 min-w-[165px] max-w-[210px] px-2 py-2 align-middle">
        <input
          data-field="name"
          value={player.name}
          onFocus={(e) => e.target.select()}
          onBlur={onFinishEditing}
          onKeyDown={(e) => handleInputKeyDown(e, 'name')}
          onChange={(e) => onUpdateField('name', e.target.value)}
          className="soft-field h-9 w-full min-w-[150px] rounded-md px-2 text-sm font-medium"
          title="Tên người chơi (Tab/Enter để sang Lượt đánh)"
        />
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

      {/* Số lượt đánh */}
      <td className="px-2 py-2 align-middle">
        <div className="flex h-9 items-center gap-1.5">
          <input
            data-field="attacks"
            type="number"
            min="0"
            max={maxAttacks}
            value={player.attacks === 0 ? '' : player.attacks}
            placeholder="0"
            onFocus={(e) => e.target.select()}
            onBlur={onFinishEditing}
            onKeyDown={(e) => handleInputKeyDown(e, 'attacks')}
            onChange={(e) => handleNumberChange(e.target.value, 'attacks', onUpdateField, maxAttacks)}
            className="soft-field h-9 w-11 rounded-md px-1 text-center text-sm font-semibold placeholder:text-slate-400/60 dark:placeholder:text-slate-500"
            title="Số lượt đánh (Tab/Enter sang % Công, Alt+Mũi tên để di chuyển)"
          />
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
            className="soft-field h-9 w-full rounded-md pr-5 pl-1.5 text-right text-sm font-semibold placeholder:text-slate-400/60 dark:placeholder:text-slate-500"
            title="% Phá huỷ trên mỗi lượt tấn công (0.0% - 100.0%) (Tab/Enter sang Lượt thủ)"
          />
          <span className="pointer-events-none absolute right-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
            %
          </span>
        </div>
      </td>

      {/* Số lượt thủ */}
      <td className="px-2 py-2 align-middle">
        <div className="flex h-9 items-center gap-1.5">
          <input
            data-field="defenses"
            type="number"
            min="0"
            max={maxDefenses}
            value={player.defenses === 0 ? '' : player.defenses}
            placeholder="0"
            onFocus={(e) => e.target.select()}
            onBlur={onFinishEditing}
            onKeyDown={(e) => handleInputKeyDown(e, 'defenses')}
            onChange={(e) => handleNumberChange(e.target.value, 'defenses', onUpdateField, maxDefenses)}
            className="soft-field h-9 w-11 rounded-md px-1 text-center text-sm font-semibold placeholder:text-slate-400/60 dark:placeholder:text-slate-500"
            title="Số lượt thủ (Tab/Enter sang % Thủ, Shift+Tab về % Công)"
          />
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
            className="soft-field h-9 w-full rounded-md pr-5 pl-1.5 text-right text-sm font-semibold placeholder:text-slate-400/60 dark:placeholder:text-slate-500"
            title="% Phá huỷ trên mỗi lượt phòng thủ (0.0% - 100.0%) (Tab/Enter sang Cup hiện tại)"
          />
          <span className="pointer-events-none absolute right-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
            %
          </span>
        </div>
      </td>

      {/* Số cup hiện tại */}
      <td className="px-2 py-2 align-middle">
        <input
          data-field="currentCups"
          type="number"
          min="0"
          value={player.currentCups === 0 ? '' : player.currentCups}
          placeholder="0"
          onFocus={(e) => e.target.select()}
          onBlur={onFinishEditing}
          onKeyDown={(e) => handleInputKeyDown(e, 'currentCups')}
          onChange={(e) => handleNumberChange(e.target.value, 'currentCups', onUpdateField)}
          className="soft-field h-9 w-full rounded-md px-2 text-sm font-semibold placeholder:text-slate-400/60 dark:placeholder:text-slate-500"
          title="Số cup hiện tại (Enter để lưu & xếp hạng, Shift+Tab về % Thủ, Tab sang người chơi kế tiếp)"
        />
      </td>

      {/* Số cup tối đa có thể đạt (tự động tính theo công thức & chỉ báo so sánh) */}
      <td className="w-48 min-w-[195px] px-2 py-2 align-middle">
        <div className="relative flex h-9 items-center">
          <input
            type="text"
            readOnly
            tabIndex={-1}
            value={player.maxPossibleCups.toLocaleString('vi-VN')}
            title={`Công thức: ${player.currentCups} cup hiện tại + (${maxAttacks} - ${player.attacks}) lượt chưa đánh × 40 = ${player.maxPossibleCups} cup`}
            className={`soft-field h-9 w-full rounded-md px-2 pr-[98px] text-sm font-bold select-all cursor-default transition-colors ${
              isMyPlayer
                ? 'border-sky-400/40 bg-sky-500/10 text-sky-700 dark:border-sky-500/40 dark:bg-sky-950/40 dark:text-sky-300'
                : canPassMe
                  ? 'border-amber-400/50 bg-amber-500/10 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200'
                  : 'border-slate-300/40 bg-slate-100/40 text-slate-600 dark:border-slate-700/40 dark:bg-slate-800/30 dark:text-slate-400'
            }`}
          />
          <span
            className={`pointer-events-none absolute right-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-black tracking-tight select-none border ${
              isMyPlayer
                ? 'border-sky-400/40 bg-sky-500/20 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/30 dark:text-sky-300'
                : canPassMe
                  ? 'border-amber-400/50 bg-amber-500/20 text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/30 dark:text-amber-200'
                  : 'border-slate-300/40 bg-slate-200/50 text-slate-500 dark:border-slate-700/40 dark:bg-slate-800/60 dark:text-slate-400'
            }`}
            title={
              isMyPlayer
                ? 'Mục tiêu cúp của bạn'
                : canPassMe
                  ? `Người này có thể đạt tới ${player.maxPossibleCups} cúp, cao hơn cúp tối đa của bạn!`
                  : `Cúp tối đa (${player.maxPossibleCups}) không thể vượt bạn.`
            }
          >
            {isMyPlayer ? 'BẠN' : canPassMe ? '⚠ CÓ THỂ VƯỢT' : '✓ DƯỚI BẠN'}
          </span>
        </div>
      </td>

      {/* Phân loại đánh giá (Tính tự động theo số cup trung bình/lượt) */}
      <td className="px-2 py-2 align-middle">
        <div
          className={`flex h-9 w-full items-center justify-center rounded-md border text-xs font-bold shadow-xs select-none transition-colors ${ratingTagColors[player.rating]}`}
          title={
            player.attacks === 0
              ? 'Chưa đánh lượt nào (Đánh giá: Chưa đánh)'
              : `Trung bình: ${avgCupsPerAttack.toFixed(1)} cup/lượt (${
                  player.rating === 'elite'
                    ? '≥ 32: Đỉnh'
                    : player.rating === 'contested'
                      ? '≥ 24: Kỹ năng tốt'
                      : '< 24: Có tiềm năng'
                })`
          }
        >
          {ratingLabels[player.rating]}
        </div>
      </td>

      {/* Nút Xóa người chơi */}
      <td className="px-1 py-2 text-center align-middle">
        <button
          type="button"
          tabIndex={-1}
          onClick={onRequestRemove}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300/60 bg-white/50 text-slate-400 transition-all duration-200 hover:scale-105 active:scale-90 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700/60 dark:bg-slate-800/50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
          title="Xóa người chơi"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </td>
    </tr>
  )
}
