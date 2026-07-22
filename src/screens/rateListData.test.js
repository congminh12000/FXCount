import { describe, expect, it } from 'vitest'
import { defaultCurrencies } from '../data/defaults'
import { buildRateListRows } from './rateListData'

describe('buildRateListRows', () => {
  it('chỉ lấy ngoại tệ đang bật và giữ nguyên thứ tự cài đặt', () => {
    const currencies = defaultCurrencies().map((currency) =>
      currency.code === 'EUR' ? { ...currency, enabled: false } : currency
    )
    const rows = buildRateListRows(currencies)

    expect(rows.some((row) => row.code === 'EUR')).toBe(false)
    expect(rows.slice(0, 3).map((row) => row.code)).toEqual(['USD', 'EURC', 'JPY'])
  })

  it('lấy đúng mệnh giá chuẩn và giá mua bán hiện tại', () => {
    const rows = buildRateListRows(defaultCurrencies())
    const usd = rows.find((row) => row.code === 'USD')
    const sgd = rows.find((row) => row.code === 'SGD')

    expect(usd).toMatchObject({ anchorValue: 100, buyPrice: 2_630_000, sellPrice: 2_660_000 })
    expect(sgd).toMatchObject({ anchorValue: 100, buyPrice: 2_000_000, sellPrice: null })
  })

  it('trả giá trống khi ngoại tệ chưa có tờ chuẩn', () => {
    const rows = buildRateListRows([
      { code: 'ABC', name: 'Tiền thử', flag: '💱', enabled: true, denominations: [] },
    ])

    expect(rows[0]).toMatchObject({ anchorValue: null, buyPrice: null, sellPrice: null })
  })
})
