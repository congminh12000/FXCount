import { describe, expect, it } from 'vitest'
import {
  MAX_RATE_IMPORT_JSON_BYTES,
  parseRateImportJson,
  RATE_IMPORT_JSON_TEMPLATE_TEXT,
} from './jsonRateImport'

const fullPayload = {
  version: 1,
  sheetDateLabel: '20/7',
  rates: {
    usdBuy: 2610,
    usdSell: 2650,
    eur: 2970,
    eurc: 2950,
    jpy: 1590,
    cad: 1830,
    aud: 1800,
    sgd: 2000,
    chf: 3150,
    gbp: 3410,
    twd: 770,
    cny: 375,
    thb: 790,
    myr: 630,
    krw50_5: 160,
    krw10_1: 150,
    nzd: 1410,
  },
}

describe('parseRateImportJson', () => {
  it('ánh xạ và quy đổi đủ 17 giá của JSON V1', () => {
    const result = parseRateImportJson(JSON.stringify(fullPayload))
    const values = Object.fromEntries(
      result.entries.map((entry) => [`${entry.code}:${entry.kind}`, entry.proposedValue])
    )

    expect(result.sheetDateLabel).toBe('20/7')
    expect(result.entries).toHaveLength(17)
    expect(values['USD:buy']).toBe(2_610_000)
    expect(values['USD:sell']).toBe(2_650_000)
    expect(values['EUR:buy']).toBe(2_970_000)
    expect(values['EURC:buy']).toBe(2_950_000)
    expect(values['JPY:buy']).toBe(1_590_000)
    expect(values['CAD:buy']).toBe(1_830_000)
    expect(values['AUD:buy']).toBe(1_800_000)
    expect(values['SGD:buy']).toBe(200_000_000)
    expect(values['CHF:buy']).toBe(31_500_000)
    expect(values['GBP:buy']).toBe(341_000)
    expect(values['TWD:buy']).toBe(770_000)
    expect(values['CNY:buy']).toBe(375_000)
    expect(values['THB:buy']).toBe(790_000)
    expect(values['MYR:buy']).toBe(630_000)
    expect(values['KRW:krw_50_5']).toBe(16_000)
    expect(values['KRW:krw_10_1']).toBe(15_000)
    expect(values['NZD:buy']).toBe(141_000)
  })

  it('chấp nhận JSON được bọc trong code fence', () => {
    const result = parseRateImportJson(`\`\`\`json\n${JSON.stringify(fullPayload)}\n\`\`\``)
    expect(result.entries).toHaveLength(17)
  })

  it('giữ nguyên trường thiếu, null và cảnh báo khóa lạ hoặc giá sai', () => {
    const result = parseRateImportJson(
      JSON.stringify({
        version: 1,
        sheetDateLabel: '99/20',
        rates: {
          usdBuy: 2610,
          usdSell: null,
          eur: '2970',
          cny: 37.5,
          mystery: 999,
        },
      })
    )

    expect(result.sheetDateLabel).toBeNull()
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0]).toMatchObject({ code: 'USD', kind: 'buy' })
    expect(result.warnings.join(' ')).toContain('mystery')
    expect(result.warnings.join(' ')).toContain('số nguyên dương')
    expect(result.warnings.join(' ')).toContain('app giữ nguyên')
  })

  it('bỏ giá ngoài khoảng an toàn', () => {
    const result = parseRateImportJson(
      JSON.stringify({ version: 1, sheetDateLabel: null, rates: { usdBuy: 2610, eur: 99 } })
    )
    expect(result.entries).toHaveLength(1)
    expect(result.warnings.join(' ')).toContain('ngoài quy tắc an toàn')
  })

  it.each([
    ['', 'JSON_EMPTY'],
    ['{', 'JSON_INVALID'],
    [JSON.stringify([]), 'JSON_INVALID_SHAPE'],
    [JSON.stringify({ version: 2, rates: {} }), 'JSON_UNSUPPORTED_VERSION'],
    [JSON.stringify({ version: 1 }), 'JSON_MISSING_RATES'],
    [RATE_IMPORT_JSON_TEMPLATE_TEXT, 'JSON_NO_VALID_RATES'],
  ])('chặn dữ liệu không thể import', (input, error) => {
    expect(() => parseRateImportJson(input)).toThrow(error)
  })

  it('chặn nội dung lớn hơn 100KB', () => {
    expect(() => parseRateImportJson(' '.repeat(MAX_RATE_IMPORT_JSON_BYTES + 1))).toThrow(
      'JSON_TOO_LARGE'
    )
  })
})
