export const RATE_SHEET_SIZE = { width: 900, height: 1500 }

const rateSlot = (id, label, code, kind, centerY) => ({
  id,
  label,
  code,
  kind,
  rect: { x: 0.5, y: centerY - 0.027, width: 0.47, height: 0.054 },
})

export const RATE_SHEET_TEMPLATE_V1 = [
  {
    id: 'sheet-date',
    label: 'Ngày',
    kind: 'date',
    rect: { x: 0.31, y: 0.005, width: 0.38, height: 0.075 },
  },
  {
    id: 'usd-buy',
    label: 'USD — MUA VÀO',
    code: 'USD',
    kind: 'buy',
    rect: { x: 0.04, y: 0.075, width: 0.43, height: 0.085 },
  },
  {
    id: 'usd-sell',
    label: 'USD — BÁN RA',
    code: 'USD',
    kind: 'sell',
    rect: { x: 0.53, y: 0.075, width: 0.43, height: 0.085 },
  },
  rateSlot('eur-buy', 'EUR — MUA VÀO', 'EUR', 'buy', 0.175),
  rateSlot('eurc-buy', 'EURC — MUA VÀO', 'EURC', 'buy', 0.23),
  rateSlot('jpy-buy', 'JPY — MUA VÀO', 'JPY', 'buy', 0.285),
  rateSlot('cad-buy', 'CAD — MUA VÀO', 'CAD', 'buy', 0.34),
  rateSlot('aud-buy', 'AUD — MUA VÀO', 'AUD', 'buy', 0.395),
  rateSlot('sgd-buy', 'SGD — MUA VÀO', 'SGD', 'buy', 0.45),
  rateSlot('chf-buy', 'CHF — MUA VÀO', 'CHF', 'buy', 0.505),
  rateSlot('gbp-buy', 'GBP — MUA VÀO', 'GBP', 'buy', 0.56),
  rateSlot('twd-buy', 'TWD — MUA VÀO', 'TWD', 'buy', 0.615),
  rateSlot('cny-buy', 'CNY — MUA VÀO', 'CNY', 'buy', 0.67),
  rateSlot('thb-buy', 'THB — MUA VÀO', 'THB', 'buy', 0.725),
  rateSlot('myr-buy', 'MYR — MUA VÀO', 'MYR', 'buy', 0.78),
  rateSlot('krw-50-5', 'KRW — nhóm 50.000/5.000', 'KRW', 'krw_50_5', 0.835),
  rateSlot('krw-10-1', 'KRW — nhóm 10.000/1.000', 'KRW', 'krw_10_1', 0.885),
  rateSlot('nzd-buy', 'NZD — MUA VÀO', 'NZD', 'buy', 0.94),
]

export const RATE_SHEET_RATE_SLOTS = RATE_SHEET_TEMPLATE_V1.filter((slot) => slot.kind !== 'date')

export const DEFAULT_PAPER_CORNERS = {
  topLeft: { x: 0.18, y: 0.1 },
  topRight: { x: 0.82, y: 0.1 },
  bottomRight: { x: 0.82, y: 0.92 },
  bottomLeft: { x: 0.18, y: 0.92 },
}
