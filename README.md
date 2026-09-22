# CoC Rank Dashboard 🏆

Bảng thống kê, phân tích và theo dõi thứ hạng người chơi Clash of Clans theo từng mùa giải. Xây dựng bằng React 19, TypeScript, Tailwind CSS và Vite.

---

## ✨ Tính Năng Nổi Bật

- 📊 **Thống kê thứ hạng tự động:** Tính toán thứ hạng, cup tối đa đạt được, số đối thủ có nguy cơ vượt qua bạn và dự đoán rank thấp nhất có thể.
- 🎯 **Phân loại kỹ năng:** Tự động đánh giá kỹ năng người chơi dựa trên số cup trung bình mỗi lượt đánh (*Đỉnh, Kỹ năng tốt, Có tiềm năng, Chưa đánh*).
- 📈 **Biểu đồ trực quan:** Biểu đồ Donut tương phản cao hiển thị tỷ lệ đối thủ so với bạn và phân bổ kỹ năng trong mùa giải.
- 🔄 **Lưu trữ linh hoạt & Auto-save:**
  - **Tự động lưu (Live Auto-save):** Mọi thao tác nhập liệu đều được tự động lưu ngầm.
  - **Máy cục bộ (File System API):** Đọc và ghi đè trực tiếp vào file `.json` hoặc `.csv` trên máy tính.
  - **Google Drive:** Kết nối OAuth 2.0 đồng bộ 2 chiều qua đám mây để sử dụng trên nhiều thiết bị (máy tính, điện thoại).
  - **Lưu nháp an toàn (LocalStorage):** Tự động lưu bản nháp dự phòng, không lo mất dữ liệu khi vô tình tắt tab.
- 📱 **Tương thích hoàn hảo trên điện thoại:** Giao diện Responsive tự co giãn mượt mà, hỗ trợ cuộn bảng ngang và bàn phím số chuyên dụng.
- 🌗 **Chế độ Sáng / Tối (Dark / Light Mode):** Dễ dàng chuyển đổi giao diện theo sở thích.
- 📅 **Quản lý đa mùa giải:** Tạo và chuyển đổi giữa nhiều mùa giải nhanh chóng.

---

## 🚀 Cài Đặt & Chạy Dự Án

### Yêu cầu
- Node.js 18+ trở lên
- npm hoặc pnpm / yarn

### Chạy ở môi trường phát triển (Local Dev)
```bash
# Cài đặt thư viện
npm install

# Khởi động máy chủ phát triển
npm run dev
```
Mở trình duyệt tại: `http://localhost:5173/`

### Kiểm tra lỗi & Biên dịch sản phẩm (Build)
```bash
# Kiểm tra linter
npm run lint

# Biên dịch ra thư mục dist
npm run build
```

---

## 🌐 Deploy Lên Internet (Vercel / Netlify / GitHub Pages)

Dự án là 100% Client-side Static App, **không cần cấu hình file `.env`** và có thể deploy miễn phí:

1. **Vercel (Khuyên dùng):**
   - Đẩy mã nguồn lên GitHub.
   - Đăng nhập [vercel.com](https://vercel.com) và bấm **Import Project**.
   - Bấm **Deploy** là xong ngay.

2. **Netlify Drop:**
   - Chạy `npm run build`.
   - Kéo thả thư mục `dist` vào [app.netlify.com/drop](https://app.netlify.com/drop).

---

## 📄 Cấu Trúc Dữ Liệu

### File JSON
Hỗ trợ cả mùa giải đơn lẻ và file đa mùa giải (Multi-season):
```json
{
  "league": "Legend 3",
  "activeSeasonName": "September 2026",
  "seasons": [ ... ]
}
```

### File CSV
```csv
league,seasonName,startsAt,endsAt,myPlayerId,id,name,rank,attacks,defenses,currentCups,maxPossibleCups,rating
```
Các hạng mục `rating`: `elite`, `contested`, `danger`, `safe`.
