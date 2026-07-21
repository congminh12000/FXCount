import { normalizeRateSheetExtraction, RATE_SHEET_RULES } from '../domain/rateImport'
import {
  RATE_SHEET_RATE_SLOTS,
  RATE_SHEET_SIZE,
  RATE_SHEET_TEMPLATE_V1,
} from '../domain/rateSheetTemplate'
import { warpImageData } from '../utils/perspective'

const OCR_TIMEOUT_MS = 60_000
const MIN_CONFIDENCE = 0.9

const throwIfAborted = (signal) => {
  if (signal?.aborted) throw new DOMException('Đã huỷ đọc ảnh', 'AbortError')
}

const canvasFromImageData = (value) => {
  const canvas = document.createElement('canvas')
  canvas.width = value.width
  canvas.height = value.height
  canvas.getContext('2d').putImageData(new ImageData(value.data, value.width, value.height), 0, 0)
  return canvas
}

const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('UNSUPPORTED_IMAGE'))
    image.src = source
  })

export async function rectifyRateSheetImage(imageDataUrl, corners) {
  const image = await loadImage(imageDataUrl)
  const maxDimension = 1800
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  sourceCanvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const sourceContext = sourceCanvas.getContext('2d', { alpha: false, willReadFrequently: true })
  sourceContext.fillStyle = '#fff'
  sourceContext.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height)
  sourceContext.drawImage(image, 0, 0, sourceCanvas.width, sourceCanvas.height)
  const source = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)
  return canvasFromImageData(
    warpImageData(source, corners, RATE_SHEET_SIZE.width, RATE_SHEET_SIZE.height)
  )
}

export function cropTemplateSlot(sheetCanvas, slot) {
  const { x, y, width, height } = slot.rect
  const sourceX = Math.round(x * sheetCanvas.width)
  const sourceY = Math.round(y * sheetCanvas.height)
  const sourceWidth = Math.max(1, Math.round(width * sheetCanvas.width))
  const sourceHeight = Math.max(1, Math.round(height * sheetCanvas.height))
  const output = document.createElement('canvas')
  output.width = sourceWidth
  output.height = sourceHeight
  output.getContext('2d', { alpha: false }).drawImage(
    sheetCanvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight
  )
  return output
}

function preprocessCrop(source, thresholded) {
  const scale = Math.max(2, Math.ceil(120 / source.height))
  const padding = 14
  const canvas = document.createElement('canvas')
  canvas.width = source.width * scale + padding * 2
  canvas.height = source.height * scale + padding * 2
  const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true })
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = true
  context.drawImage(source, padding, padding, source.width * scale, source.height * scale)
  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  let minimum = 255
  let maximum = 0

  for (let index = 0; index < image.data.length; index += 4) {
    const gray =
      image.data[index] * 0.299 +
      image.data[index + 1] * 0.587 +
      image.data[index + 2] * 0.114
    image.data[index] = gray
    minimum = Math.min(minimum, gray)
    maximum = Math.max(maximum, gray)
  }

  const range = Math.max(1, maximum - minimum)
  const cutoff = thresholded ? 150 : null
  for (let index = 0; index < image.data.length; index += 4) {
    let value = ((image.data[index] - minimum) / range) * 255
    value = thresholded ? (value < cutoff ? 0 : 255) : Math.max(0, Math.min(255, (value - 128) * 1.8 + 128))
    image.data[index] = value
    image.data[index + 1] = value
    image.data[index + 2] = value
    image.data[index + 3] = 255
  }
  context.putImageData(image, 0, 0)
  return canvas
}

export const parseOcrNumber = (text) => {
  const digits = String(text || '').replace(/\D/g, '')
  if (!digits) return null
  const value = Number.parseInt(digits, 10)
  return Number.isSafeInteger(value) && value > 0 ? value : null
}

