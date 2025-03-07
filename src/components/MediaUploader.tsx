
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Upload, Camera, X, RotateCw, Crop, Type, RefreshCw, Check,
  Sliders, FileEdit, RotateCcw, Image, FileText
} from 'lucide-react';
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface MediaUploaderProps {
  onMediaSelect: (file: File | null) => void;
  selectedMedia: File | null;
  previewUrl: string | null;
  onTextOnlySelect: () => void;
}

interface ImageFilter {
  name: string;
  class: string;
  icon?: React.ReactNode;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ 
  onMediaSelect, 
  selectedMedia, 
  previewUrl,
  onTextOnlySelect
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [textOverlay, setTextOverlay] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(24);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 }); // percentage position
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isCropMode, setIsCropMode] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [streamActive, setStreamActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const imageFilters: ImageFilter[] = [
    { name: 'None', class: '' },
    { name: 'Grayscale', class: 'grayscale' },
    { name: 'Sepia', class: 'sepia' },
    { name: 'Invert', class: 'invert' },
    { name: 'Blur', class: 'blur-sm' },
    { name: 'Brightness', class: 'brightness-125' },
    { name: 'Contrast', class: 'contrast-125' },
  ];

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  }, []);

  // File validation and handling
  const handleFiles = (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    const fileType = file.type;
    const fileSize = file.size / (1024 * 1024); // Convert to MB

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const isValidType = [...validImageTypes, ...validVideoTypes].includes(fileType);

    if (!isValidType) {
      toast.error("Invalid file type. Please upload JPG, PNG, GIF, MP4, WebM, or MOV files.");
      return;
    }

    // Validate file size
    if (fileSize > 50) {
      toast.error("File is too large. Maximum size is 50MB.");
      return;
    }

    // Reset editing states
    setRotationAngle(0);
    setSelectedFilter('');
    setTextOverlay('');
    setIsCropMode(false);

    onMediaSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleBoxClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveMedia = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onMediaSelect(null);
    
    // If camera is active, stop it
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStreamActive(false);
    }
  };

  // Camera functions
  const handleCameraClick = async () => {
    try {
      // If stream is already active, stop it first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      streamRef.current = stream;
      setStreamActive(true);
      
      // Display stream in a canvas or video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      toast.success("Camera activated successfully");
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error("Could not access the camera. Please check permissions.");
    }
  };

  const handleCapturePhoto = () => {
    if (!streamActive || !streamRef.current || !videoRef.current || !canvasRef.current) {
      toast.error("Camera not active");
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a File object from the blob
        const capturedFile = new File([blob], "captured_image.jpg", { type: "image/jpeg" });
        
        // Stop all tracks
        streamRef.current!.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setStreamActive(false);
        
        // Set the captured image as the selected media
        onMediaSelect(capturedFile);
        toast.success("Photo captured!");
      }
    }, 'image/jpeg', 0.95);
  };

  // Image editing functions
  const handleRotate = () => {
    // If no media selected yet, show message
    if (!selectedMedia) {
      toast("Upload an image or video first!");
      return;
    }
    
    // Only allow rotation for images
    if (!selectedMedia.type.startsWith('image/')) {
      toast("Rotation is only available for images");
      return;
    }
    
    setRotationAngle((prevAngle) => (prevAngle + 90) % 360);
    toast.success("Image rotated 90° clockwise");
  };

  const handleCounterRotate = () => {
    // If no media selected yet, show message
    if (!selectedMedia) {
      toast("Upload an image or video first!");
      return;
    }
    
    // Only allow rotation for images
    if (!selectedMedia.type.startsWith('image/')) {
      toast("Rotation is only available for images");
      return;
    }
    
    setRotationAngle((prevAngle) => (prevAngle - 90 + 360) % 360);
    toast.success("Image rotated 90° counter-clockwise");
  };

  const handleCrop = () => {
    // Toggle crop mode
    if (!selectedMedia) {
      toast("Upload an image or video first!");
      return;
    }
    
    // Only allow crop for images for now
    if (!selectedMedia.type.startsWith('image/')) {
      toast("Cropping is only available for images");
      return;
    }
    
    setIsCropMode(!isCropMode);
    if (!isCropMode) {
      toast.success("Crop mode enabled. Implement cropping UI here.");
    } else {
      toast.success("Crop mode disabled");
    }
  };

  const handleAddText = () => {
    if (!selectedMedia) {
      toast("Upload an image or video first!");
      return;
    }
    
    setShowTextDialog(true);
  };

  const handleSaveText = () => {
    setShowTextDialog(false);
    
    if (textOverlay.trim()) {
      toast.success("Text overlay added");
    }
  };

  const handleFilterChange = (filterClass: string) => {
    setSelectedFilter(filterClass);
    toast.success(`Filter applied: ${filterClass || 'None'}`);
  };

  // Save edits function - in a real app this would process the image with the
  // current edits applied and create a new file
  const handleSaveEdits = () => {
    toast.success("Edits saved!");
    // Implementation would apply filter, rotation, text overlays 
    // by drawing on canvas and creating a new File object
  };

  const handleTextOnlyClick = () => {
    onTextOnlySelect();
  };

  // Determine if the selected file is a video
  const isVideo = selectedMedia?.type.startsWith('video/');

  // Prepare CSS transformations
  const imageStyle: React.CSSProperties = {
    transform: `rotate(${rotationAngle}deg)`,
    maxHeight: '300px',
    maxWidth: '100%',
    objectFit: 'contain',
    transition: 'transform 0.3s ease',
  };

  return (
    <div className="w-full p-6">
      <h2 className="text-2xl font-semibold mb-1 text-gray-800 dark:text-white">
        Welcome, {currentUser?.displayName || 'User'}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Upload your media or capture directly to get human-like AI-powered captions.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="flex flex-col">
          <div 
            ref={dropAreaRef}
            className={`
              relative border-2 border-dashed rounded-lg p-8
              flex flex-col items-center justify-center
              min-h-[250px] transition-all duration-200 cursor-pointer
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-primary dark:border-gray-600 dark:hover:border-primary'}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleBoxClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/jpeg,image/png,image/gif,video/mp4,video/webm,video/quicktime"
              className="hidden"
            />
            
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Drag & drop your media here, or click to select
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Supports images and videos up to 50MB
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button 
              onClick={handleUploadClick}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Media
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleCameraClick}
            >
              <Camera className="h-4 w-4" />
              Use Camera
            </Button>
          </div>

          <div className="text-center mt-4">
            <span className="text-gray-500 dark:text-gray-400 text-sm">or</span>
            <button 
              className="block mx-auto text-primary text-sm hover:underline mt-1"
              onClick={handleTextOnlyClick}
            >
              <span className="flex items-center justify-center gap-1">
                <FileText className="h-4 w-4" />
                Create text-only caption
              </span>
            </button>
          </div>
          
          {/* Hidden video element for camera feed */}
          {streamActive && (
            <div className="mt-4 border rounded-lg overflow-hidden">
              <div className="relative">
                <video 
                  ref={videoRef} 
                  className="w-full h-auto"
                  autoPlay 
                  playsInline
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button 
                    onClick={handleCapturePhoto}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center"
                  >
                    <Camera className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Hidden canvas for image capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Preview Area */}
        <div className={`border rounded-lg overflow-hidden transition-all duration-300 ${!previewUrl && !streamActive ? 'hidden lg:block opacity-50' : 'opacity-100'}`}>
          {previewUrl ? (
            <div className="relative h-full flex flex-col">
              <div className="absolute top-2 right-2 z-10">
                <button 
                  className="bg-gray-900/70 hover:bg-gray-900/90 text-white rounded-full p-1"
                  onClick={handleRemoveMedia}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="relative flex-grow bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {isVideo ? (
                  <video 
                    src={previewUrl} 
                    controls
                    className="max-h-[300px] max-w-full object-contain"
                  />
                ) : (
                  <div className="relative">
                    <img 
                      ref={imageRef}
                      src={previewUrl}
                      alt="Preview" 
                      className={`${selectedFilter} transition-all`}
                      style={imageStyle}
                    />
                    
                    {textOverlay && (
                      <div 
                        className="absolute pointer-events-none whitespace-pre-wrap break-words text-center"
                        style={{
                          top: `${textPosition.y}%`,
                          left: `${textPosition.x}%`,
                          transform: 'translate(-50%, -50%)',
                          color: textColor,
                          fontSize: `${textSize}px`,
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                          maxWidth: '80%',
                        }}
                      >
                        {textOverlay}
                      </div>
                    )}

                    {isCropMode && (
                      <div className="absolute inset-0 border-2 border-dashed border-primary bg-black bg-opacity-50">
                        <div className="absolute inset-10 border-2 border-white"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t">
                {!isVideo && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Filters:</p>
                    <div className="flex overflow-x-auto gap-2 pb-2">
                      {imageFilters.map((filter) => (
                        <button
                          key={filter.name}
                          onClick={() => handleFilterChange(filter.class)}
                          className={`
                            min-w-[60px] text-xs p-2 rounded border 
                            ${selectedFilter === filter.class 
                              ? 'border-primary bg-primary/10' 
                              : 'border-gray-300 hover:border-gray-400'}
                          `}
                        >
                          {filter.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-4">
                  {!isVideo && (
                    <>
                      <button 
                        className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center"
                        onClick={handleRotate}
                      >
                        <RotateCw className="h-5 w-5" />
                        <span className="text-xs mt-1">Rotate</span>
                      </button>
                      <button 
                        className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center"
                        onClick={handleCounterRotate}
                      >
                        <RotateCcw className="h-5 w-5" />
                        <span className="text-xs mt-1">Counter</span>
                      </button>
                      <button 
                        className={`
                          text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center
                          ${isCropMode ? 'text-primary dark:text-primary' : ''}
                        `}
                        onClick={handleCrop}
                      >
                        <Crop className="h-5 w-5" />
                        <span className="text-xs mt-1">Crop</span>
                      </button>
                    </>
                  )}
                  <button 
                    className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center"
                    onClick={handleAddText}
                  >
                    <Type className="h-5 w-5" />
                    <span className="text-xs mt-1">Text</span>
                  </button>
                  <button 
                    className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center"
                    onClick={handleRemoveMedia}
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span className="text-xs mt-1">Reset</span>
                  </button>
                  <button 
                    className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex flex-col items-center"
                    onClick={handleSaveEdits}
                  >
                    <Check className="h-5 w-5" />
                    <span className="text-xs mt-1">Save</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6 text-center">
              <div className="text-gray-400 dark:text-gray-600">
                <div className="mx-auto w-20 h-20 mb-4 opacity-30">
                  <img src="/placeholder.svg" alt="No media selected" className="w-full h-full" />
                </div>
                <p>Media preview will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Text Overlay Dialog */}
      <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Text Overlay</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="text-overlay" className="text-sm font-medium">
                Text
              </label>
              <Input
                id="text-overlay"
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                placeholder="Enter your text"
              />
            </div>
            
            <div>
              <label htmlFor="text-color" className="text-sm font-medium">
                Color
              </label>
              <div className="flex gap-2">
                <Input
                  id="text-color"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input 
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">
                Text Size: {textSize}px
              </label>
              <Slider
                value={[textSize]}
                min={12}
                max={72}
                step={1}
                onValueChange={(value) => setTextSize(value[0])}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTextDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveText}>
              Apply Text
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaUploader;
