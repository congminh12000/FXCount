import { describe, expect, it } from 'vitest'
import { defaultCurrencies } from '../data/defaults'
import {
  buildRateImportState,
  buyPricePerNote,
  changeCurrencyAnchor,
  restoreRateImportBackup,
} from './useStore'

describe('rate import store', () => {
  it('áp dụng nguyên tử, giữ quy tắc USD nhỏ và tính lại bill đang mở', () => {
    const currencies = defaultCurrencies()
    const usd = currencies.find((currency) => currency.code === 'USD')
    const usd20 = usd.denominations.find((denom) => denom.value === 20)
    const history = [{ id: 'done', totalVND: 123 }]
    const state = {
      currencies,
      bill: {
        type: 'buy',
        items: [
          {
            id: 'usd',
            currencyCode: 'USD',
            denomValue: 100,
            qty: 2,
            pricePerNote: 1,
            subtotalVND: 2,
          },
        ],
      },
      history,
      lastRateImportBackup: null,
      lastRateImport: null,
    }

    const partial = buildRateImportState(
      state,
      [{ code: 'USD', kind: 'buy', proposedValue: 2_615_000 }],
      { sheetDateLabel: '16/7' },
      123456
    )
    const next = { ...state, ...partial }
    const nextUsd = next.currencies.find((currency) => currency.code === 'USD')
    expect(nextUsd.buyAnchorPrice).toBe(2_615_000)
    expect(nextUsd.denominations.find((denom) => denom.value === 20).fixedBuyRate).toBe(
      usd20.fixedBuyRate
    )
    expect(next.currencies.find((currency) => currency.code === 'EUR')).toEqual(
      currencies.find((currency) => currency.code === 'EUR')
    )
    expect(next.bill.items[0].pricePerNote).toBe(2_615_000)
    expect(next.bill.items[0].subtotalVND).toBe(5_230_000)
    expect(next.history).toBe(history)
    expect(next.lastRateImport.sheetDateLabel).toBe('16/7')

    const restored = { ...next, ...restoreRateImportBackup(next) }
    expect(restored.currencies).toEqual(currencies)
    expect(restored.bill).toEqual(state.bill)
    expect(restored.lastRateImportBackup).toBeNull()
  })

  it('cập nhật hai nhóm KRW đúng công thức', () => {
    const state = { currencies: defaultCurrencies(), bill: { type: 'buy', items: [] } }
    const partial = buildRateImportState(state, [
      { code: 'KRW', kind: 'krw_50_5', proposedValue: 16_000 },
      { code: 'KRW', kind: 'krw_10_1', proposedValue: 15_000 },
    ])
    const krw = partial.currencies.find((currency) => currency.code === 'KRW')
    const price = (value) =>
      buyPricePerNote(krw, krw.denominations.find((denom) => denom.value === value))
    expect(price(50_000)).toBe(800_000)
    expect(price(5_000)).toBe(80_000)
    expect(price(10_000)).toBe(150_000)
    expect(price(1_000)).toBe(15_000)
  })

  it('đổi tờ chuẩn thủ công và giữ giá hiện tại của tờ được chọn', () => {
    const sgd = defaultCurrencies().find((currency) => currency.code === 'SGD')
    const next = changeCurrencyAnchor(sgd, 1000)
    const nextAnchor = next.denominations.find((denom) => denom.value === 1000)

    expect(next.anchorValue).toBe(1000)
    expect(next.buyAnchorPrice).toBe(20_000_000)
    expect(next.sellAnchorPrice).toBeNull()
    expect(buyPricePerNote(next, nextAnchor)).toBe(20_000_000)
  })

  it('bỏ giá riêng khi mệnh giá đó được chọn làm tờ chuẩn', () => {
    const usd = defaultCurrencies().find((currency) => currency.code === 'USD')
    const next = changeCurrencyAnchor(usd, 20)
    const nextAnchor = next.denominations.find((denom) => denom.value === 20)

    expect(next.anchorValue).toBe(20)
    expect(next.buyAnchorPrice).toBe(460_000)
    expect(nextAnchor.fixedBuyRate).toBeUndefined()
    expect(buyPricePerNote(next, nextAnchor)).toBe(460_000)
  })
})
