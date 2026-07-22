import { describe, expect, it } from 'vitest'
import {
  HISTORY_DAY_BATCH_SIZE,
  groupHistoryByDay,
  nextVisibleDayCount,
} from './historyData'

const record = (id, day, hour = 12) => ({
  id,
  completedAt: new Date(2026, 6, day, hour).getTime(),
  type: 'buy',
  items: [],
  totalVND: 1,
})

describe('history day pagination', () => {
  it('gom trọn giao dịch cùng ngày và sắp xếp ngày mới nhất trước', () => {
    const groups = groupHistoryByDay([
      record('older', 19),
      record('new-morning', 22, 9),
      record('middle', 21),
      record('new-evening', 22, 18),
    ])

    expect(groups).toHaveLength(3)
    expect(groups.map((group) => group.key)).toEqual(['2026-07-22', '2026-07-21', '2026-07-19'])
    expect(groups[0].items.map((item) => item.id)).toEqual(['new-evening', 'new-morning'])
  })

  it('không chia đôi dữ liệu của ngày ở batch đầu tiên', () => {
    const history = [
      record('22-a', 22, 18),
      record('22-b', 22, 9),
      record('21', 21),
      record('20-a', 20, 18),
      record('20-b', 20, 9),
      record('19', 19),
    ]
    const visibleGroups = groupHistoryByDay(history).slice(0, HISTORY_DAY_BATCH_SIZE)

    expect(visibleGroups).toHaveLength(3)
    expect(visibleGroups.flatMap((group) => group.items).map((item) => item.id)).toEqual([
      '22-a',
      '22-b',
      '21',
      '20-a',
      '20-b',
    ])
    expect(history).toHaveLength(6)
  })

  it('tăng giới hạn theo batch và không vượt quá tổng số ngày', () => {
    expect(nextVisibleDayCount(3, 8)).toBe(6)
    expect(nextVisibleDayCount(6, 8)).toBe(8)
    expect(nextVisibleDayCount(8, 8)).toBe(8)
  })
})
