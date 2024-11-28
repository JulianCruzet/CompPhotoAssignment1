
import React, { useState, useRef, useEffect } from 'react'
import { Input } from "@/components/ui/input"

interface DrawingToolsProps {
  applyChanges: (newImageData: ImageData) => void
  imageData: ImageData | null
  onClose: () => void
}

export default function DrawingTools({ applyChanges, imageData, onClose }: DrawingToolsProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    if (imageData && canvasRef.current) {
      const canvas = canvasRef.current
      canvas.width = imageData.width
      canvas.height = imageData.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.putImageData(imageData, 0, 0)
        ctx.lineCap = 'round'
        ctx.strokeStyle = color
        ctx.lineWidth = brushSize
        contextRef.current = ctx
      }
    }
  }, [imageData, color, brushSize])

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent
    contextRef.current?.beginPath()
    contextRef.current?.moveTo(offsetX, offsetY)
    setIsDrawing(true)
  }

  const finishDrawing = () => {
    contextRef.current?.closePath()
    setIsDrawing(false)
    if (canvasRef.current) {
      const newImageData = contextRef.current?.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
      if (newImageData) {
        applyChanges(newImageData)
      }
    }
  }

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return
    }
    const { offsetX, offsetY } = nativeEvent
    contextRef.current?.lineTo(offsetX, offsetY)
    contextRef.current?.stroke()
  }

  return (
    <div className="absolute top-0 left-0 bg-white p-4 rounded shadow-md">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        aria-label="Close drawing tools"
      >
        ✕
      </button>
      <Input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="mb-2"
      />
      <Input
        type="number"
        value={brushSize}
        onChange={(e) => setBrushSize(parseInt(e.target.value))}
        placeholder="Brush size"
        className="mb-2"
      />
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        style={{ border: '1px solid black' }}
      />
    </div>
  )
}