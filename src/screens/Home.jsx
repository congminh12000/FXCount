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

      <div className="flex min-h-0 flex-1 flex-col justify-center py-8">
        <div className="text-center">
          <h1 className="text-[40px] font-extrabold tracking-tight text-gold-gradient">FXCount</h1>
          <p className="mt-1 text-sm text-muted">Tính giá ngoại tệ nhanh &amp; chính xác</p>
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-sm flex-col gap-3.5">
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

          <BigButton onClick={() => begin('buy')} className="h-20 rounded-3xl">
            <span className="flex items-center gap-2 text-[22px] font-extrabold tracking-wide">
              <ArrowDown size={24} /> MUA VÀO
            </span>
          </BigButton>

          <BigButton variant="outline" onClick={() => begin('sell')} className="h-20 rounded-3xl">
            <span className="flex items-center gap-2 text-[22px] font-extrabold tracking-wide text-gold">
              <ArrowUp size={24} /> BÁN RA
            </span>
          </BigButton>
        </div>
      </div>
    </div>
  )
}
