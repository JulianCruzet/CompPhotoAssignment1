'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Eraser, Undo, Redo } from 'lucide-react'

interface ObjectRemovalProps {
  image: string
  onProcessed: (processedImageData: ImageData) => void
  onClose: () => void
}

export default function ObjectRemoval({ image, onProcessed, onClose }: ObjectRemovalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(20)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scale, setScale] = useState(1)
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 })
  const [undoStack, setUndoStack] = useState<ImageData[]>([])
  const [redoStack, setRedoStack] = useState<ImageData[]>([])
  const maskCtx = useRef<CanvasRenderingContext2D | null>(null);
  const lastPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas?.getContext('2d')
    if (maskCanvasRef.current) {
      maskCtx.current = maskCanvasRef.current.getContext('2d');
    }

    if (canvas && ctx && container && maskCanvasRef.current) {
      const img = new Image()
      img.onload = () => {
        setOriginalSize({ width: img.width, height: img.height })
        
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight
        const imageAspectRatio = img.width / img.height
        const containerAspectRatio = containerWidth / containerHeight

        let newWidth, newHeight
        if (imageAspectRatio > containerAspectRatio) {
          newWidth = containerWidth
          newHeight = containerWidth / imageAspectRatio
        } else {
          newHeight = containerHeight
          newWidth = containerHeight * imageAspectRatio
        }

        const newScale = newWidth / img.width
        setScale(newScale)

        canvas.width = img.width
        canvas.height = img.height
        maskCanvasRef.current.width = img.width
        maskCanvasRef.current.height = img.height
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, img.width, img.height)

        canvas.style.width = `${newWidth}px`
        canvas.style.height = `${newHeight}px`
        maskCanvasRef.current.style.width = `${newWidth}px`
        maskCanvasRef.current.style.height = `${newHeight}px`

        // Initialize undo stack with empty mask
        const emptyMask = maskCtx.current?.getImageData(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height)
        if (emptyMask) {
          setUndoStack([emptyMask])
        }
      }
      img.src = image
    }
  }, [image])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const rect = maskCanvasRef.current!.getBoundingClientRect()
    lastPos.current = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    }
    drawMask(lastPos.current.x, lastPos.current.y)
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      // Save current state to undo stack
      const currentMask = maskCtx.current?.getImageData(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height)
      if (currentMask) {
        setUndoStack(prev => [...prev, currentMask])
        setRedoStack([])
      }
    }
  }

  const drawMask = (x: number, y: number) => {
    if (isDrawing && maskCtx.current) {
      maskCtx.current.beginPath()
      maskCtx.current.moveTo(lastPos.current.x, lastPos.current.y)
      maskCtx.current.lineTo(x, y)
      maskCtx.current.strokeStyle = 'rgba(255, 0, 0, 0.5)'
      maskCtx.current.lineWidth = brushSize
      maskCtx.current.lineCap = 'round'
      maskCtx.current.stroke()

      lastPos.current = { x, y }
    }
  }

  const handleRemoveObject = () => {
    setIsProcessing(true)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const maskData = maskCtx.current?.getImageData(0, 0, canvas!.width, canvas!.height)
    if (canvas && ctx && maskData) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      const radius = Math.max(20, brushSize)

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4
          if (maskData.data[i + 3] > 0) {
            let rSum = 0, gSum = 0, bSum = 0, count = 0

            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx
                const ny = y + dy
                if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                  const j = (ny * canvas.width + nx) * 4
                  if (maskData.data[j + 3] === 0) {
                    rSum += imageData.data[j]
                    gSum += imageData.data[j + 1]
                    bSum += imageData.data[j + 2]
                    count++
                  }
                }
              }
            }

            if (count > 0) {
              imageData.data[i] = rSum / count
              imageData.data[i + 1] = gSum / count
              imageData.data[i + 2] = bSum / count
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)
      onProcessed(imageData)
    }
    setIsProcessing(false)
    clearMask()
  }

  const clearMask = () => {
    if (maskCtx.current) {
      maskCtx.current.clearRect(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height)
      // Save cleared state to undo stack
      const clearedMask = maskCtx.current.getImageData(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height)
      setUndoStack(prev => [...prev, clearedMask])
      setRedoStack([])
    }
  }

  const undo = () => {
    if (undoStack.length > 1) {
      const currentState = undoStack[undoStack.length - 1]
      const previousState = undoStack[undoStack.length - 2]
      setUndoStack(prev => prev.slice(0, -1))
      setRedoStack(prev => [...prev, currentState])
      maskCtx.current?.putImageData(previousState, 0, 0)
    }
  }

  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1]
      setRedoStack(prev => prev.slice(0, -1))
      setUndoStack(prev => [...prev, nextState])
      maskCtx.current?.putImageData(nextState, 0, 0)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-[90vw] max-h-[90vh] w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Object Removal</h2>
          <Button variant="ghost" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <div className="flex items-center space-x-4 mb-4">
          <Label htmlFor="brush-size" className="w-24">Brush Size:</Label>
          <Slider
            id="brush-size"
            min={1}
            max={100}
            step={1}
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            className="flex-grow"
          />
          <span className="w-12 text-right">{brushSize}px</span>
        </div>
        <div ref={containerRef} className="relative flex-grow overflow-auto border border-gray-300 rounded-lg">
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0"
          />
          <canvas
            ref={maskCanvasRef}
            onMouseDown={startDrawing}
            onMouseMove={(e) => {
              const rect = maskCanvasRef.current!.getBoundingClientRect()
              const x = (e.clientX - rect.left) / scale
              const y = (e.clientY - rect.top) / scale
              drawMask(x, y)
            }}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="absolute top-0 left-0 cursor-crosshair"
          />
        </div>
        <div className="flex justify-between mt-4">
          <div className="space-x-2">
            <Button onClick={undo} disabled={undoStack.length <= 1}>
              <Undo className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button onClick={redo} disabled={redoStack.length === 0}>
              <Redo className="w-4 h-4 mr-2" />
              Redo
            </Button>
          </div>
          <div className="space-x-2">
            <Button onClick={clearMask} variant="outline">
              <Eraser className="w-4 h-4 mr-2" />
              Clear Selection
            </Button>
            <Button onClick={handleRemoveObject} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Remove Object"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}