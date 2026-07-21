import { normalizeRateSheetExtraction } from './rateImport'

export const MAX_RATE_IMPORT_JSON_BYTES = 100_000

export const RATE_IMPORT_JSON_TEMPLATE = {
  version: 1,
  sheetDateLabel: null,
  rates: {
    usdBuy: null,
    usdSell: null,
    eur: null,
    eurc: null,
    jpy: null,
    cad: null,
    aud: null,
    sgd: null,
    chf: null,
    gbp: null,
    twd: null,
    cny: null,
    thb: null,
    myr: null,
    krw50_5: null,
    krw10_1: null,
    nzd: null,
  },
}

export const RATE_IMPORT_JSON_TEMPLATE_TEXT = JSON.stringify(RATE_IMPORT_JSON_TEMPLATE, null, 2)

export const CHATGPT_RATE_IMPORT_PROMPT = `Đọc bảng giá viết tay trong ảnh theo đúng thứ tự mẫu FXCount.

Chỉ trả về JSON hợp lệ, không giải thích và không dùng Markdown.
Giữ số nguyên đúng như trên giấy, không nhân 1.000.
Nếu không nhìn rõ một giá, hãy dùng null và tuyệt đối không tự đoán.
Giữ đúng 17 khóa bên dưới. Ngày dùng dạng ngày/tháng, không tự thêm năm.

Cấu trúc JSON bắt buộc:
${RATE_IMPORT_JSON_TEMPLATE_TEXT}`

const RATE_FIELDS = [
  { key: 'usdBuy', label: 'USD mua', currencyCode: 'USD', kind: 'buy' },
  { key: 'usdSell', label: 'USD bán', currencyCode: 'USD', kind: 'sell' },
  { key: 'eur', label: 'EUR', currencyCode: 'EUR', kind: 'buy' },
  { key: 'eurc', label: 'EUR cũ', currencyCode: 'EURC', kind: 'buy' },
  { key: 'jpy', label: 'JPY', currencyCode: 'JPY', kind: 'buy' },
  { key: 'cad', label: 'CAD', currencyCode: 'CAD', kind: 'buy' },
  { key: 'aud', label: 'AUD', currencyCode: 'AUD', kind: 'buy' },
  { key: 'sgd', label: 'SGD', currencyCode: 'SGD', kind: 'buy' },
  { key: 'chf', label: 'CHF', currencyCode: 'CHF', kind: 'buy' },
  { key: 'gbp', label: 'GBP', currencyCode: 'GBP', kind: 'buy' },
  { key: 'twd', label: 'TWD', currencyCode: 'TWD', kind: 'buy' },
  { key: 'cny', label: 'CNY', currencyCode: 'CNY', kind: 'buy' },
  { key: 'thb', label: 'THB', currencyCode: 'THB', kind: 'buy' },
  { key: 'myr', label: 'MYR', currencyCode: 'MYR', kind: 'buy' },
  {
    key: 'krw50_5',
    label: 'KRW nhóm 50.000/5.000',
    currencyCode: 'KRW',
    kind: 'krw_50_5',
  },
  {
    key: 'krw10_1',
    label: 'KRW nhóm 10.000/1.000',
    currencyCode: 'KRW',
    kind: 'krw_10_1',
  },
  { key: 'nzd', label: 'NZD', currencyCode: 'NZD', kind: 'buy' },
]

const fieldKeys = new Set(RATE_FIELDS.map((field) => field.key))

const stripCodeFence = (input) => {
  const value = String(input || '').replace(/^\uFEFF/, '').trim()
  const fenced = value.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced ? fenced[1].trim() : value
}

const parseDateLabel = (value, warnings) => {
  if (value == null || value === '') return null
  if (typeof value !== 'string') {
    warnings.push('Ngày trên giấy không đúng định dạng ngày/tháng; app bỏ qua ngày.')
    return null
  }
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})$/)
  if (!match) {
    warnings.push('Ngày trên giấy không đúng định dạng ngày/tháng; app bỏ qua ngày.')
    return null
  }
  const day = Number(match[1])
  const month = Number(match[2])
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    warnings.push('Ngày trên giấy không hợp lệ; app bỏ qua ngày.')
    return null
  }
  return `${day}/${month}`
}

export const rateImportJsonBytes = (value) => new TextEncoder().encode(String(value || '')).length

export function parseRateImportJson(input) {
  if (rateImportJsonBytes(input) > MAX_RATE_IMPORT_JSON_BYTES) throw new Error('JSON_TOO_LARGE')
  if (!String(input || '').trim()) throw new Error('JSON_EMPTY')

  let payload
  try {
    payload = JSON.parse(stripCodeFence(input))
  } catch {
    throw new Error('JSON_INVALID')
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('JSON_INVALID_SHAPE')
  }
  if (payload.version !== 1) throw new Error('JSON_UNSUPPORTED_VERSION')
  if (!payload.rates || typeof payload.rates !== 'object' || Array.isArray(payload.rates)) {
    throw new Error('JSON_MISSING_RATES')
  }

  const warnings = []
  const rows = []
  const missing = []
  const unknownKeys = Object.keys(payload.rates).filter((key) => !fieldKeys.has(key))
  if (unknownKeys.length) warnings.push(`App bỏ qua khóa không hỗ trợ: ${unknownKeys.join(', ')}.`)

  for (const field of RATE_FIELDS) {
    const value = payload.rates[field.key]
    if (value == null) {
      missing.push(field.label)
      continue
    }
    if (!Number.isInteger(value) || value <= 0) {
      warnings.push(`${field.label} phải là số nguyên dương hoặc null; app giữ nguyên giá cũ.`)
      continue
    }
    rows.push({
      sourceLabel: `${field.label}: ${value}`,
      currencyCode: field.currencyCode,
      kind: field.kind,
      sheetValue: value,
      confidence: 1,
      note: 'Dữ liệu nhập từ JSON.',
    })
  }

  if (missing.length) {
    warnings.push(`Không có giá cho ${missing.join(', ')}; app giữ nguyên các giá này.`)
  }

  const normalized = normalizeRateSheetExtraction({
    sheetDateLabel: parseDateLabel(payload.sheetDateLabel, warnings),
    rows,
    warnings,
  })
  if (!normalized.entries.length) throw new Error('JSON_NO_VALID_RATES')
  return normalized
}
