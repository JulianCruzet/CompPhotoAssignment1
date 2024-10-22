'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Photo Editor</h1>
      <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the image here ...</p>
        ) : (
          <p>Drag 'n' drop an image here, or click to select an image</p>
        )}
      </div>
      {image && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Original Image</h2>
            <img src={image} alt="Original" className="max-w-full h-auto" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Edited Image</h2>
            <canvas ref={canvasRef} className="hidden" />
            {editedImage && <img src={editedImage} alt="Edited" className="max-w-full h-auto" />}
            <div className="mt-4">
              <Select onValueChange={(value) => setEffect(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an effect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="grayscale">Grayscale</SelectItem>
                  <SelectItem value="sepia">Sepia</SelectItem>
                  <SelectItem value="invert">Invert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Intensity</label>
              <Slider
                value={[intensity]}
                onValueChange={(value) => setIntensity(value[0])}
                max={100}
                step={1}
              />
            </div>
            <Button onClick={handleSave} className="mt-4">Save Edited Image</Button>
          </div>
        </div>
      )}
    </div>
  )
}