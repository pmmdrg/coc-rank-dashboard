import { useEffect, useRef, useState } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'

export interface SelectOption<T extends string | number> {
  value: T
  label: string
}

export interface CustomSelectProps<T extends string | number> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  ariaLabel?: string
  className?: string
}

export function CustomSelect<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value) || options[0]

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-50' : 'z-10'} ${className}`}>
      {/* Nút trigger select box - Mũi tên được căn lề rộng rãi, bo tròn tinh tế */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group relative flex h-10 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-bold shadow-2xs backdrop-blur-md transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-sky-500/30 ${
          isOpen
            ? 'border-sky-500/60 bg-white ring-2 ring-sky-500/30 text-sky-900 dark:border-sky-400/60 dark:bg-slate-800 dark:text-sky-100'
            : 'border-slate-200/80 bg-white/70 text-slate-800 hover:border-sky-500/50 hover:bg-white dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:border-sky-400/50 dark:hover:bg-slate-800'
        }`}
      >
        <span className="truncate pr-3">{selectedOption?.label}</span>
        <CaretDown
          weight="bold"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-250 ease-out group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 ${
            isOpen ? 'rotate-180 text-sky-500 dark:text-sky-400' : ''
          }`}
        />
      </button>

      {/* Menu dropdown dạng popup được bo tròn và có animation mượt mà */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="animate-dropdown-pop absolute left-0 right-0 top-full mt-1.5 z-[100] max-h-60 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/98 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/98 dark:shadow-2xl dark:shadow-black/60"
        >
          <div className="space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={`group/opt flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-sky-500/15 text-sky-800 dark:bg-sky-500/25 dark:text-sky-200 font-bold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check
                      weight="bold"
                      className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400 ml-2"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
