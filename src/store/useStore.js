import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultCurrencies } from '../data/defaults'
import { uid } from '../utils/format'

// Điều hướng dạng stack: mỗi entry là 1 màn hình, direction điều khiển chiều slide.
const homeEntry = () => ({ key: uid(), name: 'home', params: {} })

/* ---------- Logic giá "tờ chuẩn + giá riêng / chênh lệch / liên kết" ----------
 * Tờ chuẩn có thể được chỉ định bằng anchorValue; nếu không có thì tự chọn mệnh giá
 * bắt đầu bằng số 1 và lớn nhất (VD: EUR 5-500 → 100).
 * giá mua /tờ = buyAnchorPrice × (mệnh giá / tờ chuẩn) + adjustBuy (đ/tờ)
 * fixedBuyRate / fixedBuyUnit cho phép đặt giá mua riêng theo một đơn vị quy ước.
 * derivedBuy cho phép lấy giá từ một mệnh giá khác rồi nhân/cộng (VD KRW).
 * giá bán /tờ = sellAnchorPrice × (mệnh giá / tờ chuẩn)
 */
export function anchorOf(currency) {
  const ds = currency.denominations
  if (!ds || !ds.length) return null
  const explicit = ds.find((dd) => dd.value === currency.anchorValue)
  if (explicit) return explicit
  const leading1 = ds.filter((dd) => String(dd.value)[0] === '1')
  const pool = leading1.length ? leading1 : ds
  return pool.reduce((a, b) => (b.value > a.value ? b : a))
}

function resolveBuyPrice(currency, denom, visited) {
  if (!denom || visited.has(denom.id)) return null
  const nextVisited = new Set(visited)
  nextVisited.add(denom.id)

  if (denom.fixedBuyRate !== undefined) {
    const unit = denom.fixedBuyUnit || 1
    return denom.fixedBuyRate ? Math.round((denom.value / unit) * denom.fixedBuyRate) : null
  }

  if (denom.derivedBuy) {
    const source = currency.denominations.find((dd) => dd.value === denom.derivedBuy.sourceValue)
    const sourcePrice = resolveBuyPrice(currency, source, nextVisited)
    if (sourcePrice == null) return null
    return Math.round(
      sourcePrice * (denom.derivedBuy.multiplier || 1) + (denom.derivedBuy.offset || 0)
    )
  }

  const anchor = anchorOf(currency)
  if (!anchor || !currency.buyAnchorPrice) return null
  return Math.round(currency.buyAnchorPrice * (denom.value / anchor.value) + (denom.adjustBuy || 0))
}

export function buyPricePerNote(currency, denom) {
  return resolveBuyPrice(currency, denom, new Set())
}

export function sellPricePerNote(currency, denom) {
  const anchor = anchorOf(currency)
  if (!anchor || !currency.sellAnchorPrice) return null
  return Math.round(currency.sellAnchorPrice * (denom.value / anchor.value))
}

export const pricePerNoteFor = (currency, denom, type) =>
  type === 'buy' ? buyPricePerNote(currency, denom) : sellPricePerNote(currency, denom)

export const adjustedPricePerNote = (basePrice, adjustmentPerNote = 0) =>
  Math.max(1, Math.round(basePrice + adjustmentPerNote))

export function changeCurrencyAnchor(currency, nextAnchorValue) {
  const nextAnchor = currency.denominations.find((denom) => denom.value === nextAnchorValue)
  const currentAnchor = anchorOf(currency)
  if (!nextAnchor || currentAnchor?.value === nextAnchor.value) return currency

  const buyAnchorPrice = buyPricePerNote(currency, nextAnchor)
  const sellAnchorPrice = sellPricePerNote(currency, nextAnchor)
  const denominations = currency.denominations.map((denom) => {
    if (denom.id !== nextAnchor.id) return denom
    const plainDenom = { ...denom }
    delete plainDenom.fixedBuyRate
    delete plainDenom.fixedBuyUnit
    delete plainDenom.derivedBuy
    return { ...plainDenom, adjustBuy: 0 }
  })

  return {
    ...currency,
    anchorValue: nextAnchor.value,
    buyAnchorPrice,
    sellAnchorPrice,
    denominations,
  }
}

// Item cũ (v1) lưu rate theo đơn vị — quy về giá/tờ để hiển thị thống nhất
export const itemPricePerNote = (item) =>
  item.pricePerNote ?? Math.round((item.rate || 0) * item.denomValue)

