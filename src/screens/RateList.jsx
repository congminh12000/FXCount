import useStore from '../store/useStore'
import { fmtNum, fmtVND } from '../utils/format'
import Header from '../components/Header'
import { BigButton, EmptyState } from '../components/UI'
import { Gear } from '../components/Icons'
import { buildRateListRows } from './rateListData'

function PriceValue({ value }) {
  return value ? (
    <p className="text-[13px] font-bold text-cream tnum">{fmtVND(value)} đ</p>
  ) : (
    <div>
      <p className="text-[13px] font-bold text-muted">—</p>
      <p className="text-[9px] text-muted/70">Chưa cài</p>
    </div>
  )
}

export default function RateList() {
  const currencies = useStore((state) => state.currencies)
  const push = useStore((state) => state.push)
  const rows = buildRateListRows(currencies)

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Danh sách giá" subtitle="Giá theo tờ chuẩn" />

      {rows.length === 0 ? (
        <EmptyState
          icon={<Gear />}
          title="Chưa bật ngoại tệ nào"
          subtitle="Vào Cài đặt để bật các loại ngoại tệ bạn muốn theo dõi"
        >
          <BigButton variant="outline" className="mt-3 px-6" onClick={() => push('settings')}>
            Mở Cài đặt
          </BigButton>
        </EmptyState>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-1 pb-8">
          <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1.25fr)_minmax(88px,1fr)_minmax(88px,1fr)] gap-2 bg-ink/95 px-3 py-2 text-[10px] font-bold tracking-wider text-muted backdrop-blur">
            <span>NGOẠI TỆ</span>
            <span className="text-right text-gold">MUA VÀO</span>
            <span className="text-right">BÁN RA</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {rows.map((row) => (
              <div
                key={row.code}
                className="card-depth grid grid-cols-[minmax(0,1.25fr)_minmax(88px,1fr)_minmax(88px,1fr)] items-center gap-2 rounded-2xl p-3.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="text-[27px] leading-none" aria-hidden="true">
                    {row.flag || '💱'}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold">{row.code}</span>
                    <span className="block truncate text-[10px] text-muted">{row.name}</span>
                    <span className="mt-1 inline-flex rounded-full border border-gold/25 bg-gold/10 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-gold-bright">
                      {row.anchorValue ? `TỜ ${fmtNum(row.anchorValue)}` : 'CHƯA CÓ TỜ CHUẨN'}
                    </span>
                  </span>
                </div>
                <div className="min-w-0 text-right">
                  <PriceValue value={row.buyPrice} />
                </div>
                <div className="min-w-0 text-right">
                  <PriceValue value={row.sellPrice} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
