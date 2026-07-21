import { describe, expect, it } from 'vitest'
import { computeHomography, projectPoint, warpImageData } from './perspective'

describe('perspective correction', () => {
  it('ánh xạ chính xác bốn góc của hình thang', () => {
    const from = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 20 },
      { x: 0, y: 20 },
    ]
    const to = [
      { x: 2, y: 3 },
      { x: 12, y: 1 },
      { x: 11, y: 22 },
      { x: 1, y: 19 },
    ]
    const transform = computeHomography(from, to)
    from.forEach((point, index) => {
      const projected = projectPoint(transform, point)
      expect(projected.x).toBeCloseTo(to[index].x, 5)
      expect(projected.y).toBeCloseTo(to[index].y, 5)
    })
  })

  it('giữ nguyên pixel khi bốn góc phủ toàn ảnh', () => {
    const data = new Uint8ClampedArray([
      10, 20, 30, 255, 40, 50, 60, 255,
      70, 80, 90, 255, 100, 110, 120, 255,
    ])
    const output = warpImageData(
      { data, width: 2, height: 2 },
      {
        topLeft: { x: 0, y: 0 },
        topRight: { x: 1, y: 0 },
        bottomRight: { x: 1, y: 1 },
        bottomLeft: { x: 0, y: 1 },
      },
      2,
      2
    )
    expect([...output.data]).toEqual([...data])
  })

  it('đưa các tâm hàng trong ảnh nghiêng về đúng vị trí template', () => {
    const width = 130
    const height = 180
    const outputWidth = 90
    const outputHeight = 150
    const corners = {
      topLeft: { x: 0.18, y: 0.08 },
      topRight: { x: 0.86, y: 0.14 },
      bottomRight: { x: 0.78, y: 0.94 },
      bottomLeft: { x: 0.1, y: 0.86 },
    }
    const destination = [
      { x: 0, y: 0 },
      { x: outputWidth - 1, y: 0 },
      { x: outputWidth - 1, y: outputHeight - 1 },
      { x: 0, y: outputHeight - 1 },
    ]
    const sourceCorners = [
      corners.topLeft,
      corners.topRight,
      corners.bottomRight,
      corners.bottomLeft,
    ].map((point) => ({ x: point.x * (width - 1), y: point.y * (height - 1) }))
    const toSource = computeHomography(destination, sourceCorners)
    const data = new Uint8ClampedArray(width * height * 4).fill(255)
    const rowCenters = [0.175, 0.505, 0.94]

    for (const centerY of rowCenters) {
      const sourcePoint = projectPoint(toSource, {
        x: outputWidth * 0.72,
        y: outputHeight * centerY,
      })
      const centerX = Math.round(sourcePoint.x)
      const centerPixelY = Math.round(sourcePoint.y)
      for (let y = centerPixelY - 2; y <= centerPixelY + 2; y += 1) {
        for (let x = centerX - 2; x <= centerX + 2; x += 1) {
          const index = (y * width + x) * 4
          data[index] = 0
          data[index + 1] = 0
          data[index + 2] = 0
        }
      }
    }

    const output = warpImageData({ data, width, height }, corners, outputWidth, outputHeight)
    for (const centerY of rowCenters) {
      const x = Math.round(outputWidth * 0.72)
      const y = Math.round(outputHeight * centerY)
      const index = (y * outputWidth + x) * 4
      expect(output.data[index]).toBeLessThan(80)
    }
  })
})
