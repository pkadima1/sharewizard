
import { toast } from "sonner";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MediaType } from '@/types/mediaTypes';
import { createCaptionedVideo } from '@/utils/sharingUtils';

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
const getFirebaseShareableUrl = async (mediaUrl: string | null, caption: any, mediaType: MediaType = 'text-only'): Promise<string | null> => {
  if (!mediaUrl) return null;
  
  try {
    // First check if this is already a Firebase URL
    if (mediaUrl.includes('firebasestorage.googleapis.com')) {
      return mediaUrl;
    }
    
    console.log(`Preparing ${mediaType} for sharing to Firebase`);
    
    // For videos, we need to process them with captions before uploading
    if (mediaType === 'video') {
      try {
        // Create a temporary video element to load the source
        const videoElement = document.createElement('video');
        videoElement.crossOrigin = "anonymous";
        videoElement.src = mediaUrl;
        
        // Wait for the video to be loaded enough to be processed
        await new Promise<void>((resolve, reject) => {
          videoElement.onloadeddata = () => resolve();
          videoElement.onerror = () => reject(new Error("Failed to load video"));
          videoElement.load();
        });
        
        console.log("Video loaded, processing with captions...");
        
        // Process the video with captions
        const captionedVideoBlob = await createCaptionedVideo(videoElement, caption);
        
        // Upload the processed video
        const storage = getStorage();
        const timestamp = Date.now();
        const safeTitle = caption?.title 
          ? caption.title.toLowerCase().replace(/[^\w]/g, '-').substring(0, 30) 
          : 'share';
        const fileName = `shared-media/${safeTitle}-${timestamp}.webm`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, captionedVideoBlob);
        return await getDownloadURL(storageRef);
      } catch (error) {
        console.error('Error processing video for sharing:', error);
        // Fall back to the original URL
        return mediaUrl;
      }
    }
    
    // For images and other media
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      console.error('Failed to fetch media for Firebase upload');
      return null;
    }
    
    const blob = await response.blob();
    const storage = getStorage();
    const timestamp = Date.now();
    const safeTitle = caption?.title 
      ? caption.title.toLowerCase().replace(/[^\w]/g, '-').substring(0, 30) 
      : 'share';
    const fileName = `shared-media/${safeTitle}-${timestamp}.${blob.type.includes('video') ? 'mp4' : 'png'}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error preparing media for sharing:', error);
    return null;
  }
};

// Prepare the caption text with proper formatting
const formatCaptionForSharing = (caption: any): string => {
  if (!caption) return '';
  
  const titleText = caption.title || '';
  const captionText = caption.caption || '';
  const ctaText = caption.cta || '';
  const hashtagsText = Array.isArray(caption.hashtags) 
    ? caption.hashtags.map((tag: string) => `#${tag}`).join(' ') 
    : '';
  
  return `${titleText}\n\n${captionText}${ctaText ? `\n\n${ctaText}` : ''}${hashtagsText ? `\n\n${hashtagsText}` : ''}`;
};

