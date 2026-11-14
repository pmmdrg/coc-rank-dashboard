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
        className={`group relative flex h-10 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-bold shadow-2xs backdrop-blur-md transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
          isOpen
            ? 'border-amber-400 bg-[#0e0e12] ring-2 ring-amber-500/30 text-white'
            : 'border-amber-500/30 bg-[#0e0e12] text-white hover:border-amber-400 hover:bg-[#141418]'
        }`}
      >
        <span className="truncate pr-3">{selectedOption?.label}</span>
        <CaretDown
          weight="bold"
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-250 ease-out group-hover:text-white ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* Menu dropdown dạng popup được bo tròn và có animation mượt mà */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="animate-dropdown-pop absolute left-0 right-0 top-full mt-1.5 z-[100] max-h-60 overflow-y-auto rounded-2xl border border-amber-500/30 bg-[#0c0c0f]/98 p-1.5 shadow-2xl shadow-black/80 backdrop-blur-xl"
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
                      ? 'bg-[#7a1313] text-white font-bold shadow-2xs border border-red-800/60'
                      : 'text-zinc-300 hover:bg-[#18181b] hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check
                      weight="bold"
                      className="h-3.5 w-3.5 shrink-0 text-amber-400 ml-2"
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
