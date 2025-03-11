
import React from 'react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { Caption, MediaType, CaptionStyle } from '@/types/mediaTypes';
import { SharingResult } from '@/types/sharingTypes';
import { delay } from '@/lib/utils';

/**
 * Shares content using the Web Share API with fallback mechanisms
 * @param previewRef Reference to the element containing the content to share
 * @param caption The caption data to share
 * @param mediaType The type of media being shared (text-only, image, video)
 * @returns A promise that resolves to a SharingResult object
 */
export const sharePreview = async (
  previewRef: React.RefObject<HTMLElement>,
  caption: Caption,
  mediaType: MediaType = 'text-only'
): Promise<SharingResult> => {
  // Format the caption text for sharing
  const captionText = formatCaptionForSharing(caption);
  
  // Check if Web Share API is available
  if (!navigator.share) {
    console.log('Web Share API not supported, using fallback');
    return fallbackShare(captionText);
  }
  
  try {
    // For text-only sharing, use simple Web Share API
    if (mediaType === 'text-only') {
      await navigator.share({
        title: caption.title,
        text: captionText
      });
      
      return {
        status: 'shared',
        message: 'Content shared successfully!',
        success: true
      };
    }
    
    // For media sharing, we need to check if file sharing is supported
    const sharableContent = previewRef.current?.querySelector('#sharable-content');
    
    if (!sharableContent) {
      throw new Error('Could not find sharable content element');
    }
    
    // Try to share with media file if possible
    if (mediaType === 'image') {
      try {
        // Attempt to share with image file
        if (canShareFiles()) {
          const imageBlob = await captureImageFromElement(sharableContent as HTMLElement);
          const imageFile = new File([imageBlob], 'share-image.png', { type: 'image/png' });
          
          await navigator.share({
            title: caption.title,
            text: captionText,
            files: [imageFile]
          });
          
          return {
            status: 'shared',
            message: 'Image shared successfully!',
            success: true
          };
        }
      } catch (fileShareError) {
        console.warn('File sharing failed, falling back to text sharing:', fileShareError);
        // Continue to text-only sharing fallback
      }
    } else if (mediaType === 'video') {
      try {
        // Attempt to share with video file if possible
        if (canShareFiles()) {
          const videoElement = sharableContent.querySelector('video');
          
          if (videoElement && videoElement.src) {
            try {
              // Try to fetch the video as a blob
              const response = await fetch(videoElement.src);
              const videoBlob = await response.blob();
              const videoFile = new File(
                [videoBlob], 
                'share-video.mp4', 
                { type: videoBlob.type || 'video/mp4' }
              );
              
              // Check if we can share this specific file
              if (navigator.canShare && navigator.canShare({ files: [videoFile] })) {
                await navigator.share({
                  title: caption.title,
                  text: captionText,
                  files: [videoFile]
                });
                
                return {
                  status: 'shared',
                  message: 'Video shared successfully!',
                  success: true
                };
              }
            } catch (videoError) {
              console.warn('Video sharing failed:', videoError);
              // Continue to text-only sharing fallback
            }
          }
        }
      } catch (videoShareError) {
        console.warn('Video sharing failed, falling back to text sharing:', videoShareError);
        // Continue to text-only sharing fallback
      }
    }
    
    // If we reach here, file sharing wasn't supported or failed
    // Fall back to sharing just the text with the Web Share API
    await navigator.share({
      title: caption.title,
      text: captionText
    });
    
    return {
      status: 'fallback',
      message: 'Shared caption text (media not supported by your device)',
      success: true
    };
    
  } catch (error: any) {
    // Check if the user cancelled the share
    if (error.name === 'AbortError') {
      return {
        status: 'cancelled',
        message: 'Sharing was cancelled',
        success: false
      };
    }
    
    console.error('Sharing error:', error);
    
    // Try fallback sharing method
    return fallbackShare(captionText);
  }
};

/**
 * Downloads the preview content as a file
 * @param previewRef Reference to the element containing the content to download
 * @param mediaType The type of media being downloaded
 * @param caption The caption data
 * @param filename Optional custom filename
 * @param captionStyle Style of caption to apply
 * @returns A promise that resolves when the download is complete
 */
