import { useEffect, useRef } from 'react'

/**
 * AuroraBackground - Hiệu ứng cực quang Bắc Cực (Aurora Borealis)
 * - Tự động trôi dạt uốn lượn êm dịu trong không gian Arctic
 * - Khi cuộn chuột (scroll): liên tục chuyển đổi dải màu quang phổ (Emerald -> Cyan -> Indigo -> Violet -> Magenta -> Amber)
 * - Tương thích hoàn hảo cả Dark Mode và Light Mode, tối ưu hiệu năng 60/120fps với requestAnimationFrame
 */
export function AuroraBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number | null = null
    let latestScrollY = window.scrollY || 0

    const updateAurora = () => {
      if (!containerRef.current) return
      const scrollY = latestScrollY
      const docHeight = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      )
      const scrollRatio = Math.min(Math.max(scrollY / docHeight, 0), 1)

      // Xoay dải màu cực quang liên tục theo từng nhịp cuộn chuột
      // Cứ mỗi lượt cuộn, hue dịch chuyển mềm mại qua các sắc độ cực quang tự nhiên
      const hue = Math.round((scrollY * 0.16) % 360)
      const shiftY = Math.round(scrollY * 0.18)

      containerRef.current.style.setProperty('--aurora-hue', `${hue}deg`)
      containerRef.current.style.setProperty('--aurora-shift-y', `${shiftY}px`)
      containerRef.current.style.setProperty('--aurora-ratio', scrollRatio.toFixed(3))
      document.documentElement.style.setProperty('--aurora-scroll-hue', `${hue}deg`)

      rafId = null
    }

    const onScroll = () => {
      latestScrollY = window.scrollY || 0
      if (rafId === null) {
        rafId = requestAnimationFrame(updateAurora)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    updateAurora()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="aurora-ambient-canvas fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Màn cực quang 1: Dải xanh ngọc Emerald & Cyan (đặc trưng chính của Northern Lights) */}
      <div className="aurora-blob aurora-blob-1" />

      {/* Màn cực quang 2: Dải tím huyền ảo Violet, Magenta & Cosmic Indigo */}
      <div className="aurora-blob aurora-blob-2" />

      {/* Màn cực quang 3: Dải lam ngọc Cyan, Sapphire & Vệt sáng hoàng kim Amber */}
      <div className="aurora-blob aurora-blob-3" />

      {/* Màn cực quang 4: Sóng cực quang tầng sâu phía dưới khi cuộn xuống bảng xếp hạng */}
      <div className="aurora-blob aurora-blob-4" />

      {/* Lớp phủ vignette mềm tạo độ sâu không gian Arctic */}
      <div className="aurora-overlay-vignette absolute inset-0 pointer-events-none" />
    </div>
  )
}