// Instagram API sharing function
export const shareToInstagram = async (options: SharingOptions): Promise<ShareResult> => {
  try {
    const { caption, mediaType, mediaUrl } = options;
    
    // Format caption text
    const formattedText = formatCaptionForSharing(caption);
    
    // First upload to Firebase to get a stable URL if needed
    const shareableUrl = await getFirebaseShareableUrl(mediaUrl || null, caption, mediaType);
    console.log("Prepared Instagram shareable URL:", shareableUrl);
    
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
    
    // Format caption text for Twitter (limit to ~280 chars)
    const tweetText = formatCaptionForSharing(caption);
    const truncatedText = tweetText.length > 260 
      ? tweetText.substring(0, 257) + '...' 
      : tweetText;
    
    // For Twitter, we can use the Web Intent URL without media
    // Twitter will handle the media attachment in its own interface
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(truncatedText)}`;
    
    // Open Twitter share dialog
    window.open(twitterShareUrl, '_blank', 'width=600,height=600');
    
    // If we have media, copy it to clipboard for manual attachment
    if (mediaUrl) {
      try {
        // First upload to Firebase to get a stable URL if needed
        const shareableUrl = await getFirebaseShareableUrl(mediaUrl, caption, mediaType);
        
        // Notify user to download and attach media manually
        if (shareableUrl) {
          // Open the media in a new tab for easy saving
          window.open(shareableUrl, '_blank');
          toast.info('Media opened in a new tab. Save it and attach to your tweet.');
        }
      } catch (error) {
        console.error('Error preparing media for Twitter:', error);
      }
    }
    
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
    
    // Format caption text
    const formattedText = formatCaptionForSharing(caption);
    
    // First upload to Firebase to get a stable URL if needed
    let shareableUrl = '';
    
    if (mediaUrl) {
      const result = await getFirebaseShareableUrl(mediaUrl, caption, mediaType);
      if (result) {
        shareableUrl = result;
      } else {
        shareableUrl = window.location.href; // Fallback to the app URL
      }
    } else {
      shareableUrl = window.location.href; // Default to the app URL
    }
    
    console.log("Prepared Facebook sharing URL:", shareableUrl);
    
    // For Facebook, use Dialog API to ensure better compatibility
    const fbShareUrl = `https://www.facebook.com/dialog/share?app_id=${import.meta.env.VITE_FACEBOOK_APP_ID || '1602291440389010'}&href=${encodeURIComponent(shareableUrl)}&quote=${encodeURIComponent(formattedText)}&display=popup`;
    
    window.open(fbShareUrl, '_blank', 'width=600,height=600');
    
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
    
    // Format caption text
    const formattedText = formatCaptionForSharing(caption);
    
    // Try to copy the text to clipboard for easy pasting
    try {
      await navigator.clipboard.writeText(formattedText);
      toast.info('Caption copied to clipboard! You can paste it in LinkedIn.');
    } catch (err) {
      console.warn('Could not copy text to clipboard:', err);
    }
    
    // For LinkedIn, we need to use their feed URL which doesn't directly accept media
    // We'll open LinkedIn compose window and let users paste the caption
    window.open('https://www.linkedin.com/post/new', '_blank', 'width=600,height=600');
    
    // If we have media, open it in a new tab for easy saving
    if (mediaUrl) {
      try {
        // First upload to Firebase to get a stable URL if needed
        const shareableUrl = await getFirebaseShareableUrl(mediaUrl, caption, mediaType);
        
        if (shareableUrl) {
          // Open the media in a new tab for easy saving
          window.open(shareableUrl, '_blank');
          toast.info('Media opened in a new tab. Save it and attach to your LinkedIn post.');
        }
      } catch (error) {
        console.error('Error preparing media for LinkedIn:', error);
      }
    }
    
    return { 
      success: true, 
      message: 'LinkedIn post window opened' 
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
    const shareText = formatCaptionForSharing(caption);
    
    try {
      await navigator.clipboard.writeText(shareText);
      toast.info('Caption copied to clipboard! You can paste it in TikTok.');
    } catch (err) {
      console.warn('Could not copy text to clipboard:', err);
    }
    
    // If we have media, upload it to Firebase and open in a new tab for saving
    if (mediaUrl) {
      try {
        const shareableUrl = await getFirebaseShareableUrl(mediaUrl, caption, mediaType);
        
        if (shareableUrl) {
          // Open the media in a new tab for easy saving
          window.open(shareableUrl, '_blank');
          toast.info('Media opened in a new tab. Save it and upload to TikTok.');
        }
      } catch (error) {
        console.error('Error preparing media for TikTok:', error);
      }
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
    const shareText = formatCaptionForSharing(caption);
    
    try {
      await navigator.clipboard.writeText(shareText);
      toast.info('Video title and description copied to clipboard! You can paste it in YouTube.');
    } catch (err) {
      console.warn('Could not copy text to clipboard:', err);
    }
    
    // If we have media, upload it to Firebase and open in a new tab for saving
    if (mediaUrl) {
      try {
        const shareableUrl = await getFirebaseShareableUrl(mediaUrl, caption, mediaType);
        
        if (shareableUrl) {
          // Open the media in a new tab for easy saving
          window.open(shareableUrl, '_blank');
          toast.info('Video opened in a new tab. Save it and upload to YouTube.');
        }
      } catch (error) {
        console.error('Error preparing media for YouTube:', error);
      }
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
  caption: any
): Promise<string> => {
  return getFirebaseShareableUrl(mediaUrl, caption, mediaType) || '';
};
