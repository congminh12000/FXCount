import { uid } from '../utils/format'

// Giá theo TỜ CHUẨN (mệnh giá bắt đầu bằng số 1, lớn nhất của mỗi loại tiền).
// buyAnchorPrice / sellAnchorPrice = đ cho 1 tờ chuẩn — người dùng tự chỉnh trong Cài đặt.
// adjustBuy = chênh lệch giá mua đ/tờ so với tỷ lệ từ tờ chuẩn (âm = trừ, dương = cộng).
const d = (value, adjustBuy = 0) => ({ id: uid(), value, adjustBuy })

export function defaultCurrencies() {
  return [
    {
      code: 'USD',
      name: 'Đô la Mỹ',
      flag: '🇺🇸',
      enabled: true,
      buyAnchorPrice: 2615000,
      sellAnchorPrice: 2635000,
      denominations: [d(100), d(50, -10000), d(20), d(10), d(5), d(2), d(1)],
    },
    {
      code: 'EUR',
      name: 'Euro',
      flag: '🇪🇺',
      enabled: true,
      buyAnchorPrice: 3050000,
      sellAnchorPrice: 3085000,
      denominations: [d(500), d(200), d(100), d(50), d(20), d(10), d(5)],
    },
    {
      code: 'JPY',
      name: 'Yên Nhật',
      flag: '🇯🇵',
      enabled: true,
      buyAnchorPrice: 1710000,
      sellAnchorPrice: 1740000,
      denominations: [d(10000), d(5000), d(2000), d(1000)],
    },
    {
      code: 'KRW',
      name: 'Won Hàn Quốc',
      flag: '🇰🇷',
      enabled: true,
      buyAnchorPrice: 150000,
      sellAnchorPrice: 160000,
      denominations: [d(50000, 50000), d(10000), d(5000), d(1000)],
    },
    {
      code: 'CNY',
      name: 'Nhân dân tệ',
      flag: '🇨🇳',
      enabled: true,
      buyAnchorPrice: 365000,
      sellAnchorPrice: 372000,
      denominations: [d(100), d(50), d(20), d(10), d(5), d(1)],
    },
    {
      code: 'GBP',
      name: 'Bảng Anh',
      flag: '🇬🇧',
      enabled: true,
      buyAnchorPrice: 350000,
      sellAnchorPrice: 356000,
      denominations: [d(50), d(20), d(10), d(5)],
    },
    {
      code: 'AUD',
      name: 'Đô la Úc',
      flag: '🇦🇺',
      enabled: false,
      buyAnchorPrice: 1720000,
      sellAnchorPrice: 1750000,
      denominations: [d(100), d(50), d(20), d(10), d(5)],
    },
    {
      code: 'CAD',
      name: 'Đô la Canada',
      flag: '🇨🇦',
      enabled: false,
      buyAnchorPrice: 1900000,
      sellAnchorPrice: 1935000,
      denominations: [d(100), d(50), d(20), d(10), d(5)],
    },
    {
      code: 'SGD',
      name: 'Đô la Singapore',
      flag: '🇸🇬',
      enabled: false,
      buyAnchorPrice: 20400000,
      sellAnchorPrice: 20700000,
      denominations: [d(1000), d(100), d(50), d(10), d(5), d(2)],
    },
    {
      code: 'THB',
      name: 'Bạt Thái',
      flag: '🇹🇭',
      enabled: false,
      buyAnchorPrice: 800000,
      sellAnchorPrice: 818000,
      denominations: [d(1000), d(500), d(100), d(50), d(20)],
    },
  ]
}
