import useStore from '../store/useStore'
import Header from '../components/Header'
import { PressCard, TypeBadge, EmptyState, BigButton } from '../components/UI'
import { Gear } from '../components/Icons'

export default function SelectCurrency() {
  const currencies = useStore((s) => s.currencies)
  const billType = useStore((s) => s.bill.type)
  const push = useStore((s) => s.push)
  const enabled = currencies.filter((c) => c.enabled)

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Chọn ngoại tệ" badge={<TypeBadge type={billType} />} />
      {enabled.length === 0 ? (
        <EmptyState
          icon={<Gear />}
          title="Chưa bật ngoại tệ nào"
          subtitle="Vào Cài đặt để bật các loại ngoại tệ bạn giao dịch"
        >
          <BigButton variant="outline" className="mt-3 px-6" onClick={() => push('settings')}>
            Mở Cài đặt
          </BigButton>
        </EmptyState>
      ) : (
        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto px-5 pt-2 pb-8">
          {enabled.map((c) => (
            <PressCard
              key={c.code}
              onClick={() => push('denom', { code: c.code })}
              className="flex items-center gap-3 p-4"
            >
              <span className="text-[34px] leading-none">{c.flag}</span>
              <span className="min-w-0">
                <span className="block text-lg font-bold">{c.code}</span>
                <span className="block truncate text-[11px] text-muted">{c.name}</span>
              </span>
            </PressCard>
          ))}
        </div>
      )}
    </div>
  )
}
