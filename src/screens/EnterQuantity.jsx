import { useState } from 'react'
import { motion } from 'framer-motion'
import useStore, { findCurrency, ratesFor } from '../store/useStore'
import { fmtNum, fmtVND } from '../utils/format'
import Header from '../components/Header'
import NumberKeypad from '../components/NumberKeypad'
import { BigButton, TypeBadge } from '../components/UI'
import { Plus } from '../components/Icons'

export default function EnterQuantity({ params }) {
  const currencies = useStore((s) => s.currencies)
  const billType = useStore((s) => s.bill.type)
  const addItem = useStore((s) => s.addItem)
  const resetStack = useStore((s) => s.resetStack)
  const [raw, setRaw] = useState('')

  const currency = findCurrency(currencies, params.code)
  const denom = currency?.denominations.find((d) => d.id === params.denomId)
  const rate = denom && ratesFor(denom, billType).find((r) => r.id === params.rateId)
  if (!currency || !denom || !rate) return null

  const qty = parseInt(raw || '0', 10)
  const foreign = qty * denom.value
  const vnd = Math.round(foreign * rate.rate)

  const onKey = (k) => {
    if (k === 'C') return setRaw('')
    if (k === 'del') return setRaw((s) => s.slice(0, -1))
    setRaw((s) => {
      const next = (s + k).replace(/^0+(?=\d)/, '')
      return next.length > 4 ? s : next
    })
  }

  const add = () => {
    if (!qty) return
    addItem({
      currencyCode: currency.code,
      flag: currency.flag,
      denomValue: denom.value,
      qty,
      rate: rate.rate,
      rateLabel: rate.label,
    })
    resetStack([['bill']])
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title="Nhập số tờ"
        subtitle={`${currency.flag} ${fmtNum(denom.value)} ${currency.code} • ${
          rate.label || 'Đơn giá'
        } ${fmtNum(rate.rate)}`}
        badge={<TypeBadge type={billType} />}
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6">
        <p className="text-[11px] font-bold tracking-[0.2em] text-muted">SỐ TỜ</p>
        <motion.p
          key={raw}
          initial={{ scale: 0.96, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`text-[64px] leading-none font-extrabold tnum ${
            qty ? 'text-cream' : 'text-muted/40'
          }`}
        >
          {qty ? fmtNum(qty) : '0'}
        </motion.p>

        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="text-base font-semibold text-muted tnum">
            = {fmtNum(foreign)} {currency.code}
          </p>
          <p className="text-[30px] font-extrabold tnum text-gold-gradient">
            {fmtVND(vnd)} ₫
          </p>
        </div>
      </div>

      <NumberKeypad onKey={onKey} />

      <div className="safe-bottom px-5 pt-3">
        <BigButton onClick={add} disabled={!qty} className="w-full">
          <Plus size={20} /> Thêm vào bill
        </BigButton>
      </div>
    </div>
  )
}
