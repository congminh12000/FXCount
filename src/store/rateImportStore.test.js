import { describe, expect, it } from 'vitest'
import { defaultCurrencies } from '../data/defaults'
import {
  adjustedPricePerNote,
  buildRateImportState,
  buyPricePerNote,
  changeCurrencyAnchor,
  migrateV7Currencies,
  migrateV8Currencies,
  restoreRateImportBackup,
} from './useStore'

describe('rate import store', () => {
  it('tính giá sau điều chỉnh theo từng tờ', () => {
    expect(adjustedPricePerNote(2_615_000, -5_000)).toBe(2_610_000)
    expect(adjustedPricePerNote(2_615_000, -10_000)).toBe(2_605_000)
    expect(adjustedPricePerNote(2_000, -5_000)).toBe(1)
  })

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

  it('migrate SGD và CHF về tờ chuẩn 100 mà giữ nguyên giá từng mệnh giá', () => {
    const currencies = defaultCurrencies().map((currency) => {
      if (currency.code === 'SGD') {
        return { ...currency, anchorValue: 10_000, buyAnchorPrice: 200_000_000 }
      }
      if (currency.code === 'CHF') {
        return { ...currency, anchorValue: 1_000, buyAnchorPrice: 31_500_000 }
      }
      return currency
    })

    const migrated = migrateV7Currencies(currencies)
    const sgd = migrated.find((currency) => currency.code === 'SGD')
    const chf = migrated.find((currency) => currency.code === 'CHF')

    expect(sgd.anchorValue).toBe(100)
    expect(sgd.buyAnchorPrice).toBe(2_000_000)
    expect(chf.anchorValue).toBe(100)
    expect(chf.buyAnchorPrice).toBe(3_150_000)
  })

  it('import SGD và CHF tự sửa anchor cũ về tờ chuẩn 100', () => {
    const currencies = defaultCurrencies().map((currency) => {
      if (currency.code === 'SGD') {
        return { ...currency, anchorValue: 10_000, buyAnchorPrice: 200_000_000 }
      }
      if (currency.code === 'CHF') {
        return { ...currency, anchorValue: 1_000, buyAnchorPrice: 31_500_000 }
      }
      return currency
    })
    const state = { currencies, bill: { type: 'buy', items: [] } }
    const partial = buildRateImportState(state, [
      { code: 'SGD', kind: 'buy', appAnchor: 100, proposedValue: 2_000_000 },
      { code: 'CHF', kind: 'buy', appAnchor: 100, proposedValue: 3_150_000 },
    ])
    const sgd = partial.currencies.find((currency) => currency.code === 'SGD')
    const chf = partial.currencies.find((currency) => currency.code === 'CHF')

    expect(sgd).toMatchObject({ anchorValue: 100, buyAnchorPrice: 2_000_000 })
    expect(chf).toMatchObject({ anchorValue: 100, buyAnchorPrice: 3_150_000 })
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

  it('bổ sung tờ 100 GBP cho dữ liệu đã lưu và giữ nguyên giá hiện tại', () => {
    const currencies = defaultCurrencies().map((currency) =>
      currency.code === 'GBP'
        ? {
            ...currency,
            buyAnchorPrice: 345_000,
            denominations: currency.denominations.filter((denom) => denom.value !== 100),
          }
        : currency
    )

    const migrated = migrateV8Currencies(currencies)
    const gbp = migrated.find((currency) => currency.code === 'GBP')
    const gbp100 = gbp.denominations.find((denom) => denom.value === 100)

    expect(gbp.denominations.map((denom) => denom.value)).toEqual([100, 50, 20, 10, 5])
    expect(gbp.anchorValue).toBe(10)
    expect(gbp.buyAnchorPrice).toBe(345_000)
    expect(buyPricePerNote(gbp, gbp100)).toBe(3_450_000)
  })
})
