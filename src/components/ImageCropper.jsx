"use client";
import React, { useState, useCallback, useContext } from "react";
import Cropper from "react-easy-crop";
import { UserContext } from "@/utils/UserContext";
import SimpleButton from "./SimpleButton";

// Load image helper
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });

// Simplified crop function (no rotation)
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(URL.createObjectURL(blob));
        else reject(new Error("Failed to create blob"));
      },
      "image/jpeg",
      0.9
    );
  });
}

export default function ImageCropper({
  aspectRatio = 1,
  onCropComplete,
  showModal,
  setShowModal,
  imageSrc,
  modalTitle = "Crop Your Image",
  instructionText = "Adjust and then crop or cancel.",
}) {
  const { theme } = useContext(UserContext);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropCompleteCallback = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleClose = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setShowModal(false);
  }, [setShowModal]);

  const handleCrop = useCallback(async () => {
    if (!croppedAreaPixels) return;
    try {
      const blobUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(blobUrl);
      handleClose();
    } catch (e) {
      console.error("Crop error:", e);
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete, handleClose]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`rounded-lg overflow-hidden w-full max-w-lg mx-4 ${theme.mainTheme}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <h3 className="text-lg font-medium">{modalTitle}</h3>
          <SimpleButton btnText={"✕"} type={"default"} onClick={handleClose} />
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="relative h-48 w-full rounded-lg overflow-hidden mb-4">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              minZoom={1}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onZoomChange={(z) => {
                setCrop({ x: 0, y: 0 });
                setZoom(z);
              }}
              onCropComplete={onCropCompleteCallback}
              cropShape="rect"
              showGrid={false}
              restrictPosition={true}
              style={{ containerStyle: { width: "100%", height: "100%" } }}
            />
          </div>
          <p className={`mb-4 text-sm ${theme.colorText}`}>{instructionText}</p>

          {/* Zoom Slider */}
          <div className="mb-4">
            <label className={`block mb-1 text-sm ${theme.colorText}`}>
              Zoom: {zoom.toFixed(1)}x
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${theme.colorBg}`}
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end space-x-2 px-4 py-2 border-t">
          <SimpleButton
            btnText={"Cancel"}
            type={"default"}
            onClick={handleClose}
          />
          <SimpleButton
            btnText={"Crop"}
            type={"primary"}
            icon={<i className="fas fa-crop-alt"></i>}
            extraclasses="px-10"
            onClick={handleCrop}
          />
        </div>
      </div>
    </div>
  );
}
