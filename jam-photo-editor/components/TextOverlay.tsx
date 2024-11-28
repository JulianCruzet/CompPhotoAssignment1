import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TextOverlayProps {
  applyChanges: (newImageData: ImageData) => void
  imageData: ImageData | null
  onClose: () => void
}

export default function TextOverlay({ applyChanges, imageData, onClose }: TextOverlayProps) {
  const [text, setText] = useState('')
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [fontSize, setFontSize] = useState(20)
  const [color, setColor] = useState('#000000')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (imageData && canvasRef.current) {
      const canvas = canvasRef.current
      canvas.width = imageData.width
      canvas.height = imageData.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.putImageData(imageData, 0, 0)
      }
    }
  }, [imageData])

  const handleAddText = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.font = `${fontSize}px Arial`
        ctx.fillStyle = color
        ctx.fillText(text, position.x, position.y)
        const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        applyChanges(newImageData)
      }
    }
  }

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue)) {
      setPosition(prev => ({ ...prev, [axis]: numValue }))
    }
  }

  const handleFontSizeChange = (value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue > 0) {
      setFontSize(numValue)
    }
  }

  return (
    <div className="absolute top-0 left-0 bg-white p-4 rounded shadow-md">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        aria-label="Close text overlay"
      >
        ✕
      </button>
      <div className="space-y-4">
        <div className="space-y-1">
          <span className="block text-sm font-medium text-gray-700">Text</span>
          <Input
            id="text-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text"
          />
        </div>
        <div className="flex space-x-2">
          <div className="space-y-1">
            <span className="block text-sm font-medium text-gray-700">X Position</span>
            <Input
              id="x-position"
              type="number"
              value={position.x}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              placeholder="X"
            />
          </div>
          <div className="space-y-1">
            <span className="block text-sm font-medium text-gray-700">Y Position</span>
            <Input
              id="y-position"
              type="number"
              value={position.y}
              onChange={(e) => handlePositionChange('y', e.target.value)}
              placeholder="Y"
            />
          </div>
        </div>
        <div className="space-y-1">
          <span className="block text-sm font-medium text-gray-700">Font Size</span>
          <Input
            id="font-size"
            type="number"
            value={fontSize}
            onChange={(e) => handleFontSizeChange(e.target.value)}
            placeholder="Font size"
          />
        </div>
        <div className="space-y-1">
          <span className="block text-sm font-medium text-gray-700">Color</span>
          <Input
            id="color-picker"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <Button onClick={handleAddText}>Add Text</Button>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
