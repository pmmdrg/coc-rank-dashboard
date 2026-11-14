/**
 * AuroraBackground - Nền tối giản, thanh lịch, không gây rối mắt
 * Loại bỏ các khối màu cực quang chuyển động để giao diện gọn gàng, tập trung vào dữ liệu.
 */
export function AuroraBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-100"
      aria-hidden="true"
    >
      {/* Nền hào quang Crimson cực nhẹ ở đỉnh trang theo concept TH19 */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/25 via-transparent to-transparent" />
    </div>
  )
}
