import useStore, { findCurrency, ratesFor } from '../store/useStore'
import { fmtNum } from '../utils/format'
import Header from '../components/Header'
import { PressCard, TypeBadge } from '../components/UI'

export default function SelectRate({ params }) {
  const currencies = useStore((s) => s.currencies)
  const billType = useStore((s) => s.bill.type)
  const push = useStore((s) => s.push)

  const currency = findCurrency(currencies, params.code)
  const denom = currency?.denominations.find((d) => d.id === params.denomId)
  if (!currency || !denom) return null
  const rates = ratesFor(denom, billType)

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title="Chọn đơn giá"
        subtitle={`${currency.flag} ${fmtNum(denom.value)} ${currency.code}`}
        badge={<TypeBadge type={billType} />}
      />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pt-2 pb-8">
        {rates.map((r, i) => (
          <PressCard
            key={r.id}
            onClick={() =>
              push('qty', { code: currency.code, denomId: denom.id, rateId: r.id })
            }
            className="flex items-center justify-between p-5"
          >
            <span className="text-[15px] font-semibold text-muted">
              {r.label || `Đơn giá ${i + 1}`}
            </span>
            <span className="text-2xl font-extrabold tnum text-gold-gradient">
              {fmtNum(r.rate)}
            </span>
          </PressCard>
        ))}
      </div>
    </div>
  )
}
