'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button"
import { Upload } from 'lucide-react'
import { createPanorama } from './panorama-utils'

interface PanoramaProps {
  onPanoramaCreated: (imageData: ImageData) => void;
}

export default function Panorama({ onPanoramaCreated }: PanoramaProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isPanoramaProcessing, setIsPanoramaProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: true
  });

  const processPanorama = useCallback(async () => {
    if (uploadedFiles.length < 2) {
      alert("Please upload at least 2 images for panorama mode.")
      return
    }

    setIsPanoramaProcessing(true)

    try {
      const imageDataArray = await Promise.all(
        uploadedFiles.map((file) => {
          return new Promise<ImageData>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              const img = new Image()
              img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                if (ctx) {
                  ctx.drawImage(img, 0, 0)
                  resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
                } else {
                  reject(new Error('Failed to get canvas context'))
                }
              }
              img.onerror = () => reject(new Error('Failed to load image'))
              img.src = e.target?.result as string
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsDataURL(file)
          })
        })
      )

      console.log(`Processing ${imageDataArray.length} images for panorama`)

      const result = await createPanorama(imageDataArray)
      onPanoramaCreated(result)
      setUploadedFiles([])
    } catch (error) {
      console.error('Error creating panorama:', error)
      alert(`Failed to create panorama: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again with different images.`)
    } finally {
      setIsPanoramaProcessing(false)
    }
  }, [uploadedFiles, onPanoramaCreated])

  return (
    <div className="w-full space-y-4">
      {isPanoramaProcessing ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Processing panorama...</p>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? "Drop the images here ..."
                : "Drag and drop multiple images here, or click to select images"
              }
            </p>
          </div>
        </div>
      )}
      {uploadedFiles.length > 0 && !isPanoramaProcessing && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Uploaded Images:</h3>
          <ul className="list-disc pl-5">
            {uploadedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
          {uploadedFiles.length > 1 && (
            <Button onClick={processPanorama} className="mt-4">
              Create Panorama
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

