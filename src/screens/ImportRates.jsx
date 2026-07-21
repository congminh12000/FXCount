import { useEffect, useMemo, useRef, useState } from 'react'
import useStore from '../store/useStore'
import { currentValueForImportEntry } from '../domain/rateImport'
import {
  CHATGPT_RATE_IMPORT_PROMPT,
  MAX_RATE_IMPORT_JSON_BYTES,
  parseRateImportJson,
} from '../domain/jsonRateImport'
import { DEFAULT_PAPER_CORNERS } from '../domain/rateSheetTemplate'
import { fmtVND, formatRateInput, parseRate } from '../utils/format'
import { prepareRateSheetImage } from '../utils/imageImport'
import { copyText } from '../utils/clipboard'
import { readFixedRateSheet } from '../services/localRateOcr'
import Header from '../components/Header'
import CameraCapture from '../components/CameraCapture'
import PaperCornerEditor from '../components/PaperCornerEditor'
import { BigButton } from '../components/UI'
import { Camera, Check, Copy, FileText, ImageIcon, ScanLine, Undo } from '../components/Icons'

const errorLabels = {
  INVALID_IMAGE: 'Ảnh không hợp lệ. Hãy chọn ảnh JPG, PNG hoặc WebP.',
  SOURCE_TOO_LARGE: 'Ảnh gốc quá lớn. Vui lòng chọn ảnh dưới 12MB.',
  OUTPUT_TOO_LARGE: 'Không thể nén ảnh đủ nhỏ. Hãy chụp gần tờ giấy hơn.',
  UNSUPPORTED_IMAGE: 'Thiết bị không đọc được định dạng ảnh này.',
  INVALID_PAPER_CORNERS: 'Bốn góc tờ giấy chưa hợp lệ. Hãy căn lại.',
  OCR_TIMEOUT: 'Đọc ảnh quá lâu. Hãy thử ảnh rõ và thẳng hơn.',
  OCR_UNAVAILABLE: 'Không khởi động được bộ OCR offline. Hãy mở app khi có mạng một lần để tải bộ đọc.',
  JSON_EMPTY: 'Hãy dán nội dung JSON hoặc chọn một file JSON.',
  JSON_TOO_LARGE: 'File JSON quá lớn. Vui lòng chọn file dưới 100KB.',
  JSON_INVALID: 'JSON không hợp lệ. Hãy yêu cầu ChatGPT tạo lại đúng cấu trúc mẫu.',
  JSON_INVALID_SHAPE: 'JSON phải là một object theo cấu trúc mẫu FXCount V1.',
  JSON_UNSUPPORTED_VERSION: 'Phiên bản JSON không được hỗ trợ. App hiện chỉ nhận version 1.',
  JSON_MISSING_RATES: 'JSON thiếu object rates chứa bảng giá.',
  JSON_NO_VALID_RATES: 'JSON không có giá hợp lệ để cập nhật.',
  JSON_FILE_TYPE: 'Hãy chọn file có đuôi .json.',
  CLIPBOARD_UNAVAILABLE: 'Không thể sao chép tự động trên thiết bị này.',
}

const labelForEntry = (entry) => {
  if (entry.kind === 'sell') return `${entry.code} — BÁN RA`
  if (entry.kind === 'krw_50_5') return 'KRW — nhóm 50.000/5.000'
  if (entry.kind === 'krw_10_1') return 'KRW — nhóm 10.000/1.000'
  return `${entry.code} — MUA VÀO`
}

const sectionLabelForEntry = (entry) => {
  if (entry.kind === 'sell') return 'BÁN RA'
  if (entry.kind === 'krw_50_5') return 'NHÓM 50.000/5.000'
  if (entry.kind === 'krw_10_1') return 'NHÓM 10.000/1.000'
  return 'MUA VÀO'
}

const freshCorners = () =>
  Object.fromEntries(
    Object.entries(DEFAULT_PAPER_CORNERS).map(([key, point]) => [key, { ...point }])
  )

