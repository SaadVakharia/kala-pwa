import { useState, useRef, useEffect, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw, Crop, Check } from 'lucide-react'
import { Button } from '../ui/Button'

/**
 * ImageCropModal — a pure canvas-based image cropper.
 *
 * Props:
 *   open       – boolean, controls visibility
 *   imageSrc   – dataURL or object URL of the image to crop
 *   aspectRatio – number (width/height). null = free-form. 1 = square.
 *   onConfirm  – (blob, previewDataUrl) => void
 *   onCancel   – () => void
 */
export function ImageCropModal({ open, imageSrc, aspectRatio = 1, onConfirm, onCancel }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // Image state
  const [img, setImg] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [processing, setProcessing] = useState(false)

  // Pinch zoom state
  const lastPinchDist = useRef(null)
  const lastPinchZoom = useRef(1)

  // Load image when src changes
  useEffect(() => {
    if (!imageSrc) return
    const image = new Image()
    image.onload = () => {
      setImg(image)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    image.src = imageSrc
  }, [imageSrc])

  // Measure container
  useEffect(() => {
    if (!open || !containerRef.current) return
    const measure = () => {
      const rect = containerRef.current.getBoundingClientRect()
      setContainerSize({ w: rect.width, h: rect.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [open])

  // Compute crop region dimensions
  const getCropRegion = useCallback(() => {
    const padding = 24
    const maxW = containerSize.w - padding * 2
    const maxH = containerSize.h - padding * 2
    if (maxW <= 0 || maxH <= 0) return { x: 0, y: 0, size: 0 }

    let cropW, cropH
    if (aspectRatio) {
      // Fixed aspect ratio
      if (aspectRatio >= 1) {
        cropW = Math.min(maxW, maxH * aspectRatio)
        cropH = cropW / aspectRatio
      } else {
        cropH = Math.min(maxH, maxW / aspectRatio)
        cropW = cropH * aspectRatio
      }
    } else {
      // Free-form: use a 4:3 landscape default
      cropW = Math.min(maxW, maxH * (4 / 3))
      cropH = cropW * (3 / 4)
    }

    return {
      x: (containerSize.w - cropW) / 2,
      y: (containerSize.h - cropH) / 2,
      w: cropW,
      h: cropH,
    }
  }, [containerSize, aspectRatio])

  // Draw canvas
  useEffect(() => {
    if (!img || !canvasRef.current || containerSize.w === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = containerSize.w
    canvas.height = containerSize.h

    const crop = getCropRegion()

    // Calculate image draw dimensions (fit image into crop region, then apply zoom)
    const imgAspect = img.width / img.height
    const cropAspect = crop.w / crop.h
    let drawW, drawH

    if (imgAspect > cropAspect) {
      // Image is wider than crop — fit by height
      drawH = crop.h * zoom
      drawW = drawH * imgAspect
    } else {
      // Image is taller — fit by width
      drawW = crop.w * zoom
      drawH = drawW / imgAspect
    }

    const drawX = crop.x + (crop.w - drawW) / 2 + offset.x
    const drawY = crop.y + (crop.h - drawH) / 2 + offset.y

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw image
    ctx.save()
    ctx.drawImage(img, drawX, drawY, drawW, drawH)
    ctx.restore()

    // Dark overlay outside crop region
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    // Top
    ctx.fillRect(0, 0, canvas.width, crop.y)
    // Bottom
    ctx.fillRect(0, crop.y + crop.h, canvas.width, canvas.height - crop.y - crop.h)
    // Left
    ctx.fillRect(0, crop.y, crop.x, crop.h)
    // Right
    ctx.fillRect(crop.x + crop.w, crop.y, canvas.width - crop.x - crop.w, crop.h)

    // Crop border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 2
    ctx.setLineDash([])
    // Rounded rect for crop border
    const r = 16
    ctx.beginPath()
    ctx.moveTo(crop.x + r, crop.y)
    ctx.lineTo(crop.x + crop.w - r, crop.y)
    ctx.quadraticCurveTo(crop.x + crop.w, crop.y, crop.x + crop.w, crop.y + r)
    ctx.lineTo(crop.x + crop.w, crop.y + crop.h - r)
    ctx.quadraticCurveTo(crop.x + crop.w, crop.y + crop.h, crop.x + crop.w - r, crop.y + crop.h)
    ctx.lineTo(crop.x + r, crop.y + crop.h)
    ctx.quadraticCurveTo(crop.x, crop.y + crop.h, crop.x, crop.y + crop.h - r)
    ctx.lineTo(crop.x, crop.y + r)
    ctx.quadraticCurveTo(crop.x, crop.y, crop.x + r, crop.y)
    ctx.closePath()
    ctx.stroke()

    // Grid lines (rule of thirds)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.setLineDash([])
    for (let i = 1; i < 3; i++) {
      // Vertical
      const vx = crop.x + (crop.w / 3) * i
      ctx.beginPath()
      ctx.moveTo(vx, crop.y)
      ctx.lineTo(vx, crop.y + crop.h)
      ctx.stroke()
      // Horizontal
      const hy = crop.y + (crop.h / 3) * i
      ctx.beginPath()
      ctx.moveTo(crop.x, hy)
      ctx.lineTo(crop.x + crop.w, hy)
      ctx.stroke()
    }

    // Corner accents
    const cornerLen = 20
    ctx.strokeStyle = '#CC0000'
    ctx.lineWidth = 3
    ctx.setLineDash([])
    const corners = [
      [crop.x, crop.y, 1, 1],
      [crop.x + crop.w, crop.y, -1, 1],
      [crop.x, crop.y + crop.h, 1, -1],
      [crop.x + crop.w, crop.y + crop.h, -1, -1],
    ]
    corners.forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath()
      ctx.moveTo(cx, cy + dy * cornerLen)
      ctx.lineTo(cx, cy)
      ctx.lineTo(cx + dx * cornerLen, cy)
      ctx.stroke()
    })
  }, [img, zoom, offset, containerSize, getCropRegion])

  // Mouse handlers
  const handlePointerDown = (e) => {
    if (e.touches && e.touches.length > 1) return // let pinch handle it
    e.preventDefault()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setDragging(true)
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y })
  }

  const handlePointerMove = (e) => {
    if (!dragging) return
    e.preventDefault()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    })
  }

  const handlePointerUp = () => {
    setDragging(false)
  }

  // Touch pinch-to-zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      lastPinchDist.current = dist
      lastPinchZoom.current = zoom
    } else {
      handlePointerDown(e)
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      if (lastPinchDist.current) {
        const scale = dist / lastPinchDist.current
        const newZoom = Math.max(1, Math.min(5, lastPinchZoom.current * scale))
        setZoom(newZoom)
      }
    } else {
      handlePointerMove(e)
    }
  }

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      lastPinchDist.current = null
    }
    handlePointerUp()
  }

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(prev => Math.max(1, Math.min(5, prev + delta)))
  }

  // Reset
  const handleReset = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  // Confirm: extract cropped region
  const handleConfirm = async () => {
    if (!img) return
    setProcessing(true)

    try {
      const crop = getCropRegion()

      // Calculate where the image is drawn relative to the crop region
      const imgAspect = img.width / img.height
      const cropAspect = crop.w / crop.h
      let drawW, drawH

      if (imgAspect > cropAspect) {
        drawH = crop.h * zoom
        drawW = drawH * imgAspect
      } else {
        drawW = crop.w * zoom
        drawH = drawW / imgAspect
      }

      const drawX = crop.x + (crop.w - drawW) / 2 + offset.x
      const drawY = crop.y + (crop.h - drawH) / 2 + offset.y

      // Map crop region back to original image coordinates
      const scaleX = img.width / drawW
      const scaleY = img.height / drawH

      const srcX = (crop.x - drawX) * scaleX
      const srcY = (crop.y - drawY) * scaleY
      const srcW = crop.w * scaleX
      const srcH = crop.h * scaleY

      // Output canvas at a reasonable size
      const outputSize = Math.min(1200, Math.max(srcW, srcH))
      const outCanvas = document.createElement('canvas')
      const outAspect = crop.w / crop.h

      if (outAspect >= 1) {
        outCanvas.width = outputSize
        outCanvas.height = outputSize / outAspect
      } else {
        outCanvas.height = outputSize
        outCanvas.width = outputSize * outAspect
      }

      const outCtx = outCanvas.getContext('2d')
      outCtx.drawImage(
        img,
        Math.max(0, srcX), Math.max(0, srcY), srcW, srcH,
        0, 0, outCanvas.width, outCanvas.height
      )

      const previewDataUrl = outCanvas.toDataURL('image/jpeg', 0.92)

      outCanvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a File from the blob so it has a name property
            const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' })
            onConfirm(file, previewDataUrl)
          }
          setProcessing(false)
        },
        'image/jpeg',
        0.92
      )
    } catch (err) {
      console.error('Crop failed:', err)
      setProcessing(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-black/40 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-kala-red/20 flex items-center justify-center">
            <Crop size={16} className="text-kala-red" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">Crop Image</h3>
            <p className="text-[10px] text-white/50 hidden sm:block">Drag to reposition, scroll or pinch to zoom</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ touchAction: 'none' }}
        />

        {/* Help text overlay — fades after interaction */}
        {!dragging && zoom === 1 && offset.x === 0 && offset.y === 0 && (
          <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-4 sm:hidden">
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-1.5 text-[11px] text-white/70 font-medium animate-pulse">
              Drag to move • Pinch to zoom
            </div>
          </div>
        )}
      </div>

      {/* Controls Footer */}
      <div className="shrink-0 bg-black/40 backdrop-blur-md border-t border-white/10 px-4 py-3 sm:px-6 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Zoom Slider */}
        <div className="flex items-center gap-3 mb-4 max-w-sm mx-auto">
          <button
            onClick={() => setZoom(prev => Math.max(1, prev - 0.2))}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all shrink-0"
          >
            <ZoomOut size={14} />
          </button>
          <div className="flex-1 relative h-8 flex items-center">
            <input
              type="range"
              min="1"
              max="5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-white/20 outline-none
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-kala-red
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-kala-red"
            />
          </div>
          <button
            onClick={() => setZoom(prev => Math.min(5, prev + 0.2))}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all shrink-0"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleReset}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all shrink-0 ml-1"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 max-w-sm mx-auto">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/20 text-white/80 text-sm font-semibold hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <Button
            onClick={handleConfirm}
            loading={processing}
            className="flex-1 py-3 text-sm shadow-lg"
          >
            <Check size={16} className="mr-1.5" />
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  )
}
