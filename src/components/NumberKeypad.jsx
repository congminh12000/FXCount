import { motion } from 'framer-motion'
import { Backspace } from './Icons'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'del']

export default function NumberKeypad({ onKey }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 px-5">
      {KEYS.map((k) => (
        <motion.button
          key={k}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 600, damping: 30 }}
          onClick={() => onKey(k)}
          className={`card-depth flex h-15 items-center justify-center rounded-2xl text-2xl font-semibold tnum ${
            k === 'C' || k === 'del' ? 'text-muted' : 'text-cream'
          }`}
        >
          {k === 'del' ? <Backspace /> : k}
        </motion.button>
      ))}
    </div>
  )
}
