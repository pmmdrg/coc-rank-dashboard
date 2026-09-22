import { useState } from 'react'
import { CheckCircle2, Cloud, ExternalLink, Key, LogIn, LogOut, X } from 'lucide-react'
import {
  getGoogleDriveConfig,
  isGoogleDriveSignedIn,
  requestGoogleAccessToken,
  saveGoogleDriveConfig,
  signOutGoogleDrive,
} from '../storage/googleDriveAdapter'

interface GoogleDriveConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConfigSaved?: () => void
}

export function GoogleDriveConfigModal({ isOpen, onClose, onConfigSaved }: GoogleDriveConfigModalProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [config, setConfig] = useState(getGoogleDriveConfig)
  const [isSignedIn, setIsSignedIn] = useState(isGoogleDriveSignedIn)
  const [statusMessage, setStatusMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  function handleClose() {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  function handleSave() {
    saveGoogleDriveConfig(config)
    setIsError(false)
    setStatusMessage('Đã lưu cấu hình Google Drive thành công.')
    if (onConfigSaved) onConfigSaved()
  }

  async function handleSignIn() {
    try {
      setIsLoading(true)
      setIsError(false)
      setStatusMessage('Đang kết nối tài khoản Google...')
      saveGoogleDriveConfig(config)
      await requestGoogleAccessToken()
      setIsSignedIn(true)
      setStatusMessage('Đăng nhập Google Drive thành công!')
      if (onConfigSaved) onConfigSaved()
    } catch (err) {
      setIsError(true)
      setStatusMessage(err instanceof Error ? err.message : 'Đăng nhập Google thất bại.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSignOut() {
    signOutGoogleDrive()
    setIsSignedIn(false)
    setIsError(false)
    setStatusMessage('Đã đăng xuất khỏi Google Drive.')
    if (onConfigSaved) onConfigSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop mờ dần khi mở và tắt dần khi đóng */}
      <div
        className={`${
          isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
        } fixed inset-0 bg-slate-950/60 backdrop-blur-sm`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog với animation vào và ra mượt mà */}
      <div
        className={`glass-panel ${
          isClosing ? 'animate-modal-dialog-out' : 'animate-modal-dialog'
        } relative w-full max-w-lg rounded-2xl p-6 shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200/50 pb-4 dark:border-slate-700/50">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <Cloud className="h-5 w-5 text-sky-500" />
            Cấu hình Google Drive
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {statusMessage ? (
          <div
            className={`mt-4 rounded-md px-3 py-2 text-sm backdrop-blur ${
              isError
                ? 'border border-rose-300/60 bg-rose-50/80 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/50 dark:text-rose-200'
                : 'border border-emerald-300/60 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-200'
            }`}
          >
            {statusMessage}
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              OAuth 2.0 Client ID (Bắt buộc)
            </label>
            <input
              type="text"
              placeholder="xxxxxxx.apps.googleusercontent.com"
              value={config.clientId}
              onChange={(e) => setConfig((prev) => ({ ...prev, clientId: e.target.value.trim() }))}
              className="soft-field mt-1.5 h-10 w-full rounded-md px-3 text-sm"
            />
            <p className="mt-1 text-xs text-slate-400">
              Dùng để xác thực quyền truy cập Google Drive của người dùng.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              API Key (Tùy chọn - Dùng cho Google Picker)
            </label>
            <div className="relative mt-1.5">
              <input
                type="text"
                placeholder="AIzaSy..."
                value={config.apiKey}
                onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value.trim() }))}
                className="soft-field h-10 w-full rounded-md px-3 text-sm"
              />
              <Key className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Nếu không có API Key, hệ thống sẽ tự động quét các file .json và .csv có sẵn trên Drive của bạn.
            </p>
          </div>

          {/* Trạng thái xác thực */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <span className="font-medium">Trạng thái:</span>
              {isSignedIn ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Đã kết nối
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Chưa kết nối</span>
              )}
            </div>

            {isSignedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300/80 bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-300"
              >
                <LogOut className="h-3.5 w-3.5" /> Đăng xuất
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isLoading || !config.clientId}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 dark:bg-sky-600 dark:hover:bg-sky-500"
              >
                <LogIn className="h-3.5 w-3.5" />
                {isLoading ? 'Đang kết nối...' : 'Đăng nhập Google'}
              </button>
            )}
          </div>

          {/* Hướng dẫn nhanh */}
          <div className="rounded-lg border border-slate-200/50 bg-slate-50/40 p-3 text-xs text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Cách lấy Client ID nhanh trên Google Cloud:</p>
            <ol className="mt-1.5 list-inside list-decimal space-y-1">
              <li>Tạo dự án trên Google Cloud Console và bật <strong>Google Drive API</strong>.</li>
              <li>Tạo <strong>OAuth Client ID</strong> cho <em>Web application</em>.</li>
              <li>Thêm <code>http://localhost:5173</code> hoặc domain của bạn vào <em>Authorized JavaScript origins</em>.</li>
            </ol>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sky-600 hover:underline dark:text-sky-400"
            >
              Mở Google Cloud Console Credentials <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300/70 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur transition-all hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-sky-600 dark:hover:bg-sky-500"
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  )
}
