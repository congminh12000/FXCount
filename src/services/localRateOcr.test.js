import { describe, expect, it, vi } from 'vitest'
import { RATE_SHEET_RATE_SLOTS } from '../domain/rateSheetTemplate'
import {
  chooseOcrCandidate,
  parseOcrDate,
  parseOcrNumber,
  recognizeRateSlots,
} from './localRateOcr'

describe('local rate OCR', () => {
  it('chuẩn hoá chữ số và ngày OCR', () => {
    expect(parseOcrNumber(' 2.610 \n')).toBe(2610)
    expect(parseOcrNumber('không rõ')).toBeNull()
    expect(parseOcrDate('20 / 7')).toBe('20/7')
    expect(parseOcrDate('40/19')).toBeNull()
  })

  it('chỉ tin kết quả đồng thuận và nằm trong khoảng an toàn', () => {
    const usd = RATE_SHEET_RATE_SLOTS[0]
    expect(
      chooseOcrCandidate(usd, [
        { text: '2610', confidence: 96 },
        { text: '2610', confidence: 93 },
      ])
    ).toMatchObject({ value: 2610, needsReview: false })
    expect(
      chooseOcrCandidate(usd, [
        { text: '2610', confidence: 98 },
        { text: '2670', confidence: 97 },
      ])
    ).toMatchObject({ value: 2610, needsReview: true })
    expect(chooseOcrCandidate(usd, [{ text: '99', confidence: 99 }]).value).toBeNull()
  })

  it('đọc đủ 17 vị trí, báo tiến độ và giữ dòng không đọc được', async () => {
    const onProgress = vi.fn()
    const result = await recognizeRateSlots({
      onProgress,
      recognizeVariants: async (slot) => ({
        results:
          slot.code === 'EURC'
            ? [{ text: '', confidence: 0 }]
            : [
                { text: slot.code === 'KRW' ? '160' : '2000', confidence: 95 },
                { text: slot.code === 'KRW' ? '160' : '2000', confidence: 94 },
              ],
        cropPreview: `preview:${slot.id}`,
      }),
    })
    expect(result.rows).toHaveLength(17)
    expect(result.rows.find((row) => row.currencyCode === 'EURC').sheetValue).toBeNull()
    expect(result.cropPreviews.size).toBe(17)
    expect(onProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({ current: 17, total: 17 })
    )
  })

  it('dừng trước dòng kế tiếp khi bị huỷ', async () => {
    const controller = new AbortController()
    await expect(
      recognizeRateSlots({
        slots: RATE_SHEET_RATE_SLOTS.slice(0, 2),
        signal: controller.signal,
        recognizeVariants: async () => {
          controller.abort()
          return { results: [{ text: '2610', confidence: 99 }] }
        },
      })
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})
