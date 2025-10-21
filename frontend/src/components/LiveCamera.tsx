import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';

interface LiveCameraProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  title: string;
}

const LiveCamera: React.FC<LiveCameraProps> = ({ isOpen, onClose, onCapture, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error: any) {
      console.error('❌ Camera access failed:', error);
      throw new Error('Camera access denied or not available');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Stop camera and close
    stopCamera();
    onCapture(imageData);
    onClose();
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="relative w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-64 object-cover"
            playsInline
            muted
          />
          
          {/* Camera Controls Overlay */}
          <div className="absolute top-4 right-4">
            <button
              onClick={switchCamera}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
              title="Switch Camera"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Capture Button */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={capturePhoto}
              disabled={!isStreaming}
              className="bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Camera className="w-8 h-8 text-gray-800" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-white text-sm">
            {isStreaming ? 'Position yourself in the frame and tap the camera button' : 'Starting camera...'}
          </p>
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default LiveCamera;