export const parseOcrDate = (text) => {
  const match = String(text || '').match(/(\d{1,2})\D+(\d{1,2})/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  if (day < 1 || day > 31 || month < 1 || month > 12) return null
  return `${day}/${month}`
}

const validSheetValue = (slot, value) => {
  if (!value) return false
  if (slot.code === 'KRW') return value >= 50 && value <= 500
  const rule = RATE_SHEET_RULES[slot.code]
  return Boolean(rule && value >= rule.min && value <= rule.max)
}

export function chooseOcrCandidate(slot, results) {
  const candidates = results
    .map((result) => ({
      ...result,
      value: parseOcrNumber(result.text),
      confidence: Math.max(0, Math.min(1, Number(result.confidence || 0) / 100)),
    }))
    .filter((result) => validSheetValue(slot, result.value))
  if (!candidates.length) {
    return {
      value: null,
      rawText: results.map((result) => String(result.text || '').trim()).filter(Boolean).join(' / '),
      confidence: 0,
      needsReview: true,
      note: 'Không đọc được số hợp lệ trong khoảng an toàn.',
    }
  }

  const counts = new Map()
  for (const candidate of candidates) counts.set(candidate.value, (counts.get(candidate.value) || 0) + 1)
  const selected = [...candidates].sort((left, right) => {
    const consensus = (counts.get(right.value) || 0) - (counts.get(left.value) || 0)
    return consensus || right.confidence - left.confidence
  })[0]
  const agreed = (counts.get(selected.value) || 0) > 1
  const confidence = agreed ? selected.confidence : Math.min(selected.confidence, 0.79)
  return {
    value: selected.value,
    rawText: selected.text.trim(),
    confidence,
    needsReview: confidence < MIN_CONFIDENCE,
    note: agreed ? '' : 'Các lần đọc chưa đồng thuận.',
  }
}

export async function recognizeRateSlots({
  slots = RATE_SHEET_RATE_SLOTS,
  recognizeVariants,
  onProgress = () => {},
  signal,
}) {
  const rows = []
  const cropPreviews = new Map()
  for (const [index, slot] of slots.entries()) {
    throwIfAborted(signal)
    onProgress({ current: index, total: slots.length, status: 'recognizing', slot })
    const { results, cropPreview = '' } = await recognizeVariants(slot)
    const candidate = chooseOcrCandidate(slot, results)
    cropPreviews.set(`${slot.code}:${slot.kind}`, cropPreview)
    rows.push({
      sourceLabel: candidate.rawText || `${slot.label}: không đọc được`,
      currencyCode: slot.code,
      kind: slot.kind,
      sheetValue: candidate.value,
      confidence: candidate.confidence,
      note: candidate.note,
    })
    onProgress({ current: index + 1, total: slots.length, status: 'recognizing', slot })
  }
  return { rows, cropPreviews }
}

async function defaultWorkerFactory(onWorkerProgress) {
  const { createWorker, OEM, PSM } = await import('tesseract.js')
  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/core',
    langPath: '/ocr/lang',
    logger: onWorkerProgress,
  })
  await worker.setParameters({
    tessedit_char_whitelist: '0123456789/',
    tessedit_pageseg_mode: PSM.SINGLE_WORD,
    preserve_interword_spaces: '0',
  })
  return worker
}

const recognize = async (worker, canvas, signals = []) => {
  const activeSignals = signals.filter(Boolean)
  const cleanups = []
  const abortRaces = activeSignals.map(
    ({ signal, message, name = 'AbortError' }) =>
      new Promise((_, reject) => {
        const rejectAbort = () => reject(new DOMException(message, name))
        if (signal.aborted) {
          rejectAbort()
          return
        }
        signal.addEventListener('abort', rejectAbort, { once: true })
        cleanups.push(() => signal.removeEventListener('abort', rejectAbort))
      })
  )

  try {
    const result = await Promise.race([worker.recognize(canvas), ...abortRaces])
    return { text: result.data.text || '', confidence: result.data.confidence || 0 }
  } finally {
    cleanups.forEach((cleanup) => cleanup())
  }
}

export async function readFixedRateSheet({
  imageDataUrl,
  corners,
  onProgress = () => {},
  signal,
  workerFactory = defaultWorkerFactory,
}) {
  throwIfAborted(signal)
  const timeoutController = new AbortController()
  const timeout = setTimeout(() => timeoutController.abort(), OCR_TIMEOUT_MS)
  const abort = () => timeoutController.abort()
  signal?.addEventListener('abort', abort, { once: true })
  let worker

  try {
    onProgress({ current: 0, total: RATE_SHEET_RATE_SLOTS.length, status: 'preparing' })
    const sheetCanvas = await rectifyRateSheetImage(imageDataUrl, corners)
    throwIfAborted(signal)
    if (timeoutController.signal.aborted) throw new DOMException('OCR timeout', 'TimeoutError')

    worker = await workerFactory(() => {})
    const dateSlot = RATE_SHEET_TEMPLATE_V1[0]
    const dateCrop = cropTemplateSlot(sheetCanvas, dateSlot)
    const recognitionSignals = [
      signal && { signal, message: 'Đã huỷ đọc ảnh' },
      { signal: timeoutController.signal, message: 'OCR timeout', name: 'TimeoutError' },
    ]
    const dateResult = await recognize(worker, preprocessCrop(dateCrop, false), recognitionSignals)
    const sheetDateLabel = parseOcrDate(dateResult.text)
    const { rows, cropPreviews } = await recognizeRateSlots({
      signal,
      onProgress,
      recognizeVariants: async (slot) => {
        if (timeoutController.signal.aborted) throw new DOMException('OCR timeout', 'TimeoutError')
        const crop = cropTemplateSlot(sheetCanvas, slot)
        const results = []
        for (const thresholded of [false, true]) {
          results.push(await recognize(worker, preprocessCrop(crop, thresholded), recognitionSignals))
        }
        return { results, cropPreview: crop.toDataURL('image/jpeg', 0.82) }
      },
    })

    const normalized = normalizeRateSheetExtraction(
      {
        sheetDateLabel,
        rows,
        warnings: sheetDateLabel ? [] : ['Không đọc rõ ngày trên giấy.'],
      },
      { keepUnreadable: true }
    )
    return {
      ...normalized,
      entries: normalized.entries.map((entry) => ({
        ...entry,
        rawText: entry.sourceLabel,
        cropPreview: cropPreviews.get(`${entry.code}:${entry.kind}`) || '',
      })),
      sheetPreview: sheetCanvas.toDataURL('image/jpeg', 0.82),
    }
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') throw new DOMException('Đã huỷ đọc ảnh', 'AbortError')
    if (timeoutController.signal.aborted || error?.name === 'TimeoutError') throw new Error('OCR_TIMEOUT')
    if (error?.message === 'INVALID_PAPER_CORNERS') throw error
    throw new Error('OCR_UNAVAILABLE', { cause: error })
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
    await worker?.terminate().catch(() => {})
  }
}
