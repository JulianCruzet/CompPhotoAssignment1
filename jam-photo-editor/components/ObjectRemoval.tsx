import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "./ui/label";

interface ObjectRemovalProps {
  image: string;
  onProcessed: (processedImageData: ImageData) => void;
}

const ObjectRemoval: React.FC<ObjectRemovalProps> = ({ image, onProcessed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = image;
    }
  }, [image]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const removeObject = async () => {
    setIsProcessing(true);
    const canvas = canvasRef.current;
    if (canvas && window.cv) {
      try {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const src = window.cv.matFromImageData(imageData);
          const mask = new window.cv.Mat();

          // Convert the red mask to grayscale
          window.cv.cvtColor(src, mask, window.cv.COLOR_RGBA2GRAY);
          window.cv.threshold(mask, mask, 200, 255, window.cv.THRESH_BINARY);

          const dst = new window.cv.Mat();

          // Apply OpenCV's inpainting method
          window.cv.inpaint(src, mask, dst, 3, window.cv.INPAINT_TELEA);

          // Display the result on the canvas
          const resultImageData = new ImageData(
            new Uint8ClampedArray(dst.data),
            dst.cols,
            dst.rows
          );
          ctx.putImageData(resultImageData, 0, 0);

          // Notify parent component with the processed image
          onProcessed(resultImageData);

          // Cleanup OpenCV matrices
          src.delete();
          mask.delete();
          dst.delete();
        }
      } catch (error) {
        console.error("Error during object removal:", error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      console.error("OpenCV not loaded");
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="brush-size">Brush Size</Label>
        <Slider
          id="brush-size"
          min={1}
          max={50}
          step={1}
          value={[brushSize]}
          onValueChange={(value) => setBrushSize(value[0])}
        />
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="border border-gray-300 rounded-lg cursor-crosshair w-full"
        />
        <div className="absolute top-2 right-2 space-x-2">
          <Button
            onClick={removeObject}
            disabled={isProcessing}
            variant="secondary"
            className="bg-white hover:bg-gray-100"
          >
            {isProcessing ? "Processing..." : "Remove Object"}
          </Button>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        Draw over the object you want to remove, then click "Remove Object".
      </p>
    </div>
  );
};

export default ObjectRemoval;