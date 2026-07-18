import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trash } from './Icons'

const tap = { scale: 0.965 }
const spring = { type: 'spring', stiffness: 500, damping: 32 }

// Nút lớn neo đáy / hành động chính
export function BigButton({ variant = 'gold', className = '', children, ...props }) {
  const styles = {
    gold: 'btn-gold font-bold',
    outline: 'card-depth text-cream font-semibold',
    ghost: 'text-muted font-medium',
    danger: 'bg-danger/12 border border-danger/40 text-danger font-semibold',
  }
  return (
    <motion.button
      whileTap={tap}
      transition={spring}
      className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl px-5 text-[17px] active:brightness-110 disabled:opacity-40 disabled:saturate-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Card bấm được (chọn ngoại tệ / mệnh giá / đơn giá)
export function PressCard({ className = '', children, ...props }) {
  return (
    <motion.button
      whileTap={tap}
      transition={spring}
      className={`card-depth rounded-2xl text-left active:border-line-strong ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Nút icon tròn nhỏ
export function IconButton({ className = '', children, ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      transition={spring}
      className={`flex h-11 w-11 items-center justify-center rounded-full text-muted active:text-gold ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Badge MUA VÀO / BÁN RA
export function TypeBadge({ type, className = '' }) {
  const buy = type === 'buy'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider ${
        buy ? 'bg-gold/15 text-gold-bright' : 'border border-line-strong text-gold'
      } ${className}`}
    >
      {buy ? 'MUA VÀO' : 'BÁN RA'}
    </span>
  )
}

// Công tắc bật/tắt
export function Toggle({ on, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-200 ${
        on ? 'btn-gold' : 'bg-card2 border border-line'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 34 }}
        className={`absolute top-1 h-6 w-6 rounded-full shadow-md ${
          on ? 'right-1 bg-ink' : 'left-1 bg-muted/60'
        }`}
      />
    </button>
  )
}

// Xoá an toàn: chạm lần 1 để "arm", chạm lần 2 trong 2,5s mới xoá thật
function useArmed() {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 2500)
    return () => clearTimeout(t)
  }, [armed])
  return [armed, setArmed]
}

export function ConfirmDeleteButton({ onConfirm, children, className = '' }) {
  const [armed, setArmed] = useArmed()
  return (
    <motion.button
      whileTap={tap}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-[15px] font-semibold transition-colors ${
        armed ? 'bg-danger text-white' : 'bg-danger/10 border border-danger/35 text-danger'
      } ${className}`}
    >
      {armed ? 'Chạm lần nữa để xoá' : children}
    </motion.button>
  )
}

export function ConfirmIconButton({ onConfirm, className = '' }) {
  const [armed, setArmed] = useArmed()
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={(e) => {
        e.stopPropagation()
        armed ? onConfirm() : setArmed(true)
      }}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
        armed ? 'bg-danger text-white' : 'text-muted/70'
      } ${className}`}
    >
      <Trash size={18} />
    </motion.button>
  )
}

export function EmptyState({ icon, title, subtitle, children }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 pb-16 text-center">
      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl card-depth text-gold">
        {icon}
      </div>
      <p className="font-semibold text-cream">{title}</p>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      {children}
    </div>
  )
}
