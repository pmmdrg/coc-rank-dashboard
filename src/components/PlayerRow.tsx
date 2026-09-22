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
  onStartEditing?: () => void
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
  onStartEditing,
  onFinishEditing,
  onRequestRemove,
  setRowRef,
}: PlayerRowProps) {
  const rowClass = isMyPlayer
    ? 'row-mine'
    : canPassMe
      ? 'row-risk'
      : 'row-below'

  const remainingAttacks = Math.max(0, maxAttacks - player.attacks)
  const remainingDefenses = Math.max(0, maxDefenses - player.defenses)
  const { avgCupsPerAttack } = calculatePlayerRating(player.currentCups, player.attacks)

  const zoneClass = isPromotionZone
    ? 'border-l-4 border-l-emerald-500 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08]'
    : isDemotionZone
      ? 'border-l-4 border-l-rose-500 bg-rose-500/[0.04] dark:bg-rose-500/[0.08]'
      : 'border-l-4 border-l-transparent'

  return (
    <tr
      ref={setRowRef}
      className={`${rowClass} ${zoneClass} ${
        isRemoving ? 'animate-row-exit' : 'animate-row-enter'
      } ${isHighlighted ? 'row-jump-highlight' : ''} transition-colors duration-200`}
    >
      {/* Cột Rank */}
      <td className="px-3.5 py-2.5 align-middle whitespace-nowrap">
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
              className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tight shadow-xs select-none animate-pulse ${
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
              className="inline-flex shrink-0 items-center gap-0.5 rounded-xs bg-emerald-500/20 px-1 py-0.5 text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-tighter select-none border border-emerald-500/30"
              title="Vị trí thăng hạng"
            >
              ▲ Thăng
            </span>
          ) : isDemotionZone ? (
            <span
              className="inline-flex shrink-0 items-center gap-0.5 rounded-xs bg-rose-500/20 px-1 py-0.5 text-[9px] font-black text-rose-700 dark:text-rose-300 uppercase tracking-tighter select-none border border-rose-500/30"
              title="Vị trí xuống hạng"
            >
              ▼ Xuống
            </span>
          ) : null}
        </div>
      </td>

      {/* Tên người chơi */}
      <td className="px-3.5 py-2.5 align-middle">
        <input
          value={player.name}
          onFocus={onStartEditing}
          onBlur={onFinishEditing}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          onChange={(e) => onUpdateField('name', e.target.value)}
          className="soft-field h-9 w-full rounded-md px-2.5 text-sm font-medium"
        />
      </td>

      {/* Nút đánh dấu Tài khoản của tôi */}
      <td className="px-3.5 py-2.5 text-center align-middle">
        <button
          type="button"
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
      <td className="px-3.5 py-2.5 align-middle">
        <div className="flex h-9 items-center gap-1.5">
          <input
            type="number"
            min="0"
            max={maxAttacks}
            value={player.attacks === 0 ? '' : player.attacks}
            placeholder="0"
            onFocus={(e) => {
              e.target.select()
              onStartEditing?.()
            }}
            onBlur={onFinishEditing}
            onKeyDown={(e) => {
              if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault()
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            onChange={(e) => handleNumberChange(e.target.value, 'attacks', onUpdateField, maxAttacks)}
            className="soft-field h-9 w-12 rounded-md px-1 text-center text-sm font-semibold placeholder:text-slate-400/60 dark:placeholder:text-slate-500"
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

      {/* Số lượt thủ */}
      <td className="px-3.5 py-2.5 align-middle">
        <div className="flex h-9 items-center gap-1.5">
          <input
            type="number"
            min="0"
            max={maxDefenses}
            value={player.defenses === 0 ? '' : player.defenses}
            placeholder="0"
            onFocus={(e) => {
              e.target.select()
              onStartEditing?.()
            }}
            onBlur={onFinishEditing}
            onKeyDown={(e) => {
              if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault()
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            onChange={(e) => handleNumberChange(e.target.value, 'defenses', onUpdateField, maxDefenses)}
            className="soft-field h-9 w-12 rounded-md px-1 text-center text-sm font-semibold placeholder:text-slate-400/60 dark:placeholder:text-slate-500"
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

      {/* Số cup hiện tại */}
      <td className="px-3.5 py-2.5 align-middle">
        <input
          type="number"
          min="0"
          value={player.currentCups === 0 ? '' : player.currentCups}
          placeholder="0"
          onFocus={(e) => {
            e.target.select()
            onStartEditing?.()
          }}
          onBlur={onFinishEditing}
          onKeyDown={(e) => {
            if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault()
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          onChange={(e) => handleNumberChange(e.target.value, 'currentCups', onUpdateField)}
          className="soft-field h-9 w-full rounded-md px-2.5 text-sm font-semibold placeholder:text-slate-400/60 dark:placeholder:text-slate-500"
        />
      </td>

      {/* Số cup tối đa có thể đạt (tự động tính theo công thức) */}
      <td className="px-3.5 py-2.5 align-middle">
        <div className="relative flex h-9 items-center">
          <input
            type="text"
            readOnly
            value={player.maxPossibleCups.toLocaleString('vi-VN')}
            title={`Công thức: ${player.currentCups} cup hiện tại + (${maxAttacks} - ${player.attacks}) lượt chưa đánh × 40 = ${player.maxPossibleCups} cup`}
            className="soft-field h-9 w-full rounded-md border-sky-400/30 bg-sky-500/10 px-2.5 pr-10 text-sm font-bold text-sky-700 select-all cursor-default dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-300"
          />
          <span
            className="pointer-events-none absolute right-2 text-[10px] font-black tracking-wider text-sky-600/80 uppercase select-none dark:text-sky-400/80"
            title="Tính tự động bằng công thức"
          >
            MAX
          </span>
        </div>
      </td>

      {/* Phân loại đánh giá (Tính tự động theo số cup trung bình/lượt) */}
      <td className="px-3.5 py-2.5 align-middle">
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
      <td className="px-3.5 py-2.5 text-right align-middle">
        <button
          type="button"
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
