import React, { useCallback } from 'react'
import { Slider } from "@/components/ui/slider"

interface PaintedLookProps {
  imageData: ImageData | null
  applyChanges: (newImageData: ImageData) => void
  paintedLook: number
  setPaintedLook: React.Dispatch<React.SetStateAction<number>>
}

export default function PaintedLook({ imageData, applyChanges, paintedLook, setPaintedLook }: PaintedLookProps) {
  const applyPaintedLook = useCallback((value: number) => {
    if (!imageData) return

    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.putImageData(imageData, 0, 0)

    // Step 1: Edge Detection (Sobel operator)
    const edgeCanvas = document.createElement('canvas')
    edgeCanvas.width = imageData.width
    edgeCanvas.height = imageData.height
    const edgeCtx = edgeCanvas.getContext('2d')
    if (!edgeCtx) return

    const edgeData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const sobelData = applySobelOperator(edgeData)
    edgeCtx.putImageData(sobelData, 0, 0)

    // Step 2: Color Quantization
    ctx.save()
    ctx.globalAlpha = value / 100
    const quantizedData = quantizeColors(imageData, 8)
    ctx.putImageData(quantizedData, 0, 0)
    ctx.restore()

    // Step 3: Brush Stroke Simulation
    const brushSize = Math.max(1, Math.floor(value / 10))
    simulateBrushStrokes(ctx, edgeCanvas, brushSize)

    // Apply the result
    const result = ctx.getImageData(0, 0, canvas.width, canvas.height)
    applyChanges(result)
  }, [imageData, applyChanges])

  const applySobelOperator = (imageData: ImageData) => {
    const output = new ImageData(imageData.width, imageData.height)
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        let pixelX = 0, pixelY = 0
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const idx = ((y + i) * imageData.width + (x + j)) * 4
            const gray = (imageData.data[idx] + imageData.data[idx + 1] + imageData.data[idx + 2]) / 3
            pixelX += gray * sobelX[(i + 1) * 3 + (j + 1)]
            pixelY += gray * sobelY[(i + 1) * 3 + (j + 1)]
          }
        }
        const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY)
        const idx = (y * imageData.width + x) * 4
        output.data[idx] = output.data[idx + 1] = output.data[idx + 2] = magnitude
        output.data[idx + 3] = 255
      }
    }
    return output
  }

  const quantizeColors = (imageData: ImageData, levels: number) => {
    const output = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height)
    for (let i = 0; i < output.data.length; i += 4) {
      output.data[i] = Math.round(output.data[i] / 255 * (levels - 1)) / (levels - 1) * 255
      output.data[i + 1] = Math.round(output.data[i + 1] / 255 * (levels - 1)) / (levels - 1) * 255
      output.data[i + 2] = Math.round(output.data[i + 2] / 255 * (levels - 1)) / (levels - 1) * 255
    }
    return output
  }

  const simulateBrushStrokes = (ctx: CanvasRenderingContext2D, edgeCanvas: HTMLCanvasElement, brushSize: number) => {
    const width = ctx.canvas.width
    const height = ctx.canvas.height
    const edgeCtx = edgeCanvas.getContext('2d')
    if (!edgeCtx) return

    const edgeData = edgeCtx.getImageData(0, 0, width, height)
    const imageData = ctx.getImageData(0, 0, width, height)

    for (let y = 0; y < height; y += brushSize) {
      for (let x = 0; x < width; x += brushSize) {
        const idx = (y * width + x) * 4
        if (edgeData.data[idx] > 50) continue // Skip edges

        const r = imageData.data[idx]
        const g = imageData.data[idx + 1]
        const b = imageData.data[idx + 2]

        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.beginPath()
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  return (
    <div>
      <label className="block mb-2">Painted Look</label>
      <Slider
        value={[paintedLook]}
        onValueChange={(value) => {
          setPaintedLook(value[0])
          applyPaintedLook(value[0])
        }}
        min={0}
        max={100}
        step={1}
      />
    </div>
  )
}