import { afterEach, describe, expect, it } from 'vitest'
import { createImportRatesHandler, validateImageDataUrl } from './import-rates'

const imageDataUrl = `data:image/jpeg;base64,${Buffer.from('image').toString('base64')}`

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code
      return this
    },
    setHeader(name, value) {
      this.headers[name] = value
    },
    end(value) {
      this.body = JSON.parse(value)
    },
  }
}

const request = () => ({
  method: 'POST',
  headers: {},
  body: { imageDataUrl },
})

afterEach(() => {
  delete process.env.OPENAI_API_KEY
})

describe('import rates API', () => {
  it('kiểm tra ảnh', () => {
    expect(validateImageDataUrl(imageDataUrl).ok).toBe(true)
    expect(validateImageDataUrl('data:text/plain;base64,AAAA').ok).toBe(false)
    const oversized = `data:image/jpeg;base64,${Buffer.alloc(2_500_001).toString('base64')}`
    expect(validateImageDataUrl(oversized)).toEqual({ ok: false, code: 'IMAGE_TOO_LARGE' })
  })

  it('báo rõ khi server thiếu cấu hình', async () => {
    const res = responseRecorder()
    await createImportRatesHandler()(request(), res)
    expect(res.statusCode).toBe(503)
    expect(res.body.error).toBe('SERVER_NOT_CONFIGURED')
  })

  it('trả kết quả đã chuẩn hoá từ response mock', async () => {
    process.env.OPENAI_API_KEY = 'test'
    const client = {
      responses: {
        parse: async () => ({
          output_parsed: {
            sheetDateLabel: '16/7',
            warnings: [],
            rows: [
              {
                sourceLabel: '2615',
                currencyCode: 'USD',
                kind: 'buy',
                sheetValue: 2615,
                confidence: 0.99,
                note: '',
              },
            ],
          },
        }),
      },
    }
    const res = responseRecorder()
    await createImportRatesHandler({ clientFactory: () => client })(request(), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.entries[0].proposedValue).toBe(2_615_000)
  })

  it('phân loại timeout và ảnh không đọc được', async () => {
    process.env.OPENAI_API_KEY = 'test'
    const timeoutClient = {
      responses: {
        parse: async () => {
          const error = new Error()
          error.name = 'TimeoutError'
          throw error
        },
      },
    }
    const timeoutRes = responseRecorder()
    await createImportRatesHandler({ clientFactory: () => timeoutClient })(request(), timeoutRes)
    expect(timeoutRes.statusCode).toBe(504)

    const emptyClient = { responses: { parse: async () => ({ output_parsed: null }) } }
    const emptyRes = responseRecorder()
    await createImportRatesHandler({ clientFactory: () => emptyClient })(request(), emptyRes)
    expect(emptyRes.statusCode).toBe(422)
  })

  it('phân loại response sai schema và lỗi upstream', async () => {
    process.env.OPENAI_API_KEY = 'test'
    const invalidResponseClient = {
      responses: {
        parse: async () => {
          const error = new Error('schema mismatch')
          error.name = 'ZodError'
          throw error
        },
      },
    }
    const invalidResponseRes = responseRecorder()
    await createImportRatesHandler({ clientFactory: () => invalidResponseClient })(
      request(),
      invalidResponseRes
    )
    expect(invalidResponseRes.statusCode).toBe(422)
    expect(invalidResponseRes.body.error).toBe('INVALID_AI_RESPONSE')

    const upstreamClient = {
      responses: {
        parse: async () => {
          throw new Error('upstream unavailable')
        },
      },
    }
    const upstreamRes = responseRecorder()
    await createImportRatesHandler({ clientFactory: () => upstreamClient })(request(), upstreamRes)
    expect(upstreamRes.statusCode).toBe(502)
    expect(upstreamRes.body.error).toBe('AI_SERVICE_ERROR')
  })
})
