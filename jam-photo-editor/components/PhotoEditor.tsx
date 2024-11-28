'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import Histogram from './Histogram'
import Filters from './Filters'
import Adjustments from './Adjustments'
import ResizeImage from './ResizeImage'
import SaveLoad from './SaveLoad'
import PaintedLook from './PaintedLook'
import TextOverlay from './TextOverlay'
import DrawingTools from './DrawingTools'
import { Button } from "@/components/ui/button"
import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Type, Pencil } from 'lucide-react'

const Dropdown = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border rounded-md mb-2">
      <button
        className="w-full p-2 text-left font-semibold bg-gray-100 hover:bg-gray-200 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title} {isOpen ? '▲' : '▼'}
      </button>
      {isOpen && <div className="p-2">{children}</div>}
    </div>
  )
}

export default function PhotoEditor() {
  const [image, setImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null)
  const [showHistogram, setShowHistogram] = useState(false)
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [filters, setFilters] = useState({
    grayscale: false,
    sepia: false,
    averagingFilter: 0,
    gaussianFilter: 0
  })
  const [adjustments, setAdjustments] = useState({
    saturation: 100,
    contrast: 100,
    temperature: 100
  })
  const [paintedLook, setPaintedLook] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [flip, setFlip] = useState({ horizontal: false, vertical: false })
  const [showTextOverlay, setShowTextOverlay] = useState(false)
  const [showDrawingTools, setShowDrawingTools] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      setImage(e.target?.result as string)
    }

    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    }
  })

  useEffect(() => {
    if (image) {
      const img = new window.Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (canvas) {
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            setImageData(newImageData)
            setOriginalImageData(newImageData)
            setEditedImage(canvas.toDataURL())
          }
        }
      }
      img.src = image
    }
  }, [image])

  const applyChanges = useCallback((newImageData: ImageData) => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = newImageData.width
      canvas.height = newImageData.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.putImageData(newImageData, 0, 0)
        setImageData(newImageData)
        setEditedImage(canvas.toDataURL())
      }
    }
  }, [])

  const rotateImage = useCallback((direction: 'cw' | 'ccw') => {
    if (!imageData) return
    const canvas = document.createElement('canvas')
    canvas.width = imageData.height
    canvas.height = imageData.width
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(direction === 'cw' ? Math.PI / 2 : -Math.PI / 2)
      ctx.drawImage(canvasRef.current!, -imageData.width / 2, -imageData.height / 2)
      const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      applyChanges(newImageData)
      setRotation((prev) => (prev + (direction === 'cw' ? 90 : -90)) % 360)
    }
  }, [imageData, applyChanges])

  const flipImage = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!imageData) return
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      if (direction === 'horizontal') {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      } else {
        ctx.translate(0, canvas.height)
        ctx.scale(1, -1)
      }
      ctx.drawImage(canvasRef.current!, 0, 0)
      const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      applyChanges(newImageData)
      setFlip((prev) => ({ ...prev, [direction]: !prev[direction] }))
    }
  }, [imageData, applyChanges])

  const resetImage = useCallback(() => {
    if (originalImageData) {
      setImageData(originalImageData)
      applyChanges(originalImageData)
      setFilters({
        grayscale: false,
        sepia: false,
        averagingFilter: 0,
        gaussianFilter: 0
      })
      setAdjustments({
        saturation: 100,
        contrast: 100,
        temperature: 100
      })
      setPaintedLook(0)
      setRotation(0)
      setFlip({ horizontal: false, vertical: false })
    }
  }, [originalImageData, applyChanges])

  const handleSave = useCallback(() => {
    if (editedImage) {
      const link = document.createElement('a')
      link.href = editedImage
      link.download = 'edited_image.png'
      link.click()
    }
  }, [editedImage])

  return (
    <div className="flex flex-col h-screen">
      <nav className="bg-primary text-primary-foreground p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">JAM PHOTO EDITOR</h1>
      </nav>
      <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
        <div className="w-full md:w-2/3 p-4 flex flex-col overflow-auto">
          {!editedImage ? (
            <div 
              {...getRootProps()} 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 text-center cursor-pointer flex-grow flex items-center justify-center"
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the image here ...</p>
              ) : (
                <p>Drag 'n' drop an image here, or click to select an image</p>
              )}
            </div>
          ) : (
            <div className="flex-grow relative">
              <Image 
                src={editedImage} 
                alt="Edited image" 
                layout="fill"
                objectFit="contain"
                style={{
                  transform: `rotate(${rotation}deg) scale(${flip.horizontal ? -1 : 1}, ${flip.vertical ? -1 : 1})`,
                }}
              />
              {showTextOverlay && (
                <TextOverlay
                  applyChanges={applyChanges}
                  imageData={imageData}
                  onClose={() => setShowTextOverlay(false)}
                />
              )}
              {showDrawingTools && (
                <DrawingTools
                  applyChanges={applyChanges}
                  imageData={imageData}
                  onClose={() => setShowDrawingTools(false)}
                />
              )}
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
        <div className="w-full md:w-1/3 p-4 overflow-y-auto bg-secondary">
          {editedImage && (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Button onClick={() => rotateImage('ccw')}><RotateCcw className="w-4 h-4 mr-2" />Rotate CCW</Button>
                <Button onClick={() => rotateImage('cw')}><RotateCw className="w-4 h-4 mr-2" />Rotate CW</Button>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => flipImage('horizontal')}><FlipHorizontal className="w-4 h-4 mr-2" />Flip H</Button>
                <Button onClick={() => flipImage('vertical')}><FlipVertical className="w-4 h-4 mr-2" />Flip V</Button>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setShowTextOverlay(!showTextOverlay)}>
                  <Type className="w-4 h-4 mr-2" />
                  {showTextOverlay ? 'Hide Text Overlay' : 'Show Text Overlay'}
                </Button>
                <Button onClick={() => setShowDrawingTools(!showDrawingTools)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  {showDrawingTools ? 'Hide Drawing Tools' : 'Show Drawing Tools'}
                </Button>
              </div>
              <Dropdown title="Image Controls">
                <div className="space-y-4">
                  <Button className="w-full" onClick={() => setShowHistogram(!showHistogram)}>
                    {showHistogram ? 'Hide Histogram' : 'Show Histogram'}
                  </Button>
                  <Button className="w-full" onClick={resetImage}>Reset Image</Button>
                  <Button className="w-full" onClick={handleSave}>Save Image</Button>
                </div>
                {showHistogram && imageData && <Histogram imageData={imageData} />}
              </Dropdown>
              
              <Dropdown title="Filters">
                <Filters imageData={imageData} applyChanges={applyChanges} filters={filters} setFilters={setFilters}/>
              </Dropdown>
              
              <Dropdown title="Adjustments">
                <Adjustments 
                  imageData={imageData}
                  applyChanges={applyChanges}
                  adjustments={adjustments} 
                  setAdjustments={setAdjustments}
                />
              </Dropdown>
              
              <Dropdown title="Painted Look">
                <PaintedLook 
                  imageData={originalImageData} 
                  applyChanges={applyChanges} 
                  paintedLook={paintedLook} 
                  setPaintedLook={setPaintedLook}
                />
              </Dropdown>
              
              <Dropdown title="Resize Image">
                <ResizeImage imageData={imageData} applyChanges={applyChanges} />
              </Dropdown>
              
              <Dropdown title="Save/Load Settings">
                <SaveLoad 
                  imageData={imageData}
                  applyChanges={applyChanges}
                  filters={filters}
                  adjustments={adjustments}
                  paintedLook={paintedLook}
                  setFilters={setFilters}
                  setAdjustments={setAdjustments}
                  setPaintedLook={setPaintedLook}
                />
              </Dropdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}