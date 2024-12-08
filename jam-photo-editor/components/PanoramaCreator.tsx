'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Loader2, AlertCircle, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

declare global {
  interface Window {
    cv: any;
  }
}

interface PanoramaCreatorProps {
  images: File[];
  onImagesSelect: (files: File[]) => void;
  onCreatePanorama?: (panoramaImage: string) => void;
  currentImage?: string | null;
}

const PanoramaCreator: React.FC<PanoramaCreatorProps> = ({ 
  images, 
  onImagesSelect, 
  onCreatePanorama,
  currentImage 
}) => {
  const [panorama, setPanorama] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpenCVLoaded, setIsOpenCVLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.cv) {
      const script = document.createElement('script')
      script.src = 'https://docs.opencv.org/4.5.2/opencv.js'
      script.async = true
      script.onload = () => setIsOpenCVLoaded(true)
      document.body.appendChild(script)
      return () => {
        document.body.removeChild(script)
      }
    } else {
      setIsOpenCVLoaded(true)
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      const newFiles = Array.from(fileList)
      onImagesSelect(newFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFiles = Array.from(e.dataTransfer.files)
    onImagesSelect(droppedFiles)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesSelect(newImages)
  }

  const createPanorama = async () => {
    if (images.length < 2) {
      setError('Please select at least 2 images to create a panorama')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Load images
      const imgElements = await Promise.all(
        images.map((file) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = URL.createObjectURL(file)
          })
        })
      )

      // Convert to OpenCV format
      const mats = imgElements.map((img) => {
        const mat = window.cv.imread(img)
        window.cv.cvtColor(mat, mat, window.cv.COLOR_RGBA2RGB)
        return mat
      })

      // Create stitcher and result matrix
      const stitcher = new window.cv.Stitcher()
      const result = new window.cv.Mat()

      // Perform stitching
      const status = stitcher.stitch(mats, result)

      if (status !== window.cv.Stitcher_OK) {
        throw new Error('Failed to create panorama. Please ensure images have enough overlap.')
      }

      // Convert result to image
      const canvas = document.createElement('canvas')
      window.cv.imshow(canvas, result)
      const panoramaImage = canvas.toDataURL()
      setPanorama(panoramaImage)

      // Call the onCreatePanorama callback if provided
      if (onCreatePanorama) {
        onCreatePanorama(panoramaImage)
      }

      // Cleanup
      mats.forEach(mat => mat.delete())
      result.delete()
      stitcher.delete()

    } catch (err) {
      console.error('Panorama creation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create panorama')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Panorama Creator</CardTitle>
        <CardDescription>
          Select multiple overlapping images to create a panorama. The images should have common features and be taken from the same position.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            onClick={(e) => e.stopPropagation()}
          />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop multiple images here, or click to select files
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Select at least 2 overlapping images to create a panorama
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
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {images.length} {images.length === 1 ? 'image' : 'images'} selected
              </p>
            </div>

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
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {panorama && !onCreatePanorama && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Panorama Result</h3>
            <div className="rounded-lg overflow-hidden border">
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
      </CardContent>
    </Card>
  )
}

export default PanoramaCreator