// Helper function to convert ImageData to grayscale
function toGrayscale(imageData: ImageData): number[][] {
    const gray = [];
    for (let y = 0; y < imageData.height; y++) {
      gray[y] = [];
      for (let x = 0; x < imageData.width; x++) {
        const i = (y * imageData.width + x) * 4;
        gray[y][x] = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
      }
    }
    return gray;
  }
  
  // Simple feature detection using a basic corner detection algorithm
  function detectFeatures(gray: number[][], threshold: number = 10): [number, number][] {
    const features: [number, number][] = [];
    for (let y = 1; y < gray.length - 1; y++) {
      for (let x = 1; x < gray[y].length - 1; x++) {
        const dx = Math.abs(gray[y][x-1] - gray[y][x+1]);
        const dy = Math.abs(gray[y-1][x] - gray[y+1][x]);
        if (dx > threshold && dy > threshold) {
          features.push([x, y]);
        }
      }
    }
    return features;
  }
  
  // Match features between two images
  function matchFeatures(features1: [number, number][], features2: [number, number][], maxDistance: number = 10): [number, number][][] {
    const matches: [number, number][][] = [];
    for (const f1 of features1) {
      let bestMatch: [number, number] | null = null;
      let bestDistance = Infinity;
      for (const f2 of features2) {
        const dx = f1[0] - f2[0];
        const dy = f1[1] - f2[1];
        const distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < bestDistance && distance < maxDistance) {
          bestMatch = f2;
          bestDistance = distance;
        }
      }
      if (bestMatch) {
        matches.push([f1, bestMatch]);
      }
    }
    return matches;
  }
  
  // Calculate the offset between two images based on matched features
  function calculateOffset(matches: [number, number][][]): [number, number] {
    let sumX = 0, sumY = 0;
    for (const match of matches) {
      sumX += match[0][0] - match[1][0];
      sumY += match[0][1] - match[1][1];
    }
    return [Math.round(sumX / matches.length), Math.round(sumY / matches.length)];
  }
  
  export async function createPanorama(images: ImageData[]): Promise<ImageData> {
    if (images.length < 2) {
      throw new Error('At least two images are required for panorama stitching');
    }
  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
  
    // Start with the first image
    canvas.width = images[0].width;
    canvas.height = images[0].height;
    ctx.putImageData(images[0], 0, 0);
  
    for (let i = 1; i < images.length; i++) {
      const gray1 = toGrayscale(ctx.getImageData(0, 0, canvas.width, canvas.height));
      const gray2 = toGrayscale(images[i]);
  
      const features1 = detectFeatures(gray1);
      const features2 = detectFeatures(gray2);
  
      const matches = matchFeatures(features1, features2);
      const [offsetX, offsetY] = calculateOffset(matches);
  
      // Expand canvas if necessary
      const newWidth = Math.max(canvas.width, images[i].width + offsetX);
      const newHeight = Math.max(canvas.height, images[i].height + offsetY);
  
      if (newWidth > canvas.width || newHeight > canvas.height) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.putImageData(imageData, 0, 0);
      }
  
      // Draw the new image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = images[i].width;
      tempCanvas.height = images[i].height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(images[i], 0, 0);
        ctx.drawImage(tempCanvas, offsetX, offsetY);
      }
    }
  
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }  