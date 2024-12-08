import React, { useState, useEffect, useRef } from 'react';

interface MagicWandSelectorProps {
  image: string;
  onSelection: (selection: { mask: ImageData; original: ImageData }) => void;
}

const MagicWandSelector: React.FC<MagicWandSelectorProps> = ({ image, onSelection }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (image && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
          }
        }
      };
      img.src = image;
    }
  }, [image]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSelecting) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

    setIsSelecting(true);
    magicWandSelect(x, y);
    setIsSelecting(false);
  };

  const magicWandSelect = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const mask = new ImageData(canvas.width, canvas.height);
    const stack: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();

    const targetColor = getPixelColor(imageData, startX, startY);
    const colorThreshold = 30;

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const currentColor = getPixelColor(imageData, x, y);
      if (colorMatch(targetColor, currentColor, colorThreshold)) {
        setPixelColor(mask, x, y, [255, 0, 0, 128]);

        if (x > 0) stack.push([x - 1, y]);
        if (x < canvas.width - 1) stack.push([x + 1, y]);
        if (y > 0) stack.push([x, y - 1]);
        if (y < canvas.height - 1) stack.push([x, y + 1]);
      }
    }

    // Create a new canvas for the overlay
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;
    const overlayCtx = overlayCanvas.getContext('2d');

    if (overlayCtx) {
      // Draw the original image
      overlayCtx.drawImage(canvas, 0, 0);

      // Apply the semi-transparent red mask
      for (let y = 0; y < mask.height; y++) {
        for (let x = 0; x < mask.width; x++) {
          if (mask.data[(y * mask.width + x) * 4 + 3] > 0) {
            const index = (y * mask.width + x) * 4;
            overlayCtx.fillStyle = `rgba(255, 0, 0, 0.5)`;
            overlayCtx.fillRect(x, y, 1, 1);
          }
        }
      }

      // Draw the result back to the main canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(overlayCanvas, 0, 0);
    }

    onSelection({ mask, original: imageData });
  };

  const getPixelColor = (imageData: ImageData, x: number, y: number): number[] => {
    const index = (y * imageData.width + x) * 4;
    return [
      imageData.data[index],
      imageData.data[index + 1],
      imageData.data[index + 2],
      imageData.data[index + 3],
    ];
  };

  const setPixelColor = (imageData: ImageData, x: number, y: number, color: number[]) => {
    const index = (y * imageData.width + x) * 4;
    imageData.data[index] = color[0];
    imageData.data[index + 1] = color[1];
    imageData.data[index + 2] = color[2];
    imageData.data[index + 3] = color[3];
  };


  const colorMatch = (color1: number[], color2: number[], threshold: number): boolean => {
    const dist = Math.sqrt(
      Math.pow(color1[0] - color2[0], 2) +
      Math.pow(color1[1] - color2[1], 2) +
      Math.pow(color1[2] - color2[2], 2)
    );
    return dist <= threshold;
  };

  return (
    <div>
      <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ cursor: 'crosshair' }} />
    </div>
  );
};

export default MagicWandSelector;