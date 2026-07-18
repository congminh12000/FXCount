import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultCurrencies } from '../data/defaults'
import { uid } from '../utils/format'

// Điều hướng dạng stack: mỗi entry là 1 màn hình, direction điều khiển chiều slide.
const homeEntry = () => ({ key: uid(), name: 'home', params: {} })

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

      /* ---------- Cài đặt ngoại tệ / đơn giá ---------- */
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
              { code, name, flag: flag || '💱', enabled: true, denominations: [] },
            ],
          }
        }),

      removeCurrency: (code) =>
        set((s) => ({ currencies: s.currencies.filter((c) => c.code !== code) })),

      addDenomination: (code, value) =>
        set((s) => ({
          currencies: s.currencies.map((c) => {
            if (c.code !== code || c.denominations.some((dd) => dd.value === value)) return c
            const denoms = [...c.denominations, { id: uid(), value, buyRates: [], sellRates: [] }]
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

      addRate: (code, denomId, side, { label, rate }) =>
        get()._mutateRates(code, denomId, side, (rates) => [...rates, { id: uid(), label, rate }]),

      updateRate: (code, denomId, side, rateId, patch) =>
        get()._mutateRates(code, denomId, side, (rates) =>
          rates.map((rr) => (rr.id === rateId ? { ...rr, ...patch } : rr))
        ),

      removeRate: (code, denomId, side, rateId) =>
        get()._mutateRates(code, denomId, side, (rates) => rates.filter((rr) => rr.id !== rateId)),

      _mutateRates: (code, denomId, side, fn) =>
        set((s) => {
          const field = side === 'buy' ? 'buyRates' : 'sellRates'
          return {
            currencies: s.currencies.map((c) =>
              c.code === code
                ? {
                    ...c,
                    denominations: c.denominations.map((dd) =>
                      dd.id === denomId ? { ...dd, [field]: fn(dd[field]) } : dd
                    ),
                  }
                : c
            ),
          }
        }),

      /* ---------- Bill đang tính ---------- */
      bill: { type: null, items: [] },

      startBill: (type) =>
        set((s) => ({
          bill: s.bill.type === type ? s.bill : { type, items: [] },
        })),

      addItem: ({ currencyCode, flag, denomValue, qty, rate, rateLabel }) =>
        set((s) => {
          const foreignAmount = qty * denomValue
          const item = {
            id: uid(),
            currencyCode,
            flag,
            denomValue,
            qty,
            rate,
            rateLabel,
            foreignAmount,
            subtotalVND: Math.round(foreignAmount * rate),
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
      version: 1,
      partialize: (s) => ({ currencies: s.currencies, bill: s.bill, history: s.history }),
    }
  )
)

export const billTotal = (bill) => bill.items.reduce((sum, i) => sum + i.subtotalVND, 0)

export const findCurrency = (currencies, code) => currencies.find((c) => c.code === code)

export const ratesFor = (denom, type) => (type === 'buy' ? denom.buyRates : denom.sellRates)

export default useStore
