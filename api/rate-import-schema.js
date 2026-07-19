import { z } from 'zod'
import { IMPORTABLE_CODES, RATE_ROW_KINDS } from '../src/domain/rateImport.js'

export const RateSheetExtraction = z.object({
  sheetDateLabel: z.string().nullable(),
  rows: z.array(
    z.object({
      sourceLabel: z.string(),
      currencyCode: z.enum([...IMPORTABLE_CODES, 'UNKNOWN']),
      kind: z.enum(RATE_ROW_KINDS),
      sheetValue: z.number().int().positive().nullable(),
      confidence: z.number().min(0).max(1),
      note: z.string(),
    })
  ).max(30),
  warnings: z.array(z.string()).max(30),
})

