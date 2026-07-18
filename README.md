# FXCount

Web app mobile-first tính giá giao dịch ngoại tệ (mua vào / bán ra) cho quầy thu đổi — nhanh và chính xác hơn tính thủ công.

## Tính năng

- **Step-by-step**: Mua/Bán → chọn ngoại tệ → chọn mệnh giá → chọn đơn giá → nhập số tờ → bill
- **Đơn giá tự cài đặt** cho từng mệnh giá của từng ngoại tệ; mỗi mệnh giá có thể có **nhiều đơn giá preset** (giá chuẩn, giá tốt, khách quen…)
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
