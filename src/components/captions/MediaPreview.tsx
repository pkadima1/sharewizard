
import React, { forwardRef, useRef, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Edit, Share, Download } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { GeneratedCaption } from '@/services/openaiService';
import { MediaType, CaptionStyle } from '@/types/mediaTypes';
import SocialSharing from './SocialSharing';

interface MediaPreviewProps {
  previewUrl: string | null;
  selectedMedia: File | null;
  captionOverlayMode: 'overlay' | 'below';
  onCaptionOverlayModeChange: (mode: 'overlay' | 'below') => void;
  currentCaption: GeneratedCaption | null;
  isTextOnly: boolean;
  onEditClick: () => void;
  onShareClick: () => void;
  onDownloadClick: () => void;
  isSharing: boolean;
  isDownloading: boolean;
  isEditing: boolean;
}

const MediaPreview = forwardRef<HTMLDivElement, MediaPreviewProps>(({
  previewUrl,
  selectedMedia,
  captionOverlayMode,
  onCaptionOverlayModeChange,
  currentCaption,
  isTextOnly,
  onEditClick,
  onShareClick,
  onDownloadClick,
  isSharing,
  isDownloading,
  isEditing
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Ensure media elements have crossOrigin attribute set for sharing
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.crossOrigin = "anonymous";
    }
    if (imageRef.current) {
      imageRef.current.crossOrigin = "anonymous";
    }
  }, [previewUrl]);

  const handleToggleOverlayMode = () => {
    onCaptionOverlayModeChange(captionOverlayMode === 'overlay' ? 'below' : 'overlay');
  };

  // Determine media type for sharing
  const getMediaType = (): MediaType => {
    if (isTextOnly) return 'text-only';
    if (selectedMedia?.type.startsWith('video')) return 'video';
    if (selectedMedia?.type.startsWith('image')) return 'image';
    return 'text-only';
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium dark:text-white">Preview</h3>
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Edit"
                  onClick={onEditClick}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Share"
                  onClick={onShareClick}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <div className="h-4 w-4 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>
                  ) : (
                    <Share className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Download"
                  onClick={onDownloadClick}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <div className="h-4 w-4 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div 
          ref={ref}
          className="rounded-md overflow-hidden bg-white dark:bg-gray-900"
        >
          <div id="sharable-content" className={isTextOnly ? 'p-6' : ''}>
            {!isTextOnly && previewUrl && (
              <div className="relative">
                {selectedMedia && selectedMedia.type.startsWith('image') ? (
                  <div className="aspect-square w-full relative">
                    <img 
                      ref={imageRef}
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                    {captionOverlayMode === 'overlay' && currentCaption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4 backdrop-blur-sm">
                        <p className="text-white text-lg font-semibold mb-2">{currentCaption.title}</p>
                        <p className="text-white text-sm mb-2">{currentCaption.caption}</p>
                        <p className="text-white text-sm italic mb-2">{currentCaption.cta}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentCaption.hashtags.map((hashtag, idx) => (
                            <span key={idx} className="text-blue-300 text-xs">
                              #{hashtag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedMedia && selectedMedia.type.startsWith('video') ? (
                  <div className="aspect-video w-full relative">
                    <video 
                      ref={videoRef}
                      src={previewUrl} 
                      className="w-full h-full object-cover" 
                      controls
                      crossOrigin="anonymous"
                      playsInline
                    />
                    {captionOverlayMode === 'overlay' && currentCaption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4 backdrop-blur-sm">
                        <p className="text-white text-lg font-semibold mb-2">{currentCaption.title}</p>
                        <p className="text-white text-sm mb-2">{currentCaption.caption}</p>
                        <p className="text-white text-sm italic mb-2">{currentCaption.cta}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentCaption.hashtags.map((hashtag, idx) => (
                            <span key={idx} className="text-blue-300 text-xs">
                              #{hashtag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-200 dark:bg-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">No media preview</span>
                  </div>
                )}
              </div>
            )}
          
            {currentCaption && (captionOverlayMode === 'below' || isTextOnly) && (
              <div className={`space-y-3 p-6 ${!isTextOnly && captionOverlayMode === 'below' ? 'bg-blue-950 text-white' : ''}`}>
                <h3 className="font-semibold text-xl">{currentCaption.title}</h3>
                <p className="whitespace-pre-line">{currentCaption.caption}</p>
                <p className="italic text-gray-300 mt-3">{currentCaption.cta}</p>
                <div className="flex flex-wrap gap-1 pt-2">
                  {currentCaption.hashtags.map((hashtag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-blue-400">
                      #{hashtag}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-gray-500 pt-3 mt-3 border-t border-gray-800">
                  Created with EngagePerfect • https://engageperfect.com
                </div>
              </div>
            )}
          </div>
        </div>
        
        {!isEditing && (
          <>
            <div className="mt-4 flex items-center justify-end">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Caption below</span>
                <Switch 
                  checked={captionOverlayMode === 'overlay'} 
                  onCheckedChange={handleToggleOverlayMode} 
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">Caption overlay</span>
              </div>
            </div>
            
            {/* We now include SocialSharing directly in MediaPreview for better integration */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <SocialSharing
                isEditing={isEditing}
                isSharing={isSharing}
                onShareClick={onShareClick}
                selectedPlatform=""
                caption={currentCaption}
                mediaType={getMediaType()}
                previewUrl={previewUrl}
                previewRef={ref}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
});

MediaPreview.displayName = 'MediaPreview';

export default MediaPreview;
