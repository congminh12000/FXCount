import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useStore from '../store/useStore'
import { fmtNum, fmtVND, fmtTime, relativeDateLabel } from '../utils/format'
import Header from '../components/Header'
import { TypeBadge, EmptyState, ConfirmDeleteButton } from '../components/UI'
import { Clock, ChevronRight } from '../components/Icons'

export default function History() {
  const history = useStore((s) => s.history)
  const deleteHistory = useStore((s) => s.deleteHistory)
  const [openId, setOpenId] = useState(null)

  const groups = []
  for (const rec of history) {
    const label = relativeDateLabel(rec.completedAt)
    const g = groups[groups.length - 1]
    if (g && g.label === label) g.items.push(rec)
    else groups.push({ label, items: [rec] })
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Lịch sử" subtitle={history.length ? `${history.length} giao dịch` : undefined} />

      {history.length === 0 ? (
        <EmptyState
          icon={<Clock />}
          title="Chưa có giao dịch nào"
          subtitle="Các bill hoàn tất sẽ được lưu ở đây"
        />
      ) : (
        <div className="flex-1 overflow-y-auto px-5 pt-1 pb-10">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mt-4 mb-2 text-[11px] font-bold tracking-[0.15em] text-muted uppercase">
                {g.label}
              </p>
              {g.items.map((rec) => {
                const open = openId === rec.id
                return (
                  <motion.div
                    key={rec.id}
                    layout
                    className="card-depth mb-2.5 overflow-hidden rounded-2xl"
                  >
                    <button
                      onClick={() => setOpenId(open ? null : rec.id)}
                      className="flex w-full items-center gap-3 p-3.5 text-left"
                    >
                      <span className="text-sm font-semibold text-muted tnum">
                        {fmtTime(rec.completedAt)}
                      </span>
                      <TypeBadge type={rec.type} />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {[...new Set(rec.items.map((i) => i.flag))].join(' ')}
                      </span>
                      <span className="font-bold tnum">{fmtVND(rec.totalVND)}</span>
                      <ChevronRight
                        size={18}
                        className={`text-muted transition-transform ${open ? 'rotate-90' : ''}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                        >
                          <div className="border-t border-line px-4 pb-3">
                            {rec.items.map((it) => (
                              <div
                                key={it.id}
                                className="flex items-center justify-between border-b border-line py-2 text-sm last:border-b-0"
                              >
                                <span className="text-muted">
                                  {it.flag} {fmtNum(it.denomValue)} {it.currencyCode} ×{' '}
                                  {fmtNum(it.qty)} • giá {fmtNum(it.rate)}
                                </span>
                                <span className="font-semibold tnum">
                                  {fmtVND(it.subtotalVND)}
                                </span>
                              </div>
                            ))}
                            <ConfirmDeleteButton
                              className="mt-3 w-full"
                              onConfirm={() => deleteHistory(rec.id)}
                            >
                              Xoá bill này
                            </ConfirmDeleteButton>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
