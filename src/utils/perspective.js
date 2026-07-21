const EPSILON = 1e-8

function solveLinearSystem(matrix, values) {
  const size = values.length
  const augmented = matrix.map((row, index) => [...row, values[index]])

  for (let column = 0; column < size; column += 1) {
    let pivot = column
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row
    }
    if (Math.abs(augmented[pivot][column]) < EPSILON) throw new Error('INVALID_PAPER_CORNERS')
    ;[augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]]

    const divisor = augmented[column][column]
    for (let index = column; index <= size; index += 1) augmented[column][index] /= divisor

    for (let row = 0; row < size; row += 1) {
      if (row === column) continue
      const factor = augmented[row][column]
      for (let index = column; index <= size; index += 1) {
        augmented[row][index] -= factor * augmented[column][index]
      }
    }
  }

  return augmented.map((row) => row[size])
}

export function computeHomography(from, to) {
  const matrix = []
  const values = []
  for (let index = 0; index < 4; index += 1) {
    const { x, y } = from[index]
    const { x: u, y: v } = to[index]
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    values.push(u)
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    values.push(v)
  }
  return solveLinearSystem(matrix, values)
}

export function projectPoint(homography, point) {
  const [a, b, c, d, e, f, g, h] = homography
  const scale = g * point.x + h * point.y + 1
  return {
    x: (a * point.x + b * point.y + c) / scale,
    y: (d * point.x + e * point.y + f) / scale,
  }
}

const cornerList = (corners, width, height) => [
  { x: corners.topLeft.x * width, y: corners.topLeft.y * height },
  { x: corners.topRight.x * width, y: corners.topRight.y * height },
  { x: corners.bottomRight.x * width, y: corners.bottomRight.y * height },
  { x: corners.bottomLeft.x * width, y: corners.bottomLeft.y * height },
]

export function warpImageData(source, corners, outputWidth, outputHeight) {
  const destination = [
    { x: 0, y: 0 },
    { x: outputWidth - 1, y: 0 },
    { x: outputWidth - 1, y: outputHeight - 1 },
    { x: 0, y: outputHeight - 1 },
  ]
  const homography = computeHomography(
    destination,
    cornerList(corners, source.width - 1, source.height - 1)
  )
  const output = new Uint8ClampedArray(outputWidth * outputHeight * 4)

  for (let y = 0; y < outputHeight; y += 1) {
    for (let x = 0; x < outputWidth; x += 1) {
      const point = projectPoint(homography, { x, y })
      const sourceX = Math.max(0, Math.min(source.width - 1, point.x))
      const sourceY = Math.max(0, Math.min(source.height - 1, point.y))
      const left = Math.floor(sourceX)
      const top = Math.floor(sourceY)
      const right = Math.min(source.width - 1, left + 1)
      const bottom = Math.min(source.height - 1, top + 1)
      const xWeight = sourceX - left
      const yWeight = sourceY - top
      const outputIndex = (y * outputWidth + x) * 4

      for (let channel = 0; channel < 4; channel += 1) {
        const topValue =
          source.data[(top * source.width + left) * 4 + channel] * (1 - xWeight) +
          source.data[(top * source.width + right) * 4 + channel] * xWeight
        const bottomValue =
          source.data[(bottom * source.width + left) * 4 + channel] * (1 - xWeight) +
          source.data[(bottom * source.width + right) * 4 + channel] * xWeight
        output[outputIndex + channel] = topValue * (1 - yWeight) + bottomValue * yWeight
      }
    }
  }

  return { data: output, width: outputWidth, height: outputHeight }
}
