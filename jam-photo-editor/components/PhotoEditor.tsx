'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
<<<<<<< Updated upstream
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
=======
import Image from 'next/image'
import Histogram from './Histogram'
import Filters from './Filters'
import Adjustments from './Adjustments'
import ResizeImage from './ResizeImage'
import SaveLoad from './SaveLoad'
import PaintedLook from './PaintedLook'
import TextOverlay from './TextOverlay'
import DrawingTools from './DrawingTools'
import LocalizedEditing from './LocalizedEditing'
import PanoramaCreator from './PanoramaCreator'
import { Button } from "@/components/ui/button"
import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Type, Pencil, Edit3, ImageIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

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
>>>>>>> Stashed changes

export default function PhotoEditor() {
  const [image, setImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [effect, setEffect] = useState('none')
  const [intensity, setIntensity] = useState(50)
  const canvasRef = useRef<HTMLCanvasElement>(null)
<<<<<<< Updated upstream
=======
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
  const [localEditState, setLocalEditState] = useState({ show: false, hideImage: false });
  const [showPanoramaCreator, setShowPanoramaCreator] = useState(false)
  const [panoramaImages, setPanoramaImages] = useState<File[]>([])
>>>>>>> Stashed changes

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      setImage(e.target?.result as string)
    }

    reader.readAsDataURL(file)
  }, [])

<<<<<<< Updated upstream
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
=======
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: false
  })
>>>>>>> Stashed changes

  useEffect(() => {
    if (image) {
      applyEffect()
    }
  }, [image, effect, intensity])

  const applyEffect = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    if (!canvas || !ctx || !image) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      switch (effect) {
        case 'grayscale':
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
            data[i] = data[i + 1] = data[i + 2] = avg
          }
          break
        case 'sepia':
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
          }
          break
        case 'invert':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i]
            data[i + 1] = 255 - data[i + 1]
            data[i + 2] = 255 - data[i + 2]
          }
          break
      }

      ctx.putImageData(imageData, 0, 0)
      setEditedImage(canvas.toDataURL())
    }
    img.src = image
  }

  const handleSave = () => {
    if (editedImage) {
      const link = document.createElement('a')
      link.href = editedImage
      link.download = 'edited_image.png'
      link.click()
    }
  }

  const handlePanoramaImagesUpload = (files: File[]) => {
    setPanoramaImages(files)
  }

  return (
    <div className="min-h-screen min-w-full w-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col p-4">
      <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">Photo Editor</h1>
      <div className="flex-grow flex flex-col md:flex-row gap-4">
        <motion.div 
          className="flex-1 bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-4 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Original Image</h2>
          {image ? (
            <img src={image} alt="Original" className="w-full h-full object-contain rounded-lg" />
          ) : (
            <div 
              {...getRootProps()} 
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer transition-all hover:border-blue-500 flex-grow flex items-center justify-center"
            >
              <input {...getInputProps()} />
              <p className="text-lg text-gray-600">
                {isDragActive ? "Drop the image here ..." : "Drag and drop an image here, or click to select"}
              </p>
            </div>
          )}
        </motion.div>
        
        <motion.div 
          className="flex-1 bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-4 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Edited Image</h2>
          <canvas ref={canvasRef} className="hidden" />
          {editedImage ? (
            <img src={editedImage} alt="Edited" className="w-full h-full object-contain rounded-lg mb-4" />
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">
              No image edited yet
            </div>
          )}
          <div className="space-y-4 mt-auto">
            <Select onValueChange={(value) => setEffect(value)}>
              <SelectTrigger className="w-full bg-white border-gray-300">
                <SelectValue placeholder="Select an effect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="grayscale">Grayscale</SelectItem>
                <SelectItem value="sepia">Sepia</SelectItem>
                <SelectItem value="invert">Invert</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Intensity</label>
              <Slider
                value={[intensity]}
                onValueChange={(value) => setIntensity(value[0])}
                max={100}
                step={1}
                className="bg-gray-200"
              />
            </div>
<<<<<<< Updated upstream
            <Button onClick={handleSave} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full transition-colors duration-300">
              Save Edited Image
            </Button>
          </div>
        </motion.div>
=======
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
              <div className="grid grid-cols-3 gap-4">
                <Button onClick={() => setShowTextOverlay(!showTextOverlay)} className="w-full">
                  <Type className="w-4 h-4 mr-2" />
                  {showTextOverlay ? 'Hide Text' : 'Add Text'}
                </Button>
                <Button onClick={() => setShowDrawingTools(!showDrawingTools)} className="w-full">
                  <Pencil className="w-4 h-4 mr-2" />
                  {showDrawingTools ? 'Hide Draw' : 'Draw'}
                </Button>
                <Button onClick={() => setLocalEditState({ show: !localEditState.show, hideImage: !localEditState.show })} className="w-full">
                  <Edit3 className="w-4 h-4 mr-2" />
                  {localEditState.show ? 'Hide Edit' : 'Local Edit'}
                </Button>
              </div>
              <Button 
                onClick={() => setShowPanoramaCreator(!showPanoramaCreator)} 
                className="w-full"
                variant={showPanoramaCreator ? "secondary" : "default"}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {showPanoramaCreator ? 'Hide Panorama' : 'Create Panorama'}
              </Button>
              {showPanoramaCreator && (
                <PanoramaCreator
                  images={panoramaImages}
                  onImagesSelect={handlePanoramaImagesUpload}
                />
              )}
              <Dropdown title="Image Controls">
                <div className="space-y-4">
                  <Button className="w-full" onClick={() => setShowHistogram(!showHistogram)}>
                    {showHistogram ? 'Hide Histogram' : 'Show Histogram'}
                  </Button>
                  <Button className="w-full" onClick={resetImage}>Reset Image</Button>
                  <Button className="w-full" onClick={handleSave}>Save Image</Button>
                </div>
                {showHistogram && imageData && <Histogram
 imageData={imageData} />}
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
>>>>>>> Stashed changes
      </div>
    </div>
  )
}
