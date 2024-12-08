import React, { useState } from "react";
import dynamic from "next/dynamic";
import HydrationBarrier from "./HydrationBarrier";
import { Button } from "@/components/ui/button";

const LocalizedEditing = dynamic(() => import("./LocalizedEditing"), {
  ssr: false,
});

const ObjectRemoval = dynamic(() => import("./ObjectRemoval"), {
  ssr: false,
});

const ImageEditor: React.FC<{ image: string }> = ({ image }) => {
  const [editedImageData, setEditedImageData] = useState<ImageData | null>(null);

  const saveImage = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx && editedImageData) {
      canvas.width = editedImageData.width;
      canvas.height = editedImageData.height;
      ctx.putImageData(editedImageData, 0, 0);
      const link = document.createElement("a");
      link.download = "edited-image.png";
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="space-y-8">
      {image && (
        <div className="space-y-4">
          <HydrationBarrier>
            <ObjectRemoval
              image={image}
              onProcessed={(imageData) => setEditedImageData(imageData)}
            />
          </HydrationBarrier>
          <Button onClick={saveImage}>Save</Button>
        </div>
      )}
    </div>
  );
};

export default ImageEditor;