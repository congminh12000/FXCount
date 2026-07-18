import { uid } from '../utils/format'

// Đơn giá mẫu (VND / 1 đơn vị ngoại tệ) — người dùng tự chỉnh trong Cài đặt.
const r = (label, rate) => ({ id: uid(), label, rate })
const d = (value, buyRates, sellRates) => ({
  id: uid(),
  value,
  buyRates: buyRates.map(([label, rate]) => r(label, rate)),
  sellRates: sellRates.map(([label, rate]) => r(label, rate)),
})

export function defaultCurrencies() {
  return [
    {
      code: 'USD',
      name: 'Đô la Mỹ',
      flag: '🇺🇸',
      enabled: true,
      denominations: [
        d(100, [['Giá chuẩn', 26150], ['Giá tốt', 26200]], [['Giá chuẩn', 26350]]),
        d(50, [['Giá chuẩn', 26100]], [['Giá chuẩn', 26350]]),
        d(20, [['Giá chuẩn', 25900]], [['Giá chuẩn', 26300]]),
        d(10, [['Giá chuẩn', 25900]], [['Giá chuẩn', 26300]]),
        d(5, [['Giá chuẩn', 25700]], [['Giá chuẩn', 26300]]),
        d(2, [['Giá chuẩn', 25500]], [['Giá chuẩn', 26300]]),
        d(1, [['Giá chuẩn', 25500]], [['Giá chuẩn', 26300]]),
      ],
    },
    {
      code: 'EUR',
      name: 'Euro',
      flag: '🇪🇺',
      enabled: true,
      denominations: [
        d(500, [['Giá chuẩn', 30500]], [['Giá chuẩn', 30850]]),
        d(200, [['Giá chuẩn', 30500]], [['Giá chuẩn', 30850]]),
        d(100, [['Giá chuẩn', 30500]], [['Giá chuẩn', 30850]]),
        d(50, [['Giá chuẩn', 30400]], [['Giá chuẩn', 30850]]),
        d(20, [['Giá chuẩn', 30300]], [['Giá chuẩn', 30800]]),
        d(10, [['Giá chuẩn', 30300]], [['Giá chuẩn', 30800]]),
        d(5, [['Giá chuẩn', 30200]], [['Giá chuẩn', 30800]]),
      ],
    },
    {
      code: 'JPY',
      name: 'Yên Nhật',
      flag: '🇯🇵',
      enabled: true,
      denominations: [
        d(10000, [['Giá chuẩn', 171]], [['Giá chuẩn', 174]]),
        d(5000, [['Giá chuẩn', 170]], [['Giá chuẩn', 174]]),
        d(2000, [['Giá chuẩn', 169]], [['Giá chuẩn', 174]]),
        d(1000, [['Giá chuẩn', 169]], [['Giá chuẩn', 174]]),
      ],
    },
    {
      code: 'KRW',
      name: 'Won Hàn Quốc',
      flag: '🇰🇷',
      enabled: true,
      denominations: [
        d(50000, [['Giá chuẩn', 18.5]], [['Giá chuẩn', 19.2]]),
        d(10000, [['Giá chuẩn', 18.3]], [['Giá chuẩn', 19.2]]),
        d(5000, [['Giá chuẩn', 18]], [['Giá chuẩn', 19.2]]),
        d(1000, [['Giá chuẩn', 18]], [['Giá chuẩn', 19.2]]),
      ],
    },
    {
      code: 'CNY',
      name: 'Nhân dân tệ',
      flag: '🇨🇳',
      enabled: true,
      denominations: [
        d(100, [['Giá chuẩn', 3650]], [['Giá chuẩn', 3720]]),
        d(50, [['Giá chuẩn', 3630]], [['Giá chuẩn', 3720]]),
        d(20, [['Giá chuẩn', 3600]], [['Giá chuẩn', 3710]]),
        d(10, [['Giá chuẩn', 3600]], [['Giá chuẩn', 3710]]),
        d(5, [['Giá chuẩn', 3580]], [['Giá chuẩn', 3710]]),
        d(1, [['Giá chuẩn', 3580]], [['Giá chuẩn', 3710]]),
      ],
    },
    {
      code: 'GBP',
      name: 'Bảng Anh',
      flag: '🇬🇧',
      enabled: true,
      denominations: [
        d(50, [['Giá chuẩn', 35200]], [['Giá chuẩn', 35650]]),
        d(20, [['Giá chuẩn', 35100]], [['Giá chuẩn', 35650]]),
        d(10, [['Giá chuẩn', 35000]], [['Giá chuẩn', 35600]]),
        d(5, [['Giá chuẩn', 34900]], [['Giá chuẩn', 35600]]),
      ],
    },
    {
      code: 'AUD',
      name: 'Đô la Úc',
      flag: '🇦🇺',
      enabled: false,
      denominations: [
        d(100, [['Giá chuẩn', 17200]], [['Giá chuẩn', 17500]]),
        d(50, [['Giá chuẩn', 17150]], [['Giá chuẩn', 17500]]),
        d(20, [['Giá chuẩn', 17100]], [['Giá chuẩn', 17450]]),
        d(10, [['Giá chuẩn', 17050]], [['Giá chuẩn', 17450]]),
        d(5, [['Giá chuẩn', 17000]], [['Giá chuẩn', 17450]]),
      ],
    },
    {
      code: 'CAD',
      name: 'Đô la Canada',
      flag: '🇨🇦',
      enabled: false,
      denominations: [
        d(100, [['Giá chuẩn', 19000]], [['Giá chuẩn', 19350]]),
        d(50, [['Giá chuẩn', 18950]], [['Giá chuẩn', 19350]]),
        d(20, [['Giá chuẩn', 18900]], [['Giá chuẩn', 19300]]),
        d(10, [['Giá chuẩn', 18850]], [['Giá chuẩn', 19300]]),
        d(5, [['Giá chuẩn', 18800]], [['Giá chuẩn', 19300]]),
      ],
    },
    {
      code: 'SGD',
      name: 'Đô la Singapore',
      flag: '🇸🇬',
      enabled: false,
      denominations: [
        d(1000, [['Giá chuẩn', 20400]], [['Giá chuẩn', 20700]]),
        d(100, [['Giá chuẩn', 20350]], [['Giá chuẩn', 20700]]),
        d(50, [['Giá chuẩn', 20300]], [['Giá chuẩn', 20650]]),
        d(10, [['Giá chuẩn', 20250]], [['Giá chuẩn', 20650]]),
        d(5, [['Giá chuẩn', 20200]], [['Giá chuẩn', 20650]]),
        d(2, [['Giá chuẩn', 20200]], [['Giá chuẩn', 20650]]),
      ],
    },
    {
      code: 'THB',
      name: 'Bạt Thái',
      flag: '🇹🇭',
      enabled: false,
      denominations: [
        d(1000, [['Giá chuẩn', 800]], [['Giá chuẩn', 818]]),
        d(500, [['Giá chuẩn', 798]], [['Giá chuẩn', 818]]),
        d(100, [['Giá chuẩn', 795]], [['Giá chuẩn', 815]]),
        d(50, [['Giá chuẩn', 792]], [['Giá chuẩn', 815]]),
        d(20, [['Giá chuẩn', 790]], [['Giá chuẩn', 815]]),
      ],
    },
  ]
}
