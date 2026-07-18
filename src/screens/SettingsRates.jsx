import { useState } from 'react'
import useStore, { findCurrency } from '../store/useStore'
import { fmtNum, formatRateInput, parseRate } from '../utils/format'
import Header from '../components/Header'
import { BigButton, ConfirmIconButton, TypeBadge } from '../components/UI'
import { Plus, Pencil, Check } from '../components/Icons'

const inputCls =
  'h-12 rounded-xl bg-card2 border border-line px-3 text-cream placeholder:text-muted/50 focus:border-line-strong outline-none'

function RateEditor({ initial, onSave, onCancel }) {
  const [label, setLabel] = useState(initial?.label || '')
  const [rateStr, setRateStr] = useState(initial ? formatRateInput(String(initial.rate).replace('.', ',')) : '')
  const rate = parseRate(rateStr)

  return (
    <div className="card-depth mb-2.5 flex flex-col gap-2.5 rounded-2xl border-line-strong p-3.5">
      <div className="flex gap-2.5">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Tên giá (VD: Khách quen)"
          className={`${inputCls} min-w-0 flex-1`}
        />
        <input
          value={rateStr}
          onChange={(e) => setRateStr(formatRateInput(e.target.value))}
          inputMode="decimal"
          placeholder="Giá VND"
          autoFocus
          className={`${inputCls} w-32 text-right tnum font-bold`}
        />
      </div>
      <div className="flex gap-2.5">
        <BigButton variant="ghost" className="min-h-12 flex-1" onClick={onCancel}>
          Huỷ
        </BigButton>
        <BigButton
          className="min-h-12 flex-[2]"
          disabled={!rate}
          onClick={() => onSave({ label: label.trim(), rate })}
        >
          <Check size={18} /> Lưu
        </BigButton>
      </div>
    </div>
  )
}

function RateSection({ side, rates, currency, denom }) {
  const addRate = useStore((s) => s.addRate)
  const updateRate = useStore((s) => s.updateRate)
  const removeRate = useStore((s) => s.removeRate)
  const [editing, setEditing] = useState(null) // rate id | 'new' | null

  return (
    <div className="mb-7">
      <div className="mb-2 flex items-center gap-2">
        <TypeBadge type={side} />
        <span className="text-xs text-muted">
          {rates.length ? `${rates.length} đơn giá` : 'chưa có đơn giá'}
        </span>
      </div>

      {rates.map((r, i) =>
        editing === r.id ? (
          <RateEditor
            key={r.id}
            initial={r}
            onCancel={() => setEditing(null)}
            onSave={(patch) => {
              updateRate(currency.code, denom.id, side, r.id, patch)
              setEditing(null)
            }}
          />
        ) : (
          <div
            key={r.id}
            className="card-depth mb-2.5 flex items-center gap-2 rounded-2xl p-3 pl-4"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-muted">
              {r.label || `Đơn giá ${i + 1}`}
            </span>
            <span className="text-lg font-extrabold tnum text-gold-gradient">
              {fmtNum(r.rate)}
            </span>
            <button
              onClick={() => setEditing(r.id)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted active:text-gold"
            >
              <Pencil />
            </button>
            <ConfirmIconButton
              onConfirm={() => removeRate(currency.code, denom.id, side, r.id)}
            />
          </div>
        )
      )}

      {editing === 'new' ? (
        <RateEditor
          onCancel={() => setEditing(null)}
          onSave={(data) => {
            addRate(currency.code, denom.id, side, data)
            setEditing(null)
          }}
        />
      ) : (
        <BigButton
          variant="outline"
          className="min-h-12 w-full"
          onClick={() => setEditing('new')}
        >
          <Plus size={18} /> Thêm đơn giá {side === 'buy' ? 'mua' : 'bán'}
        </BigButton>
      )}
    </div>
  )
}

export default function SettingsRates({ params }) {
  const currencies = useStore((s) => s.currencies)
  const currency = findCurrency(currencies, params.code)
  const denom = currency?.denominations.find((d) => d.id === params.denomId)
  if (!currency || !denom) return null

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title={`${fmtNum(denom.value)} ${currency.code}`}
        subtitle={`${currency.flag} ${currency.name} • đơn giá cho 1 ${currency.code}`}
      />
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-10">
        <RateSection side="buy" rates={denom.buyRates} currency={currency} denom={denom} />
        <RateSection side="sell" rates={denom.sellRates} currency={currency} denom={denom} />
      </div>
    </div>
  )
}
