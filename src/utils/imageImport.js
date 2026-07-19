const MAX_SOURCE_BYTES = 12_000_000
const MAX_OUTPUT_BYTES = 2_000_000
const MAX_DIMENSION = 2000

const dataUrlBytes = (dataUrl) => Math.ceil((dataUrl.split(',')[1]?.length || 0) * 0.75)

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({ image, release: () => URL.revokeObjectURL(url) })
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('UNSUPPORTED_IMAGE'))
    }
    image.src = url
  })
}

export async function prepareRateSheetImage(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('INVALID_IMAGE')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('SOURCE_TOO_LARGE')

  const { image, release } = await loadImage(file)
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { alpha: false })
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)

    for (const quality of [0.86, 0.76, 0.66, 0.56]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      if (dataUrlBytes(dataUrl) <= MAX_OUTPUT_BYTES) return dataUrl
    }
    throw new Error('OUTPUT_TOO_LARGE')
  } finally {
    release()
  }
}

