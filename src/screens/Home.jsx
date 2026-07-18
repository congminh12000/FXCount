import useStore, { billTotal } from '../store/useStore'
import { fmtVND } from '../utils/format'
import { BigButton, PressCard, IconButton, TypeBadge } from '../components/UI'
import { Gear, Clock, ArrowDown, ArrowUp, ChevronRight } from '../components/Icons'

export default function Home() {
  const push = useStore((s) => s.push)
  const startBill = useStore((s) => s.startBill)
  const bill = useStore((s) => s.bill)
  const hasDraft = bill.items.length > 0

  const begin = (type) => {
    if (hasDraft && bill.type !== type) {
      const label = bill.type === 'buy' ? 'MUA VÀO' : 'BÁN RA'
      if (!window.confirm(`Bạn đang có bill ${label} chưa hoàn tất. Bắt đầu bill mới sẽ xoá bill đó?`))
        return
    }
    startBill(type)
    push('currency')
  }

  return (
    <div className="safe-top safe-bottom flex flex-1 flex-col px-5">
      <div className="flex items-center justify-between">
        <IconButton onClick={() => push('history')}>
          <Clock />
        </IconButton>
        <IconButton onClick={() => push('settings')}>
          <Gear />
        </IconButton>
      </div>

      <div className="mt-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] card-depth">
          <span className="text-2xl font-extrabold text-gold-gradient">₫</span>
        </div>
        <h1 className="text-[40px] font-extrabold tracking-tight text-gold-gradient">FXCount</h1>
        <p className="mt-1 text-sm text-muted">Tính giá ngoại tệ nhanh &amp; chính xác</p>
      </div>

      <div className="mt-auto flex flex-col gap-3.5 pb-2">
        {hasDraft && (
          <PressCard onClick={() => push('bill')} className="flex items-center gap-3 p-4">
            <TypeBadge type={bill.type} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Tiếp tục bill đang tính</p>
              <p className="text-xs text-muted">
                {bill.items.length} dòng • {fmtVND(billTotal(bill))} ₫
              </p>
            </div>
            <ChevronRight className="text-muted" />
          </PressCard>
        )}

        <BigButton onClick={() => begin('buy')} className="h-24 flex-col gap-0.5 rounded-3xl">
          <span className="flex items-center gap-2 text-[22px] font-extrabold tracking-wide">
            <ArrowDown size={24} /> MUA VÀO
          </span>
          <span className="text-[12px] font-semibold opacity-70">Khách đưa ngoại tệ — mình trả VND</span>
        </BigButton>

        <BigButton
          variant="outline"
          onClick={() => begin('sell')}
          className="h-24 flex-col gap-0.5 rounded-3xl"
        >
          <span className="flex items-center gap-2 text-[22px] font-extrabold tracking-wide text-gold">
            <ArrowUp size={24} /> BÁN RA
          </span>
          <span className="text-[12px] font-medium text-muted">Khách mua ngoại tệ — mình thu VND</span>
        </BigButton>
      </div>
    </div>
  )
}