export const downloadPreview = async (
  previewRef: React.RefObject<HTMLElement>,
  mediaType: MediaType,
  caption: Caption,
  filename?: string,
  captionStyle: CaptionStyle = 'standard'
): Promise<void> => {
  const defaultFilename = `caption-${Date.now()}`;
  const loadingToastId = `download-${Date.now()}`;
  
  try {
    const sharableContent = previewRef.current?.querySelector('#sharable-content');
    
    if (!sharableContent) {
      throw new Error('Could not find sharable content element');
    }
    
    // Handle different media types
    if (mediaType === 'video') {
      const video = sharableContent.querySelector('video');
      
      if (!video) {
        throw new Error('No video element found');
      }
      
      toast.loading('Processing video...', { id: loadingToastId });
      
      try {
        // Create captioned video with overlay
        const captionedVideoBlob = await createCaptionedVideo(video, caption, captionStyle);
        
        // Generate filename
        const videoFilename = `${filename || defaultFilename}.webm`;
        
        // Download the video
        downloadBlobAsFile(captionedVideoBlob, videoFilename, loadingToastId);
      } catch (error) {
        console.error('Error creating captioned video:', error);
        toast.error('Failed to process video for download', { id: loadingToastId });
        throw error;
      }
    } else if (mediaType === 'image') {
      // For image content
      toast.loading('Capturing image...', { id: loadingToastId });
      
      try {
        // Capture the entire content with html2canvas
        const canvas = await html2canvas(sharableContent as HTMLElement, {
          useCORS: true,
          scale: window.devicePixelRatio * 2, // Higher quality
          logging: false,
          backgroundColor: getComputedStyle(document.documentElement)
            .getPropertyValue('--background') || '#1e1e1e'
        });
        
        // Convert to blob
        const imageBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('Failed to create image blob')),
            'image/png',
            0.95 // High quality
          );
        });
        
        // Generate filename
        const imageFilename = `${filename || defaultFilename}.png`;
        
        // Download the image
        downloadBlobAsFile(imageBlob, imageFilename, loadingToastId);
      } catch (error) {
        console.error('Error capturing image for download:', error);
        toast.error('Failed to capture image for download', { id: loadingToastId });
        throw error;
      }
    } else {
      // For text-only content
      try {
        // Format the text
        const textContent = `${caption.title}\n\n${caption.caption}\n\n${caption.cta}\n\n${caption.hashtags.map(tag => `#${tag}`).join(' ')}`;
        
        // Create a text blob
        const textBlob = new Blob([textContent], { type: 'text/plain' });
        
        // Generate filename
        const textFilename = `${filename || defaultFilename}.txt`;
        
        // Download the text
        downloadBlobAsFile(textBlob, textFilename, loadingToastId);
      } catch (error) {
        console.error('Error creating text download:', error);
        toast.error('Failed to create text download', { id: loadingToastId });
        throw error;
      }
    }
    
    return Promise.resolve();
  } catch (error) {
    if (loadingToastId) {
      toast.error('Download failed', { id: loadingToastId });
    }
    console.error('Download preview error:', error);
    throw error;
  }
};

/**
 * Creates a captioned video by overlaying caption on video frames
 * This is a simplified implementation - in a real app, you'd use a more robust video processing library
 */
export const createCaptionedVideo = async (
  videoElement: HTMLVideoElement,
  caption: Caption,
  captionStyle: CaptionStyle = 'standard'
): Promise<Blob> => {
  // This is a placeholder implementation
  // In a real application, you would use a video processing library
  // or a server-side solution to properly add captions to videos
  
  // For now, we'll just return the original video as a blob
  try {
    const response = await fetch(videoElement.src);
    return await response.blob();
  } catch (error) {
    console.error('Error creating captioned video:', error);
    throw new Error('Failed to process video');
  }
};

/**
 * Formats a caption object into a shareable text string
 */
function formatCaptionForSharing(caption: Caption): string {
  const hashtagsText = caption.hashtags.map(tag => `#${tag}`).join(' ');
  return `${caption.title}\n\n${caption.caption}\n\n${caption.cta}\n\n${hashtagsText}`;
}

/**
 * Fallback sharing method when Web Share API is not available
 * Copies content to clipboard and shows a notification
 */
async function fallbackShare(text: string): Promise<SharingResult> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Content copied to clipboard!');
    return {
      status: 'fallback',
      message: 'Content copied to clipboard for sharing',
      success: true
    };
  } catch (error) {
    console.error('Clipboard fallback failed:', error);
    toast.error('Could not share or copy content. Please try manually copying the text.');
    return {
      status: 'fallback',
      error: 'Failed to copy to clipboard',
      success: false
    };
  }
}

/**
 * Checks if the browser supports sharing files
 */
function canShareFiles(): boolean {
  return !!(
    navigator.canShare && 
    navigator.share && 
    typeof navigator.canShare === 'function'
  );
}

/**
 * Captures an image from an HTML element using html2canvas
 */
async function captureImageFromElement(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    useCORS: true,
    scale: window.devicePixelRatio * 2,
    logging: false,
    backgroundColor: getComputedStyle(document.documentElement)
      .getPropertyValue('--background') || '#1e1e1e'
  });
  
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to create image blob')),
      'image/png',
      0.95
    );
  });
}

/**
 * Downloads a blob as a file
 */
function downloadBlobAsFile(blob: Blob, filename: string, toastId?: string): void {
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to the document, click it, and remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
  
  // Update toast if provided
  if (toastId) {
    toast.success(`Downloaded as ${filename}`, { id: toastId });
  }
}
