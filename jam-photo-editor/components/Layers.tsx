import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Eye, EyeOff, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react'
import React from "react"

export interface Layer {
  id: string
  name: string
  visible: boolean
  opacity: number
  data: ImageData
  preview: string
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

export function Layers({
  layers,
  selectedLayer,
  onLayerSelect,
  onLayerVisibilityToggle,
  onLayerOpacityChange,
  onLayerDelete,
  onLayerAdd,
  onLayerMove
}: LayersProps) {
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