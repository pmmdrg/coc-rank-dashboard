import { useEffect, useRef } from 'react'

/**
 * AuroraBackground - Hiệu ứng cực quang Bắc Cực (Aurora Borealis) cao cấp
 * - Chuyển màu từ từ, mềm mại theo quán tính mượt mà (LERP momentum) khi cuộn chuột
 * - Các khối mây cực quang (Aurora blobs) chuyển động và dạt sóng rõ rệt theo từng nhịp cuộn (parallax swoop)
 * - Tự động biến hình (morphing) và uốn lượn liên tục tạo cảm giác bồng bềnh sống động như cực quang tự nhiên
 */
export function AuroraBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const blob1Ref = useRef<HTMLDivElement>(null)
  const blob2Ref = useRef<HTMLDivElement>(null)
  const blob3Ref = useRef<HTMLDivElement>(null)
  const blob4Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number | null = null
    let targetScrollY = window.scrollY || 0
    let currentScrollY = targetScrollY
    let targetHue = (targetScrollY * 0.05) % 360
    let currentHue = targetHue
    let isRunning = true

    const loop = () => {
      if (!isRunning) return

      // LERP (Linear Interpolation) tạo quán tính trôi màu êm dịu, không giật cục
      const diffY = targetScrollY - currentScrollY
      const diffHue = targetHue - currentHue

      // Hệ số easing mượt mà, chuyển màu từ từ không giật cái một
      currentScrollY += diffY * 0.065
      currentHue += diffHue * 0.055

      if (containerRef.current) {
        containerRef.current.style.setProperty('--aurora-hue', `${currentHue.toFixed(2)}deg`)
      }
      document.documentElement.style.setProperty('--aurora-scroll-hue', `${currentHue.toFixed(2)}deg`)

      // Di chuyển các khối màu cực quang rõ rệt khi cuộn chuột (parallax movement)
      if (blob1Ref.current) {
        const b1X = (currentScrollY * -0.22).toFixed(1)
        const b1Y = (currentScrollY * -0.32).toFixed(1)
        const b1Rot = (currentScrollY * 0.03).toFixed(1)
        blob1Ref.current.style.transform = `translate3d(${b1X}px, ${b1Y}px, 0) rotate(${b1Rot}deg)`
      }

      if (blob2Ref.current) {
        const b2X = (currentScrollY * 0.28).toFixed(1)
        const b2Y = (currentScrollY * -0.38).toFixed(1)
        const b2Rot = (currentScrollY * -0.035).toFixed(1)
        blob2Ref.current.style.transform = `translate3d(${b2X}px, ${b2Y}px, 0) rotate(${b2Rot}deg)`
      }

      if (blob3Ref.current) {
        const b3X = (currentScrollY * -0.18).toFixed(1)
        const b3Y = (currentScrollY * -0.44).toFixed(1)
        const b3Scale = (1 + Math.min(currentScrollY * 0.00025, 0.2)).toFixed(3)
        blob3Ref.current.style.transform = `translate3d(${b3X}px, ${b3Y}px, 0) scale(${b3Scale})`
      }

      if (blob4Ref.current) {
        const b4X = (currentScrollY * 0.24).toFixed(1)
        const b4Y = (currentScrollY * -0.55).toFixed(1)
        blob4Ref.current.style.transform = `translate3d(${b4X}px, ${b4Y}px, 0)`
      }

      rafId = requestAnimationFrame(loop)
    }

    const onScroll = () => {
      targetScrollY = window.scrollY || 0
      // Hệ số 0.05 giúp màu chuyển đổi từ từ, chuyển tiếp mượt mà qua các dải màu cực quang
      targetHue = (targetScrollY * 0.05) % 360
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    rafId = requestAnimationFrame(loop)

    return () => {
      isRunning = false
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
      {/* Khối cực quang 1: Dải xanh ngọc Emerald & Cyan (di chuyển từ góc trên bên trái) */}
      <div ref={blob1Ref} className="aurora-blob-wrapper aurora-blob-pos-1">
        <div className="aurora-blob-inner aurora-blob-inner-1" />
      </div>

      {/* Khối cực quang 2: Dải tím huyền ảo Violet & Magenta (di chuyển từ góc trên bên phải) */}
      <div ref={blob2Ref} className="aurora-blob-wrapper aurora-blob-pos-2">
        <div className="aurora-blob-inner aurora-blob-inner-2" />
      </div>

      {/* Khối cực quang 3: Dải lam ngọc Cyan & Vệt vàng Amber (dâng từ trung tâm) */}
      <div ref={blob3Ref} className="aurora-blob-wrapper aurora-blob-pos-3">
        <div className="aurora-blob-inner aurora-blob-inner-3" />
      </div>

      {/* Khối cực quang 4: Sóng cực quang tầng sâu dâng mạnh khi cuộn xuống bảng */}
      <div ref={blob4Ref} className="aurora-blob-wrapper aurora-blob-pos-4">
        <div className="aurora-blob-inner aurora-blob-inner-4" />
      </div>

      {/* Lớp phủ vignette mềm tạo độ sâu không gian Arctic */}
      <div className="aurora-overlay-vignette absolute inset-0 pointer-events-none" />
    </div>
  )
}
