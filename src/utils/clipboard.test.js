import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText } from './clipboard'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('copyText', () => {
  it('sao chép nội dung bằng Clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await copyText('mẫu JSON')
    expect(writeText).toHaveBeenCalledWith('mẫu JSON')
  })

  it('báo lỗi khi thiết bị không hỗ trợ Clipboard API', async () => {
    vi.stubGlobal('navigator', {})
    await expect(copyText('mẫu JSON')).rejects.toThrow('CLIPBOARD_UNAVAILABLE')
  })
})
