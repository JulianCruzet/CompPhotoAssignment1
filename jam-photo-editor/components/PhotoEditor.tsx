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
    <div className="border rounded-md mb-2 overflow-hidden">
      <button
        className="w-full p-3 text-left font-semibold bg-gray-100 hover:bg-gray-200 transition-colors flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span className="text-gray-500">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && <div className="p-3 bg-white">{children}</div>}
    </div>
  )
}

interface Transform {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export default function PhotoEditor() {
  const [image, setImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null)
  const [showHistogram, setShowHistogram] = useState(false)
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transformCanvasRef = useRef<HTMLCanvasElement>(null)
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
  const [transform, setTransform] = useState<Transform>({ rotation: 0, flipHorizontal: false, flipVertical: false })
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

  const applyTransform = useCallback((imageData: ImageData, transform: Transform) => {
    const { rotation, flipHorizontal, flipVertical } = transform
    const sourceCanvas = canvasRef.current
    const targetCanvas = transformCanvasRef.current
    if (!sourceCanvas || !targetCanvas) return null

    const ctx = targetCanvas.getContext('2d')
    if (!ctx) return null

    const { width, height } = imageData
    const isRotated90or270 = rotation % 180 !== 0
    targetCanvas.width = isRotated90or270 ? height : width
    targetCanvas.height = isRotated90or270 ? width : height

    ctx.save()
    ctx.translate(targetCanvas.width / 2, targetCanvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1)
    ctx.drawImage(sourceCanvas, -width / 2, -height / 2, width, height)
    ctx.restore()

    return ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height)
  }, [])

  const applyChanges = useCallback((newImageData: ImageData) => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = newImageData.width
      canvas.height = newImageData.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.putImageData(newImageData, 0, 0)
        setImageData(newImageData)
        const transformedImageData = applyTransform(newImageData, transform)
        if (transformedImageData) {
          setEditedImage(transformCanvasRef.current!.toDataURL())
        }
      }
    }
  }, [transform, applyTransform])

  const rotateImage = useCallback((direction: 'cw' | 'ccw') => {
    setTransform(prev => ({
      ...prev,
      rotation: (prev.rotation + (direction === 'cw' ? 90 : -90) + 360) % 360
    }))
  }, [])

  const flipImage = useCallback((direction: 'horizontal' | 'vertical') => {
    setTransform(prev => ({
      ...prev,
      [direction === 'horizontal' ? 'flipHorizontal' : 'flipVertical']: !prev[direction === 'horizontal' ? 'flipHorizontal' : 'flipVertical']
    }))
  }, [])

  useEffect(() => {
    if (imageData) {
      const transformedImageData = applyTransform(imageData, transform)
      if (transformedImageData) {
        setEditedImage(transformCanvasRef.current!.toDataURL())
      }
    }
  }, [imageData, transform, applyTransform])

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
      setTransform({ rotation: 0, flipHorizontal: false, flipVertical: false })
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
    <div className="flex flex-col h-screen bg-gray-100">
      <nav className="bg-primary text-primary-foreground p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">JAM PHOTO EDITOR</h1>
      </nav>
      <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
        <div className="w-full md:w-2/3 p-6 flex flex-col overflow-auto">
          {!editedImage ? (
            <div 
              {...getRootProps()} 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center cursor-pointer flex-grow flex items-center justify-center bg-white shadow-sm hover:border-primary transition-colors"
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-lg text-gray-600">Drop the image here ...</p>
              ) : (
                <p className="text-lg text-gray-600">Drag 'n' drop an image here, or click to select an image</p>
              )}
            </div>
          ) : (
            <div className="flex-grow relative bg-white rounded-lg shadow-md overflow-hidden">
              <Image 
                src={editedImage} 
                alt="Edited image" 
                layout="fill"
                objectFit="contain"
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
          <canvas ref={transformCanvasRef} style={{ display: 'none' }} />
        </div>
        <div className="w-full md:w-1/3 p-6 overflow-y-auto bg-white shadow-md">
          {editedImage && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => rotateImage('ccw')} className="w-full"><RotateCcw className="w-4 h-4 mr-2" />Rotate CCW</Button>
                <Button onClick={() => rotateImage('cw')} className="w-full"><RotateCw className="w-4 h-4 mr-2" />Rotate CW</Button>
                <Button onClick={() => flipImage('horizontal')} className="w-full"><FlipHorizontal className="w-4 h-4 mr-2" />Flip H</Button>
                <Button onClick={() => flipImage('vertical')} className="w-full"><FlipVertical className="w-4 h-4 mr-2" />Flip V</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setShowTextOverlay(!showTextOverlay)} className="w-full">
                  <Type className="w-4 h-4 mr-2" />
                  {showTextOverlay ? 'Hide Text' : 'Add Text'}
                </Button>
                <Button onClick={() => setShowDrawingTools(!showDrawingTools)} className="w-full">
                  <Pencil className="w-4 h-4 mr-2" />
                  {showDrawingTools ? 'Hide Draw' : 'Draw'}
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