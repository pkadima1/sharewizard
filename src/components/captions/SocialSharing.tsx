
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Share, Instagram, Facebook, Twitter, Linkedin, Youtube, Music } from 'lucide-react';
import { toast } from "sonner";
import { shareToPlatform } from '@/utils/socialMediaUtils';
import { MediaType } from '@/types/mediaTypes';
import { isWebShareSupported, isFileShareSupported, sharePreview } from '@/utils/sharingUtils';

interface SocialSharingProps {
  isEditing: boolean;
  isSharing: boolean;
  onShareClick: () => void;
  selectedPlatform?: string;
  caption?: any;
  mediaType?: MediaType;
  previewUrl?: string | null;
  previewRef?: React.RefObject<HTMLDivElement>;
}

const SocialSharing: React.FC<SocialSharingProps> = ({
  isEditing,
  isSharing,
  onShareClick,
  selectedPlatform = '',
  caption,
  mediaType = 'text-only',
  previewUrl,
  previewRef
}) => {
  const [platformLoading, setPlatformLoading] = useState<string | null>(null);
  const [browserShareLoading, setBrowserShareLoading] = useState<boolean>(false);
  const [hasCheckedCapabilities, setHasCheckedCapabilities] = useState<boolean>(false);
  const [canShareFiles, setCanShareFiles] = useState<boolean>(false);
  
  // Check sharing capabilities on component mount
  useEffect(() => {
    const checkSharingCapabilities = async () => {
      const webShareSupported = isWebShareSupported();
      let fileShareSupported = false;
      
      if (webShareSupported) {
        // Actually test if the browser can share files, not just check for API presence
        try {
          if (mediaType === 'image') {
            // Create a small test image file
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 10;
            testCanvas.height = 10;
            const testBlob = await new Promise<Blob>((resolve) => 
              testCanvas.toBlob((blob) => resolve(blob!), 'image/png')
            );
            const testFile = new File([testBlob], 'test.png', { type: 'image/png' });
            
            fileShareSupported = navigator.canShare && navigator.canShare({ files: [testFile] });
            console.log('File sharing capability for images:', fileShareSupported);
          } else if (mediaType === 'video') {
            // We can't easily create a test video, so we'll make a conservative estimate
            fileShareSupported = 
              typeof navigator.canShare === 'function' && 
              typeof navigator.share === 'function' && 
              'files' in new window.ShareData();
            console.log('File sharing capability for videos (estimated):', fileShareSupported);
          }
        } catch (error) {
          console.warn('Error testing file sharing capability:', error);
          fileShareSupported = false;
        }
      }
      
      setCanShareFiles(fileShareSupported);
      setHasCheckedCapabilities(true);
      console.log('Web Share API supported:', webShareSupported);
      console.log('File sharing supported:', fileShareSupported);
    };
    
    checkSharingCapabilities();
  }, [mediaType]);
  
  if (isEditing) return null;

  const handleDirectShare = async (platform: string) => {
    try {
      // Set loading state for this specific platform
      setPlatformLoading(platform);
      toast.info(`Preparing to share on ${platform}...`);
      
      // Share directly to the selected platform
      const result = await shareToPlatform(platform.toLowerCase(), {
        caption,
        mediaType,
        mediaUrl: previewUrl
      });
      
      if (result.success) {
        toast.success(result.message || `Shared to ${platform} successfully!`);
        console.log(`Shared to ${platform} via API`);
      } else if (result.error) {
        // If direct sharing fails, show the error
        console.warn(`${platform} sharing error: ${result.error}`);
        toast.error(`Failed to share to ${platform}: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      toast.error(`Failed to share to ${platform}.`);
    } finally {
      setPlatformLoading(null);
    }
  };

  const handleBrowserShare = async () => {
    try {
      setBrowserShareLoading(true);
      console.log("Starting browser share with previewRef:", previewRef?.current);
      
      // Ensure we don't trigger any platform loading indicators
      setPlatformLoading(null);
      
      // Direct Web Share API implementation for better media sharing
      if (previewRef && previewRef.current && caption) {
        console.log("Using enhanced Web Share API for sharing", mediaType);
        
        try {
          // Use the sharePreview function directly from here for better control
          const result = await sharePreview(previewRef, caption, mediaType || 'text-only');
          
          if (result.status === 'shared') {
            toast.success(result.message || "Shared successfully!");
          } else if (result.status === 'fallback') {
            toast.info(result.message || "Used fallback sharing method.");
          } else if (result.status === 'cancelled') {
            // User cancelled, no need for notification
            console.log("Share was cancelled by user");
          }
          
          setBrowserShareLoading(false);
          return;
        } catch (shareError) {
          console.error("Enhanced sharing failed:", shareError);
          toast.error("Sharing failed. Using fallback method.");
          // Continue to fallback method if enhanced sharing fails
        }
      } else {
        console.warn("Missing previewRef or caption for enhanced sharing");
      }
      
      // Fall back to parent component's share function if enhanced sharing fails
      await onShareClick();
      console.log(`Shared via browser share API (fallback method)`);
    } catch (error) {
      console.error('Browser sharing error:', error);
      toast.error('Failed to share. Please try copying the text and sharing manually.');
    } finally {
      setBrowserShareLoading(false);
    }
  };

  // Define platform icons and details
  const platforms = {
    instagram: { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' },
    twitter: { name: 'Twitter', icon: Twitter, color: 'bg-blue-500 hover:bg-blue-600' },
    facebook: { name: 'Facebook', icon: Facebook, color: 'bg-blue-600 hover:bg-blue-700' },
    linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700 hover:bg-blue-800' },
    tiktok: { name: 'TikTok', icon: Music, color: 'bg-black hover:bg-gray-900' },
    youtube: { name: 'YouTube', icon: Youtube, color: 'bg-red-600 hover:bg-red-700' }
  };

  // Get currently selected platform details, fallback to default
  const selectedPlatformDetails = selectedPlatform && platforms[selectedPlatform as keyof typeof platforms] 
    ? platforms[selectedPlatform as keyof typeof platforms] 
    : null;

  // Display a different sharing message based on media type and capabilities
  const getBrowserShareText = () => {
    if (!hasCheckedCapabilities) return "Share via Browser";
    
    if (mediaType === 'video') {
      if (canShareFiles) {
        return "Share via Browser (with video)";
      }
      return "Share via Browser (caption only, video opens separately)";
    } else if (mediaType === 'image') {
      if (canShareFiles) {
        return "Share via Browser (with image)";
      }
      return "Share via Browser (caption only)";
    }
    return "Share via Browser (WhatsApp, Telegram, etc.)";
  };

  return (
    <div className="space-y-3">
      <h3 className="font-medium dark:text-white">Share to Social Media</h3>
      
      {/* Selected platform share button - prominently displayed if a platform is selected */}
      {selectedPlatformDetails && (
        <Button
          className={`w-full text-white ${selectedPlatformDetails.color} mb-2`}
          onClick={() => handleDirectShare(selectedPlatformDetails.name)}
          disabled={isSharing || platformLoading === selectedPlatformDetails.name || browserShareLoading}
        >
          {platformLoading === selectedPlatformDetails.name ? (
            <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
          ) : (
            <selectedPlatformDetails.icon className="h-4 w-4 mr-2" />
          )}
          Share to {selectedPlatformDetails.name}
        </Button>
      )}
      
      {/* Fallback browser sharing option with improved feedback */}
      <Button
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        onClick={handleBrowserShare}
        disabled={isSharing || browserShareLoading || !!platformLoading}
      >
        {browserShareLoading ? (
          <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
        ) : (
          <Share className="h-4 w-4 mr-2" />
        )}
        {getBrowserShareText()}
      </Button>
      
      {!isWebShareSupported() && (
        <div className="text-xs text-amber-500 dark:text-amber-400">
          Your browser doesn't support Web Share API. Content will be copied to clipboard.
        </div>
      )}
      
      {isWebShareSupported() && mediaType !== 'text-only' && !canShareFiles && hasCheckedCapabilities && (
        <div className="text-xs text-amber-500 dark:text-amber-400">
          Your browser doesn't support sharing files directly. Caption will be shared, and media will open in a new tab.
        </div>
      )}
      
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Or share directly to:
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(platforms).map(([key, platform]) => {
          // Skip the platform that's already selected for the main button
          if (key === selectedPlatform) return null;
          
          return (
            <Button 
              key={key}
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={() => handleDirectShare(platform.name)}
              disabled={platformLoading === platform.name || !!platformLoading || browserShareLoading}
            >
              {platformLoading === platform.name ? (
                <div className="h-4 w-4 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin mr-1"></div>
              ) : (
                <platform.icon className="h-4 w-4 mr-1" />
              )}
              {platform.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default SocialSharing;
