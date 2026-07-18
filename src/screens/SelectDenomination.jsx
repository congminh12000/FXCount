import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useStore, { findCurrency, ratesFor } from '../store/useStore'
import { fmtNum } from '../utils/format'
import Header from '../components/Header'
import { PressCard, TypeBadge, BigButton, EmptyState } from '../components/UI'
import { Plus } from '../components/Icons'

export default function SelectDenomination({ params }) {
  const currencies = useStore((s) => s.currencies)
  const billType = useStore((s) => s.bill.type)
  const push = useStore((s) => s.push)
  const [missing, setMissing] = useState(null) // mệnh giá chưa có đơn giá

  const currency = findCurrency(currencies, params.code)
  if (!currency) return null

  const pick = (denom) => {
    const rates = ratesFor(denom, billType)
    if (rates.length === 0) return setMissing(denom)
    if (rates.length === 1)
      return push('qty', { code: currency.code, denomId: denom.id, rateId: rates[0].id })
    push('rate', { code: currency.code, denomId: denom.id })
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
        <div className="grid flex-1 auto-rows-min grid-cols-3 gap-3 overflow-y-auto px-5 pt-2 pb-8">
          {currency.denominations.map((d) => (
            <PressCard
              key={d.id}
              onClick={() => pick(d)}
              className="flex h-21 flex-col items-center justify-center gap-0.5"
            >
              <span className="text-[22px] font-extrabold tnum">{fmtNum(d.value)}</span>
              <span className="text-[10px] font-semibold tracking-widest text-muted">
                {currency.code}
              </span>
            </PressCard>
          ))}
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
              {fmtNum(missing.value)} {currency.code} chưa có đơn giá{' '}
              {billType === 'buy' ? 'mua vào' : 'bán ra'}
            </p>
            <p className="mt-0.5 text-sm text-muted">Cài đơn giá trước rồi quay lại giao dịch.</p>
            <div className="mt-3 flex gap-2.5 pb-1">
              <BigButton variant="ghost" className="flex-1" onClick={() => setMissing(null)}>
                Đóng
              </BigButton>
              <BigButton
                className="flex-[2]"
                onClick={() =>
                  push('settings-rates', { code: currency.code, denomId: missing.id })
                }
              >
                Cài đơn giá
              </BigButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
