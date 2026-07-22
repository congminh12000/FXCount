import { relativeDateLabel } from '../utils/format'

export const HISTORY_DAY_BATCH_SIZE = 3

const localDayKey = (timestamp) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function groupHistoryByDay(history = []) {
  const groupsByDay = new Map()
  const orderedHistory = [...history].sort((a, b) => b.completedAt - a.completedAt)

  for (const record of orderedHistory) {
    const key = localDayKey(record.completedAt)
    const existing = groupsByDay.get(key)
    if (existing) {
      existing.items.push(record)
    } else {
      groupsByDay.set(key, {
        key,
        label: relativeDateLabel(record.completedAt),
        items: [record],
      })
    }
  }

  return [...groupsByDay.values()]
}

export const nextVisibleDayCount = (
  currentCount,
  totalCount,
  batchSize = HISTORY_DAY_BATCH_SIZE
) => Math.min(currentCount + batchSize, totalCount)