export default function ImportRates() {
  const currencies = useStore((s) => s.currencies)
  const applyRateImport = useStore((s) => s.applyRateImport)
  const undoRateImport = useStore((s) => s.undoRateImport)
  const lastRateImportBackup = useStore((s) => s.lastRateImportBackup)
  const goHome = useStore((s) => s.goHome)
  const cameraRef = useRef(null)
  const libraryRef = useRef(null)
  const jsonFileRef = useRef(null)
  const abortRef = useRef(null)
  const copiedTimerRef = useRef(null)

  const [cameraOpen, setCameraOpen] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [corners, setCorners] = useState(freshCorners)
  const [sheetDateLabel, setSheetDateLabel] = useState(null)
  const [entries, setEntries] = useState([])
  const [warnings, setWarnings] = useState([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 17, status: 'idle' })
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(false)
  const [undone, setUndone] = useState(false)
  const [importSource, setImportSource] = useState(null)
  const [jsonText, setJsonText] = useState('')
  const [reviewConfirmed, setReviewConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCopyFallback, setShowCopyFallback] = useState(false)

  useEffect(
    () => () => {
      abortRef.current?.abort()
      clearTimeout(copiedTimerRef.current)
    },
    []
  )

  const loadReview = (payload, source) => {
    setSheetDateLabel(payload.sheetDateLabel)
    setWarnings(payload.warnings || [])
    setImportSource(source)
    setReviewConfirmed(false)
    setEntries(
      payload.entries.map((entry) => ({
        ...entry,
        selected: true,
        confirmed: source === 'json' ? true : !entry.needsReview,
        editText: entry.proposedValue ? fmtVND(entry.proposedValue) : '',
      }))
    )
  }

  const prepareSelectedImage = async (file) => {
    if (!file) return
    setError('')
    setEntries([])
    setWarnings([])
    setApplied(false)
    setUndone(false)
    setBusy(true)
    setProgress({ current: 0, total: 17, status: 'image' })
    try {
      setImageDataUrl(await prepareRateSheetImage(file))
      setFileName(file.name || 'Ảnh bảng giá')
      setCorners(freshCorners())
    } catch (nextError) {
      setImageDataUrl('')
      setError(errorLabels[nextError.message] || 'Không thể xử lý ảnh này.')
    } finally {
      setBusy(false)
    }
  }

  const useCameraImage = (dataUrl) => {
    setCameraOpen(false)
    setImageDataUrl(dataUrl)
    setFileName('Ảnh chụp bảng giá')
    setCorners(freshCorners())
    setEntries([])
    setWarnings([])
    setError('')
  }

  const analyze = async () => {
    if (!imageDataUrl || busy) return
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    setError('')
    setProgress({ current: 0, total: 17, status: 'preparing' })
    try {
      const payload = await readFixedRateSheet({
        imageDataUrl,
        corners,
        signal: controller.signal,
        onProgress: setProgress,
      })
      loadReview(payload, 'ocr')
    } catch (nextError) {
      if (nextError.name !== 'AbortError') {
        setError(errorLabels[nextError.message] || 'Không thể đọc bảng giá offline.')
      }
    } finally {
      abortRef.current = null
      setBusy(false)
    }
  }

  const inspectJson = (value = jsonText) => {
    setError('')
    try {
      const payload = parseRateImportJson(value)
      setImageDataUrl('')
      setFileName('')
      loadReview(payload, 'json')
    } catch (nextError) {
      setError(errorLabels[nextError.message] || 'Không thể đọc file JSON này.')
    }
  }

  const prepareJsonFile = async (file) => {
    if (!file) return
    setError('')
    const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json'
    if (!isJson) {
      setError(errorLabels.JSON_FILE_TYPE)
      return
    }
    if (file.size > MAX_RATE_IMPORT_JSON_BYTES) {
      setError(errorLabels.JSON_TOO_LARGE)
      return
    }
    try {
      const value = await file.text()
      setJsonText(value)
      inspectJson(value)
    } catch {
      setError('Không thể đọc file JSON này.')
    }
  }

  const copyChatGptPrompt = async () => {
    clearTimeout(copiedTimerRef.current)
    setError('')
    try {
      await copyText(CHATGPT_RATE_IMPORT_PROMPT)
      setCopied(true)
      setShowCopyFallback(false)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2500)
    } catch (nextError) {
      setCopied(false)
      setShowCopyFallback(true)
      setError(errorLabels[nextError.message] || errorLabels.CLIPBOARD_UNAVAILABLE)
    }
  }

  const updateEntry = (id, patch) => {
    if (importSource === 'json') setReviewConfirmed(false)
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    )
  }

  const selectedEntries = useMemo(
    () => entries.filter((entry) => entry.selected && parseRate(entry.editText)),
    [entries]
  )
  const entryGroups = useMemo(() => {
    const groups = new Map()
    entries.forEach((entry) => {
      const group = groups.get(entry.code) || []
      group.push(entry)
      groups.set(entry.code, group)
    })
    return [...groups.entries()].map(([code, groupEntries]) => ({ code, entries: groupEntries }))
  }, [entries])
  const hasUnconfirmed = entries.some(
    (entry) => entry.selected && entry.needsReview && !entry.confirmed
  )
  const hasInvalidSelected = entries.some((entry) => entry.selected && !parseRate(entry.editText))
  const needsTableConfirmation = importSource === 'json' && !reviewConfirmed
  const canApply =
    selectedEntries.length > 0 &&
    !hasUnconfirmed &&
    !hasInvalidSelected &&
    !needsTableConfirmation &&
    !busy

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

  const confirmUndo = () => {
    const confirmed = window.confirm(
      'Hoàn tác sẽ khôi phục bảng giá và bill trước lần cập nhật này. Bạn có chắc muốn tiếp tục?'
    )
    if (!confirmed) return
    undoRateImport()
    setUndone(true)
  }

  const reset = () => {
    abortRef.current?.abort()
    setCameraOpen(false)
    setImageDataUrl('')
    setFileName('')
    setCorners(freshCorners())
    setEntries([])
    setWarnings([])
    setSheetDateLabel(null)
    setError('')
    setApplied(false)
    setUndone(false)
    setBusy(false)
    setImportSource(null)
    setJsonText('')
    setReviewConfirmed(false)
    setCopied(false)
    setShowCopyFallback(false)
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Nhập bảng giá" />

      {cameraOpen && (
        <CameraCapture
          onCapture={useCameraImage}
          onCancel={() => setCameraOpen(false)}
          onFallback={() => {
            setCameraOpen(false)
            cameraRef.current?.click()
          }}
        />
      )}

      <div className="flex-1 overflow-y-auto px-5 pt-1 pb-10">
        {applied ? (
          <div className="flex min-h-full flex-col items-center justify-center pb-14 text-center">
            <div className="btn-gold mb-5 flex h-20 w-20 items-center justify-center rounded-full">
              <Check size={38} />
            </div>
            <h2 className="text-xl font-bold">Cập nhật bảng giá thành công</h2>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Đã áp dụng {selectedEntries.length} dòng
              {sheetDateLabel ? ` của ngày ${sheetDateLabel}` : ''} và tính lại bill đang mở.
            </p>
            <BigButton className="mt-6 w-full" onClick={goHome}>
              Quay về trang chủ
            </BigButton>
            {lastRateImportBackup && !undone && (
              <BigButton
                variant="ghost"
                className="mt-2 w-full"
                onClick={confirmUndo}
              >
                <Undo size={20} /> Hoàn tác
              </BigButton>
            )}
            {undone && (
              <p className="mt-5 font-semibold text-gold-bright">Đã khôi phục bảng giá cũ.</p>
            )}
          </div>
        ) : entries.length ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-bold">Kiểm tra trước khi áp dụng</p>
                <p className="text-xs text-muted">
                  {sheetDateLabel
                    ? `Ngày trên giấy: ${sheetDateLabel}`
                    : 'Không đọc rõ ngày trên giấy'}
                </p>
              </div>
              <button onClick={reset} className="text-sm font-semibold text-gold">Nhập lại</button>
            </div>

            {warnings.map((warning, index) => (
              <p
                key={`${warning}:${index}`}
                className="mb-2 rounded-xl border border-danger/35 bg-danger/10 px-3 py-2 text-xs text-danger"
              >
                {warning}
              </p>
            ))}

            {entryGroups.map((group) => {
              const currency = currencies.find((candidate) => candidate.code === group.code)
              return (
                <div
                  key={group.code}
                  className="card-depth mb-3 overflow-hidden rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2.5 border-b border-line pb-3">
                    <span className="text-2xl leading-none" aria-hidden="true">
                      {currency?.flag || '💱'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold">{group.code}</p>
                      {currency?.name && (
                        <p className="truncate text-xs text-muted">{currency.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-line">
                    {group.entries.map((entry) => {
                      const currentValue = currentValueForImportEntry(currency, entry)
                      return (
                        <div
                          key={entry.id}
                          className={`flex items-start gap-3 py-4 first:pt-3 last:pb-0 ${
                            entry.selected ? '' : 'opacity-55'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={entry.selected}
                            aria-label={`Chọn ${labelForEntry(entry)}`}
                            onChange={(event) =>
                              updateEntry(entry.id, { selected: event.target.checked })
                            }
                            className="mt-0.5 h-5 w-5 shrink-0 accent-[#d4af37]"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-bold text-gold-bright">
                                {sectionLabelForEntry(entry)}
                              </p>
                              {importSource !== 'json' && (
                                <span
                                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                                    entry.needsReview
                                      ? 'bg-danger/15 text-danger'
                                      : 'bg-gold/15 text-gold-bright'
                                  }`}
                                >
                                  {entry.confidence
                                    ? `${Math.round(entry.confidence * 100)}%`
                                    : 'CẦN NHẬP'}
                                </span>
                              )}
                            </div>
                            {entry.cropPreview && (
                              <img
                                src={entry.cropPreview}
                                alt={`Vùng ảnh ${labelForEntry(entry)}`}
                                className="mt-2 h-14 w-full rounded-lg border border-line bg-white object-contain"
                              />
                            )}
                            {importSource === 'json' ? (
                              <p className="mt-1 text-xs text-muted tnum">
                                Giá trên giấy: {entry.sheetValue?.toLocaleString('vi-VN') || '—'}
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-muted">
                                OCR đọc: “{entry.rawText || 'không đọc được'}”
                              </p>
                            )}
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div className="rounded-xl bg-card2/70 p-2.5">
                                <p className="text-[10px] font-bold tracking-wider text-muted">
                                  GIÁ HIỆN TẠI
                                </p>
                                <p className="mt-1 text-sm font-bold tnum">
                                  {currentValue ? fmtVND(currentValue) : '—'}
                                </p>
                              </div>
                              <label className="rounded-xl bg-card2/70 p-2.5">
                                <span className="text-[10px] font-bold tracking-wider text-gold">
                                  GIÁ MỚI
                                </span>
                                <input
                                  value={entry.editText}
                                  inputMode="numeric"
                                  aria-label={`Giá mới ${labelForEntry(entry)}`}
                                  placeholder="Nhập giá"
                                  disabled={!entry.selected}
                                  onChange={(event) => {
                                    const editText = formatRateInput(event.target.value)
                                    updateEntry(entry.id, {
                                      editText,
                                      confirmed: entry.needsReview ? false : entry.confirmed,
                                    })
                                  }}
                                  className="mt-1 w-full bg-transparent text-sm font-bold text-gold-bright placeholder:text-muted/40 tnum outline-none"
                                />
                              </label>
                            </div>
                            <p className="mt-2 text-[11px] text-muted">{entry.unitLabel}</p>
                            {entry.needsReview && entry.selected && (
                              <label className="mt-3 flex items-center gap-2 rounded-xl border border-danger/35 bg-danger/10 p-2.5 text-xs font-semibold text-danger">
                                <input
                                  type="checkbox"
                                  checked={entry.confirmed}
                                  onChange={(event) =>
                                    updateEntry(entry.id, { confirmed: event.target.checked })
                                  }
                                  className="h-4 w-4 accent-[#e5484d]"
                                />
                                Tôi đã đối chiếu dòng này với ảnh
                              </label>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {importSource === 'json' && (
              <label className="card-depth mb-3 flex items-start gap-3 rounded-2xl p-4 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={reviewConfirmed}
                  onChange={(event) => setReviewConfirmed(event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#d4af37]"
                />
                <span>Tôi đã đối chiếu toàn bộ dữ liệu với ảnh gốc</span>
              </label>
            )}

            <BigButton className="mt-2 w-full" disabled={!canApply} onClick={apply}>
              <Check size={20} /> Áp dụng {selectedEntries.length} dòng
            </BigButton>
            {(hasUnconfirmed || hasInvalidSelected || needsTableConfirmation) && (
              <p className="mt-2 text-center text-xs text-danger">
                {importSource === 'json'
                  ? 'Kiểm tra dữ liệu, nhập các giá còn thiếu và xác nhận toàn bộ bảng trước khi áp dụng.'
                  : 'Nhập các giá còn trống và xác nhận những dòng OCR chưa chắc chắn, hoặc bỏ chọn dòng đó.'}
              </p>
            )}
          </>
        ) : busy ? (
          <div className="flex min-h-full flex-col items-center justify-center pb-16 text-center">
            <div className="mb-5 h-14 w-14 animate-spin rounded-full border-4 border-line border-t-gold" />
            <p className="font-bold">
              {progress.status === 'image'
                ? 'Đang chuẩn bị ảnh…'
                : progress.status === 'preparing'
                  ? 'Đang nắn tờ giấy và tải OCR…'
                  : `Đang đọc dòng ${Math.min(progress.current + 1, progress.total)}/${progress.total}`}
            </p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
              Mọi xử lý diễn ra trên thiết bị. Lần đầu mở có thể mất lâu hơn để tải bộ OCR từ app.
            </p>
            {progress.status !== 'image' && (
              <BigButton
                variant="ghost"
                className="mt-5"
                onClick={() => abortRef.current?.abort()}
              >
                Huỷ đọc ảnh
              </BigButton>
            )}
          </div>
        ) : imageDataUrl ? (
          <>
            <div className="mb-3">
              <p className="font-bold">Căn bốn góc tờ giấy</p>
              <p className="text-xs text-muted">OCR chỉ đọc các hàng đúng cấu trúc mẫu V1.</p>
            </div>
            <div className="card-depth rounded-2xl p-3">
              <PaperCornerEditor
                imageDataUrl={imageDataUrl}
                corners={corners}
                onChange={setCorners}
              />
              <p className="mt-2 truncate text-[11px] text-muted">{fileName}</p>
            </div>
            {error && (
              <p className="mt-3 rounded-xl border border-danger/35 bg-danger/10 px-3 py-2.5 text-sm text-danger">
                {error}
              </p>
            )}
            <BigButton className="mt-4 w-full" onClick={analyze}>
              <ScanLine size={20} /> Bắt đầu OCR offline
            </BigButton>
            <BigButton variant="ghost" className="mt-1 w-full" onClick={reset}>Chọn ảnh khác</BigButton>
          </>
        ) : (
          <>
            <div className="card-depth mb-4 rounded-2xl p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <FileText size={25} />
                </div>
                <div>
                  <p className="font-bold">Nhập JSON từ ChatGPT</p>
                  <p className="text-xs text-muted">Nhanh và phù hợp hơn với bảng giá viết tay.</p>
                </div>
              </div>

              <BigButton
                variant="outline"
                className="mb-3 w-full px-3 text-sm"
                onClick={copyChatGptPrompt}
              >
                {copied ? <Check size={19} /> : <Copy size={19} />}
                {copied ? 'Đã sao chép' : 'Sao chép hướng dẫn cho ChatGPT'}
              </BigButton>

              {showCopyFallback && (
                <label className="mb-3 block text-xs text-muted">
                  Chọn và sao chép nội dung bên dưới:
                  <textarea
                    readOnly
                    value={CHATGPT_RATE_IMPORT_PROMPT}
                    className="mt-2 h-28 w-full resize-none rounded-xl border border-line bg-card2 p-3 text-xs text-cream outline-none"
                  />
                </label>
              )}

              <BigButton
                variant="outline"
                className="mb-3 w-full px-3 text-sm"
                onClick={() => jsonFileRef.current?.click()}
              >
                <FileText size={19} /> Chọn file JSON
              </BigButton>
              <input
                ref={jsonFileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(event) => {
                  prepareJsonFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />

              <label className="block">
                <span className="text-[11px] font-bold tracking-wider text-muted">
                  HOẶC DÁN NỘI DUNG JSON
                </span>
                <textarea
                  value={jsonText}
                  onChange={(event) => {
                    setJsonText(event.target.value)
                    setError('')
                  }}
                  placeholder={'{\n  "version": 1,\n  "rates": { ... }\n}'}
                  spellCheck={false}
                  className="mt-2 h-32 w-full resize-none rounded-xl border border-line bg-card2 p-3 font-mono text-xs text-cream placeholder:text-muted/35 outline-none focus:border-gold/60"
                />
              </label>
              <BigButton
                className="mt-3 w-full px-3 text-sm"
                disabled={!jsonText.trim()}
                onClick={() => inspectJson()}
              >
                <Check size={19} /> Kiểm tra JSON
              </BigButton>
            </div>

            {error && (
              <p className="mb-4 rounded-xl border border-danger/35 bg-danger/10 px-3 py-2.5 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="card-depth mb-4 rounded-2xl p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <ScanLine size={25} />
                </div>
                <div>
                  <p className="font-bold">OCR offline — thử nghiệm</p>
                  <p className="text-xs text-muted">Không gửi ảnh hoặc giá tới bất kỳ API nào.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <BigButton
                  variant="outline"
                  className="px-2 text-sm"
                  onClick={() => setCameraOpen(true)}
                >
                  <Camera size={20} /> Chụp ảnh
                </BigButton>
                <BigButton
                  variant="outline"
                  className="px-2 text-sm"
                  onClick={() => libraryRef.current?.click()}
                >
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
                  prepareSelectedImage(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <input
                ref={libraryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  prepareSelectedImage(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </div>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
              Bộ OCR được tải từ chính FXCount và lưu cache để dùng offline. Bạn luôn được xem lại trước khi áp dụng.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
