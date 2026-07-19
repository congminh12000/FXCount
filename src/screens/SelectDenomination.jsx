import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useStore, { findCurrency, anchorOf, pricePerNoteFor } from '../store/useStore'
import { fmtNum } from '../utils/format'
import Header from '../components/Header'
import { PressCard, TypeBadge, BigButton, EmptyState } from '../components/UI'
import { Plus } from '../components/Icons'

export default function SelectDenomination({ params }) {
  const currencies = useStore((s) => s.currencies)
  const billType = useStore((s) => s.bill.type)
  const push = useStore((s) => s.push)
  const [missing, setMissing] = useState(false) // chưa cài giá chuẩn

  const currency = findCurrency(currencies, params.code)
  if (!currency) return null
  const anchor = anchorOf(currency)

  const pick = (denom) => {
    const price = pricePerNoteFor(currency, denom, billType)
    if (!price || price <= 0) return setMissing(true)
    push('qty', { code: currency.code, denomId: denom.id })
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title={`Mệnh giá ${currency.code}`}
        subtitle={currency.name}
        badge={<TypeBadge type={billType} />}
      />
      {currency.denominations.length === 0 ? (
        <EmptyState
          icon={<Plus />}
          title="Chưa có mệnh giá nào"
          subtitle={`Thêm mệnh giá cho ${currency.code} trong Cài đặt`}
        >
          <BigButton
            variant="outline"
            className="mt-3 px-6"
            onClick={() => push('settings-currency', { code: currency.code })}
          >
            Cài đặt {currency.code}
          </BigButton>
        </EmptyState>
      ) : (
        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto px-5 pt-2 pb-8">
          {currency.denominations.map((d) => {
            const isAnchor = anchor && d.id === anchor.id
            return (
              <PressCard
                key={d.id}
                onClick={() => pick(d)}
                className={`relative flex h-23 flex-col items-center justify-center gap-1 ${
                  isAnchor ? 'border-line-strong' : ''
                }`}
              >
                {isAnchor && (
                  <span className="absolute top-2 right-2.5 text-[9px] font-bold tracking-widest text-gold/70">
                    CHUẨN
                  </span>
                )}
                <span className="text-[24px] leading-none font-extrabold tnum">
                  {fmtNum(d.value)}
                  <span className="ml-1 text-[11px] font-semibold text-muted">{currency.code}</span>
                </span>
              </PressCard>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {missing && (
          <motion.div
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className="glass-bar safe-bottom absolute inset-x-0 bottom-0 rounded-t-3xl px-5 pt-4"
          >
            <p className="font-semibold">
              {currency.code} chưa cài giá {billType === 'buy' ? 'mua vào' : 'bán ra'}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              Nhập giá tờ chuẩn{anchor ? ` (${fmtNum(anchor.value)} ${currency.code})` : ''} trong
              Cài đặt, các mệnh giá khác tự tính theo.
            </p>
            <div className="mt-3 flex gap-2.5 pb-1">
              <BigButton variant="ghost" className="flex-1" onClick={() => setMissing(false)}>
                Đóng
              </BigButton>
              <BigButton
                className="flex-[2]"
                onClick={() => push('settings-currency', { code: currency.code })}
              >
                Cài giá {currency.code}
              </BigButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