// Chuyển dữ liệu v1 (rate/đơn vị, nhiều preset) → v2 (giá tờ chuẩn + chênh lệch),
// giữ nguyên các mức giá người dùng đã cài.
function migrateV1Currency(c) {
  if (c.buyAnchorPrice !== undefined) return c
  const ds = c.denominations || []
  const leading1 = ds.filter((dd) => String(dd.value)[0] === '1')
  const pool = leading1.length ? leading1 : ds
  const anchor = pool.length ? pool.reduce((a, b) => (b.value > a.value ? b : a)) : null
  const firstRate = (arr) => (arr && arr.length ? arr[0].rate : null)
  const anchorBuyRate = anchor ? firstRate(anchor.buyRates) : null
  const anchorSellRate = anchor ? firstRate(anchor.sellRates) : null
  return {
    code: c.code,
    name: c.name,
    flag: c.flag,
    enabled: c.enabled,
    buyAnchorPrice: anchorBuyRate != null ? Math.round(anchorBuyRate * anchor.value) : null,
    sellAnchorPrice: anchorSellRate != null ? Math.round(anchorSellRate * anchor.value) : null,
    denominations: ds.map((dd) => {
      const r = firstRate(dd.buyRates)
      const adjustBuy =
        anchorBuyRate != null && r != null ? Math.round(dd.value * (r - anchorBuyRate)) : 0
      return { id: dd.id, value: dd.value, adjustBuy }
    }),
  }
}

// Áp dụng hồ sơ giá của tiệm cho các ngoại tệ chuẩn, giữ trạng thái bật/tắt và
// giữ lại các ngoại tệ do người dùng tự thêm.
function migrateV3Currencies(currencies = []) {
  const configured = defaultCurrencies()
  const existingByCode = new Map(currencies.map((currency) => [currency.code, currency]))
  const configuredCodes = new Set(configured.map((currency) => currency.code))

  return [
    ...configured.map((currency) => ({
      ...currency,
      enabled: existingByCode.get(currency.code)?.enabled ?? currency.enabled,
    })),
    ...currencies.filter((currency) => !configuredCodes.has(currency.code)),
  ]
}

const usdFixedBuyRates = new Map([
  [20, 23000],
  [10, 23000],
  [5, 20000],
  [2, 20000],
  [1, 20000],
])

// Các tờ USD nhỏ dùng đơn giá riêng, không đổi theo giá tờ chuẩn 100 USD.
function migrateV4Currencies(currencies = []) {
  if (!currencies.length) return defaultCurrencies()
  return currencies.map((currency) => {
    if (currency.code !== 'USD') return currency
    return {
      ...currency,
      denominations: currency.denominations.map((denom) => {
        const fixedBuyRate = usdFixedBuyRates.get(denom.value)
        return fixedBuyRate
          ? { ...denom, adjustBuy: 0, fixedBuyRate }
          : denom
      }),
    }
  })
}

// Tờ 5.000 KRW mua theo 16.000đ / 1.000 KRW; tờ 50.000 kế thừa tờ 5.000 × 10.
function migrateV5Currencies(currencies = []) {
  if (!currencies.length) return defaultCurrencies()
  return currencies.map((currency) => {
    if (currency.code !== 'KRW') return currency
    return {
      ...currency,
      denominations: currency.denominations.map((denom) =>
        denom.value === 5000
          ? { ...denom, adjustBuy: 0, fixedBuyRate: 16000, fixedBuyUnit: 1000 }
          : denom
      ),
    }
  })
}

function repriceBillCurrency(bill, currencies, code) {
  if (!bill?.items?.length) return bill
  const currency = currencies.find((item) => item.code === code)
  if (!currency) return bill
  return {
    ...bill,
    items: bill.items.map((item) => {
      if (item.currencyCode !== code) return item
      const denom = currency.denominations.find((candidate) => candidate.value === item.denomValue)
      const basePricePerNote = pricePerNoteFor(currency, denom, bill.type)
      if (!basePricePerNote) return item
      const pricePerNote = adjustedPricePerNote(basePricePerNote, item.adjustmentPerNote)
      return {
        ...item,
        pricePerNote,
        foreignAmount: item.qty * item.denomValue,
        subtotalVND: Math.round(item.qty * pricePerNote),
      }
    }),
  }
}

const clonePersisted = (value) => JSON.parse(JSON.stringify(value))

