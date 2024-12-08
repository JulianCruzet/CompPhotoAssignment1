'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MagicWandSelectorProps {
  image: string;
  onSelection: (selection: { mask: ImageData; original: ImageData }) => void;
}

const MagicWandSelector: React.FC<MagicWandSelectorProps> = ({ image, onSelection }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const [tolerance, setTolerance] = useState(32)
  const [edgeThreshold, setEdgeThreshold] = useState(30)
  const [selection, setSelection] = useState<{ mask: ImageData; original: ImageData } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const overlayCanvas = overlayCanvasRef.current
    const ctx = canvas?.getContext('2d')
    const overlayCtx = overlayCanvas?.getContext('2d')

    if (canvas && ctx && overlayCanvas && overlayCtx) {
      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        overlayCanvas.width = img.width
        overlayCanvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        // Initialize the overlay canvas with transparent pixels
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
      }
      img.src = image
    }
  }, [image])

  const detectEdges = (imageData: ImageData): ImageData => {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')!
    ctx.putImageData(imageData, 0, 0)

    const src = window.cv.imread(canvas)
    const edges = new window.cv.Mat()
    
    // Convert to grayscale
    window.cv.cvtColor(src, edges, window.cv.COLOR_RGBA2GRAY)
    
    // Apply Gaussian blur to reduce noise
    window.cv.GaussianBlur(edges, edges, new window.cv.Size(5, 5), 0)
    
    // Apply Canny edge detection
    window.cv.Canny(edges, edges, edgeThreshold, edgeThreshold * 2)
    
    // Dilate the edges to make them more prominent
    const kernel = window.cv.Mat.ones(3, 3, window.cv.CV_8U)
    window.cv.dilate(edges, edges, kernel)
    
    // Convert back to RGBA
    window.cv.cvtColor(edges, edges, window.cv.COLOR_GRAY2RGBA)
    
    // Clean up
    src.delete()
    kernel.delete()
    
    // Convert to ImageData and return
    window.cv.imshow(canvas, edges)
    edges.delete()
    
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  const magicWandSelect = (startX: number, startY: number) => {
    const canvas = canvasRef.current
    const overlayCanvas = overlayCanvasRef.current
    if (!canvas || !overlayCanvas) return

    const ctx = canvas.getContext('2d')!
    const overlayCtx = overlayCanvas.getContext('2d')!
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const edgeData = detectEdges(imageData)
    const data = imageData.data
    const edgePixels = edgeData.data
    const width = imageData.width
    const height = imageData.height

    // Create selection mask
    const mask = new Uint8ClampedArray(width * height * 4)
    const targetColor = getPixel(imageData, startX, startY)
    const stack: [number, number][] = [[startX, startY]]
    const visited = new Set<string>()

    while (stack.length > 0) {
      const [x, y] = stack.pop()!
      const key = `${x},${y}`
      
      if (visited.has(key)) continue
      visited.add(key)

      const pixelPos = (y * width + x) * 4
      const isEdge = edgePixels[pixelPos + 3] > 0 // Check alpha channel for edge
      
      if (!isEdge && colorMatch(getPixel(imageData, x, y), targetColor, tolerance)) {
        // Set selected pixel in mask
        mask[pixelPos] = 255
        mask[pixelPos + 1] = 0
        mask[pixelPos + 2] = 0
        mask[pixelPos + 3] = 128

        // Add neighboring pixels to stack
        if (x > 0) stack.push([x - 1, y])
        if (x < width - 1) stack.push([x + 1, y])
        if (y > 0) stack.push([x, y - 1])
        if (y < height - 1) stack.push([x, y + 1])
      }
    }

    // Create and display the selection overlay
    const selectionMask = new ImageData(mask, width, height)
    overlayCtx.putImageData(selectionMask, 0, 0)

    // Store both the mask and the original image data
    setSelection({
      mask: selectionMask,
      original: imageData
    })
  }

  const getPixel = (imageData: ImageData, x: number, y: number): number[] => {
    const index = (y * imageData.width + x) * 4
    return Array.from(imageData.data.slice(index, index + 4))
  }

  const colorMatch = (color1: number[], color2: number[], tolerance: number): boolean => {
    return Math.abs(color1[0] - color2[0]) <= tolerance &&
           Math.abs(color1[1] - color2[1]) <= tolerance &&
           Math.abs(color1[2] - color2[2]) <= tolerance
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSelecting) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))

    setIsSelecting(true)
    magicWandSelect(x, y)
    setIsSelecting(false)
  }

  const handleApplySelection = () => {
    if (selection) {
      onSelection(selection)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="settings">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tolerance">Color Tolerance</Label>
            <Slider
              id="tolerance"
              min={0}
              max={255}
              step={1}
              value={[tolerance]}
              onValueChange={(value) => setTolerance(value[0])}
            />
            <span className="text-sm text-gray-500">{tolerance}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edge-threshold">Edge Sensitivity</Label>
            <Slider
              id="edge-threshold"
              min={10}
              max={100}
              step={1}
              value={[edgeThreshold]}
              onValueChange={(value) => setEdgeThreshold(value[0])}
            />
            <span className="text-sm text-gray-500">{edgeThreshold}</span>
          </div>
        </TabsContent>
        <TabsContent value="help">
          <div className="space-y-2 text-sm text-gray-600">
            <p>Click on an area to select similar pixels.</p>
            <p>Adjust Color Tolerance to control how similar colors need to be to be selected.</p>
            <p>Adjust Edge Sensitivity to control how strictly the selection follows image edges.</p>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="border border-gray-300 rounded-lg cursor-crosshair w-full"
        />
        <canvas
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 pointer-events-none w-full h-full"
        />
      </div>

      <Button 
        onClick={handleApplySelection} 
        disabled={!selection || isSelecting}
        className="w-full"
      >
        Apply Selection
      </Button>
    </div>
  )
}

export default MagicWandSelector