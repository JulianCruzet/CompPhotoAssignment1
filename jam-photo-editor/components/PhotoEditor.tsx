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
import { Button } from "@/components/ui/button"

// MOHSINNN QURESHHIIII
// ALIIII SHAMBOOOOOOO

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

  const applyChanges = (newImageData: ImageData) => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.putImageData(newImageData, 0, 0)
        setImageData(newImageData)
        setEditedImage(canvas.toDataURL())
      }
    }
  }

  const resetImage = () => {
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
    }
  }

  const handleSave = () => {
    if (editedImage) {
      const link = document.createElement('a')
      link.href = editedImage
      link.download = 'edited_image.png'
      link.click()
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Photo Editor</h1>
      <div 
        {...getRootProps()} 
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 text-center cursor-pointer"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the image here ...</p>
        ) : (
          <p>Drag 'n' drop an image here, or click to select an image</p>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {editedImage ? (
        <div className="mt-4">
          <div style={{ position: 'relative', width: '100%', height: '300px' }}>
            <Image 
              src={editedImage} 
              alt="Edited image" 
              layout="fill"
              objectFit="contain"
            />
          </div>
          <div className="mt-4 space-y-4">
            <Button onClick={() => setShowHistogram(!showHistogram)}>
              {showHistogram ? 'Hide Histogram' : 'Show Histogram'}
            </Button>
            <Button onClick={resetImage}>Reset Image</Button>
            {showHistogram && imageData && <Histogram imageData={imageData} />}
            <Filters imageData={imageData} applyChanges={applyChanges} filters={filters} setFilters={setFilters}/>
            <Adjustments imageData={imageData} applyChanges={applyChanges} adjustments={adjustments} setAdjustments={setAdjustments}/>
            <PaintedLook imageData={imageData} applyChanges={applyChanges} paintedLook={paintedLook} setPaintedLook={setPaintedLook}/>
            <ResizeImage imageData={imageData} applyChanges={applyChanges} />
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
            <Button onClick={handleSave}>Save Image</Button>
          </div>
        </div>
      ) : (
        <p>No image uploaded yet</p>
      )}
    </div>
  )
}