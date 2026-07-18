import { useState } from 'react'
import useStore, { findCurrency } from '../store/useStore'
import { fmtNum, formatRateInput, parseRate } from '../utils/format'
import Header from '../components/Header'
import { BigButton, ConfirmDeleteButton, ConfirmIconButton } from '../components/UI'
import { ChevronRight, Plus } from '../components/Icons'

export default function SettingsCurrency({ params }) {
  const currencies = useStore((s) => s.currencies)
  const addDenomination = useStore((s) => s.addDenomination)
  const removeDenomination = useStore((s) => s.removeDenomination)
  const removeCurrency = useStore((s) => s.removeCurrency)
  const push = useStore((s) => s.push)
  const pop = useStore((s) => s.pop)

  const [newValue, setNewValue] = useState('')

  const currency = findCurrency(currencies, params.code)
  if (!currency) return null

  const submitDenom = () => {
    const v = parseRate(newValue)
    if (!v) return
    addDenomination(currency.code, v)
    setNewValue('')
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`${currency.flag} ${currency.code}`} subtitle={currency.name} />

      <div className="flex-1 overflow-y-auto px-5 pt-1 pb-10">
        <p className="mb-2 text-[11px] font-bold tracking-[0.15em] text-muted">MỆNH GIÁ</p>

        {currency.denominations.map((d) => (
          <div
            key={d.id}
            className="card-depth mb-2.5 flex items-center gap-2 rounded-2xl p-3 pl-4"
          >
            <button
              onClick={() =>
                push('settings-rates', { code: currency.code, denomId: d.id })
              }
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="text-lg font-extrabold tnum">{fmtNum(d.value)}</span>
              <span className="text-xs text-muted">
                {d.buyRates.length} giá mua • {d.sellRates.length} giá bán
              </span>
              <ChevronRight size={18} className="ml-auto text-muted" />
            </button>
            <ConfirmIconButton
              onConfirm={() => removeDenomination(currency.code, d.id)}
            />
          </div>
        ))}

        <div className="mt-3 flex gap-2.5">
          <input
            value={newValue}
            onChange={(e) => setNewValue(formatRateInput(e.target.value))}
            inputMode="decimal"
            placeholder="Mệnh giá mới, VD: 100"
            className="h-13 min-w-0 flex-1 rounded-xl border border-line bg-card2 px-3 text-cream tnum outline-none placeholder:text-muted/50 focus:border-line-strong"
          />
          <BigButton className="min-h-13 px-5" disabled={!parseRate(newValue)} onClick={submitDenom}>
            <Plus size={18} /> Thêm
          </BigButton>
        </div>

        <ConfirmDeleteButton
          className="mt-8 w-full"
          onConfirm={() => {
            removeCurrency(currency.code)
            pop()
          }}
        >
          Xoá ngoại tệ {currency.code}
        </ConfirmDeleteButton>
      </div>
    </div>
  )
}
