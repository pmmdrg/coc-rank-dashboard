import { useEffect, useRef } from 'react'

/**
 * AuroraBackground - Hiệu ứng cực quang Bắc Cực (Aurora Borealis) cao cấp
 * - Chuyển màu từ từ, mềm mại theo quán tính mượt mà (LERP momentum) khi cuộn chuột
 * - Các khối mây cực quang (Aurora blobs) luôn bao phủ toàn bộ viewport, uốn lượn và đổi chỗ nhịp nhàng theo cuộn chuột, KHÔNG BAO GIỜ bị trôi mất khỏi màn hình khi cuộn xuống dưới
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
    let targetHue = (targetScrollY * 0.045) % 360
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

      // Tỉ lệ cuộn từ 0 (đỉnh trang) tới 1 (đáy trang)
      const docHeight = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      )
      const scrollRatio = Math.min(Math.max(currentScrollY / docHeight, 0), 1)

      if (containerRef.current) {
        containerRef.current.style.setProperty('--aurora-hue', `${currentHue.toFixed(2)}deg`)
      }
      document.documentElement.style.setProperty('--aurora-scroll-hue', `${currentHue.toFixed(2)}deg`)

      // Di chuyển các khối cực quang nhịp nhàng THEO CUỘN CHUỘT nhưng LUÔN NẰM TRONG VIEWPORT
      // Sử dụng hàm sóng lượng giác biên độ hữu hạn để các khối màu uốn lượn, đổi chỗ cho nhau, không bao giờ trôi mất khỏi màn hình

      // Khối 1 (Emerald & Cyan): Lượn sóng ngang và nhấp nhô nhẹ ở mảng trên
      if (blob1Ref.current) {
        const b1X = (Math.sin(currentScrollY * 0.0022) * 110 + scrollRatio * 50).toFixed(1)
        const b1Y = (Math.cos(currentScrollY * 0.0018) * 80 + Math.sin(scrollRatio * Math.PI) * 70).toFixed(1)
        const b1Rot = (Math.sin(currentScrollY * 0.0015) * 16).toFixed(1)
        const b1Scale = (1 + Math.sin(currentScrollY * 0.002) * 0.08).toFixed(3)
        blob1Ref.current.style.transform = `translate3d(${b1X}px, ${b1Y}px, 0) rotate(${b1Rot}deg) scale(${b1Scale})`
      }

      // Khối 2 (Violet & Magenta): Quét chéo, dạt xuống và giãn rộng theo nhịp cuộn
      if (blob2Ref.current) {
        const b2X = (-Math.sin(currentScrollY * 0.002) * 130 - scrollRatio * 70).toFixed(1)
        const b2Y = (Math.sin(currentScrollY * 0.0019) * 90 + scrollRatio * 110).toFixed(1)
        const b2Rot = (-Math.cos(currentScrollY * 0.0016) * 18).toFixed(1)
        const b2Scale = (1 + Math.cos(currentScrollY * 0.0022) * 0.1).toFixed(3)
        blob2Ref.current.style.transform = `translate3d(${b2X}px, ${b2Y}px, 0) rotate(${b2Rot}deg) scale(${b2Scale})`
      }

      // Khối 3 (Cyan & Solar Amber): Uốn lượn ở khu vực trung tâm, nở to khi cuộn giữa trang
      if (blob3Ref.current) {
        const b3X = (Math.cos(currentScrollY * 0.0021) * 120 + Math.sin(scrollRatio * Math.PI * 2) * 60).toFixed(1)
        const b3Y = (-Math.sin(currentScrollY * 0.0017) * 90 + (scrollRatio - 0.5) * 120).toFixed(1)
        const b3Scale = (1.02 + Math.sin(scrollRatio * Math.PI) * 0.16).toFixed(3)
        blob3Ref.current.style.transform = `translate3d(${b3X}px, ${b3Y}px, 0) scale(${b3Scale})`
      }

      // Khối 4 (Deep Cosmic Wave): Dâng lên và rực rỡ mạnh mẽ ở nửa dưới khi cuộn vào bảng xếp hạng & chân trang
      if (blob4Ref.current) {
        const b4X = (-Math.cos(currentScrollY * 0.0023) * 110 + (1 - scrollRatio) * 40).toFixed(1)
        const b4Y = (Math.sin(currentScrollY * 0.0018) * 80 - scrollRatio * 90).toFixed(1)
        const b4Scale = (0.95 + scrollRatio * 0.22).toFixed(3)
        blob4Ref.current.style.transform = `translate3d(${b4X}px, ${b4Y}px, 0) scale(${b4Scale})`
      }

      rafId = requestAnimationFrame(loop)
    }

    const onScroll = () => {
      targetScrollY = window.scrollY || 0
      // Đổi màu cực quang từ tốn theo từng vòng cuộn, êm ái
      targetHue = (targetScrollY * 0.045) % 360
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
      {/* Khối cực quang 1: Dải xanh ngọc Emerald & Cyan (uốn lượn ở góc trên bên trái) */}
      <div ref={blob1Ref} className="aurora-blob-wrapper aurora-blob-pos-1">
        <div className="aurora-blob-inner aurora-blob-inner-1" />
      </div>

      {/* Khối cực quang 2: Dải tím huyền ảo Violet & Magenta (uốn lượn ở góc trên bên phải) */}
      <div ref={blob2Ref} className="aurora-blob-wrapper aurora-blob-pos-2">
        <div className="aurora-blob-inner aurora-blob-inner-2" />
      </div>

      {/* Khối cực quang 3: Dải lam ngọc Cyan & Vệt vàng Amber (dập dềnh ở trung tâm) */}
      <div ref={blob3Ref} className="aurora-blob-wrapper aurora-blob-pos-3">
        <div className="aurora-blob-inner aurora-blob-inner-3" />
      </div>

      {/* Khối cực quang 4: Sóng cực quang tầng sâu rực rỡ ở nửa dưới màn hình khi xem bảng xếp hạng & chân trang */}
      <div ref={blob4Ref} className="aurora-blob-wrapper aurora-blob-pos-4">
        <div className="aurora-blob-inner aurora-blob-inner-4" />
      </div>

      {/* Lớp phủ vignette mềm tạo độ sâu không gian Arctic */}
      <div className="aurora-overlay-vignette absolute inset-0 pointer-events-none" />
    </div>
  )
}
