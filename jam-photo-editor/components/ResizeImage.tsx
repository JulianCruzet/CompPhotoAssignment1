import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ResizeImageProps {
  imageData: ImageData | null
  applyChanges: (newImageData: ImageData) => void
}

export default function ResizeImage({ imageData, applyChanges }: ResizeImageProps) {
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')

  const handleResize = () => {
    if (!imageData) return
    const newWidth = parseInt(width)
    const newHeight = parseInt(height)
    if (isNaN(newWidth) || isNaN(newHeight)) return

    const canvas = document.createElement('canvas')
    canvas.width = newWidth
    canvas.height = newHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Implement nearest neighbor resizing
    const scaleX = imageData.width / newWidth
    const scaleY = imageData.height / newHeight
    const newImageData = ctx.createImageData(newWidth, newHeight)

    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = Math.floor(x * scaleX)
        const srcY = Math.floor(y * scaleY)
        const srcIndex = (srcY * imageData.width + srcX) * 4
        const destIndex = (y * newWidth + x) * 4

        newImageData.data[destIndex] = imageData.data[srcIndex]
        newImageData.data[destIndex + 1] = imageData.data[srcIndex + 1]
        newImageData.data[destIndex + 2] = imageData.data[srcIndex + 2]
        newImageData.data[destIndex + 3] = imageData.data[srcIndex + 3]
      }
    }

    applyChanges(newImageData)
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          type="number"
          placeholder="Width"
          value={width}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWidth(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Height"
          value={height}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeight(e.target.value)}
        />
      </div>
      <Button onClick={handleResize}>Resize</Button>
    </div>
  )
}