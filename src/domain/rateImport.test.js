import { describe, expect, it } from 'vitest'
import { normalizeRateSheetExtraction } from './rateImport'

const row = (sourceLabel, currencyCode, kind, sheetValue, confidence = 0.98) => ({
  sourceLabel,
  currencyCode,
  kind,
  sheetValue,
  confidence,
  note: '',
})

describe('normalizeRateSheetExtraction', () => {
  it('chuẩn hoá đầy đủ tờ giấy mẫu', () => {
    const result = normalizeRateSheetExtraction({
      sheetDateLabel: '16/7',
      warnings: [],
      rows: [
        row('2615', 'USD', 'buy', 2615),
        row('2655', 'USD', 'sell', 2655),
        row('E 2970', 'EUR', 'buy', 2970),
        row('E cũ 2950', 'EURC', 'buy', 2950),
        row('Y 1595', 'JPY', 'buy', 1595),
        row('C 1830', 'CAD', 'buy', 1830),
        row('UC 1800', 'AUD', 'buy', 1800),
        row('S 2000', 'SGD', 'buy', 2000),
        row('TS 3150', 'CHF', 'buy', 3150),
        row('BA 3410', 'GBP', 'buy', 3410),
        row('ĐL 785', 'TWD', 'buy', 785),
        row('TQ 375', 'CNY', 'buy', 375),
        row('TL 790', 'THB', 'buy', 790),
        row('MY 630', 'MYR', 'buy', 630),
        row('HQ 50 160', 'KRW', 'krw_50_5', 160),
        row('HQ 10 150', 'KRW', 'krw_10_1', 150),
        row('NZ 1410', 'NZD', 'buy', 1410),
      ],
    })

    const values = Object.fromEntries(
      result.entries.map((entry) => [`${entry.code}:${entry.kind}`, entry.proposedValue])
    )
    expect(result.sheetDateLabel).toBe('16/7')
    expect(result.entries).toHaveLength(17)
    expect(values['USD:buy']).toBe(2_615_000)
    expect(values['USD:sell']).toBe(2_655_000)
    expect(values['EUR:buy']).toBe(2_970_000)
    expect(values['EURC:buy']).toBe(2_950_000)
    expect(values['JPY:buy']).toBe(1_595_000)
    expect(values['CAD:buy']).toBe(1_830_000)
    expect(values['AUD:buy']).toBe(1_800_000)
    expect(values['SGD:buy']).toBe(200_000_000)
    expect(values['CHF:buy']).toBe(31_500_000)
    expect(values['GBP:buy']).toBe(341_000)
    expect(values['TWD:buy']).toBe(785_000)
    expect(values['CNY:buy']).toBe(375_000)
    expect(values['THB:buy']).toBe(790_000)
    expect(values['MYR:buy']).toBe(630_000)
    expect(values['NZD:buy']).toBe(141_000)
    expect(values['KRW:krw_50_5']).toBe(16_000)
    expect(values['KRW:krw_10_1']).toBe(15_000)
  })

  it('loại dòng lạ, trùng và ngoài khoảng an toàn', () => {
    const result = normalizeRateSheetExtraction({
      sheetDateLabel: null,
      warnings: [],
      rows: [
        row('E 2970', 'EUR', 'buy', 2970),
        row('E 3000', 'EUR', 'buy', 3000),
        row('???', 'UNKNOWN', 'unknown', 999),
        row('USD 99', 'USD', 'buy', 99),
      ],
    })
    expect(result.entries).toHaveLength(1)
    expect(result.warnings).toHaveLength(3)
  })

  it('đánh dấu dòng có độ tin cậy thấp', () => {
    const result = normalizeRateSheetExtraction({
      sheetDateLabel: null,
      warnings: [],
      rows: [row('TQ 375', 'CNY', 'buy', 375, 0.72)],
    })
    expect(result.entries[0].needsReview).toBe(true)
  })

  it('giữ dòng cố định không đọc được để người dùng sửa hoặc bỏ chọn', () => {
    const result = normalizeRateSheetExtraction(
      {
        sheetDateLabel: null,
        warnings: [],
        rows: [row('không đọc được', 'EUR', 'buy', null, 0)],
      },
      { keepUnreadable: true }
    )

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0]).toMatchObject({
      code: 'EUR',
      proposedValue: null,
      needsReview: true,
    })
    expect(result.warnings).toHaveLength(1)
  })
})
