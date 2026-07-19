# FXCount

Web app mobile-first tính giá giao dịch ngoại tệ (mua vào / bán ra) cho quầy thu đổi — nhanh và chính xác hơn tính thủ công.

## Tính năng

- **Step-by-step**: Mua/Bán → chọn ngoại tệ → chọn mệnh giá → nhập số tờ → bill
- **Hệ thống giá linh hoạt**: tự chọn **tờ chuẩn** cho từng ngoại tệ và nhập giá mua/bán; các mệnh giá khác có thể tự tính theo tỷ lệ, cài **cộng/trừ chênh lệch đ/tờ**, hoặc dùng **giá mua riêng theo đơn vị quy ước** (VD USD 20/10 dùng 23.000 đ/USD; tờ 5.000 KRW dùng 16.000đ/1.000 KRW)
- **1 bill gộp nhiều ngoại tệ + mệnh giá**, tổng cuối bằng VND
- **Lịch sử giao dịch** theo ngày, lưu ngay trên máy (localStorage, không cần đăng nhập, offline được)
- **PWA**: thêm vào màn hình chính điện thoại, dùng như app thật
- **Import bảng giá từ ảnh**: chụp/chọn ảnh viết tay, AI đọc theo quy ước của tiệm, duyệt từng dòng rồi mới cập nhật và có thể hoàn tác
- Giao diện tối vàng–đen, hiệu ứng chạm và chuyển cảnh mượt

## Tech

Vite + React 19 · Tailwind CSS 4 · Framer Motion · Zustand (persist) · vite-plugin-pwa

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build production vào dist/
npm run preview  # xem thử bản build
```

## Import bảng giá bằng AI

Tạo `.env.local` từ `.env.example` và đặt các biến:

```bash
OPENAI_API_KEY=...
OPENAI_VISION_MODEL=gpt-5.6-sol
```

Không đặt API key trong biến `VITE_*` vì các biến đó sẽ bị đưa xuống trình duyệt. Khi deploy Vercel, thêm các biến trên vào Project Settings → Environment Variables cho Production và Preview.

Chạy cả Vite app và Vercel Function ở local bằng:

```bash
npm run dev:full
```

`npm run dev` chỉ chạy giao diện Vite nên endpoint `/api/import-rates` không hoạt động. Ảnh được thu nhỏ trong trình duyệt, gửi tạm thời đến OpenAI để nhận dạng và không được lưu trong Zustand/localStorage.
