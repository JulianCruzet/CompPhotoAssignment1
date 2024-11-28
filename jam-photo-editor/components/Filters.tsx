import React from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface FiltersProps {
  imageData: ImageData | null
  applyChanges: (newImageData: ImageData) => void
  filters: {
    grayscale: boolean
    sepia: boolean
    averagingFilter: number
    gaussianFilter: number
  }
  setFilters: React.Dispatch<React.SetStateAction<FiltersProps['filters']>>
}

export default function Filters({ imageData, applyChanges, filters, setFilters }: FiltersProps) {
  const applyGrayscale = () => {
    if (!imageData) return
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )
    for (let i = 0; i < newImageData.data.length; i += 4) {
      const avg = (newImageData.data[i] + newImageData.data[i + 1] + newImageData.data[i + 2]) / 3
      newImageData.data[i] = avg
      newImageData.data[i + 1] = avg
      newImageData.data[i + 2] = avg
    }
    applyChanges(newImageData)
    setFilters(prev => ({ ...prev, grayscale: !prev.grayscale, sepia: false }))
  }

  const applySepia = () => {
    if (!imageData) return
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )
    for (let i = 0; i < newImageData.data.length; i += 4) {
      const r = newImageData.data[i]
      const g = newImageData.data[i + 1]
      const b = newImageData.data[i + 2]
      newImageData.data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
      newImageData.data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
      newImageData.data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
    }
    applyChanges(newImageData)
    setFilters(prev => ({ ...prev, grayscale: false, sepia: !prev.sepia }))
  }

  const applyAveragingFilter = (value: number) => {
    if (!imageData) return
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )
    const size = Math.floor(value / 10) * 2 + 1 // Ensure odd number
    const half = Math.floor(size / 2)

    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        let r = 0, g = 0, b = 0, count = 0
        for (let fy = -half; fy <= half; fy++) {
          for (let fx = -half; fx <= half; fx++) {
            const nx = x + fx
            const ny = y + fy
            if (nx >= 0 && nx < imageData.width && ny >= 0 && ny < imageData.height) {
              const i = (ny * imageData.width + nx) * 4
              r += imageData.data[i]
              g += imageData.data[i + 1]
              b += imageData.data[i + 2]
              count++
            }
          }
        }
        const i = (y * imageData.width + x) * 4
        newImageData.data[i] = r / count
        newImageData.data[i + 1] = g / count
        newImageData.data[i + 2] = b / count
      }
    }
    applyChanges(newImageData)
    setFilters(prev => ({ ...prev, averagingFilter: value }))
  }

  const applyGaussianFilter = (value: number) => {
    if (!imageData) return
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )
    const size = Math.floor(value / 10) * 2 + 1 // Ensure odd number
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

    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        let r = 0, g = 0, b = 0
        for (let fy = -half; fy <= half; fy++) {
          for (let fx = -half; fx <= half; fx++) {
            const nx = x + fx
            const ny = y + fy
            if (nx >= 0 && nx < imageData.width && ny >= 0 && ny < imageData.height) {
              const i = (ny * imageData.width + nx) * 4
              const kernelIndex = (fy + half) * size + (fx + half)
              r += imageData.data[i] * kernel[kernelIndex]
              g += imageData.data[i + 1] * kernel[kernelIndex]
              b += imageData.data[i + 2] * kernel[kernelIndex]
            }
          }
        }
        const i = (y * imageData.width + x) * 4
        newImageData.data[i] = r
        newImageData.data[i + 1] = g
        newImageData.data[i + 2] = b
      }
    }
    applyChanges(newImageData)
    setFilters(prev => ({ ...prev, gaussianFilter: value }))
  }

  return (
    <div className="space-y-4">
      <Button onClick={applyGrayscale} variant={filters.grayscale ? "default" : "outline"}>Grayscale</Button>
      <Button onClick={applySepia} variant={filters.sepia ? "default" : "outline"}>Sepia</Button>
      <div>
        <label className="block mb-2">Averaging Filter</label>
        <Slider
          value={[filters.averagingFilter]}
          onValueChange={(value) => applyAveragingFilter(value[0])}
          max={100}
          step={1}
        />
      </div>
      <div>
        <label className="block mb-2">Gaussian Filter</label>
        <Slider
          value={[filters.gaussianFilter]}
          onValueChange={(value) => applyGaussianFilter(value[0])}
          max={100}
          step={1}
        />
      </div>
    </div>
  )
}