import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import HydrationBarrier from './HydrationBarrier';
import PanoramaCreator from './PanoramaCreator';
import { Button } from "@/components/ui/button"

const LocalizedEditing = dynamic(() => import('./LocalizedEditing'), {
  ssr: false,
});

const ImageEditor: React.FC<{ image: ImageBitmap | null }> = ({ image }) => {
  const [editedImageData, setEditedImageData] = useState<ImageData | null>(null);

  const saveImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx && image) {
      canvas.width = image.width;
      canvas.height = image.height;
      if (editedImageData) {
        ctx.putImageData(editedImageData, 0, 0);
      } else {
        ctx.drawImage(image, 0, 0, image.width, image.height);
      }
      const link = document.createElement('a');
      link.download = 'edited-image.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="space-y-8">
      {/* other editing tools */}
      <HydrationBarrier>
        {image && (
          <div className="space-y-4">
            <LocalizedEditing
              image={image}
              onEdit={(imageData) => setEditedImageData(imageData)}
            />
            <Button onClick={saveImage}>Save</Button>
          </div>
        )}
      </HydrationBarrier>
      <PanoramaCreator />
    </div>
  );
};

export default ImageEditor;