import { anchorOf, buyPricePerNote, sellPricePerNote } from '../store/useStore'

export function buildRateListRows(currencies = []) {
  return currencies
    .filter((currency) => currency.enabled)
    .map((currency) => {
      const anchor = anchorOf(currency)
      return {
        code: currency.code,
        name: currency.name,
        flag: currency.flag,
        anchorValue: anchor?.value ?? null,
        buyPrice: anchor ? buyPricePerNote(currency, anchor) : null,
        sellPrice: anchor ? sellPricePerNote(currency, anchor) : null,
      }
    })
}
