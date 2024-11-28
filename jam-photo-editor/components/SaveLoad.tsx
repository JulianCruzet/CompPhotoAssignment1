import React, { useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SaveLoadProps {
  imageData: ImageData | null
  applyChanges: (newImageData: ImageData) => void
  filters: {
    grayscale: boolean
    sepia: boolean
    averagingFilter: number
    gaussianFilter: number
  }
  adjustments: {
    saturation: number
    contrast: number
    temperature: number
  }
  paintedLook: number
  setFilters: React.Dispatch<React.SetStateAction<SaveLoadProps['filters']>>
  setAdjustments: React.Dispatch<React.SetStateAction<SaveLoadProps['adjustments']>>
  setPaintedLook: React.Dispatch<React.SetStateAction<number>>
}

export default function SaveLoad({
  imageData,
  applyChanges,
  filters,
  adjustments,
  paintedLook,
  setFilters,
  setAdjustments,
  setPaintedLook
}: SaveLoadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    const settings = {
      filters,
      adjustments,
      paintedLook
    }
    const blob = new Blob([JSON.stringify(settings)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'photo_editor_settings.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target?.result as string)
          setFilters(settings.filters)
          setAdjustments(settings.adjustments)
          setPaintedLook(settings.paintedLook)
          applyAllFiltersAndAdjustments(settings)
        } catch (error) {
          console.error('Error parsing settings file:', error)
          alert('Error loading settings. Please make sure you selected a valid settings file.')
        }
      }
      reader.readAsText(file)
    }
  }

  const applyAllFiltersAndAdjustments = (settings: {
    filters: SaveLoadProps['filters']
    adjustments: SaveLoadProps['adjustments']
    paintedLook: number
  }) => {
    if (!imageData) return

    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.putImageData(imageData, 0, 0)

    // Apply filters
    if (settings.filters.grayscale) {
      applyGrayscale(ctx, canvas.width, canvas.height)
    }
    if (settings.filters.sepia) {
      applySepia(ctx, canvas.width, canvas.height)
    }
    if (settings.filters.averagingFilter > 0) {
      applyAveragingFilter(ctx, canvas.width, canvas.height, settings.filters.averagingFilter)
    }
    if (settings.filters.gaussianFilter > 0) {
      applyGaussianFilter(ctx, canvas.width, canvas.height, settings.filters.gaussianFilter)
    }

    // Apply adjustments
    applyAdjustments(ctx, canvas.width, canvas.height, settings.adjustments)

    // Apply painted look
    if (settings.paintedLook > 0) {
      applyPaintedLook(ctx, canvas.width, canvas.height, settings.paintedLook)
    }

    const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    applyChanges(newImageData)
  }

  const applyGrayscale = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
      imageData.data[i] = avg
      imageData.data[i + 1] = avg
      imageData.data[i + 2] = avg
    }
    ctx.putImageData(imageData, 0, 0)
  }

  const applySepia = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i]
      const g = imageData.data[i + 1]
      const b = imageData.data[i + 2]
      imageData.data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
      imageData.data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
      imageData.data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
    }
    ctx.putImageData(imageData, 0, 0)
  }

  const applyAveragingFilter = (ctx: CanvasRenderingContext2D, width: number, height: number, value: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const size = Math.floor(value / 10) * 2 + 1
    const half = Math.floor(size / 2)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0
        for (let fy = -half; fy <= half; fy++) {
          for (let fx = -half; fx <= half; fx++) {
            const nx = x + fx
            const ny = y + fy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const i = (ny * width + nx) * 4
              r += imageData.data[i]
              g += imageData.data[i + 1]
              b += imageData.data[i + 2]
              count++
            }
          }
        }
        const i = (y * width + x) * 4
        imageData.data[i] = r / count
        imageData.data[i + 1] = g / count
        imageData.data[i + 2] = b / count
      }
    }
    ctx.putImageData(imageData, 0, 0)
  }

  const applyGaussianFilter = (ctx: CanvasRenderingContext2D, width: number, height: number, value: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const size = Math.floor(value / 10) * 2 + 1
    const sigma = value / 10
    const half = Math.floor(size / 2)

    // Generate Gaussian kernel
    const kernel = []
    let sum = 0
    for (let y = -half; y <= half; y++) {
      for (let x = -half; x <= half; x++) {
        const exponent = -(x * x + y * y) / (2 * sigma * sigma)
        const value = Math.exp(exponent) / (2 * Math.PI * sigma * sigma)
        kernel.push(value)
        sum += value
      }
    }
    // Normalize kernel
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum
    }

    const tempImageData = new ImageData(new Uint8ClampedArray(imageData.data), width, height)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0
        for (let fy = -half; fy <= half; fy++) {
          for (let fx = -half; fx <= half; fx++) {
            const nx = x + fx
            const ny = y + fy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const i = (ny * width + nx) * 4
              const kernelIndex = (fy + half) * size + (fx + half)
              r += tempImageData.data[i] * kernel[kernelIndex]
              g += tempImageData.data[i + 1] * kernel[kernelIndex]
              b += tempImageData.data[i + 2] * kernel[kernelIndex]
            }
          }
        }
        const i = (y * width + x) * 4
        imageData.data[i] = r
        imageData.data[i + 1] = g
        imageData.data[i + 2] = b
      }
    }
    ctx.putImageData(imageData, 0, 0)
  }

  const applyAdjustments = (ctx: CanvasRenderingContext2D, width: number, height: number, adjustments: SaveLoadProps['adjustments']) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    
    // Apply saturation
    const saturationFactor = adjustments.saturation / 100
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i]
      const g = imageData.data[i + 1]
      const b = imageData.data[i + 2]
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b
      imageData.data[i] = Math.min(255, Math.max(0, gray + saturationFactor * (r - gray)))
      imageData.data[i + 1] = Math.min(255, Math.max(0, gray + saturationFactor * (g - gray)))
      imageData.data[i + 2] = Math.min(255, Math.max(0, gray + saturationFactor * (b - gray)))
    }

    // Apply contrast
    const contrastFactor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast))
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = Math.min(255, Math.max(0, contrastFactor * (imageData.data[i] - 128) + 128))
      imageData.data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (imageData.data[i + 1] - 128) + 128))
      imageData.data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (imageData.data[i + 2] - 128) + 128))
    }

    // Apply temperature
    const temperatureFactor = (adjustments.temperature - 100) / 100
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] + temperatureFactor * 30))
      imageData.data[i + 2] = Math.min(255, Math.max(0, imageData.data[i + 2] - temperatureFactor * 30))
    }

    ctx.putImageData(imageData, 0, 0)
  }

  const applyPaintedLook = (ctx: CanvasRenderingContext2D, width: number, height: number, value: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const brushSize = Math.max(1, Math.floor(value / 10))

    for (let y = 0; y < height; y += brushSize) {
      for (let x = 0; x < width; x += brushSize) {
        const i = (y * width + x) * 4
        const r = imageData.data[i]
        const g = imageData.data[i + 1]
        const b = imageData.data[i + 2]

        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.beginPath()
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleSave}>Save Settings</Button>
      <div>
        <Input
          type="file"
          accept=".json"
          onChange={handleLoad}
          ref={fileInputRef}
          className="hidden"
          id="load-settings"
        />
        <Button onClick={() => fileInputRef.current?.click()}>
          Load Settings
        </Button>
      </div>
    </div>
  )
}