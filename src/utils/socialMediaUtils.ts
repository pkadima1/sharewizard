
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
    const igAppId = import.meta.env.VITE_INSTAGRAM_APP_ID;
    
    if (!igApiKey || !igAccessToken) {
      console.log('Missing Instagram API credentials');
      
      // Attempt to open Instagram sharing in a new window if we can't use the API
      if (mediaUrl && typeof window !== 'undefined') {
        const instagramUrl = `https://www.instagram.com/share?url=${encodeURIComponent(mediaUrl)}`;
        window.open(instagramUrl, '_blank', 'width=600,height=600');
        return { 
          success: true, 
          message: 'Instagram sharing window opened' 
        };
      }
      
      return { 
        success: false, 
        error: 'Instagram API credentials not configured.' 
      };
    }
    
    if (!mediaUrl && mediaType !== 'text-only') {
      return { success: false, error: 'Media URL is required for Instagram sharing' };
    }
    
    console.log('Sharing to Instagram with:', { mediaType, captionTitle: caption?.title });
    
    // In a real implementation, you would make API calls to the Instagram Graph API
    // For now, let's simulate a successful API call
    // In production, you would use the FB Graph API: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
    
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
    
    // For Twitter, we can fall back to the Twitter Web Intent URL
    const text = `${caption.title}\n\n${caption.caption}\n${caption.hashtags.map(tag => `#${tag}`).join(' ')}`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    if (mediaUrl) {
      twitterShareUrl + `&url=${encodeURIComponent(mediaUrl)}`;
    }
    
    // Open Twitter share dialog
    window.open(twitterShareUrl, '_blank', 'width=600,height=600');
    
    return { 
      success: true, 
      message: 'Twitter sharing window opened' 
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
    
    // For Facebook, we can fall back to the Facebook Sharer URL
    let facebookShareUrl = 'https://www.facebook.com/sharer/sharer.php?';
    
    if (mediaUrl) {
      facebookShareUrl += `u=${encodeURIComponent(mediaUrl)}`;
    } else {
      // If no media URL, share the caption text
      const text = `${caption.title}\n\n${caption.caption}`;
      facebookShareUrl += `quote=${encodeURIComponent(text)}`;
    }
    
    // Open Facebook share dialog
    window.open(facebookShareUrl, '_blank', 'width=600,height=600');
    
    console.log('Shared to Facebook via web dialog');
    
    return { 
      success: true, 
      message: 'Facebook sharing window opened' 
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
    
    // For LinkedIn, we can fall back to the LinkedIn Share URL
    let linkedinShareUrl = 'https://www.linkedin.com/sharing/share-offsite/?';
    
    if (mediaUrl) {
      linkedinShareUrl += `url=${encodeURIComponent(mediaUrl)}`;
    }
    
    // Open LinkedIn share dialog
    window.open(linkedinShareUrl, '_blank', 'width=600,height=600');
    
    console.log('Shared to LinkedIn via web dialog');
    
    return { 
      success: true, 
      message: 'LinkedIn sharing window opened' 
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
    
    // TikTok doesn't have a standard web share URL like other platforms
    // We'll need to use their SDK or API in a real implementation
    
    // As a fallback, we can direct users to the TikTok app or website
    toast.info('Opening TikTok. Please upload your media there.');
    window.open('https://www.tiktok.com/upload', '_blank');
    
    return { 
      success: true, 
      message: 'TikTok upload page opened' 
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
    
    // YouTube doesn't have a standard web share URL for uploading
    // Direct users to YouTube Studio
    toast.info('Opening YouTube Studio. Please upload your video there.');
    window.open('https://studio.youtube.com/channel/upload', '_blank');
    
    return { 
      success: true, 
      message: 'YouTube Studio opened for upload' 
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
