import React, { useLayoutEffect, useRef, useState, useEffect } from 'react'

export interface SegmentedControlOption<T extends string = string> {
  value: T
  label: React.ReactNode
  activeColorClass?: string
  hoverColorClass?: string
  title?: string
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  containerClassName?: string
  ariaLabel?: string
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  containerClassName = '',
  ariaLabel,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<T, HTMLButtonElement>>(new Map())
  const [isAnimated, setIsAnimated] = useState(false)

  const [sliderStyle, setSliderStyle] = useState<{
    left: number
    top: number
    width: number
    height: number
    ready: boolean
  }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  })

  useLayoutEffect(() => {
    const updateSlider = () => {
      const container = containerRef.current
      const activeEl = itemRefs.current.get(value)

      if (!container || !activeEl) {
        setSliderStyle((prev) => (prev.ready ? { ...prev, ready: false } : prev))
        return
      }

      const left = activeEl.offsetLeft
      const top = activeEl.offsetTop
      const width = activeEl.offsetWidth
      const height = activeEl.offsetHeight

      setSliderStyle({
        left,
        top,
        width,
        height,
        ready: true,
      })
    }

    updateSlider()

    const container = containerRef.current
    if (container && typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        updateSlider()
      })
      observer.observe(container)
      return () => observer.disconnect()
    }
  }, [value, options])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true)
    }, 60)
    return () => clearTimeout(timer)
  }, [])

  // Hỗ trợ điều hướng bằng phím mũi tên Trái / Phải chuẩn Apple HIG
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const currentIndex = options.findIndex((opt) => opt.value === value)
    if (currentIndex === -1) return

    let nextIndex = currentIndex
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % options.length
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + options.length) % options.length
    }

    const nextOption = options[nextIndex]
    if (nextOption) {
      onChange(nextOption.value)
      const btn = itemRefs.current.get(nextOption.value)
      btn?.focus()
    }
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`apple-segmented-container relative select-none ${containerClassName}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {/* Thanh trượt con nhộng (Sliding Pill Indicator) lướt êm ái giữa các tab */}
      <div
        className="apple-segmented-slider"
        style={{
          transform: `translate3d(${sliderStyle.left}px, ${sliderStyle.top}px, 0)`,
          width: `${sliderStyle.width}px`,
          height: `${sliderStyle.height}px`,
          opacity: sliderStyle.ready ? 1 : 0,
          transition: isAnimated
            ? 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), width 0.32s cubic-bezier(0.16, 1, 0.3, 1), height 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease'
            : 'opacity 0.15s ease',
        }}
        aria-hidden="true"
      />

      {/* Danh sách các tab bấm */}
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(option.value, el)
              } else {
                itemRefs.current.delete(option.value)
              }
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={`apple-segmented-item ${className} ${
              isActive
                ? `is-active ${option.activeColorClass || ''}`
                : option.hoverColorClass || ''
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
