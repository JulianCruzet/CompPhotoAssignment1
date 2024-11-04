'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"

// MOHSINNN QURESHHIIII
// ALIIII SHAMBOOOOOOO

export default function PhotoEditor() {
  const [image, setImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [effect, setEffect] = useState('none')
  const [intensity, setIntensity] = useState(50)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      setImage(e.target?.result as string)
    }

    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

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
            <Button onClick={handleSave} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full transition-colors duration-300">
              Save Edited Image
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
