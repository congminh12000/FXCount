import { useEffect, useRef, useState } from 'react'
import { Camera } from './Icons'
import { BigButton } from './UI'

export default function CameraCapture({ onCapture, onCancel, onFallback }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices)
    if (!getUserMedia) {
      setError('Thiết bị này không hỗ trợ mở camera trực tiếp.')
      return () => {}
    }

    getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        videoRef.current.srcObject = stream
        return videoRef.current.play()
      })
      .catch(() => active && setError('Không mở được camera trên thiết bị này.'))
    return () => {
      active = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const capture = () => {
    const video = videoRef.current
    if (!video?.videoWidth || !video.videoHeight) return
    const scale = Math.min(1, 2000 / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    canvas.getContext('2d', { alpha: false }).drawImage(video, 0, 0, canvas.width, canvas.height)
    onCapture(canvas.toDataURL('image/jpeg', 0.9))
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-black">
      <div className="safe-top flex items-center justify-between px-5 py-3 text-white">
        <button onClick={onCancel} className="min-h-11 px-2 text-sm font-semibold">Huỷ</button>
        <p className="font-bold">Căn tờ giấy vào khung</p>
        <span className="w-12" />
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          onLoadedData={() => setReady(true)}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-[8%_13%] rounded-2xl border-2 border-gold shadow-[0_0_0_999px_rgba(0,0,0,0.48)]">
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-white">
            Đặt toàn bộ tờ giấy trong khung
          </span>
        </div>
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 px-8 text-center">
            <p className="mb-4 text-sm text-white">{error}</p>
            <BigButton variant="outline" onClick={onFallback}>Dùng camera hệ thống</BigButton>
          </div>
        )}
      </div>
      <div className="safe-bottom flex justify-center py-5">
        <button
          onClick={capture}
          disabled={!ready || Boolean(error)}
          aria-label="Chụp bảng giá"
          className="btn-gold flex h-16 w-16 items-center justify-center rounded-full disabled:opacity-40"
        >
          <Camera size={28} />
        </button>
      </div>
    </div>
  )
}
