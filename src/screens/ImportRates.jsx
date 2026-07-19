import { useMemo, useRef, useState } from 'react'
import useStore from '../store/useStore'
import { currentValueForImportEntry } from '../domain/rateImport'
import { fmtVND, formatRateInput, parseRate } from '../utils/format'
import { prepareRateSheetImage } from '../utils/imageImport'
import Header from '../components/Header'
import { BigButton } from '../components/UI'
import { Camera, Check, ImageIcon, ScanLine, Undo } from '../components/Icons'

const errorLabels = {
  INVALID_IMAGE: 'Ảnh không hợp lệ. Hãy chọn ảnh JPG, PNG hoặc WebP.',
  SOURCE_TOO_LARGE: 'Ảnh gốc quá lớn. Vui lòng chọn ảnh dưới 12MB.',
  OUTPUT_TOO_LARGE: 'Không thể nén ảnh đủ nhỏ. Hãy chụp gần tờ giấy hơn.',
  IMAGE_TOO_LARGE: 'Ảnh gửi lên vẫn quá lớn. Hãy chọn ảnh khác.',
  UNSUPPORTED_IMAGE: 'Thiết bị không đọc được định dạng ảnh này.',
  UNREADABLE_IMAGE: 'Không đọc được bảng giá. Hãy chụp rõ và thẳng hơn.',
  INVALID_AI_RESPONSE: 'Kết quả AI không đúng định dạng an toàn.',
  AI_TIMEOUT: 'Đọc ảnh quá lâu. Vui lòng thử lại.',
  AI_SERVICE_ERROR: 'Dịch vụ đọc ảnh đang lỗi. Vui lòng thử lại sau.',
  SERVER_NOT_CONFIGURED: 'Server chưa cấu hình OpenAI API key.',
  NETWORK_ERROR: 'Không thể kết nối server. Tính năng import cần Internet.',
}

const labelForEntry = (entry) => {
  if (entry.kind === 'sell') return `${entry.code} — BÁN RA`
  if (entry.kind === 'krw_50_5') return 'KRW — nhóm 50.000/5.000'
  if (entry.kind === 'krw_10_1') return 'KRW — nhóm 10.000/1.000'
  return `${entry.code} — MUA VÀO`
}

