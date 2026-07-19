import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useStore, {
  findCurrency,
  anchorOf,
  buyPricePerNote,
  sellPricePerNote,
} from '../store/useStore'
import {
  fmtNum,
  fmtVND,
  formatRateInput,
  parseRate,
  formatAdjustInput,
  parseAdjust,
} from '../utils/format'
import Header from '../components/Header'
import { BigButton, ConfirmDeleteButton, ConfirmIconButton, TypeBadge } from '../components/UI'
import { ChevronRight, Plus } from '../components/Icons'

const inputCls =
  'h-13 rounded-xl bg-card2 border border-line px-3 text-cream tnum font-bold text-[17px] placeholder:text-muted/50 placeholder:font-normal focus:border-line-strong outline-none'

const fmtSigned = (n) => (n < 0 ? '-' : '') + fmtVND(Math.abs(n))

// Ô nhập giá tờ chuẩn — ghi thẳng vào store khi gõ
function AnchorPriceInput({ currency, side }) {
  const setAnchorPrice = useStore((s) => s.setAnchorPrice)
  const stored = side === 'buy' ? currency.buyAnchorPrice : currency.sellAnchorPrice
  const [text, setText] = useState(stored ? fmtVND(stored) : '')
  return (
    <input
      value={text}
      inputMode="numeric"
      placeholder="VD: 2.615.000"
      onChange={(e) => {
        const t = formatRateInput(e.target.value)
        setText(t)
        setAnchorPrice(currency.code, side, parseRate(t))
      }}
      className={`${inputCls} w-full text-right`}
    />
  )
}

// Chỉnh chênh lệch giá mua đ/tờ cho 1 mệnh giá (≠ tờ chuẩn)
function AdjustEditor({ currency, denom }) {
  const setAdjust = useStore((s) => s.setAdjust)
  const [text, setText] = useState(denom.adjustBuy ? fmtSigned(denom.adjustBuy) : '0')

  const apply = (n) => {
    setAdjust(currency.code, denom.id, n)
    setText(fmtSigned(n))
  }

  return (
    <div className="border-t border-line px-4 pt-3 pb-4">
      <p className="mb-2 text-xs font-semibold text-muted">
        Chênh lệch giá mua so với tỷ lệ tờ chuẩn (đ/tờ)
      </p>
      <div className="flex items-center gap-2.5">
        <BigButton
          variant="outline"
          className="min-h-12 flex-1 px-0 text-[15px]"
          onClick={() => apply((denom.adjustBuy || 0) - 5000)}
        >
          −5.000
        </BigButton>
        <input
          value={text}
          inputMode="numeric"
          onChange={(e) => {
            const t = formatAdjustInput(e.target.value)
            setText(t)
            setAdjust(currency.code, denom.id, parseAdjust(t))
          }}
          className="h-13 w-24 min-w-0 rounded-xl border border-line bg-card2 px-1 text-center text-[15px] font-bold text-cream tnum outline-none focus:border-line-strong"
        />
        <BigButton
          variant="outline"
          className="min-h-12 flex-1 px-0 text-[15px]"
          onClick={() => apply((denom.adjustBuy || 0) + 5000)}
        >
          +5.000
        </BigButton>
      </div>
      <p className="mt-2.5 text-sm font-semibold text-gold-bright tnum">
        = mua {fmtVND(buyPricePerNote(currency, denom) || 0)} đ/tờ
      </p>
    </div>
  )
}

function FixedBuyRateEditor({ currency, denom }) {
  const setFixedBuyRate = useStore((s) => s.setFixedBuyRate)
  const [text, setText] = useState(denom.fixedBuyRate ? fmtVND(denom.fixedBuyRate) : '')
  const buy = buyPricePerNote(currency, denom)
  const unit = denom.fixedBuyUnit || 1

  return (
    <div className="border-t border-line px-4 pt-3 pb-4">
      <label className="block">
        <span className="mb-2 block text-xs font-semibold text-muted">
          Giá mua riêng (đ / {fmtNum(unit)} {currency.code})
        </span>
        <input
          value={text}
          inputMode="numeric"
          placeholder="VD: 23.000"
          onChange={(e) => {
            const next = formatRateInput(e.target.value)
            setText(next)
            setFixedBuyRate(currency.code, denom.id, parseRate(next))
          }}
          className={`${inputCls} w-full text-right`}
        />
      </label>
      <p className="mt-2.5 text-sm font-semibold text-gold-bright tnum">
        = mua {buy ? fmtVND(buy) : '—'} đ/tờ
      </p>
    </div>
  )
}

