'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'

interface QrScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
  active: boolean
}

export default function QrScanner({ onScan, onError, active }: QrScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [started, setStarted] = useState(false)
  const containerId = 'qr-scanner-container'

  useEffect(() => {
    if (!active) {
      // スキャナーを停止
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
        setStarted(false)
      }
      return
    }

    if (started) return

    const scanner = new Html5QrcodeScanner(
      containerId,
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
      },
      /* verbose= */ false
    )

    scanner.render(
      (decodedText) => {
        onScan(decodedText)
      },
      (errorMessage) => {
        // スキャン中の通常エラーは無視（毎フレーム来るため）
        if (errorMessage.includes('No QR code found')) return
        onError?.(errorMessage)
      }
    )

    scannerRef.current = scanner
    setStarted(true)

    return () => {
      scanner.clear().catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return (
    <div className="w-full">
      <div
        id={containerId}
        className="rounded-2xl overflow-hidden [&_#qr-shaded-region]:border-gold-400"
      />
      <style>{`
        #${containerId} { width: 100% !important; }
        #${containerId} video { border-radius: 1rem !important; }
        #${containerId} #qr-shaded-region { border: 3px solid #c9a84c !important; border-radius: 0.5rem !important; }
        #${containerId} button { 
          background: #1a2340 !important; 
          color: #fafaf7 !important; 
          border-radius: 0.75rem !important;
          padding: 0.5rem 1rem !important;
          font-size: 0.875rem !important;
          border: none !important;
          cursor: pointer !important;
        }
        #${containerId} select {
          border: 1px solid #e8e8df !important;
          border-radius: 0.5rem !important;
          padding: 0.25rem 0.5rem !important;
          font-size: 0.875rem !important;
        }
        #${containerId} img[alt="Info icon"] { display: none !important; }
        #${containerId} #html5-qrcode-anchor-scan-type-change { display: none !important; }
      `}</style>
    </div>
  )
}
