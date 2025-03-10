
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

// Helper function to generate a Firebase-hosted URL for sharing
const getFirebaseShareableUrl = async (mediaUrl: string | null, caption: any): Promise<string | null> => {
  if (!mediaUrl) return null;
  
  try {
    // First check if this is already a Firebase URL
    if (mediaUrl.includes('firebasestorage.googleapis.com')) {
      return mediaUrl;
    }
    
    // Fetch the media
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      console.error('Failed to fetch media for Firebase upload');
      return null;
    }
    
    const blob = await response.blob();
    const storage = getStorage();
    const timestamp = Date.now();
    const safeTitle = caption?.title ? caption.title.toLowerCase().replace(/[^\w]/g, '-') : 'share';
    const fileName = `shared-media/${safeTitle}-${timestamp}.${blob.type.includes('video') ? 'mp4' : 'png'}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error preparing media for sharing:', error);
    return null;
  }
};

// Instagram API sharing function
export const shareToInstagram = async (options: SharingOptions): Promise<ShareResult> => {
  try {
    const { caption, mediaType, mediaUrl } = options;
    
    // First upload to Firebase to get a stable URL if needed
    const shareableUrl = await getFirebaseShareableUrl(mediaUrl || null, caption);
    
    // Format caption text
    const formattedText = `${caption.title}\n\n${caption.caption}${caption.cta ? `\n\n${caption.cta}` : ''}${caption.hashtags?.length ? `\n\n${caption.hashtags.map((tag: string) => `#${tag}`).join(' ')}` : ''}`;
    
    // For Instagram, we directly open Instagram.com in mobile or the app intent on supported devices
    const useNativeApp = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (useNativeApp && shareableUrl) {
      // On mobile, try to use the app intent
      window.location.href = `instagram://library?AssetPath=${encodeURIComponent(shareableUrl)}`;
      
      // Set a timeout to check if the app was opened
      setTimeout(() => {
        // Fall back to web if the app didn't open
        window.open(`https://www.instagram.com/`, '_blank');
      }, 2500);
      
      return { 
        success: true, 
        message: 'Opening Instagram... Please complete sharing there.' 
      };
    } else {
      // On desktop, open Instagram.com
      window.open('https://www.instagram.com/', '_blank');
      
      // Try to copy the caption to clipboard for easy pasting
      await navigator.clipboard.writeText(formattedText);
      
      return { 
        success: true, 
        message: 'Instagram opened. Caption copied to clipboard for pasting!' 
      };
    }
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
    
    // First upload to Firebase to get a stable URL if needed
    const shareableUrl = await getFirebaseShareableUrl(mediaUrl || null, caption);
    
    // For Twitter, we can use the Twitter Web Intent URL
    const text = `${caption.title}\n\n${caption.caption}\n${caption.hashtags.map(tag => `#${tag}`).join(' ')}`;
    let twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    if (shareableUrl) {
      twitterShareUrl += `&url=${encodeURIComponent(shareableUrl)}`;
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
    
    // First upload to Firebase to get a stable URL if needed
    const shareableUrl = await getFirebaseShareableUrl(mediaUrl || null, caption);
    
    // For Facebook, different sharing methods based on what we have
    if (shareableUrl) {
      // If we have media, share the URL with optional quote
      const text = `${caption.title}\n\n${caption.caption}`;
      const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableUrl)}&quote=${encodeURIComponent(text)}`;
      window.open(fbShareUrl, '_blank', 'width=600,height=600');
    } else {
      // If no media, share just as a text feed post
      const fbFeedUrl = `https://www.facebook.com/dialog/feed?app_id=${import.meta.env.VITE_FACEBOOK_APP_ID || '1602291440389010'}&display=popup&link=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(`${caption.title}\n\n${caption.caption}`)}`;
      window.open(fbFeedUrl, '_blank', 'width=600,height=600');
    }
    
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
    
    // First upload to Firebase to get a stable URL if needed
    const shareableUrl = await getFirebaseShareableUrl(mediaUrl || null, caption);
    
    // Create a shareable text
    const shareText = `${caption.title}\n\n${caption.caption}${caption.cta ? `\n\n${caption.cta}` : ''}${caption.hashtags?.length ? `\n\n${caption.hashtags.map((tag: string) => `#${tag}`).join(' ')}` : ''}`;
    
    // LinkedIn requires a URL to share content
    let linkedinShareUrl;
    
    if (shareableUrl) {
      // If we have a Firebase URL for the media
      linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableUrl)}`;
    } else {
      // If we don't have media, share the current page with LinkedIn
      linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
      
      // Try to copy the text to clipboard for easy pasting
      try {
        await navigator.clipboard.writeText(shareText);
        toast.info('Caption copied to clipboard! You can paste it in LinkedIn.');
      } catch (err) {
        console.warn('Could not copy text to clipboard:', err);
      }
    }
    
    // Open LinkedIn share dialog
    window.open(linkedinShareUrl, '_blank', 'width=600,height=600');
    
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
    // Try to copy caption to clipboard for convenience
    const shareText = `${caption.title}\n\n${caption.caption}${caption.cta ? `\n\n${caption.cta}` : ''}${caption.hashtags?.length ? `\n\n${caption.hashtags.map((tag: string) => `#${tag}`).join(' ')}` : ''}`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      toast.info('Caption copied to clipboard! You can paste it in TikTok.');
    } catch (err) {
      console.warn('Could not copy text to clipboard:', err);
    }
    
    // Direct users to TikTok upload page
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
    
    // Try to copy caption to clipboard for convenience
    const shareText = `${caption.title}\n\n${caption.caption}${caption.cta ? `\n\n${caption.cta}` : ''}${caption.hashtags?.length ? `\n\n${caption.hashtags.map((tag: string) => `#${tag}`).join(' ')}` : ''}`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      toast.info('Video title and description copied to clipboard! You can paste it in YouTube.');
    } catch (err) {
      console.warn('Could not copy text to clipboard:', err);
    }
    
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
