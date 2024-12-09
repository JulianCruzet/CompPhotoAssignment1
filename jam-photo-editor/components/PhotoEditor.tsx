'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Type, Pencil, Edit3, Eraser, Wand2, LayersIcon, Eye, EyeOff, Trash2, Plus, ChevronUp, ChevronDown, Upload } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

// Assume these components are defined in separate files
import Histogram from './Histogram'
import Filters from './Filters'
import Adjustments from './Adjustments'
import ResizeImage from './ResizeImage'
import SaveLoad from './SaveLoad'
import PaintedLook from './PaintedLook'
import TextOverlay from './TextOverlay'
import DrawingTools from './DrawingTools'
import LocalizedEditing from './LocalizedEditing'
import ObjectRemoval from './ObjectRemoval'
import MagicWandSelector from './MagicWandSelector'
import { createPanorama } from './panorama-utils'

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  data: ImageData;
  preview: string;
}

interface Transform {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

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

interface LayersProps {
  layers: Layer[]
  selectedLayer: string | null
  onLayerSelect: (id: string) => void
  onLayerVisibilityToggle: (id: string) => void
  onLayerOpacityChange: (id: string, opacity: number) => void
  onLayerDelete: (id: string) => void
  onLayerAdd: () => void
  onLayerMove: (id: string, direction: 'up' | 'down') => void
}

const Layers: React.FC<LayersProps> = ({
  layers,
  selectedLayer,
  onLayerSelect,
  onLayerVisibilityToggle,
  onLayerOpacityChange,
  onLayerDelete,
  onLayerAdd,
  onLayerMove
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Layers</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onLayerAdd}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Layer
        </Button>
      </div>
      <div className="space-y-2">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`p-2 rounded-lg border ${
              selectedLayer === layer.id ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onClick={() => onLayerSelect(layer.id)}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLayerVisibilityToggle(layer.id)
                }}
                className="p-1 hover:bg-muted rounded"
              >
                {layer.visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <img
                    src={layer.preview}
                    alt={layer.name}
                    className="h-8 w-8 object-cover rounded"
                  />
                  <span className="text-sm font-medium truncate">
                    {layer.name}
                  </span>
                </div>
                <div className="mt-2">
                  <Slider
                    value={[layer.opacity]}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                    onValueChange={(value) => onLayerOpacityChange(layer.id, value[0])}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={index === 0}
                  onClick={(e) => {
                    e.stopPropagation()
                    onLayerMove(layer.id, 'up')
                  }}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={index === layers.length - 1}
                  onClick={(e) => {
                    e.stopPropagation()
                    onLayerMove(layer.id, 'down')
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onLayerDelete(layer.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PhotoEditor() {
  const [image, setImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null)
  const [showHistogram, setShowHistogram] = useState(false)
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transformCanvasRef = useRef<HTMLCanvasElement>(null)
  const [filters, setFilters] = useState({
    grayscale: false,
    sepia: false,
    averagingFilter: 0,
    gaussianFilter: 0,
    portraitMode: 0
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
  const [showObjectRemoval, setShowObjectRemoval] = useState(false);
  const [showMagicWand, setShowMagicWand] = useState(false);
  const [selectionMask, setSelectionMask] = useState<ImageData | null>(null);
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [isPanoramaMode, setIsPanoramaMode] = useState(false)
  const [panoramaImages, setPanoramaImages] = useState<ImageData[]>([])
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [isPanoramaProcessing, setIsPanoramaProcessing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const createLayer = useCallback((imageData: ImageData, name: string): Layer => {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.putImageData(imageData, 0, 0)
      const preview = canvas.toDataURL()
      
      return {
        id: uuidv4(),
        name,
        visible: true,
        opacity: 100,
        data: imageData,
        preview
      }
    }
    throw new Error('Failed to create layer')
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
    if (!isPanoramaMode && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [isPanoramaMode]);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: isPanoramaMode
  })

  useEffect(() => {
    if (image) {
      const img = new window.Image()
      img.onload = async () => {
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

            const bitmap = await createImageBitmap(img)
            setImageBitmap(bitmap)

            const initialLayer = createLayer(newImageData, 'Background')
            setLayers([initialLayer])
            setSelectedLayer(initialLayer.id)
          }
        }
      }
      img.src = image
    }
  }, [image, createLayer])

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
        if (selectionMask) {
          const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < newImageData.data.length; i += 4) {
            if (selectionMask.data[i + 3] > 0) {
              currentImageData.data[i] = newImageData.data[i];
              currentImageData.data[i + 1] = newImageData.data[i + 1];
              currentImageData.data[i + 2] = newImageData.data[i + 2];
              currentImageData.data[i + 3] = newImageData.data[i+ 3];
            }
          }
          ctx.putImageData(currentImageData, 0, 0);
        } else {
          ctx.putImageData(newImageData, 0, 0);
        }

        setImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
        const transformedImageData = applyTransform(ctx.getImageData(0, 0, canvas.width, canvas.height), transform)
        if (transformedImageData) {
          setEditedImage(transformCanvasRef.current!.toDataURL())
        }

        if (selectedLayer) {
          updateLayerImageData(selectedLayer, newImageData)
        }
      }
    }
  }, [transform, applyTransform, selectionMask, selectedLayer])

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
        gaussianFilter: 0,
        portraitMode: 0
      })
      setAdjustments({
        saturation: 100,
        contrast: 100,
        temperature: 100
      })
      setPaintedLook(0)
      setTransform({ rotation: 0, flipHorizontal: false, flipVertical: false })
      setSelectionMask(null)

      const initialLayer = createLayer(originalImageData, 'Background')
      setLayers([initialLayer])
      setSelectedLayer(initialLayer.id)
    }
  }, [originalImageData, applyChanges, createLayer])

  const handleSave = useCallback(() => {
    if (editedImage) {
      const link = document.createElement('a')
      link.href = editedImage
      link.download = 'edited_image.png'
      link.click()
    }
  }, [editedImage])

  const handleObjectRemoval = useCallback((processedImageData: ImageData) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = processedImageData.width;
      canvas.height = processedImageData.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(processedImageData, 0, 0);
        const newEditedImage = canvas.toDataURL();
        setEditedImage(newEditedImage);
        setImageData(processedImageData);

        const transformedImageData = applyTransform(processedImageData, transform);
        if (transformedImageData) {
          setEditedImage(transformCanvasRef.current!.toDataURL());
        }

        setEditedImage(prevImage => {
          if (prevImage) {
            return prevImage + '?' + new Date().getTime();
          }
          return null;
        });

        if (selectedLayer) {
          updateLayerImageData(selectedLayer, processedImageData)
        }
      }
    }
    setShowObjectRemoval(false);
  }, [applyTransform, transform, selectedLayer])

  const handleMagicWandSelection = useCallback((selection: { mask: ImageData; original: ImageData }) => {
    setSelectionMask(selection.mask);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(selection.original, 0, 0);

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'red';
        for (let y = 0; y < selection.mask.height; y++) {
          for (let x = 0; x < selection.mask.width; x++) {
            if (selection.mask.data[(y * selection.mask.width + x) * 4 + 3] > 0) {
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        ctx.globalAlpha = 1.0;

        setEditedImage(canvas.toDataURL());
        setImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));

        if (selectedLayer) {
          updateLayerImageData(selectedLayer, ctx.getImageData(0, 0, canvas.width, canvas.height))
        }
      }
    }
    setShowMagicWand(false);
  }, [selectedLayer])

  const clearSelection = useCallback(() => {
    setSelectionMask(null);
    if (imageData) {
      applyChanges(imageData);
    }
  }, [imageData, applyChanges])

  const updateLayerImageData = useCallback((layerId: string, newImageData: ImageData) => {
    setLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === layerId 
          ? { ...layer, data: newImageData, preview: createLayerPreview(newImageData) } 
          : layer
      )
    )
  }, [])

  const createLayerPreview = (imageData: ImageData): string => {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.putImageData(imageData, 0, 0)
      return canvas.toDataURL()
    }
    throw new Error('Failed to create layer preview')
  }

  const handleLayerVisibilityToggle = useCallback((id: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ))
  }, [])

  const handleLayerOpacityChange = useCallback((id: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, opacity } : layer
    ))
  }, [])

  const handleLayerDelete = useCallback((id: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== id))
    if (selectedLayer === id) {
      setSelectedLayer(null)
    }
  }, [selectedLayer])

  const handleLayerMove = useCallback((id: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const index = prev.findIndex(layer => layer.id === id)
      if (index === -1) return prev
      
      const newLayers = [...prev]
      const newIndex = direction === 'up' ? index - 1 : index + 1
      
      if (newIndex < 0 || newIndex >= newLayers.length) return prev
      
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]]
      return newLayers
    })
  }, [])

  const handleLayerAdd = useCallback(() => {
    if (imageData) {
      const newLayer = createLayer(imageData, `Layer ${layers.length + 1}`)
      setLayers(prev => [newLayer, ...prev])
      setSelectedLayer(newLayer.id)
    }
  }, [imageData, layers.length, createLayer])

  const compositeLayers = useCallback(() => {
    if (!canvasRef.current || layers.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    layers.forEach(layer => {
      if (layer.visible && layer.opacity > 0) {
        ctx.globalAlpha = layer.opacity / 100
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = layer.data.width
        tempCanvas.height = layer.data.height
        const tempCtx = tempCanvas.getContext('2d')
        if (tempCtx) {
          tempCtx.putImageData(layer.data, 0, 0)
          ctx.drawImage(tempCanvas, 0, 0)
        }
      }
    })

    ctx.globalAlpha = 1
    setEditedImage(canvas.toDataURL())
    setImageData(ctx.getImageData(0, 0, canvas.width, canvas.height))
  }, [layers])

  useEffect(() => {
    compositeLayers()
  }, [layers, compositeLayers])

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
      setImageData(result)
      setOriginalImageData(result)
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = result.width
        canvas.height = result.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.putImageData(result, 0, 0)
          setEditedImage(canvas.toDataURL())

          // Create initial layer for the panorama
          const initialLayer = createLayer(result, 'Panorama')
          setLayers([initialLayer])
          setSelectedLayer(initialLayer.id)
        }
      }
      setUploadedImages([])
    } catch (error) {
      console.error('Error creating panorama:', error)
      alert(`Failed to create panorama: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again with different images.`)
    } finally {
      setIsPanoramaProcessing(false)
    }
  }, [uploadedFiles, createLayer])

  const switchMode = useCallback(() => {
    setIsPanoramaMode(prev => !prev);
    if (uploadedFiles.length > 0) {
      if (!isPanoramaMode) {
        // Switching to panorama mode
        setEditedImage(null);
        setImageData(null);
        setOriginalImageData(null);
        setPanoramaImages([]);
      } else {
        // Switching to normal mode
        const file = uploadedFiles[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          setImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setUploadedFiles([]);
      setEditedImage(null);
      setImageData(null);
      setOriginalImageData(null);
      setPanoramaImages([]);
    }
  }, [isPanoramaMode, uploadedFiles]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <nav className="bg-primary text-primary-foreground p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">JAM PHOTO EDITOR</h1>
      </nav>
      <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
        <div className="w-full md:w-2/3 p-6 flex flex-col overflow-auto">
          {!editedImage ? (
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-medium">
                  {isPanoramaMode ? 'Panorama Mode' : 'Normal Mode'}
                </span>
                <Button onClick={switchMode} variant="outline">
                  Switch to {isPanoramaMode ? 'Normal' : 'Panorama'} Mode
                </Button>
              </div>
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
                        ? `Drop the image${isPanoramaMode ? 's' : ''} here ...`
                        : `Drag and drop ${isPanoramaMode ? 'multiple images' : 'an image'} here, or click to select ${isPanoramaMode ? 'images' : 'an image'}`
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
                  {isPanoramaMode && uploadedFiles.length > 1 && (
                    <Button onClick={processPanorama} className="mt-4">
                      Create Panorama
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-grow relative bg-white rounded-lg shadow-md overflow-hidden">
              {editedImage && (
                <img 
                  src={editedImage} 
                  alt="Edited image" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  className={localEditState.hideImage ? 'hidden' : ''}
                />
              )}
              {localEditState.show && imageBitmap && (
                <div className="absolute inset-0 z-10 bg-white">
                  <button
                    className="absolute top-2 right-2 z-20 p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                    onClick={() => setLocalEditState({ show: false, hideImage: false })}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <LocalizedEditing
                    image={imageBitmap}
                    onEdit={applyChanges}
                  />
                </div>
              )}
              {showTextOverlay && (
                <div className="absolute inset-0 z-10">
                  <TextOverlay
                    applyChanges={applyChanges}
                    imageData={imageData}
                    onClose={() => setShowTextOverlay(false)}
                  />
                </div>
              )}
              {showDrawingTools && (
                <div className="absolute inset-0 z-10">
                  <DrawingTools
                    applyChanges={applyChanges}
                    imageData={imageData}
                    onClose={() => setShowDrawingTools(false)}
                  />
                </div>
              )}
              {showMagicWand && editedImage && (
                <div className="absolute inset-0 z-10 bg-transparent">
                  <MagicWandSelector
                    image={editedImage}
                    onSelection={handleMagicWandSelection}
                  />
                  <Button onClick={() => setShowMagicWand(false)} className="absolute top-4 right-4">
                    Close Magic Wand
                  </Button>
                </div>
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
              <div className="flex justify-between items-center w-full mt-4 mb-2">
                <span className="text-base font-medium">
                  {isPanoramaMode ? 'Panorama Mode' : 'Normal Mode'}
                </span>
                <Button onClick={switchMode} variant="outline">
                  Switch to {isPanoramaMode ? 'Normal' : 'Panorama'} Mode
                </Button>
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
                <Button onClick={() => setShowObjectRemoval(!showObjectRemoval)} className="w-full">
                  <Eraser className="w-4 h-4 mr-2" />
                  {showObjectRemoval ? 'Hide Removal' : 'Remove Object'}
                </Button>
                <Button onClick={() => setShowMagicWand(!showMagicWand)} className="w-full">
                  <Wand2 className="w-4 h-4 mr-2" />
                  {showMagicWand ? 'Hide Magic Wand' : 'Magic Wand'}
                </Button>
                <Button onClick={clearSelection} className="w-full">
                  Clear Selection
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
                <Filters 
                  imageData={imageData} 
                  applyChanges={applyChanges} 
                  filters={filters}
                  setFilters={setFilters}
                />
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

              <Dropdown title="Layers">
                <Layers
                  layers={layers}
                  selectedLayer={selectedLayer}
                  onLayerSelect={setSelectedLayer}
                  onLayerVisibilityToggle={handleLayerVisibilityToggle}
                  onLayerOpacityChange={handleLayerOpacityChange}
                  onLayerDelete={handleLayerDelete}
                  onLayerAdd={handleLayerAdd}
                  onLayerMove={handleLayerMove}
                />
              </Dropdown>
            </div>
          )}
        </div>
      </div>
      {showObjectRemoval && editedImage && (
        <ObjectRemoval
          image={editedImage}
          onProcessed={handleObjectRemoval}
          onClose={() => setShowObjectRemoval(false)}
        />
      )}
    </div>
  )
}

