import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useStore from '../store/useStore'
import Header from '../components/Header'
import { Toggle, BigButton } from '../components/UI'
import { ChevronRight, Plus, ScanLine } from '../components/Icons'

export default function Settings() {
  const currencies = useStore((s) => s.currencies)
  const toggleCurrency = useStore((s) => s.toggleCurrency)
  const addCurrency = useStore((s) => s.addCurrency)
  const push = useStore((s) => s.push)

  const [showAdd, setShowAdd] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [flag, setFlag] = useState('')

  const submitAdd = () => {
    const c = code.trim().toUpperCase()
    if (!c || currencies.some((x) => x.code === c)) return
    addCurrency({ code: c, name: name.trim() || c, flag: flag.trim() })
    setCode('')
    setName('')
    setFlag('')
    setShowAdd(false)
    push('settings-currency', { code: c })
  }

  const inputCls =
    'h-12 rounded-xl bg-card2 border border-line px-3 text-cream placeholder:text-muted/50 focus:border-line-strong outline-none'

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Cài đặt" />

      <div className="flex-1 overflow-y-auto px-5 pt-1 pb-10">
        <BigButton
          className="mb-4 w-full"
          onClick={() => push('import-rates')}
        >
          <ScanLine size={20} /> Nhập bảng giá
        </BigButton>

        {currencies.map((c) => (
          <div
            key={c.code}
            className="card-depth mb-2.5 flex items-center gap-3 rounded-2xl p-3.5"
          >
            <button
              onClick={() => push('settings-currency', { code: c.code })}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="text-[28px] leading-none">{c.flag}</span>
              <span className="min-w-0">
                <span className="block font-bold">{c.code}</span>
                <span className="block truncate text-xs text-muted">{c.name}</span>
              </span>
              <ChevronRight size={18} className="ml-auto text-muted" />
            </button>
            <Toggle on={c.enabled} onChange={() => toggleCurrency(c.code)} />
          </div>
        ))}

        <AnimatePresence initial={false}>
          {showAdd ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="card-depth mt-1 flex flex-col gap-2.5 rounded-2xl p-4">
                <p className="text-sm font-bold">Thêm ngoại tệ mới</p>
                <div className="flex gap-2.5">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Mã (VD: CHF)"
                    maxLength={5}
                    className={`${inputCls} w-32`}
                  />
                  <input
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    placeholder="Cờ 🇨🇭"
                    maxLength={4}
                    className={`${inputCls} min-w-0 flex-1`}
                  />
                </div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên (VD: Franc Thụy Sĩ)"
                  className={inputCls}
                />
                <div className="mt-1 flex gap-2.5">
                  <BigButton variant="ghost" className="flex-1" onClick={() => setShowAdd(false)}>
                    Huỷ
                  </BigButton>
                  <BigButton className="flex-[2]" disabled={!code.trim()} onClick={submitAdd}>
                    Thêm
                  </BigButton>
                </div>
              </div>
            </motion.div>
          ) : (
            <BigButton variant="outline" className="mt-1 w-full" onClick={() => setShowAdd(true)}>
              <Plus size={18} /> Thêm ngoại tệ
            </BigButton>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
