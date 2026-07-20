import { useState } from 'react'
import { motion } from 'framer-motion'
import useStore, {
  adjustedPricePerNote,
  findCurrency,
  pricePerNoteFor,
} from '../store/useStore'
import { fmtNum, fmtVND } from '../utils/format'
import Header from '../components/Header'
import NumberKeypad from '../components/NumberKeypad'
import { BigButton, TypeBadge } from '../components/UI'
import { Plus } from '../components/Icons'

const PRICE_STEP = 5000

export default function EnterQuantity({ params }) {
  const currencies = useStore((s) => s.currencies)
  const billType = useStore((s) => s.bill.type)
  const addItem = useStore((s) => s.addItem)
  const resetStack = useStore((s) => s.resetStack)
  const [raw, setRaw] = useState('')
  const [adjustmentPerNote, setAdjustmentPerNote] = useState(0)

  const currency = findCurrency(currencies, params.code)
  const denom = currency?.denominations.find((d) => d.id === params.denomId)
  const price = currency && denom ? pricePerNoteFor(currency, denom, billType) : null
  if (!currency || !denom || !price) return null

  const finalPrice = adjustedPricePerNote(price, adjustmentPerNote)
  const qty = parseInt(raw || '0', 10)
  const foreign = qty * denom.value
  const vnd = Math.round(qty * finalPrice)

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
      pricePerNote: finalPrice,
      adjustmentPerNote,
    })
    resetStack([['bill']])
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title="Nhập số tờ"
        subtitle={`${currency.flag} ${fmtNum(denom.value)} ${currency.code} • ${fmtVND(price)} đ/tờ`}
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

        <div className="mt-4 flex w-full flex-col items-center gap-2">
          <p className="text-base font-semibold text-muted tnum">
            = {fmtNum(foreign)} {currency.code}
          </p>

          <div className="card-depth flex w-full max-w-xs items-center gap-2 rounded-xl px-2.5 py-2">
            <span className="shrink-0 text-[9px] font-bold tracking-[0.12em] text-muted">
              GIẢM / TỜ
            </span>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setAdjustmentPerNote((current) => current - PRICE_STEP)}
              disabled={finalPrice <= PRICE_STEP}
              aria-label="Giảm thêm 5.000 đồng mỗi tờ"
              className="card-depth flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-gold disabled:opacity-35"
            >
              −
            </motion.button>
            <input
              readOnly
              value={adjustmentPerNote ? `−${fmtVND(Math.abs(adjustmentPerNote))}` : '0'}
              aria-label="Mức giảm giá mỗi tờ"
              className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-card2 px-1.5 text-center text-base font-extrabold text-gold-bright tnum outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setAdjustmentPerNote((current) => Math.min(0, current + PRICE_STEP))}
              disabled={adjustmentPerNote === 0}
              aria-label="Tăng lại 5.000 đồng mỗi tờ"
              className="card-depth flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-gold disabled:opacity-35"
            >
              +
            </motion.button>
          </div>

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
