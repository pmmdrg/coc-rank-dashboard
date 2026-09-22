import { useState } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import type { Player } from '../types'

interface ConfirmDeleteModalProps {
  player: Player | null
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmDeleteModal({
  player,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  if (!player) return null

  function handleClose() {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  function handleConfirm() {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onConfirm()
    }, 200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`${
          isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
        } fixed inset-0 bg-slate-950/60 backdrop-blur-sm`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={`glass-panel ${
          isClosing ? 'animate-modal-dialog-out' : 'animate-modal-dialog'
        } relative w-full max-w-md rounded-2xl p-6 shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200/50 pb-4 dark:border-slate-700/50">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 dark:bg-rose-500/20">
              <AlertTriangle className="h-4 w-4" />
            </span>
            Xác nhận xóa người chơi
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200/50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Bạn có chắc chắn muốn xóa người chơi{' '}
            <strong className="font-bold text-slate-900 dark:text-slate-100">
              "{player.name}"
            </strong>{' '}
            (Rank #{player.rank}, {player.currentCups.toLocaleString('vi-VN')} cup) khỏi bảng xếp hạng không?
          </p>
          <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
            Hành động này sẽ xóa người chơi khỏi mùa giải hiện tại và tự động sắp xếp lại thứ hạng.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300/70 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur transition-all hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-95 dark:bg-rose-600 dark:hover:bg-rose-500"
          >
            <Trash2 className="h-4 w-4" />
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  )
}
