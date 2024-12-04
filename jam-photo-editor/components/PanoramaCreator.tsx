import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

declare global {
  interface Window {
    cv: any;
  }
}

const PanoramaCreator: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [panorama, setPanorama] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpenCVLoaded, setIsOpenCVLoaded] = useState(false);

  useEffect(() => {
    if (!window.cv) {
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.5.2/opencv.js';
      script.async = true;
      script.onload = () => {
        console.log('OpenCV loaded');
        setIsOpenCVLoaded(true);
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } else {
      setIsOpenCVLoaded(true);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setImages(Array.from(event.target.files));
    }
  };

  const createPanorama = async () => {
    setIsProcessing(true);
    setError(null);

    if (!isOpenCVLoaded) {
      setError('OpenCV is not loaded. Please try again in a few moments.');
      setIsProcessing(false);
      return;
    }

    if (images.length < 2) {
      setError('Please select at least two images.');
      setIsProcessing(false);
      return;
    }

    try {
      const imgElements = await Promise.all(
        images.map((file) => createImageElement(file))
      );

      const mats = imgElements.map((img) => {
        const mat = window.cv.imread(img);
        window.cv.cvtColor(mat, mat, window.cv.COLOR_RGBA2RGB);
        return mat;
      });

      const stitcher = new window.cv.Stitcher();
      const result = new window.cv.Mat();
      const status = stitcher.stitch(mats, result);

      if (status !== window.cv.Stitcher_OK) {
        throw new Error('Panorama creation failed');
      }

      const canvas = document.createElement('canvas');
      window.cv.imshow(canvas, result);
      setPanorama(canvas.toDataURL());

      // Clean up
      mats.forEach((mat) => mat.delete());
      result.delete();
      stitcher.delete();
    } catch (err) {
      console.error(err);
      setError('Failed to create panorama. Please try with different images.');
    } finally {
      setIsProcessing(false);
    }
  };

  const createImageElement = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Panorama Creator</CardTitle>
        <CardDescription>Combine multiple images into a panorama</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            Select Images
          </Button>
          <div>{images.length} images selected</div>
          <Button onClick={createPanorama} disabled={isProcessing || images.length < 2 || !isOpenCVLoaded}>
            {isProcessing ? 'Processing...' : 'Create Panorama'}
          </Button>
          {error && <div className="text-red-500">{error}</div>}
          {panorama && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <img src={panorama} alt="Panorama" className="max-w-full h-auto" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PanoramaCreator;