import React, { useCallback } from 'react'
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
    portraitMode: number
  }
  setFilters: React.Dispatch<React.SetStateAction<FiltersProps['filters']>>
}

export default function Filters({ imageData, applyChanges, filters, setFilters }: FiltersProps) {
  const applyFilter = useCallback((filterFunction: (data: ImageData) => void) => {
    if (!imageData) return
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )
    filterFunction(newImageData)
    applyChanges(newImageData)
  }, [imageData, applyChanges])

  const applyGrayscale = useCallback(() => {
    applyFilter((data) => {
      for (let i = 0; i < data.data.length; i += 4) {
        const avg = (data.data[i] + data.data[i + 1] + data.data[i + 2]) / 3
        data.data[i] = avg
        data.data[i + 1] = avg
        data.data[i + 2] = avg
      }
    })
    setFilters(prev => ({ ...prev, grayscale: !prev.grayscale, sepia: false }))
  }, [applyFilter, setFilters])

  const applySepia = useCallback(() => {
    applyFilter((data) => {
      for (let i = 0; i < data.data.length; i += 4) {
        const r = data.data[i]
        const g = data.data[i + 1]
        const b = data.data[i + 2]
        data.data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
        data.data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
        data.data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
      }
    })
    setFilters(prev => ({ ...prev, grayscale: false, sepia: !prev.sepia }))
  }, [applyFilter, setFilters])

  const applyAveragingFilter = useCallback((value: number) => {
    applyFilter((data) => {
      const size = Math.floor(value / 10) * 2 + 1 // Ensure odd number
      const half = Math.floor(size / 2)
      const tempData = new Uint8ClampedArray(data.data)

      for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < data.width; x++) {
          let r = 0, g = 0, b = 0, count = 0
          for (let fy = -half; fy <= half; fy++) {
            for (let fx = -half; fx <= half; fx++) {
              const nx = x + fx
              const ny = y + fy
              if (nx >= 0 && nx < data.width && ny >= 0 && ny < data.height) {
                const i = (ny * data.width + nx) * 4
                r += tempData[i]
                g += tempData[i + 1]
                b += tempData[i + 2]
                count++
              }
            }
          }
          const i = (y * data.width + x) * 4
          data.data[i] = r / count
          data.data[i + 1] = g / count
          data.data[i + 2] = b / count
        }
      }
    })
    setFilters(prev => ({ ...prev, averagingFilter: value }))
  }, [applyFilter, setFilters])

  const applyGaussianFilter = useCallback((value: number) => {
    applyFilter((data) => {
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

      const tempData = new Uint8ClampedArray(data.data)

      for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < data.width; x++) {
          let r = 0, g = 0, b = 0
          for (let fy = -half; fy <= half; fy++) {
            for (let fx = -half; fx <= half; fx++) {
              const nx = x + fx
              const ny = y + fy
              if (nx >= 0 && nx < data.width && ny >= 0 && ny < data.height) {
                const i = (ny * data.width + nx) * 4
                const kernelIndex = (fy + half) * size + (fx + half)
                r += tempData[i] * kernel[kernelIndex]
                g += tempData[i + 1] * kernel[kernelIndex]
                b += tempData[i + 2] * kernel[kernelIndex]
              }
            }
          }
          const i = (y * data.width + x) * 4
          data.data[i] = r
          data.data[i + 1] = g
          data.data[i + 2] = b
        }
      }
    })
    setFilters(prev => ({ ...prev, gaussianFilter: value }))
  }, [applyFilter, setFilters])

  const applyPortraitMode = useCallback((value: number) => {
    applyFilter((data) => {
      // Set focal point to the center of the image
      const focalY = data.height / 2
      const focalX = data.width / 2

      const maxDistance = Math.sqrt(data.width * data.width + data.height * data.height)
      const blurRadius = Math.floor(value / 10) * 2 + 1 // Ensure odd number

      const tempData = new Uint8ClampedArray(data.data)

      for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < data.width; x++) {
          const distance = Math.sqrt((x - focalX) ** 2 + (y - focalY) ** 2)
          
          // Create a sharper transition with a non-linear function
          const normalizedDistance = distance / maxDistance
          const blurAmount = Math.pow(normalizedDistance, 5) * value

          // Define a threshold for the completely sharp area
          const sharpThreshold = 0.1 * maxDistance

          if (distance > sharpThreshold) {
            let r = 0, g = 0, b = 0, count = 0
            for (let by = -blurRadius; by <= blurRadius; by++) {
              for (let bx = -blurRadius; bx <= blurRadius; bx++) {
                const nx = x + bx
                const ny = y + by
                if (nx >= 0 && nx < data.width && ny >= 0 && ny < data.height) {
                  const i = (ny * data.width + nx) * 4
                  r += tempData[i]
                  g += tempData[i + 1]
                  b += tempData[i + 2]
                  count++
                }
              }
            }
            const i = (y * data.width + x) * 4
            data.data[i] = Math.round(tempData[i] * (1 - blurAmount) + (r / count) * blurAmount)
            data.data[i + 1] = Math.round(tempData[i + 1] * (1 - blurAmount) + (g / count) * blurAmount)
            data.data[i + 2] = Math.round(tempData[i + 2] * (1 - blurAmount) + (b / count) * blurAmount)
          } else {
            // Keep the center area completely sharp
            const i = (y * data.width + x) * 4
            data.data[i] = tempData[i]
            data.data[i + 1] = tempData[i + 1]
            data.data[i + 2] = tempData[i + 2]
          }
        }
      }
    })
    setFilters(prev => ({ ...prev, portraitMode: value }))
  }, [applyFilter, setFilters])

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
      <div>
        <label className="block mb-2">Portrait Mode</label>
        <Slider
          value={[filters.portraitMode]}
          onValueChange={(value) => applyPortraitMode(value[0])}
          max={100}
          step={1}
        />
      </div>
    </div>
  )
}

