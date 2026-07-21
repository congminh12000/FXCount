import { describe, expect, it } from 'vitest'
import { RATE_SHEET_RATE_SLOTS, RATE_SHEET_TEMPLATE_V1 } from './rateSheetTemplate'

describe('fixed rate sheet template', () => {
  it('khai báo ngày và đủ 17 ô giá theo đúng thứ tự', () => {
    expect(RATE_SHEET_TEMPLATE_V1[0].kind).toBe('date')
    expect(RATE_SHEET_RATE_SLOTS).toHaveLength(17)
    expect(RATE_SHEET_RATE_SLOTS.map(({ code, kind }) => `${code}:${kind}`)).toEqual([
      'USD:buy',
      'USD:sell',
      'EUR:buy',
      'EURC:buy',
      'JPY:buy',
      'CAD:buy',
      'AUD:buy',
      'SGD:buy',
      'CHF:buy',
      'GBP:buy',
      'TWD:buy',
      'CNY:buy',
      'THB:buy',
      'MYR:buy',
      'KRW:krw_50_5',
      'KRW:krw_10_1',
      'NZD:buy',
    ])
  })

  it('mọi vùng cắt đều nằm trong tờ giấy chuẩn', () => {
    for (const slot of RATE_SHEET_TEMPLATE_V1) {
      expect(slot.rect.x).toBeGreaterThanOrEqual(0)
      expect(slot.rect.y).toBeGreaterThanOrEqual(0)
      expect(slot.rect.x + slot.rect.width).toBeLessThanOrEqual(1)
      expect(slot.rect.y + slot.rect.height).toBeLessThanOrEqual(1)
    }
  })
})
