export async function copyText(value) {
  if (!navigator.clipboard?.writeText) throw new Error('CLIPBOARD_UNAVAILABLE')
  await navigator.clipboard.writeText(value)
}
