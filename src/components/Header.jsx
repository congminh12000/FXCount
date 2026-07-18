import useStore from '../store/useStore'
import { ChevronLeft } from './Icons'
import { IconButton } from './UI'

export default function Header({ title, subtitle, badge, right, onBack }) {
  const pop = useStore((s) => s.pop)
  return (
    <div className="safe-top flex items-center gap-1 px-3 pb-2">
      <IconButton onClick={onBack || pop} className="-ml-1 text-cream">
        <ChevronLeft size={26} />
      </IconButton>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-lg font-bold">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
