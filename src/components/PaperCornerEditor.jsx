import { DEFAULT_PAPER_CORNERS } from '../domain/rateSheetTemplate'

const cornerKeys = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft']

const clamp = (value) => Math.max(0.02, Math.min(0.98, value))

export default function PaperCornerEditor({ imageDataUrl, corners, onChange }) {
  const moveCorner = (key, event) => {
    const bounds = event.currentTarget.parentElement.getBoundingClientRect()
    onChange({
      ...corners,
      [key]: {
        x: clamp((event.clientX - bounds.left) / bounds.width),
        y: clamp((event.clientY - bounds.top) / bounds.height),
      },
    })
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-black/40">
        <img src={imageDataUrl} alt="Ảnh bảng giá cần căn" className="block w-full select-none" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points={cornerKeys.map((key) => `${corners[key].x * 100},${corners[key].y * 100}`).join(' ')}
            fill="rgba(212,175,55,0.12)"
            stroke="#f4d35e"
            strokeWidth="0.7"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {cornerKeys.map((key) => (
          <button
            key={key}
            type="button"
            aria-label={`Chỉnh góc ${key}`}
            onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) moveCorner(key, event)
            }}
            className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-gold bg-ink/85 shadow-lg"
            style={{ left: `${corners[key].x * 100}%`, top: `${corners[key].y * 100}%` }}
          >
            <span className="absolute inset-2 rounded-full bg-gold" />
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11px] leading-relaxed text-muted">
          Kéo bốn chấm vàng trùng với bốn góc tờ giấy.
        </p>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_PAPER_CORNERS)}
          className="shrink-0 text-xs font-semibold text-gold"
        >
          Đặt lại
        </button>
      </div>
    </div>
  )
}
