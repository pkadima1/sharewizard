
import { toast } from "sonner";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MediaType } from '@/types/mediaTypes';

interface SharingOptions {
  caption: any;
  mediaType?: MediaType;
  mediaUrl?: string | null;
}

interface ShareResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Instagram API sharing function
export const shareToInstagram = async (options: SharingOptions): Promise<ShareResult> => {
  try {
    const { caption, mediaType, mediaUrl } = options;
    
    // Check if Instagram API credentials are available
    const igApiKey = import.meta.env.VITE_INSTAGRAM_CLIENT_SECRET;
    const igAccessToken = import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN;
    
    if (!igApiKey || !igAccessToken) {
      return { 
        success: false, 
        error: 'Instagram API credentials not configured.' 
      };
    }
    
    if (!mediaUrl && mediaType !== 'text-only') {
      return { success: false, error: 'Media URL is required for Instagram sharing' };
    }
    
    console.log('Sharing to Instagram with:', { mediaType, captionTitle: caption?.title });
    
    // For demo purposes, simulate a successful API call
    // In a real implementation, you would make API calls to the Instagram Graph API
    
    return { 
      success: true, 
      message: 'Shared to Instagram successfully' 
    };
  } catch (error) {
    console.error('Instagram sharing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown Instagram sharing error' 
    };
  }
};

// Twitter API sharing function
export const shareToTwitter = async (options: SharingOptions): Promise<ShareResult> => {
  try {
    const { caption, mediaType, mediaUrl } = options;
    
    // Check if Twitter API credentials are available
    const twitterApiKey = import.meta.env.VITE_TWITTER_API_KEY;
    const twitterAccessToken = import.meta.env.VITE_TWITTER_ACCESS_TOKEN;
    
    if (!twitterApiKey || !twitterAccessToken) {
      return { 
        success: false, 
        error: 'Twitter API credentials not configured.' 
      };
    }
    
    console.log('Sharing to Twitter with:', { mediaType, captionTitle: caption?.title });
    
    // For demo purposes, simulate a successful API call
    // In a real implementation, you would make API calls to the Twitter API
    
    return { 
      success: true, 
      message: 'Shared to Twitter successfully' 
    };
  } catch (error) {
    console.error('Twitter sharing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown Twitter sharing error' 
    };
  }
};

// Facebook API sharing function
export const shareToFacebook = async (options: SharingOptions): Promise<ShareResult> => {
  try {
    const { caption, mediaType, mediaUrl } = options;
    
    // Check if Facebook API credentials are available
    const fbApiKey = import.meta.env.VITE_FACEBOOK_API_KEY;
    const fbAccessToken = import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN;
    
    if (!fbApiKey || !fbAccessToken) {
      return { 
        success: false, 
        error: 'Facebook API credentials not configured.' 
      };
    }
    
    console.log('Sharing to Facebook with:', { mediaType, captionTitle: caption?.title });
    
    // For demo purposes, simulate a successful API call
    // In a real implementation, you would make API calls to the Facebook Graph API
    
    return { 
      success: true, 
      message: 'Shared to Facebook successfully' 
    };
  } catch (error) {
    console.error('Facebook sharing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown Facebook sharing error' 
    };
  }
};

// LinkedIn API sharing function
export const shareToLinkedIn = async (options: SharingOptions): Promise<ShareResult> => {
  try {
    const { caption, mediaType, mediaUrl } = options;
    
    // Check if LinkedIn API credentials are available
    const linkedinApiKey = import.meta.env.VITE_LINKEDIN_API_KEY;
    const linkedinAccessToken = import.meta.env.VITE_LINKEDIN_ACCESS_TOKEN;
    
    if (!linkedinApiKey || !linkedinAccessToken) {
      return { 
        success: false, 
        error: 'LinkedIn API credentials not configured.' 
      };
    }
    
    console.log('Sharing to LinkedIn with:', { mediaType, captionTitle: caption?.title });
    
    // For demo purposes, simulate a successful API call
    // In a real implementation, you would make API calls to the LinkedIn API
    
    return { 
      success: true, 
      message: 'Shared to LinkedIn successfully' 
    };
  } catch (error) {
    console.error('LinkedIn sharing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown LinkedIn sharing error' 
    };
  }
};

// TikTok API sharing function
export const shareToTikTok = async (options: SharingOptions): Promise<ShareResult> => {
  try {
    const { caption, mediaType, mediaUrl } = options;
    
    // Check if TikTok API credentials are available
    const tiktokApiKey = import.meta.env.VITE_TIKTOK_API_KEY;
    const tiktokAccessToken = import.meta.env.VITE_TIKTOK_ACCESS_TOKEN;
    
    if (!tiktokApiKey || !tiktokAccessToken) {
      return { 
        success: false, 
        error: 'TikTok API credentials not configured.' 
      };
    }
    
    console.log('Sharing to TikTok with:', { mediaType, captionTitle: caption?.title });
    
    // For demo purposes, simulate a successful API call
    // In a real implementation, you would make API calls to the TikTok API
    
    return { 
      success: true, 
      message: 'Shared to TikTok successfully' 
    };
  } catch (error) {
    console.error('TikTok sharing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown TikTok sharing error' 
    };
  }
};

// YouTube API sharing function
export const shareToYouTube = async (options: SharingOptions): Promise<ShareResult> => {
  try {
    const { caption, mediaType, mediaUrl } = options;
    
    if (mediaType !== 'video') {
      return { 
        success: false, 
        error: 'Only videos can be shared to YouTube' 
      };
    }
    
    // Check if YouTube API credentials are available
    const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    const youtubeAccessToken = import.meta.env.VITE_YOUTUBE_ACCESS_TOKEN;
    
    if (!youtubeApiKey || !youtubeAccessToken) {
      return { 
        success: false, 
        error: 'YouTube API credentials not configured.' 
      };
    }
    
    console.log('Sharing to YouTube with:', { mediaType, captionTitle: caption?.title });
    
    // For demo purposes, simulate a successful API call
    // In a real implementation, you would make API calls to the YouTube API
    
    return { 
      success: true, 
      message: 'Shared to YouTube successfully' 
    };
  } catch (error) {
    console.error('YouTube sharing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown YouTube sharing error' 
    };
  }
};

// Main sharing function that routes to the appropriate platform
export const shareToPlatform = async (
  platform: string,
  options: SharingOptions
): Promise<ShareResult> => {
  try {
    // Normalize platform name to lowercase for consistent matching
    const normalizedPlatform = platform.toLowerCase();
    
    // Route to the appropriate platform sharing function
    switch (normalizedPlatform) {
      case 'instagram':
        return await shareToInstagram(options);
      case 'twitter':
        return await shareToTwitter(options);
      case 'facebook':
        return await shareToFacebook(options);
      case 'linkedin':
        return await shareToLinkedIn(options);
      case 'tiktok':
        return await shareToTikTok(options);
      case 'youtube':
        return await shareToYouTube(options);
      default:
        return {
          success: false,
          error: `Unsupported platform: ${platform}`
        };
    }
  } catch (error) {
    console.error(`Error sharing to ${platform}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `Unknown error sharing to ${platform}`
    };
  }
};

// Helper function to upload media to Firebase before sharing
export const uploadMediaForSharing = async (
  mediaUrl: string,
  mediaType: MediaType,
  filename: string
): Promise<string> => {
  try {
    // Fetch the media file
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch media for sharing');
    }
    
    const blob = await response.blob();
    
    // Upload to Firebase
    const storage = getStorage();
    const storageRef = ref(storage, `shared-media/${filename}`);
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading media for sharing:', error);
    throw error;
  }
};
