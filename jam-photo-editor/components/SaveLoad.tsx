import React from 'react'
import { Button } from "@/components/ui/button"

interface SaveLoadProps {
  imageData: ImageData | null
  applyChanges: (newImageData: ImageData) => void
  filters: {
    grayscale: boolean
    sepia: boolean
    averagingFilter: number
    gaussianFilter: number
  }
  adjustments: {
    saturation: number
    contrast: number
    temperature: number
  }
  paintedLook: number
  setFilters: React.Dispatch<React.SetStateAction<SaveLoadProps['filters']>>
  setAdjustments: React.Dispatch<React.SetStateAction<SaveLoadProps['adjustments']>>
  setPaintedLook: React.Dispatch<React.SetStateAction<number>>
}

export default function SaveLoad({
  imageData,
  applyChanges,
  filters,
  adjustments,
  paintedLook,
  setFilters,
  setAdjustments,
  setPaintedLook
}: SaveLoadProps) {
  const saveSettings = () => {
    if (!imageData) return
    const settings = {
      filters,
      adjustments,
      paintedLook
    }
    const blob = new Blob([JSON.stringify(settings)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'photo_editor_settings.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const loadSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string)
        setFilters(settings.filters)
        setAdjustments(settings.adjustments)
        setPaintedLook(settings.paintedLook)
        
        // Re-apply the loaded settings to the image
        if (imageData) {
          // You'll need to implement a function that applies all filters and adjustments
          // based on the loaded settings
          const newImageData = applyAllFiltersAndAdjustments(imageData, settings)
          applyChanges(newImageData)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        // You might want to show an error message to the user here
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <Button onClick={saveSettings}>Save Settings</Button>
      <div>
        <input
          type="file"
          accept=".json"
          onChange={loadSettings}
          style={{ display: 'none' }}
          id="load-settings"
        />
        <label htmlFor="load-settings">
          <Button asChild>
            <span>Load Settings</span>
          </Button>
        </label>
      </div>
    </div>
  )
}

// This function needs to be implemented to apply all filters and adjustments
function applyAllFiltersAndAdjustments(imageData: ImageData, settings: any): ImageData {
  // Implement the logic to apply all filters and adjustments here
  // You'll need to create a new ImageData object and apply each filter/adjustment in order
  // Return the new ImageData object
  return imageData // Placeholder return, replace with actual implementation
}