export function applyRateEntriesToCurrencies(currencies, entries) {
  const changedCodes = new Set()
  const updatesByCode = new Map()

  for (const entry of entries) {
    const value = Math.round(entry.proposedValue)
    if (
      !entry.code ||
      !currencies.some((currency) => currency.code === entry.code) ||
      !Number.isFinite(value) ||
      value <= 0
    ) continue
    changedCodes.add(entry.code)
    if (!updatesByCode.has(entry.code)) updatesByCode.set(entry.code, [])
    updatesByCode.get(entry.code).push({ ...entry, proposedValue: value })
  }

  const nextCurrencies = currencies.map((currency) => {
    const updates = updatesByCode.get(currency.code)
    if (!updates?.length) return currency

    let next = { ...currency }
    for (const entry of updates) {
      if (entry.kind === 'buy') next.buyAnchorPrice = entry.proposedValue
      if (entry.kind === 'sell') next.sellAnchorPrice = entry.proposedValue

      if (currency.code === 'KRW' && entry.kind === 'krw_10_1') {
        next.buyAnchorPrice = entry.proposedValue
        next.denominations = next.denominations.map((denom) =>
          denom.value === 10000
            ? { ...denom, derivedBuy: { sourceValue: 1000, multiplier: 10, offset: 0 } }
            : denom
        )
      }

      if (currency.code === 'KRW' && entry.kind === 'krw_50_5') {
        next.denominations = next.denominations.map((denom) => {
          if (denom.value === 5000) {
            return {
              ...denom,
              adjustBuy: 0,
              fixedBuyRate: entry.proposedValue,
              fixedBuyUnit: 1000,
            }
          }
          if (denom.value === 50000) {
            return { ...denom, derivedBuy: { sourceValue: 5000, multiplier: 10, offset: 0 } }
          }
          return denom
        })
      }
    }
    return next
  })

  return { currencies: nextCurrencies, changedCodes }
}

export function repriceOpenBill(bill, currencies, changedCodes) {
  if (!bill?.items?.length || !changedCodes.size) return bill
  return {
    ...bill,
    items: bill.items.map((item) => {
      if (!changedCodes.has(item.currencyCode)) return item
      const currency = currencies.find((candidate) => candidate.code === item.currencyCode)
      const denom = currency?.denominations.find((candidate) => candidate.value === item.denomValue)
      const basePricePerNote = currency ? pricePerNoteFor(currency, denom, bill.type) : null
      if (!basePricePerNote) return item
      const pricePerNote = adjustedPricePerNote(basePricePerNote, item.adjustmentPerNote)
      return {
        ...item,
        pricePerNote,
        foreignAmount: item.qty * item.denomValue,
        subtotalVND: Math.round(item.qty * pricePerNote),
      }
    }),
  }
}

export function buildRateImportState(state, entries, meta = {}, importedAt = Date.now()) {
  const { currencies, changedCodes } = applyRateEntriesToCurrencies(state.currencies, entries)
  if (!changedCodes.size) return state
  return {
    currencies,
    bill: repriceOpenBill(state.bill, currencies, changedCodes),
    lastRateImportBackup: {
      createdAt: importedAt,
      currencies: clonePersisted(state.currencies),
      bill: clonePersisted(state.bill),
    },
    lastRateImport: {
      importedAt,
      sheetDateLabel: meta.sheetDateLabel || null,
      changedCodes: [...changedCodes],
      entryCount: entries.length,
    },
  }
}

export function restoreRateImportBackup(state) {
  if (!state.lastRateImportBackup) return state
  return {
    currencies: clonePersisted(state.lastRateImportBackup.currencies),
    bill: clonePersisted(state.lastRateImportBackup.bill),
    lastRateImportBackup: null,
    lastRateImport: null,
  }
}

