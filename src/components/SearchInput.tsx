import { MagnifyingGlass, X } from '@phosphor-icons/react'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
  onClear?: () => void
}

/**
 * Ô tìm kiếm chuẩn hóa dùng chung toàn bộ Dashboard theo phong cách Spotlight của Apple:
 * Tích hợp sẵn icon kính lúp, hiệu ứng focus viền sáng, và nút 'X' để xóa nhanh.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className = '',
  ariaLabel,
  onClear,
}: SearchInputProps) {
  const handleClear = () => {
    onChange('')
    if (onClear) onClear()
  }

  return (
    <div className={`relative ${className}`}>
      <MagnifyingGlass
        weight="bold"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className="h-10 w-full rounded-xl border border-slate-200/80 bg-white/70 pl-9.5 pr-8 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs backdrop-blur-md transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="apple-btn absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          title="Xóa tìm kiếm"
        >
          <X weight="bold" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
