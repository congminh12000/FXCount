import { motion } from 'framer-motion'
import useStore from '../store/useStore'
import { fmtNum, fmtVND, fmtTime } from '../utils/format'
import { BigButton, TypeBadge } from '../components/UI'
import { Check } from '../components/Icons'

export default function DoneScreen({ params }) {
  const history = useStore((s) => s.history)
  const resetStack = useStore((s) => s.resetStack)
  const record = history.find((h) => h.id === params.recordId)
  if (!record) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="safe-top min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex min-h-full flex-col items-center justify-center py-4">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.05 }}
            className="btn-gold flex h-20 w-20 items-center justify-center rounded-full"
          >
            <Check size={38} strokeWidth={3} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-5 flex flex-col items-center"
          >
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">Đã hoàn tất</p>
              <TypeBadge type={record.type} />
            </div>
            <p className="mt-3 text-[40px] leading-tight font-extrabold tnum text-gold-gradient">
              {fmtVND(record.totalVND)} ₫
            </p>
            <p className="mt-1 text-xs text-muted">lúc {fmtTime(record.completedAt)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="card-depth mt-6 w-full rounded-2xl px-4 py-1"
          >
            {record.items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between border-b border-line py-2.5 text-sm last:border-b-0"
              >
                <span className="text-muted">
                  {it.flag} {fmtNum(it.denomValue)} {it.currencyCode} × {fmtNum(it.qty)}
                </span>
                <span className="font-semibold tnum">{fmtVND(it.subtotalVND)}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="glass-bar safe-bottom flex flex-col gap-2.5 px-6 pt-3">
        <BigButton onClick={() => resetStack([])} className="w-full">
          Giao dịch mới
        </BigButton>
        <BigButton variant="ghost" onClick={() => resetStack([['history']])} className="w-full">
          Xem lịch sử
        </BigButton>
      </div>
    </div>
  )
}
