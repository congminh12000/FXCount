# FXCount

Web app mobile-first tính giá giao dịch ngoại tệ (mua vào / bán ra) cho quầy thu đổi — nhanh và chính xác hơn tính thủ công.

## Tính năng

- **Step-by-step**: Mua/Bán → chọn ngoại tệ → chọn mệnh giá (giá/tờ hiện ngay trên nút) → nhập số tờ → bill
- **Hệ thống giá "tờ chuẩn + chênh lệch"**: mỗi ngoại tệ chỉ cần nhập giá mua + giá bán cho **tờ chuẩn** (mệnh giá bắt đầu bằng số 1 lớn nhất, VD USD→100, KRW→10.000); các mệnh giá khác tự tính theo tỷ lệ, giá mua có thể cài **cộng/trừ chênh lệch đ/tờ** cho từng mệnh giá (VD tờ 50 USD trừ 10.000 đ/tờ, tờ 50.000₩ cộng 50.000 đ/tờ)
- **1 bill gộp nhiều ngoại tệ + mệnh giá**, tổng cuối bằng VND
- **Lịch sử giao dịch** theo ngày, lưu ngay trên máy (localStorage, không cần đăng nhập, offline được)
- **PWA**: thêm vào màn hình chính điện thoại, dùng như app thật
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
