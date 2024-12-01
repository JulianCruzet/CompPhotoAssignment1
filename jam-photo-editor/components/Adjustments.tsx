import React from 'react'
import { Slider } from "@/components/ui/slider"

interface AdjustmentsProps {
  imageData: ImageData | null
  applyChanges: (newImageData: ImageData) => void
  adjustments: {
    saturation: number
    contrast: number
    temperature: number
  }
  setAdjustments: React.Dispatch<React.SetStateAction<AdjustmentsProps['adjustments']>>
}

export default function Adjustments({ imageData, applyChanges, adjustments, setAdjustments }: AdjustmentsProps) {
  const applySaturation = (value: number) => {
    if (!imageData) return
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )
    const factor = value / 100
    for (let i = 0; i < newImageData.data.length; i += 4) {
      const r = newImageData.data[i]
      const g = newImageData.data[i + 1]
      const b = newImageData.data[i + 2]
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b
      newImageData.data[i] = Math.min(255, Math.max(0, gray + factor * (r - gray)))
      newImageData.data[i + 1] = Math.min(255, Math.max(0, gray + factor * (g - gray)))
      newImageData.data[i + 2] = Math.min(255, Math.max(0, gray + factor * (b - gray)))
    }
    applyChanges(newImageData)
    setAdjustments(prev => ({ ...prev, saturation: value }))
  }

  const applyContrast = (value: number) => {
    if (!imageData) return
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )
    const factor = (259 * (value + 255)) / (255 * (259 - value))
    for (let i = 0; i < newImageData.data.length; i += 4) {
      newImageData.data[i] = Math.min(255, Math.max(0, factor * (newImageData.data[i] - 128) + 128))
      newImageData.data[i + 1] = Math.min(255, Math.max(0, factor * (newImageData.data[i + 1] - 128) + 128))
      newImageData.data[i + 2] = Math.min(255, Math.max(0, factor * (newImageData.data[i + 2] - 128) + 128))
    }
    applyChanges(newImageData)
    setAdjustments(prev => ({ ...prev, contrast: value }))
  }

  const applyTemperature = (value: number) => {
    if (!imageData) return
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )
    const factor = (value - 100) / 100 // Adjust so that 100 is the neutral point
    for (let i = 0; i < newImageData.data.length; i += 4) {
      newImageData.data[i] = Math.min(255, Math.max(0, newImageData.data[i] + factor * 30))
      newImageData.data[i + 2] = Math.min(255, Math.max(0, newImageData.data[i + 2] - factor * 30))
    }
    applyChanges(newImageData)
    setAdjustments(prev => ({ ...prev, temperature: value }))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2">Saturation</label>
        <Slider
          value={[adjustments.saturation]}
          onValueChange={(value) => applySaturation(value[0])}
          min={0}
          max={200}
          step={1}
          defaultValue={[100]}
        />
      </div>
      <div>
        <label className="block mb-2">Contrast</label>
        <Slider
          value={[adjustments.contrast]}
          onValueChange={(value) => applyContrast(value[0])}
          min={0}
          max={200}
          step={1}
          defaultValue={[100]}
        />
      </div>
      <div>
        <label className="block mb-2">Temperature</label>
        <Slider
          value={[adjustments.temperature]}
          onValueChange={(value) => applyTemperature(value[0])}
          min={0}
          max={200}
          step={1}
          defaultValue={[100]}
        />
      </div>
    </div>
  )
}