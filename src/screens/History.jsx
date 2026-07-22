import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useStore, { itemPricePerNote } from '../store/useStore'
import { fmtNum, fmtVND, fmtTime } from '../utils/format'
import Header from '../components/Header'
import { TypeBadge, EmptyState, ConfirmDeleteButton } from '../components/UI'
import { Clock, ChevronRight } from '../components/Icons'
import {
  HISTORY_DAY_BATCH_SIZE,
  groupHistoryByDay,
  nextVisibleDayCount,
} from './historyData'

const originalPricePerNote = (item) =>
  itemPricePerNote(item) - (item.adjustmentPerNote || 0)

function DaySummary({ records }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const summarize = (type) => {
    const matched = records.filter((record) => record.type === type)
    return {
      count: matched.length,
      total: matched.reduce((sum, record) => sum + record.totalVND, 0),
    }
  }
  const buy = summarize('buy')
  const sell = summarize('sell')
  const currencyTotals = [...records.reduce((currencies, record) => {
    for (const item of record.items) {
      const current = currencies.get(item.currencyCode) || {
        code: item.currencyCode,
        flag: item.flag,
        buy: { foreign: 0, vnd: 0 },
        sell: { foreign: 0, vnd: 0 },
      }
      current[record.type].foreign += item.foreignAmount
      current[record.type].vnd += item.subtotalVND
      currencies.set(item.currencyCode, current)
    }
    return currencies
  }, new Map()).values()]

  return (
    <div className="card-depth mb-2.5 overflow-hidden rounded-2xl">
      <div className="grid grid-cols-2 divide-x divide-line">
        {[
          { label: 'TỔNG MUA VÀO', summary: buy, prominent: true },
          { label: 'TỔNG BÁN RA', summary: sell, prominent: false },
        ].map(({ label, summary, prominent }) => (
          <div key={label} className="min-w-0 px-3 py-2.5">
            <p
              className={`text-[9px] font-bold tracking-[0.12em] ${
                prominent ? 'text-gold' : 'text-muted'
              }`}
            >
              {label}
            </p>
            <p className="mt-1 truncate text-base font-extrabold tnum text-cream">
              {fmtVND(summary.total)} ₫
            </p>
            <p className="mt-0.5 truncate text-[10px] text-muted">
              {summary.count ? `${summary.count} giao dịch` : 'Chưa có giao dịch'}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-expanded={detailsOpen}
        onClick={() => setDetailsOpen((open) => !open)}
        className="flex w-full items-center gap-2 border-t border-line px-3 py-2 text-left"
      >
        <span className="min-w-0 flex-1 text-[10px] font-bold tracking-[0.08em] text-muted">
          CHI TIẾT THEO LOẠI TIỀN
        </span>
        <span className="text-[10px] text-muted">{currencyTotals.length} loại</span>
        <ChevronRight
          size={15}
          className={`text-muted transition-transform ${detailsOpen ? 'rotate-90' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {detailsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-3 pb-1">
              {currencyTotals.map((currency) => (
                <div
                  key={currency.code}
                  className="grid grid-cols-[58px_1fr_1fr] gap-2 border-b border-line py-2 last:border-b-0"
                >
                  <p className="text-xs font-bold">
                    {currency.flag} {currency.code}
                  </p>
                  {[
                    { label: 'MUA', value: currency.buy },
                    { label: 'BÁN', value: currency.sell },
                  ].map(({ label, value }) => (
                    <div key={label} className="min-w-0 tnum">
                      <p className="text-[8px] font-bold tracking-[0.1em] text-muted">{label}</p>
                      {value.vnd ? (
                        <>
                          <p className="truncate text-[11px] font-semibold text-cream">
                            {fmtNum(value.foreign)} {currency.code}
                          </p>
                          <p className="truncate text-[9px] text-muted">{fmtVND(value.vnd)}đ</p>
                        </>
                      ) : (
                        <p className="text-[11px] text-muted">—</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function History() {
  const history = useStore((s) => s.history)
  const deleteHistory = useStore((s) => s.deleteHistory)
  const [openId, setOpenId] = useState(null)
  const [visibleDayCount, setVisibleDayCount] = useState(HISTORY_DAY_BATCH_SIZE)
  const scrollRef = useRef(null)
  const loadMoreRef = useRef(null)
  const groups = useMemo(() => groupHistoryByDay(history), [history])
  const visibleGroups = groups.slice(0, visibleDayCount)
  const hasMore = visibleDayCount < groups.length

  useEffect(() => {
    const root = scrollRef.current
    const target = loadMoreRef.current
    if (!hasMore || !root || !target) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setVisibleDayCount((currentCount) =>
          nextVisibleDayCount(currentCount, groups.length)
        )
      },
      { root, rootMargin: '0px 0px 240px 0px', threshold: 0.01 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [groups.length, hasMore])

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
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-1 pb-10">
          {visibleGroups.map((g) => (
            <div key={g.key}>
              <p className="mt-4 mb-2 text-[11px] font-bold tracking-[0.15em] text-muted uppercase">
                {g.label}
              </p>
              <DaySummary records={g.items} />
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
                                className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm last:border-b-0"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-muted">
                                    {it.flag} {fmtNum(it.denomValue)} {it.currencyCode} ×{' '}
                                    {fmtNum(it.qty)}
                                  </p>
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] tnum">
                                    <span className="text-muted">
                                      Đơn giá: {fmtVND(originalPricePerNote(it))}đ/tờ
                                    </span>
                                    {it.adjustmentPerNote ? (
                                      <span className="rounded-md bg-gold/10 px-1.5 py-0.5 font-bold text-gold">
                                        Giảm {fmtVND(Math.abs(it.adjustmentPerNote))}đ/tờ
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-[9px] font-bold tracking-[0.08em] text-muted">
                                    THÀNH TIỀN
                                  </p>
                                  <p className="font-semibold tnum">{fmtVND(it.subtotalVND)}</p>
                                </div>
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
          {hasMore ? (
            <div
              ref={loadMoreRef}
              aria-live="polite"
              className="flex min-h-14 items-center justify-center text-[11px] font-semibold text-muted"
            >
              Đang tải thêm…
            </div>
          ) : (
            <p className="py-5 text-center text-[10px] font-semibold tracking-wide text-muted/70">
              ĐÃ HIỂN THỊ TOÀN BỘ
            </p>
          )}
        </div>
      )}
    </div>
  )
}
