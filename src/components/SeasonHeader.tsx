import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudUpload,
  Download,
  FileJson,
  FolderOpen,
  HardDrive,
  Loader2,
  Settings,
} from 'lucide-react'
import type { AutoSaveStatus, StorageFormat, StorageSource } from '../types'
import { formatLeagueName } from '../lib/ranking'
import { ThemeToggle } from './ThemeToggle'

interface SeasonHeaderProps {
  league: string
  myPlayerName: string
  storageSource: StorageSource
  autoSaveStatus: AutoSaveStatus
  hasActiveFile: boolean
  onStorageSourceChange: (source: StorageSource) => void
  onOpen: () => void
  onSave: () => void
  onSaveAs: (format: StorageFormat) => void
  onOpenDriveConfig: () => void
}

export function SeasonHeader({
  league,
  myPlayerName,
  storageSource,
  autoSaveStatus,
  hasActiveFile,
  onStorageSourceChange,
  onOpen,
  onSave,
  onSaveAs,
  onOpenDriveConfig,
}: SeasonHeaderProps) {
  const displayLeague = formatLeagueName(league)

  return (
    <header className="glass-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            CoC Rank Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-200">{myPlayerName}</span> • {displayLeague}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nguồn lưu trữ: Local File vs Google Drive */}
          <div className="inline-flex rounded-lg border border-slate-300/60 bg-white/50 p-0.5 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60">
            <button
              type="button"
              onClick={() => onStorageSourceChange('local')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                storageSource === 'local'
                  ? 'bg-blue-600 text-white shadow-sm dark:bg-sky-500'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Lưu trữ và mở file trực tiếp từ máy tính"
            >
              <HardDrive className="h-3.5 w-3.5" />
              Máy cục bộ
            </button>
            <button
              type="button"
              onClick={() => onStorageSourceChange('google-drive')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                storageSource === 'google-drive'
                  ? 'bg-blue-600 text-white shadow-sm dark:bg-sky-500'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Lưu trữ và đồng bộ với Google Drive"
            >
              <Cloud className="h-3.5 w-3.5" />
              Google Drive
            </button>
          </div>

          {/* Nút cài đặt Google Drive */}
          {storageSource === 'google-drive' && (
            <button
              type="button"
              onClick={onOpenDriveConfig}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300/60 bg-white/60 text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Cài đặt Google Drive (Client ID / API Key)"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}

          {/* Nút Mở */}
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-300/60 bg-white/60 px-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Mở file dữ liệu"
          >
            <FolderOpen className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Mở
          </button>

          {/* Chỉ báo trạng thái Tự động lưu (thay thế nút Lưu cứng) */}
          {autoSaveStatus === 'saving' && (
            <div
              className="animate-fade-in inline-flex h-10 items-center gap-1.5 rounded-md border border-amber-300/60 bg-amber-50/80 px-3 text-xs font-semibold text-amber-700 shadow-sm backdrop-blur dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300"
              title="Đang đồng bộ thay đổi..."
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang lưu...
            </div>
          )}

          {autoSaveStatus === 'saved' && (
            <button
              type="button"
              onClick={onSave}
              className="animate-fade-in inline-flex h-10 items-center gap-1.5 rounded-md border border-emerald-300/60 bg-emerald-50/80 px-3 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
              title={hasActiveFile ? 'Dữ liệu đã tự động lưu vào file. Bấm để lưu đè lại.' : 'Đã lưu tự động'}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã tự động lưu
            </button>
          )}

          {autoSaveStatus === 'draft' && (
            <button
              type="button"
              onClick={onSave}
              className="animate-fade-in inline-flex h-10 items-center gap-1.5 rounded-md border border-sky-300/60 bg-sky-50/80 px-3 text-xs font-semibold text-sky-700 shadow-sm backdrop-blur hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60"
              title="Đã tự động lưu bản nháp vào trình duyệt. Bấm để chọn file lưu chính thức trên máy tính hoặc Drive."
            >
              <CloudUpload className="h-3.5 w-3.5 text-sky-500" />
              Đã lưu nháp • Gắn file
            </button>
          )}

          {autoSaveStatus === 'error' && (
            <button
              type="button"
              onClick={onSave}
              className="animate-fade-in inline-flex h-10 items-center gap-1.5 rounded-md border border-rose-300/60 bg-rose-50/80 px-3 text-xs font-semibold text-rose-700 shadow-sm backdrop-blur hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300"
              title="Lưu tự động gặp lỗi. Bấm để thử lại thủ công."
            >
              <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
              Lỗi lưu • Thử lại
            </button>
          )}

          {/* Các nút Xuất file */}
          <button
            type="button"
            onClick={() => onSaveAs('json')}
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-300/60 bg-white/60 px-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Xuất sang file JSON"
          >
            <FileJson className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            JSON
          </button>

          <button
            type="button"
            onClick={() => onSaveAs('csv')}
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-300/60 bg-white/60 px-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Xuất sang file CSV"
          >
            <Download className="h-4 w-4 text-sky-500" aria-hidden="true" />
            CSV
          </button>

          {/* Nút đổi theme */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
