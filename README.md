# FXCount

Web app mobile-first tính giá giao dịch ngoại tệ (mua vào / bán ra) cho quầy thu đổi — nhanh và chính xác hơn tính thủ công.

## Tính năng

- **Step-by-step**: Mua/Bán → chọn ngoại tệ → chọn mệnh giá → nhập số tờ → bill
- **Hệ thống giá linh hoạt**: tự chọn **tờ chuẩn** cho từng ngoại tệ và nhập giá mua/bán; các mệnh giá khác có thể tự tính theo tỷ lệ, cài **cộng/trừ chênh lệch đ/tờ**, hoặc dùng **giá mua riêng theo đơn vị quy ước** (VD USD 20/10 dùng 23.000 đ/USD; tờ 5.000 KRW dùng 16.000đ/1.000 KRW)
- **1 bill gộp nhiều ngoại tệ + mệnh giá**, tổng cuối bằng VND
- **Lịch sử giao dịch** theo ngày, lưu ngay trên máy (localStorage, không cần đăng nhập, offline được)
- **PWA**: thêm vào màn hình chính điện thoại, dùng như app thật
- **Import bảng giá**: nhập/dán JSON do ChatGPT tạo hoặc chụp ảnh để OCR trên thiết bị; luôn duyệt lại trước khi cập nhật và có thể hoàn tác
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

## Import bảng giá bằng OCR offline

- Bộ đọc dùng Tesseract.js/WebAssembly và chỉ nhận dạng 17 ô số theo mẫu giấy cố định V1.
- Ảnh, nội dung OCR và giá không được gửi tới API hoặc dịch vụ bên ngoài.
- `npm run dev` và `npm run build` tự sao chép worker, OCR core và language-data từ `node_modules` sang `public/ocr`.
- Lần đầu mở màn hình import, trình duyệt tải các static assets này từ chính FXCount; service worker lưu chúng để dùng offline ở các lần sau.
- Ảnh chỉ tồn tại trong bộ nhớ của màn hình import, không lưu trong Zustand/localStorage.

Không cần API key hoặc biến môi trường cho tính năng import.

## Import bảng giá bằng JSON

- Trong **Cài đặt → Nhập bảng giá**, chọn **Sao chép hướng dẫn cho ChatGPT** rồi gửi hướng dẫn kèm ảnh bảng giá cho ChatGPT.
- Dán JSON ChatGPT trả về hoặc chọn file `.json` dưới 100KB. App chỉ nhận cấu trúc V1 cố định và kiểm tra khoảng giá trước khi hiển thị màn hình xem lại.
- Giá `null`, thiếu, sai kiểu hoặc ngoài khoảng an toàn không được áp dụng; giá hiện tại tương ứng được giữ nguyên.
- JSON được xử lý hoàn toàn trong trình duyệt. FXCount không tự gửi ảnh hoặc dữ liệu tới ChatGPT.
