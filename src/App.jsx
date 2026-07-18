import { AnimatePresence, motion } from 'framer-motion'
import useStore from './store/useStore'
import Home from './screens/Home'
import SelectCurrency from './screens/SelectCurrency'
import SelectDenomination from './screens/SelectDenomination'
import SelectRate from './screens/SelectRate'
import EnterQuantity from './screens/EnterQuantity'
import BillScreen from './screens/BillScreen'
import DoneScreen from './screens/DoneScreen'
import History from './screens/History'
import Settings from './screens/Settings'
import SettingsCurrency from './screens/SettingsCurrency'
import SettingsRates from './screens/SettingsRates'

const SCREENS = {
  home: Home,
  currency: SelectCurrency,
  denom: SelectDenomination,
  rate: SelectRate,
  qty: EnterQuantity,
  bill: BillScreen,
  done: DoneScreen,
  history: History,
  settings: Settings,
  'settings-currency': SettingsCurrency,
  'settings-rates': SettingsRates,
}

const variants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-30%', opacity: dir > 0 ? 1 : 0.5 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-30%' : '100%', opacity: dir > 0 ? 0.5 : 1 }),
}

export default function App() {
  const stack = useStore((s) => s.stack)
  const direction = useStore((s) => s.direction)
  const top = stack[stack.length - 1]
  const ScreenComp = SCREENS[top.name] || Home

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={top.key}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          className="bg-glow absolute inset-0 flex flex-col"
        >
          <ScreenComp params={top.params} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