export default function ImportRates() {
  const currencies = useStore((s) => s.currencies)
  const applyRateImport = useStore((s) => s.applyRateImport)
  const undoRateImport = useStore((s) => s.undoRateImport)
  const lastRateImportBackup = useStore((s) => s.lastRateImportBackup)
  const cameraRef = useRef(null)
  const libraryRef = useRef(null)

  const [imageDataUrl, setImageDataUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [sheetDateLabel, setSheetDateLabel] = useState(null)
  const [entries, setEntries] = useState([])
  const [warnings, setWarnings] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(false)
  const [undone, setUndone] = useState(false)

  const selectImage = async (file) => {
    if (!file) return
    setError('')
    setEntries([])
    setWarnings([])
    setApplied(false)
    setUndone(false)
    setBusy(true)
    try {
      setImageDataUrl(await prepareRateSheetImage(file))
      setFileName(file.name || 'Ảnh bảng giá')
    } catch (nextError) {
      setImageDataUrl('')
      setError(errorLabels[nextError.message] || 'Không thể xử lý ảnh này.')
    } finally {
      setBusy(false)
    }
  }

  const analyze = async () => {
    if (!imageDataUrl || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/import-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'AI_SERVICE_ERROR')
      setSheetDateLabel(payload.sheetDateLabel)
      setWarnings(payload.warnings || [])
      setEntries(
        payload.entries.map((entry) => ({
          ...entry,
          selected: true,
          confirmed: !entry.needsReview,
          editText: fmtVND(entry.proposedValue),
        }))
      )
    } catch (nextError) {
      const code = nextError.message === 'Failed to fetch' ? 'NETWORK_ERROR' : nextError.message
      setError(errorLabels[code] || 'Không thể đọc bảng giá.')
    } finally {
      setBusy(false)
    }
  }

  const updateEntry = (id, patch) =>
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))

  const selectedEntries = useMemo(
    () => entries.filter((entry) => entry.selected && parseRate(entry.editText)),
    [entries]
  )
  const hasUnconfirmed = entries.some(
    (entry) => entry.selected && entry.needsReview && !entry.confirmed
  )
  const hasInvalidSelected = entries.some((entry) => entry.selected && !parseRate(entry.editText))
  const canApply = selectedEntries.length > 0 && !hasUnconfirmed && !hasInvalidSelected && !busy

  const apply = () => {
    if (!canApply) return
    applyRateImport(
      selectedEntries.map((entry) => ({ ...entry, proposedValue: parseRate(entry.editText) })),
      { sheetDateLabel }
    )
    setImageDataUrl('')
    setApplied(true)
    setUndone(false)
  }

  const reset = () => {
    setImageDataUrl('')
    setFileName('')
    setEntries([])
    setWarnings([])
    setSheetDateLabel(null)
    setError('')
    setApplied(false)
    setUndone(false)
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Nhập bảng giá" subtitle="Đọc ảnh viết tay bằng AI" />

      <div className="flex-1 overflow-y-auto px-5 pt-1 pb-10">
        {applied ? (
          <div className="flex min-h-full flex-col items-center justify-center pb-14 text-center">
            <div className="btn-gold mb-5 flex h-20 w-20 items-center justify-center rounded-full">
              <Check size={38} />
            </div>
            <h2 className="text-xl font-bold">Đã cập nhật bảng giá</h2>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Đã áp dụng {selectedEntries.length} dòng{sheetDateLabel ? ` của ngày ${sheetDateLabel}` : ''} và tính lại bill đang mở.
            </p>
            {lastRateImportBackup && !undone && (
              <BigButton
                variant="outline"
                className="mt-6 w-full"
                onClick={() => {
                  undoRateImport()
                  setUndone(true)
                }}
              >
                <Undo size={20} /> Hoàn tác lần import này
              </BigButton>
            )}
            {undone && <p className="mt-5 font-semibold text-gold-bright">Đã khôi phục bảng giá cũ.</p>}
            <BigButton variant="ghost" className="mt-2 w-full" onClick={reset}>
              Nhập ảnh khác
            </BigButton>
          </div>
        ) : entries.length ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-bold">Kiểm tra trước khi áp dụng</p>
                <p className="text-xs text-muted">
                  {sheetDateLabel ? `Ngày trên giấy: ${sheetDateLabel}` : 'Không đọc rõ ngày trên giấy'}
                </p>
              </div>
              <button onClick={reset} className="text-sm font-semibold text-gold">Đổi ảnh</button>
            </div>

            {warnings.map((warning) => (
              <p key={warning} className="mb-2 rounded-xl border border-danger/35 bg-danger/10 px-3 py-2 text-xs text-danger">
                {warning}
              </p>
            ))}

            {entries.map((entry) => {
              const currency = currencies.find((candidate) => candidate.code === entry.code)
              const currentValue = currentValueForImportEntry(currency, entry)
              return (
                <div key={entry.id} className={`card-depth mb-3 rounded-2xl p-4 ${entry.selected ? '' : 'opacity-55'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={entry.selected}
                      onChange={(event) => updateEntry(entry.id, { selected: event.target.checked })}
                      className="mt-1 h-5 w-5 accent-[#d4af37]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold">{labelForEntry(entry)}</p>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.needsReview ? 'bg-danger/15 text-danger' : 'bg-gold/15 text-gold-bright'}`}>
                          {Math.round(entry.confidence * 100)}%
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">Đọc từ ảnh: “{entry.sourceLabel}”</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-card2/70 p-2.5">
                          <p className="text-[10px] font-bold tracking-wider text-muted">GIÁ HIỆN TẠI</p>
                          <p className="mt-1 text-sm font-bold tnum">{currentValue ? fmtVND(currentValue) : '—'}</p>
                        </div>
                        <label className="rounded-xl bg-card2/70 p-2.5">
                          <span className="text-[10px] font-bold tracking-wider text-gold">GIÁ ĐỀ XUẤT</span>
                          <input
                            value={entry.editText}
                            inputMode="numeric"
                            disabled={!entry.selected}
                            onChange={(event) => {
                              const editText = formatRateInput(event.target.value)
                              updateEntry(entry.id, { editText, confirmed: entry.needsReview ? false : entry.confirmed })
                            }}
                            className="mt-1 w-full bg-transparent text-sm font-bold text-gold-bright tnum outline-none"
                          />
                        </label>
                      </div>
                      <p className="mt-2 text-[11px] text-muted">{entry.unitLabel}</p>
                      {entry.needsReview && entry.selected && (
                        <label className="mt-3 flex items-center gap-2 rounded-xl border border-danger/35 bg-danger/10 p-2.5 text-xs font-semibold text-danger">
                          <input
                            type="checkbox"
                            checked={entry.confirmed}
                            onChange={(event) => updateEntry(entry.id, { confirmed: event.target.checked })}
                            className="h-4 w-4 accent-[#e5484d]"
                          />
                          Tôi đã kiểm tra dòng chưa chắc chắn này
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            <BigButton className="mt-2 w-full" disabled={!canApply} onClick={apply}>
              <Check size={20} /> Áp dụng {selectedEntries.length} dòng
            </BigButton>
            {(hasUnconfirmed || hasInvalidSelected) && (
              <p className="mt-2 text-center text-xs text-danger">
                Kiểm tra các giá trống và xác nhận những dòng AI chưa chắc chắn.
              </p>
            )}
          </>
        ) : (
          <>
            <div className="card-depth mb-4 rounded-2xl p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <ScanLine size={25} />
                </div>
                <div>
                  <p className="font-bold">Chụp rõ toàn bộ tờ giấy</p>
                  <p className="text-xs text-muted">Đặt giấy thẳng, đủ sáng và tránh bóng tay.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <BigButton variant="outline" className="px-2 text-sm" onClick={() => cameraRef.current?.click()} disabled={busy}>
                  <Camera size={20} /> Chụp ảnh
                </BigButton>
                <BigButton variant="outline" className="px-2 text-sm" onClick={() => libraryRef.current?.click()} disabled={busy}>
                  <ImageIcon size={20} /> Thư viện
                </BigButton>
              </div>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  selectImage(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <input
                ref={libraryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  selectImage(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </div>

            {imageDataUrl && (
              <div className="card-depth mb-4 overflow-hidden rounded-2xl">
                <img src={imageDataUrl} alt="Ảnh bảng giá đã chọn" className="max-h-80 w-full object-contain bg-black/30" />
                <p className="truncate px-3 py-2 text-xs text-muted">{fileName}</p>
              </div>
            )}

            {error && <p className="mt-3 rounded-xl border border-danger/35 bg-danger/10 px-3 py-2.5 text-sm text-danger">{error}</p>}

            <BigButton className="mt-4 w-full" disabled={!imageDataUrl || busy} onClick={analyze}>
              <ScanLine size={20} /> {busy ? 'Đang xử lý…' : 'Đọc bảng giá'}
            </BigButton>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
              Ảnh được gửi đến OpenAI để nhận dạng và không được lưu trong app.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
