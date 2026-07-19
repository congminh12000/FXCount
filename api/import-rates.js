import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { normalizeRateSheetExtraction } from '../src/domain/rateImport.js'
import { RateSheetExtraction } from './rate-import-schema.js'

const MAX_IMAGE_BYTES = 2_500_000
const IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/

const SYSTEM_PROMPT = `Bạn đọc bảng tỷ giá ngoại tệ viết tay của một quầy đổi tiền Việt Nam.

Chỉ trích xuất dữ liệu nhìn thấy, không đoán số bị che hoặc quá mờ. Số trên giấy là số viết tắt theo nghìn đồng và phải trả nguyên số viết trên giấy, chưa nhân thêm 1.000.

Quy ước mã cố định:
- Dòng đầu không có mã, gồm hai số: USD mua trước, USD bán sau.
- E=EUR, E cũ=EURC, Y=JPY, C=CAD, UC=Australian dollar AUD, S=SGD,
  TS=CHF, BA=GBP, ĐL=TWD, TQ=CNY, TL=THB, MY=MYR, HQ=KRW, NZ=NZD.
- Các mã thông thường là kind=buy, trừ số USD thứ hai là kind=sell.
- HQ 50 (nhóm 50.000/5.000) là kind=krw_50_5.
- HQ 10 (nhóm 10.000/1.000) là kind=krw_10_1.

sourceLabel phải chép ngắn gọn đúng chữ/số nhìn thấy. confidence từ 0 đến 1. Nếu không chắc mã hoặc số, dùng UNKNOWN/unknown, ghi lý do trong note và confidence thấp. Ngày chỉ giữ dạng nhìn thấy như 16/7, không tự thêm năm.`

function json(res, status, body) {
  res.status(status)
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export function validateImageDataUrl(imageDataUrl) {
  if (typeof imageDataUrl !== 'string') return { ok: false, code: 'INVALID_IMAGE' }
  const match = imageDataUrl.match(IMAGE_RE)
  if (!match) return { ok: false, code: 'INVALID_IMAGE' }
  const bytes = Buffer.from(match[2], 'base64').byteLength
  if (!bytes || bytes > MAX_IMAGE_BYTES) return { ok: false, code: 'IMAGE_TOO_LARGE' }
  return { ok: true, bytes }
}

export function createImportRatesHandler({ clientFactory = () => new OpenAI() } = {}) {
  return async function importRates(req, res) {
    if (req.method !== 'POST') return json(res, 405, { error: 'METHOD_NOT_ALLOWED' })
    if (!process.env.OPENAI_API_KEY) {
      return json(res, 503, { error: 'SERVER_NOT_CONFIGURED' })
    }

    let body = req.body
    try {
      if (typeof body === 'string') body = JSON.parse(body)
    } catch {
      return json(res, 400, { error: 'INVALID_REQUEST' })
    }

    const image = validateImageDataUrl(body?.imageDataUrl)
    if (!image.ok) return json(res, 400, { error: image.code })

    try {
      const client = clientFactory()
      const response = await client.responses.parse(
        {
          model: process.env.OPENAI_VISION_MODEL || 'gpt-5.6-sol',
          input: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'input_text', text: 'Đọc toàn bộ bảng giá trong ảnh này.' },
                { type: 'input_image', image_url: body.imageDataUrl, detail: 'high' },
              ],
            },
          ],
          text: { format: zodTextFormat(RateSheetExtraction, 'fx_rate_sheet') },
        },
        { signal: AbortSignal.timeout(45_000) }
      )

      if (!response.output_parsed) return json(res, 422, { error: 'UNREADABLE_IMAGE' })
      const normalized = normalizeRateSheetExtraction(response.output_parsed)
      if (!normalized.entries.length) return json(res, 422, { error: 'UNREADABLE_IMAGE', ...normalized })
      return json(res, 200, normalized)
    } catch (error) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        return json(res, 504, { error: 'AI_TIMEOUT' })
      }
      if (error?.name === 'ZodError') return json(res, 422, { error: 'INVALID_AI_RESPONSE' })
      return json(res, 502, { error: 'AI_SERVICE_ERROR' })
    }
  }
}

export const config = { maxDuration: 60 }

export default createImportRatesHandler()
