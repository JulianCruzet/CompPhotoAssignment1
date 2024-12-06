'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Loader2 } from 'lucide-react'

declare global {
  interface Window {
    cv: any;
  }
}

interface PanoramaCreatorProps {
  onImagesSelect: (files: File[]) => void;
  images: File[];
}

const PanoramaCreator: React.FC<PanoramaCreatorProps> = ({ onImagesSelect, images }) => {
  const [panorama, setPanorama] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpenCVLoaded, setIsOpenCVLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://docs.opencv.org/4.5.2/opencv.js'
    script.async = true
    script.onload = () => {
      console.log('OpenCV loaded')
      setIsOpenCVLoaded(true)
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length >= 2) {
      onImagesSelect(Array.from(event.target.files))
    } else {
      setError('Please select at least 2 images')
    }
  }

  const createPanorama = async () => {
    if (images.length < 2) {
      setError('Please select at least two images')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const imgElements = await Promise.all(
        images.map((file) => createImageElement(file))
      )

      if (!window.cv) {
        throw new Error('OpenCV is not loaded')
      }

      const mats = imgElements.map((img) => {
        const mat = window.cv.imread(img)
        window.cv.cvtColor(mat, mat, window.cv.COLOR_RGBA2RGB)
        return mat
      })

      const stitcher = new window.cv.Stitcher()
      const result = new window.cv.Mat()
      const status = stitcher.stitch(mats, result)

      if (status !== window.cv.Stitcher_OK) {
        throw new Error('Failed to stitch images')
      }

      const canvas = document.createElement('canvas')
      window.cv.imshow(canvas, result)
      setPanorama(canvas.toDataURL())

      // Clean up
      mats.forEach((mat) => mat.delete())
      result.delete()
      stitcher.delete()
    } catch (err) {
      console.error(err)
      setError('Failed to create panorama. Please try with different images.')
    } finally {
      setIsProcessing(false)
    }
  }

  const createImageElement = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length >= 2) {
      onImagesSelect(files)
    } else {
      setError('Please select at least 2 images')
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Panorama Creator</CardTitle>
        <CardDescription>Select multiple images to create a panorama</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop multiple images here, or click to select files
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Select at least 2 images to create a panorama
            </p>
          </div>

          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {images.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Selected image ${index + 1}`}
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                {images.length} {images.length === 1 ? 'image' : 'images'} selected
              </div>
            </div>
          )}

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {images.length >= 2 && (
            <Button
              onClick={createPanorama}
              disabled={isProcessing || !isOpenCVLoaded}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Panorama...
                </>
              ) : (
                'Create Panorama'
              )}
            </Button>
          )}

          {panorama && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Panorama Result:</h3>
              <div className="rounded-lg overflow-hidden">
                <img
                  src={panorama}
                  alt="Generated panorama"
                  className="w-full h-auto"
                />
              </div>
              <Button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = panorama
                  link.download = 'panorama.jpg'
                  link.click()
                }}
                className="w-full"
              >
                Download Panorama
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PanoramaCreator