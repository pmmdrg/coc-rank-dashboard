/**
 * AuroraBackground - Nền hào quang theo chuẩn TH19: Đen tuyền, Đỏ Crimson & Vàng ánh kim
 * Kết hợp nhẹ nhàng ánh hào quang Đỏ và Vàng kim phía trên đỉnh màn hình mà không làm rối mắt.
 */
export function AuroraBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-100"
      aria-hidden="true"
    >
      {/* Hào quang kép: Đỏ Crimson góc trái & Vàng ánh kim góc phải */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_25%_-5%,rgba(220,38,38,0.22),transparent_70%),radial-gradient(ellipse_60%_40%_at_80%_-5%,rgba(245,158,11,0.18),transparent_65%)]" />
    </div>
  )
}
