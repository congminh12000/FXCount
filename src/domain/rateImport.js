export const IMPORTABLE_CODES = [
  'USD',
  'EUR',
  'EURC',
  'JPY',
  'CAD',
  'AUD',
  'SGD',
  'CHF',
  'GBP',
  'TWD',
  'CNY',
  'THB',
  'MYR',
  'KRW',
  'NZD',
]

export const RATE_ROW_KINDS = ['buy', 'sell', 'krw_50_5', 'krw_10_1', 'unknown']

// Trên giấy, số giá được viết theo nghìn đồng cho một đơn vị quy ước.
// appAnchor là mệnh giá chuẩn mà store đang dùng.
export const RATE_SHEET_RULES = {
  USD: { sheetUnit: 100, appAnchor: 100, min: 1000, max: 5000 },
  EUR: { sheetUnit: 100, appAnchor: 100, min: 1000, max: 6000 },
  EURC: { sheetUnit: 100, appAnchor: 100, min: 1000, max: 6000 },
  JPY: { sheetUnit: 10000, appAnchor: 10000, min: 300, max: 4000 },
  CAD: { sheetUnit: 100, appAnchor: 100, min: 500, max: 4000 },
  AUD: { sheetUnit: 100, appAnchor: 100, min: 500, max: 4000 },
  SGD: { sheetUnit: 100, appAnchor: 100, min: 500, max: 5000 },
  CHF: { sheetUnit: 100, appAnchor: 100, min: 1000, max: 7000 },
  GBP: { sheetUnit: 100, appAnchor: 10, min: 1000, max: 7000 },
  TWD: { sheetUnit: 1000, appAnchor: 1000, min: 100, max: 2000 },
  CNY: { sheetUnit: 100, appAnchor: 100, min: 100, max: 1500 },
  THB: { sheetUnit: 1000, appAnchor: 1000, min: 100, max: 2000 },
  MYR: { sheetUnit: 100, appAnchor: 100, min: 100, max: 2000 },
  NZD: { sheetUnit: 100, appAnchor: 10, min: 500, max: 4000 },
}

const entryId = (row, index) => `${row.currencyCode}:${row.kind}:${index}`

function genericEntry(row, index) {
  const rule = RATE_SHEET_RULES[row.currencyCode]
  if (!rule) return null
  if (!['buy', 'sell'].includes(row.kind)) return null
  if (row.kind === 'sell' && row.currencyCode !== 'USD') return null
  if (row.sheetValue < rule.min || row.sheetValue > rule.max) return null

  return {
    id: entryId(row, index),
    code: row.currencyCode,
    kind: row.kind,
    sourceLabel: row.sourceLabel,
    sheetValue: row.sheetValue,
    proposedValue: Math.round(row.sheetValue * 1000 * (rule.appAnchor / rule.sheetUnit)),
    appAnchor: rule.appAnchor,
    confidence: row.confidence,
    needsReview: row.confidence < 0.9,
    note: row.note,
    unitLabel: `đ / tờ ${rule.appAnchor.toLocaleString('vi-VN')} ${row.currencyCode}`,
  }
}

function krwEntry(row, index) {
  if (row.currencyCode !== 'KRW' || !['krw_50_5', 'krw_10_1'].includes(row.kind)) return null
  if (row.sheetValue < 50 || row.sheetValue > 500) return null
  const isLargeGroup = row.kind === 'krw_50_5'
  return {
    id: entryId(row, index),
    code: 'KRW',
    kind: row.kind,
    sourceLabel: row.sourceLabel,
    sheetValue: row.sheetValue,
    // 160 trên giấy = 160.000đ/10.000 KRW = 16.000đ/1.000 KRW.
    proposedValue: Math.round(row.sheetValue * 100),
    appAnchor: 1000,
    confidence: row.confidence,
    needsReview: row.confidence < 0.9,
    note: row.note,
    unitLabel: isLargeGroup ? 'đ / 1.000 KRW (nhóm 50.000/5.000)' : 'đ / tờ 1.000 KRW (nhóm 10.000/1.000)',
  }
}

function unreadableEntry(row, index) {
  if (row.currencyCode === 'KRW' && ['krw_50_5', 'krw_10_1'].includes(row.kind)) {
    return {
      id: entryId(row, index),
      code: 'KRW',
      kind: row.kind,
      sourceLabel: row.sourceLabel,
      sheetValue: null,
      proposedValue: null,
      appAnchor: 1000,
      confidence: row.confidence || 0,
      needsReview: true,
      note: row.note,
      unitLabel:
        row.kind === 'krw_50_5'
          ? 'đ / 1.000 KRW (nhóm 50.000/5.000)'
          : 'đ / tờ 1.000 KRW (nhóm 10.000/1.000)',
    }
  }

  const rule = RATE_SHEET_RULES[row.currencyCode]
  if (!rule || !['buy', 'sell'].includes(row.kind)) return null
  if (row.kind === 'sell' && row.currencyCode !== 'USD') return null
  return {
    id: entryId(row, index),
    code: row.currencyCode,
    kind: row.kind,
    sourceLabel: row.sourceLabel,
    sheetValue: null,
    proposedValue: null,
    appAnchor: rule.appAnchor,
    confidence: row.confidence || 0,
    needsReview: true,
    note: row.note,
    unitLabel: `đ / tờ ${rule.appAnchor.toLocaleString('vi-VN')} ${row.currencyCode}`,
  }
}

export function normalizeRateSheetExtraction(extraction, { keepUnreadable = false } = {}) {
  const warnings = [...(extraction.warnings || [])]
  const entries = []
  const seen = new Set()

  for (const [index, row] of (extraction.rows || []).entries()) {
    if (!row.sheetValue || row.currencyCode === 'UNKNOWN' || row.kind === 'unknown') {
      const placeholder = keepUnreadable ? unreadableEntry(row, index) : null
      if (placeholder) entries.push(placeholder)
      warnings.push(`Không thể dùng dòng “${row.sourceLabel || 'không rõ'}”.`)
      continue
    }

    const key = `${row.currencyCode}:${row.kind}`
    if (seen.has(key)) {
      warnings.push(`Có nhiều dòng ${key}; app chỉ giữ dòng đầu tiên.`)
      continue
    }

    const entry = row.currencyCode === 'KRW' ? krwEntry(row, index) : genericEntry(row, index)
    if (!entry) {
      warnings.push(`Giá “${row.sourceLabel}” nằm ngoài quy tắc an toàn hoặc sai loại.`)
      continue
    }

    seen.add(key)
    entries.push(entry)
  }

  return {
    sheetDateLabel: extraction.sheetDateLabel || null,
    entries,
    warnings,
  }
}

export function currentValueForImportEntry(currency, entry) {
  if (!currency) return null
  if (entry.kind === 'buy') return currency.buyAnchorPrice ?? null
  if (entry.kind === 'sell') return currency.sellAnchorPrice ?? null
  if (entry.kind === 'krw_10_1') return currency.buyAnchorPrice ?? null
  if (entry.kind === 'krw_50_5') {
    return currency.denominations.find((denom) => denom.value === 5000)?.fixedBuyRate ?? null
  }
  return null
}
