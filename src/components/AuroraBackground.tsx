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
      {/* Nền gradient trung tính cực nhẹ ở đỉnh trang */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100/60 via-transparent to-transparent dark:from-slate-900/40 dark:via-transparent dark:to-transparent" />
    </div>
  )
}
