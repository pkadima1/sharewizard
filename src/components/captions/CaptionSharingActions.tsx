
import React from 'react';
import { GeneratedCaption } from '@/services/openaiService';
import { MediaType } from '@/types/mediaTypes';
import SocialSharing from './SocialSharing';
import { sharePreview, downloadPreview } from '@/utils/sharingUtils';
import { toast } from "sonner";

interface CaptionSharingActionsProps {
  previewRef: React.RefObject<HTMLDivElement>;
  captions: GeneratedCaption[];
  selectedCaption: number;
  isEditing: boolean;
  isSharing: boolean;
  setIsSharing: React.Dispatch<React.SetStateAction<boolean>>;
  isDownloading: boolean;
  setIsDownloading: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPlatform: string;
  previewUrl: string | null;
  mediaType: MediaType;
  captionOverlayMode: 'overlay' | 'below';
}

const CaptionSharingActions: React.FC<CaptionSharingActionsProps> = ({
  previewRef,
  captions,
  selectedCaption,
  isEditing,
  isSharing,
  setIsSharing,
  isDownloading,
  setIsDownloading,
  selectedPlatform,
  previewUrl,
  mediaType,
  captionOverlayMode
}) => {
  const handleShareToSocial = async () => {
    if (!previewRef.current) {
      toast.error("Preview container not found. Please try again.");
      console.error("Preview ref is null:", previewRef.current);
      return;
    }
    
    if (!captions[selectedCaption]) {
      toast.error("No caption selected to share");
      return;
    }
    
    try {
      setIsSharing(true);
      
      const result = await sharePreview(
        previewRef,
        captions[selectedCaption],
        mediaType
      );
      
      if (result.message) {
        toast.success(result.message);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current) {
      toast.error("Preview container not found. Please try again.");
      console.error("Preview ref is null:", previewRef.current);
      return;
    }
    
    try {
      setIsDownloading(true);
      console.log("Starting download, media type:", mediaType);
      
      const caption = captions[selectedCaption];
      if (!caption) {
        toast.error("No caption selected for download");
        return;
      }
      
      const timestamp = new Date().getTime();
      const filename = `${caption.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;
      
      const captionStyle = captionOverlayMode === 'overlay' ? 'handwritten' : 'standard';
      
      await downloadPreview(
        previewRef,
        mediaType,
        caption,
        filename,
        captionStyle
      );
    } catch (error) {
      console.error("Error in download process:", error);
      toast.error("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SocialSharing 
      isEditing={isEditing}
      isSharing={isSharing}
      onShareClick={handleShareToSocial}
      selectedPlatform={selectedPlatform}
      caption={captions[selectedCaption]}
      mediaType={mediaType}
      previewUrl={previewUrl}
    />
  );
};

export default CaptionSharingActions;