export default function SettingsCurrency({ params }) {
  const currencies = useStore((s) => s.currencies)
  const addDenomination = useStore((s) => s.addDenomination)
  const removeDenomination = useStore((s) => s.removeDenomination)
  const setAnchorDenomination = useStore((s) => s.setAnchorDenomination)
  const removeCurrency = useStore((s) => s.removeCurrency)
  const pop = useStore((s) => s.pop)

  const [newValue, setNewValue] = useState('')
  const [openId, setOpenId] = useState(null)

  const currency = findCurrency(currencies, params.code)
  if (!currency) return null
  const anchor = anchorOf(currency)

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
        {anchor ? (
          <>
            <p className="mb-3 rounded-xl bg-card2/60 px-3 py-2.5 text-xs leading-relaxed text-muted">
              Nhập giá <b className="text-cream">tờ chuẩn {fmtNum(anchor.value)} {currency.code}</b>.
              {' '}Mỗi mệnh giá có thể theo tỷ lệ, cộng/trừ chênh lệch hoặc dùng đơn giá mua riêng.
            </p>

            <div className="mb-5 flex flex-col gap-2.5">
              <div className="card-depth rounded-2xl p-4">
                <div className="mb-2 flex items-center justify-between">
                  <TypeBadge type="buy" />
                  <span className="text-xs text-muted">
                    đ / tờ {fmtNum(anchor.value)} {currency.code}
                  </span>
                </div>
                <AnchorPriceInput key={`buy-${currency.code}-${anchor.value}`} currency={currency} side="buy" />
              </div>
              <div className="card-depth rounded-2xl p-4">
                <div className="mb-2 flex items-center justify-between">
                  <TypeBadge type="sell" />
                  <span className="text-xs text-muted">
                    đ / tờ {fmtNum(anchor.value)} {currency.code}
                  </span>
                </div>
                <AnchorPriceInput key={`sell-${currency.code}-${anchor.value}`} currency={currency} side="sell" />
              </div>
            </div>
          </>
        ) : (
          <p className="mb-3 rounded-xl bg-card2/60 px-3 py-2.5 text-xs leading-relaxed text-muted">
            Thêm mệnh giá trước, sau đó chọn tờ chuẩn để cài giá.
          </p>
        )}

        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold tracking-[0.15em] text-muted">MỆNH GIÁ</p>
          <p className="text-[10px] font-semibold text-muted">Chọn ◉ để đặt tờ chuẩn</p>
        </div>

        {currency.denominations.map((d) => {
          const isAnchor = anchor && d.id === anchor.id
          const isDerived = Boolean(d.derivedBuy)
          const hasFixedBuyRate = d.fixedBuyRate !== undefined
          const canEdit = !isAnchor && !isDerived
          const buy = buyPricePerNote(currency, d)
          const sell = sellPricePerNote(currency, d)
          const open = openId === d.id
          return (
            <motion.div key={d.id} layout className="card-depth mb-2.5 overflow-hidden rounded-2xl">
              <div className="flex items-center gap-2 p-3 pl-4">
                <label className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center">
                  <input
                    type="radio"
                    name={`anchor-${currency.code}`}
                    checked={Boolean(isAnchor)}
                    onChange={() => {
                      setAnchorDenomination(currency.code, d.value)
                      setOpenId(null)
                    }}
                    aria-label={`Đặt ${fmtNum(d.value)} ${currency.code} làm tờ chuẩn`}
                    className="h-5 w-5 cursor-pointer accent-[#d4af37]"
                  />
                </label>
                <button
                  onClick={() => canEdit && setOpenId(open ? null : d.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <span className="text-lg font-extrabold tnum">{fmtNum(d.value)}</span>
                  {isAnchor ? (
                    <span className="rounded-full border border-line-strong px-2 py-0.5 text-[9px] font-bold tracking-widest text-gold">
                      CHUẨN
                    </span>
                  ) : isDerived ? (
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold-bright tnum">
                      = {fmtNum(d.derivedBuy.sourceValue)} × {d.derivedBuy.multiplier}
                      {d.derivedBuy.offset
                        ? ` ${d.derivedBuy.offset > 0 ? '+' : '−'} ${fmtVND(Math.abs(d.derivedBuy.offset))}`
                        : ''}
                    </span>
                  ) : hasFixedBuyRate ? (
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold-bright tnum">
                      {d.fixedBuyRate
                        ? `${fmtVND(d.fixedBuyRate)}/${fmtNum(d.fixedBuyUnit || 1)} ${currency.code}`
                        : 'giá riêng'}
                    </span>
                  ) : (
                    d.adjustBuy !== 0 && (
                      <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold-bright tnum">
                        {d.adjustBuy > 0 ? '+' : '−'}{fmtVND(Math.abs(d.adjustBuy))}/tờ
                      </span>
                    )
                  )}
                  <span className="ml-auto flex flex-col items-end">
                    <span className="text-[13px] font-bold text-gold-bright tnum">
                      {buy ? `mua ${fmtVND(buy)}` : 'mua —'}
                    </span>
                    <span className="text-[11px] text-muted tnum">
                      {sell ? `bán ${fmtVND(sell)}` : 'bán —'}
                    </span>
                  </span>
                  {canEdit && (
                    <ChevronRight
                      size={16}
                      className={`shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`}
                    />
                  )}
                </button>
                {!isAnchor && (
                  <ConfirmIconButton onConfirm={() => removeDenomination(currency.code, d.id)} />
                )}
              </div>

              <AnimatePresence initial={false}>
                {open && canEdit && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                  >
                    {hasFixedBuyRate ? (
                      <FixedBuyRateEditor currency={currency} denom={d} />
                    ) : (
                      <AdjustEditor currency={currency} denom={d} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}

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
