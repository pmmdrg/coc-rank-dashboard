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
 * Ô tìm kiếm chuẩn hóa dùng chung toàn bộ Dashboard theo phong cách TH19:
 * Tích hợp sẵn icon kính lúp, hiệu ứng focus viền đỏ crimson, và nút 'X' để xóa nhanh.
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
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className="h-9 w-full rounded-lg border border-amber-500/30 bg-[#121216] pl-9 pr-8 text-xs sm:text-sm text-white placeholder:text-zinc-500 shadow-2xs transition-colors focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-900/40"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-white cursor-pointer transition-colors"
          title="Xóa tìm kiếm"
        >
          <X weight="bold" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