const useStore = create(
  persist(
    (set, get) => ({
      /* ---------- Điều hướng ---------- */
      stack: [homeEntry()],
      direction: 1,
      push: (name, params = {}) =>
        set((s) => ({ stack: [...s.stack, { key: uid(), name, params }], direction: 1 })),
      pop: () =>
        set((s) => (s.stack.length > 1 ? { stack: s.stack.slice(0, -1), direction: -1 } : {})),
      resetStack: (entries) =>
        set(() => ({
          stack: [homeEntry(), ...entries.map(([name, params = {}]) => ({ key: uid(), name, params }))],
          direction: 1,
        })),
      goHome: () => set(() => ({ stack: [homeEntry()], direction: -1 })),

      /* ---------- Cài đặt ngoại tệ / giá ---------- */
      currencies: defaultCurrencies(),

      toggleCurrency: (code) =>
        set((s) => ({
          currencies: s.currencies.map((c) => (c.code === code ? { ...c, enabled: !c.enabled } : c)),
        })),

      addCurrency: ({ code, name, flag }) =>
        set((s) => {
          if (s.currencies.some((c) => c.code === code)) return {}
          return {
            currencies: [
              ...s.currencies,
              {
                code,
                name,
                flag: flag || '💱',
                enabled: true,
                buyAnchorPrice: null,
                sellAnchorPrice: null,
                denominations: [],
              },
            ],
          }
        }),

      removeCurrency: (code) =>
        set((s) => ({ currencies: s.currencies.filter((c) => c.code !== code) })),

      addDenomination: (code, value) =>
        set((s) => ({
          currencies: s.currencies.map((c) => {
            if (c.code !== code || c.denominations.some((dd) => dd.value === value)) return c
            const denoms = [...c.denominations, { id: uid(), value, adjustBuy: 0 }]
            denoms.sort((a, b) => b.value - a.value)
            return { ...c, denominations: denoms }
          }),
        })),

      removeDenomination: (code, denomId) =>
        set((s) => ({
          currencies: s.currencies.map((c) =>
            c.code === code
              ? { ...c, denominations: c.denominations.filter((dd) => dd.id !== denomId) }
              : c
          ),
        })),

      // side: 'buy' | 'sell' — giá đ/tờ chuẩn (null = chưa cài)
      setAnchorPrice: (code, side, price) =>
        set((s) => ({
          currencies: s.currencies.map((c) =>
            c.code === code
              ? { ...c, [side === 'buy' ? 'buyAnchorPrice' : 'sellAnchorPrice']: price }
              : c
          ),
        })),

      setAnchorDenomination: (code, anchorValue) =>
        set((s) => {
          const currencies = s.currencies.map((currency) =>
            currency.code === code ? changeCurrencyAnchor(currency, anchorValue) : currency
          )
          return {
            currencies,
            bill: repriceBillCurrency(s.bill, currencies, code),
          }
        }),

      // Chênh lệch giá mua đ/tờ cho 1 mệnh giá
      setAdjust: (code, denomId, adjustBuy) =>
        set((s) => ({
          currencies: s.currencies.map((c) =>
            c.code === code
              ? {
                  ...c,
                  denominations: c.denominations.map((dd) =>
                    dd.id === denomId ? { ...dd, adjustBuy } : dd
                  ),
                }
              : c
          ),
        })),

      // Đơn giá mua riêng cho 1 đơn vị ngoại tệ (null = chưa cài).
      setFixedBuyRate: (code, denomId, fixedBuyRate) =>
        set((s) => ({
          currencies: s.currencies.map((c) =>
            c.code === code
              ? {
                  ...c,
                  denominations: c.denominations.map((dd) =>
                    dd.id === denomId ? { ...dd, fixedBuyRate } : dd
                  ),
                }
              : c
          ),
        })),

      applyRateImport: (entries, meta) => set((s) => buildRateImportState(s, entries, meta)),

      undoRateImport: () => set((s) => restoreRateImportBackup(s)),

      lastRateImportBackup: null,
      lastRateImport: null,

      /* ---------- Bill đang tính ---------- */
      bill: { type: null, items: [] },

      startBill: (type) =>
        set((s) => ({
          bill: s.bill.type === type ? s.bill : { type, items: [] },
        })),

      addItem: ({ currencyCode, flag, denomValue, qty, pricePerNote, adjustmentPerNote = 0 }) =>
        set((s) => {
          const item = {
            id: uid(),
            currencyCode,
            flag,
            denomValue,
            qty,
            pricePerNote,
            ...(adjustmentPerNote ? { adjustmentPerNote } : {}),
            foreignAmount: qty * denomValue,
            subtotalVND: Math.round(qty * pricePerNote),
          }
          return { bill: { ...s.bill, items: [...s.bill.items, item] } }
        }),

      removeItem: (id) =>
        set((s) => ({ bill: { ...s.bill, items: s.bill.items.filter((i) => i.id !== id) } })),

      clearBill: () => set(() => ({ bill: { type: null, items: [] } })),

      completeBill: () => {
        const { bill } = get()
        if (!bill.items.length) return null
        const record = {
          id: uid(),
          completedAt: Date.now(),
          type: bill.type,
          items: bill.items,
          totalVND: bill.items.reduce((sum, i) => sum + i.subtotalVND, 0),
        }
        set((s) => ({ history: [record, ...s.history], bill: { type: null, items: [] } }))
        return record
      },

      /* ---------- Lịch sử ---------- */
      history: [],
      deleteHistory: (id) => set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
    }),
    {
      name: 'fxcount',
      version: 6,
      migrate: (persisted, version) => {
        if (version < 2 && persisted?.currencies) {
          persisted.currencies = persisted.currencies.map(migrateV1Currency)
        }
        if (version < 3) {
          persisted.currencies = migrateV3Currencies(persisted?.currencies)
        }
        if (version < 4) {
          persisted.currencies = migrateV4Currencies(persisted?.currencies)
        }
        if (version < 5) {
          persisted.currencies = migrateV5Currencies(persisted?.currencies)
          persisted.bill = repriceBillCurrency(persisted.bill, persisted.currencies, 'KRW')
        }
        return persisted
      },
      partialize: (s) => ({
        currencies: s.currencies,
        bill: s.bill,
        history: s.history,
        lastRateImportBackup: s.lastRateImportBackup,
        lastRateImport: s.lastRateImport,
      }),
    }
  )
)

export const billTotal = (bill) => bill.items.reduce((sum, i) => sum + i.subtotalVND, 0)

export const findCurrency = (currencies, code) => currencies.find((c) => c.code === code)

export default useStore
