// Định dạng số theo chuẩn Việt Nam: 26150 -> "26.150", 18.5 -> "18,5"
const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })
const nfInt = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

export const fmtNum = (n) => nf.format(n)
export const fmtVND = (n) => nfInt.format(Math.round(n))

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now())

// Nhập đơn giá: chỉ giữ chữ số + 1 dấu phẩy thập phân, tự chèn dấu chấm nghìn.
// "26150" -> "26.150", "18,55" -> "18,55"
export function formatRateInput(raw) {
  let s = String(raw).replace(/[^\d,]/g, '')
  const firstComma = s.indexOf(',')
  if (firstComma !== -1) {
    s = s.slice(0, firstComma + 1) + s.slice(firstComma + 1).replace(/,/g, '')
  }
  const [intPart, decPart] = s.split(',')
  const grouped = intPart.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decPart !== undefined ? `${grouped},${decPart}` : grouped
}

// "26.150" -> 26150, "18,5" -> 18.5
export function parseRate(display) {
  const s = String(display).replace(/\./g, '').replace(',', '.')
  const n = parseFloat(s)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function relativeDateLabel(ts) {
  const d = new Date(ts)
  const today = new Date()
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86400000)
  if (diffDays === 0) return 'Hôm nay'
  if (diffDays === 1) return 'Hôm qua'
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
