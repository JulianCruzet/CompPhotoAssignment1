import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import HydrationBarrier from './HydrationBarrier';

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
    <div>
      {/* other editing tools */}
      <HydrationBarrier>
        {image && (
          <>
            <LocalizedEditing
              image={image}
              onEdit={(imageData) => setEditedImageData(imageData)}
            />
            <button onClick={saveImage}>Save</button>
          </>
        )}
      </HydrationBarrier>
    </div>
  );
};

export default ImageEditor;