import React, { useRef, useEffect, useState } from 'react';

interface LocalizedEditingProps {
  image: ImageBitmap;
  onEdit: (editedImageData: ImageData) => void;
}

const LocalizedEditing: React.FC<LocalizedEditingProps> = ({ image, onEdit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      try {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
      } catch (error) {
        console.error('Error initializing canvas:', error);
      }
    }
  }, [image]);

  const startEditing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsEditing(true);
    applyEdit(e);
  };

  const stopEditing = () => {
    setIsEditing(false);
  };

  const applyEdit = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    try {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const px = (i / 4) % canvas.width;
        const py = Math.floor((i / 4) / canvas.width);

        const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);

        if (distance < brushSize) {
          const factor = 1 - (distance / brushSize);
          data[i] = Math.min(255, Math.max(0, data[i] + intensity * factor));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + intensity * factor));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + intensity * factor));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      onEdit(imageData);
    } catch (error) {
      console.error('Error applying edit:', error);
    }
  };

  return (
    <div>
      <h3>Localized Editing</h3>
      <div>
        <label>
          Brush Size:
          <input
            type="range"
            min="1"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Intensity:
          <input
            type="range"
            min="-255"
            max="255"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
          />
        </label>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startEditing}
        onMouseMove={applyEdit}
        onMouseUp={stopEditing}
        onMouseLeave={stopEditing}
        style={{ cursor: 'crosshair' }}
      />
    </div>
  );
};

export default LocalizedEditing;