import { AnimatePresence, motion } from 'framer-motion'
import useStore, { billTotal, itemPricePerNote } from '../store/useStore'
import { fmtNum, fmtVND } from '../utils/format'
import Header from '../components/Header'
import { BigButton, TypeBadge, EmptyState, ConfirmIconButton } from '../components/UI'
import { Plus, Check, Clock } from '../components/Icons'

const originalPricePerNote = (item) =>
  itemPricePerNote(item) - (item.adjustmentPerNote || 0)

export default function BillScreen() {
  const bill = useStore((s) => s.bill)
  const removeItem = useStore((s) => s.removeItem)
  const completeBill = useStore((s) => s.completeBill)
  const push = useStore((s) => s.push)
  const resetStack = useStore((s) => s.resetStack)

  const total = billTotal(bill)

  const finish = () => {
    const record = completeBill()
    if (record) resetStack([['done', { recordId: record.id }]])
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Bill giao dịch" badge={bill.type && <TypeBadge type={bill.type} />} />

      {bill.items.length === 0 ? (
        <EmptyState
          icon={<Clock />}
          title="Bill đang trống"
          subtitle="Thêm ngoại tệ để bắt đầu tính"
        >
          <BigButton className="mt-3 px-6" onClick={() => push('currency')}>
            <Plus size={20} /> Thêm tiền
          </BigButton>
        </EmptyState>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 pt-1 pb-4">
          <AnimatePresence initial={false}>
            {bill.items.map((it) => (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -60, height: 0, marginBottom: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                className="card-depth mb-2.5 flex items-center gap-2 overflow-hidden rounded-2xl p-3"
              >
                <span className="text-[22px] leading-none">{it.flag}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold whitespace-nowrap">
                    {fmtNum(it.denomValue)} {it.currencyCode}
                    <span className="font-semibold text-muted"> × {fmtNum(it.qty)} tờ</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted tnum">
                    Tổng ngoại tệ: {fmtNum(it.foreignAmount)} {it.currencyCode}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] tnum">
                    <span className="text-muted">
                      {it.adjustmentPerNote ? 'Giá gốc' : 'Đơn giá'}:{' '}
                      {fmtVND(originalPricePerNote(it))}đ/tờ
                    </span>
                    {it.adjustmentPerNote ? (
                      <span className="rounded-md bg-gold/10 px-1.5 py-0.5 font-bold text-gold">
                        Giảm {fmtVND(Math.abs(it.adjustmentPerNote))}đ/tờ
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[9px] font-bold tracking-[0.08em] text-muted">THÀNH TIỀN</p>
                  <p className="text-sm font-bold tnum">{fmtVND(it.subtotalVND)}</p>
                </div>
                <ConfirmIconButton onConfirm={() => removeItem(it.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {bill.items.length > 0 && (
        <div className="glass-bar safe-bottom px-5 pt-3.5">
          <div className="flex items-end justify-between pb-3">
            <span className="pb-1 text-[11px] font-bold tracking-[0.2em] text-muted">
              TỔNG CỘNG
            </span>
            <motion.span
              key={total}
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
              className="text-[32px] leading-none font-extrabold tnum text-gold-gradient"
            >
              {fmtVND(total)} ₫
            </motion.span>
          </div>
          <div className="flex gap-2.5 pb-1">
            <BigButton variant="outline" className="flex-1" onClick={() => push('currency')}>
              <Plus size={18} /> Thêm tiền
            </BigButton>
            <BigButton className="flex-1" onClick={finish}>
              <Check size={20} /> Hoàn tất
            </BigButton>
          </div>
        </div>
      )}
    </div>
  )
}
