const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const ChevronLeft = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} {...p}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

export const ChevronRight = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} {...p}>
    <path d="M9 18l6-6-6-6" />
  </svg>
)

export const Gear = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
  </svg>
)

export const Clock = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export const Trash = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} {...base} {...p}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

export const Plus = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const Check = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} {...base} {...p}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

export const Pencil = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} {...base} {...p}>
    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
)

export const Backspace = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 26} height={p.size || 26} {...base} {...p}>
    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
    <path d="M18 9l-6 6M12 9l6 6" />
  </svg>
)

export const ArrowDown = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} {...p}>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
)

export const ArrowUp = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)

export const Camera = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} {...p}>
    <path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

export const ImageIcon = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
)

export const ScanLine = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} {...p}>
    <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M3 12h18" />
  </svg>
)

export const Undo = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} {...p}>
    <path d="M9 7l-5 5 5 5" />
    <path d="M4 12h10a6 6 0 0 1 6 6v1" />
  </svg>
)
