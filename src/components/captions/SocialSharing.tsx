
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Share, Instagram, Facebook, Twitter, Linkedin, Youtube, Music } from 'lucide-react';
import { toast } from "sonner";
import { shareToPlatform } from '@/utils/socialMediaUtils';
import { MediaType } from '@/types/mediaTypes';

interface SocialSharingProps {
  isEditing: boolean;
  isSharing: boolean;
  onShareClick: () => void;
  selectedPlatform?: string;
  caption?: any;
  mediaType?: MediaType;
  previewUrl?: string | null;
}

const SocialSharing: React.FC<SocialSharingProps> = ({
  isEditing,
  isSharing,
  onShareClick,
  selectedPlatform = '',
  caption,
  mediaType = 'text-only',
  previewUrl
}) => {
  const [platformLoading, setPlatformLoading] = useState<string | null>(null);
  const [browserShareLoading, setBrowserShareLoading] = useState<boolean>(false);
  
  if (isEditing) return null;

  const handleDirectShare = async (platform: string) => {
    try {
      // Set loading state for this specific platform
      setPlatformLoading(platform);
      toast.info(`Preparing to share on ${platform}...`);
      
      // If we're trying to share directly to a social platform
      if (platform.toLowerCase() !== 'browser') {
        // First try the direct API sharing
        const result = await shareToPlatform(platform.toLowerCase(), {
          caption,
          mediaType,
          mediaUrl: previewUrl
        });
        
        if (result.success) {
          toast.success(result.message || `Shared to ${platform} successfully!`);
          console.log(`Shared to ${platform} via API`);
          setPlatformLoading(null);
          return;
        } else if (result.error) {
          // If direct API sharing fails, fall back to browser sharing
          console.warn(`Direct ${platform} sharing failed: ${result.error}`);
          toast.warning(`Direct ${platform} sharing unavailable. Falling back to browser sharing.`);
        }
      }
      
      // Fall back to browser sharing with both text and media
      setPlatformLoading(null); // Clear platform loading before starting browser sharing
      handleBrowserShare();
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      toast.error(`Failed to share to ${platform}. Trying browser sharing instead.`);
      setPlatformLoading(null);
      handleBrowserShare();
    }
  };

  const handleBrowserShare = async () => {
    try {
      setBrowserShareLoading(true);
      await onShareClick();
      console.log(`Shared via browser share API`);
    } catch (error) {
      console.error('Browser sharing error:', error);
      toast.error('Failed to share via browser. Please try copying the text and sharing manually.');
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
      
      {/* Fallback browser sharing option */}
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
        Share via Browser (WhatsApp, Telegram, etc.)
      </Button>
      
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
