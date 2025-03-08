import html2canvas from 'html2canvas';
import { toast } from "sonner";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export type MediaType = 'image' | 'video' | 'text-only';

export interface Caption {
  title: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

// Add a new type for caption styles
export type CaptionStyle = 'standard' | 'handwritten';

// Helper function to create video with caption overlay
export const createCaptionedVideo = async (
  videoElement: HTMLVideoElement, 
  caption: Caption,
  captionStyle: CaptionStyle = 'standard'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Validate caption object to prevent errors
      const validatedCaption: Caption = {
        title: caption?.title || 'Untitled',
        caption: caption?.caption || '',
        cta: caption?.cta || '',
        hashtags: Array.isArray(caption?.hashtags) ? caption.hashtags : []
      };

      // Create a canvas with space for video and caption (if standard style)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Set canvas dimensions - only add extra height for standard captions
      canvas.width = videoElement.videoWidth;
      const captionHeight = captionStyle === 'standard' ? 220 : 0;
      canvas.height = videoElement.videoHeight + captionHeight;

      // Clone the original video to preserve audio
      const originalVideoSrc = videoElement.src;
      const originalVideo = document.createElement('video');
      originalVideo.src = originalVideoSrc;
      originalVideo.crossOrigin = 'anonymous';
      originalVideo.muted = false; // Ensure audio is enabled
      originalVideo.volume = 1.0;  // Max volume
      
      // Progress tracking for long videos
      let toastId: string | number | undefined;
      
      // Set up video recording with audio
      originalVideo.onloadedmetadata = () => {
        // Create a loading toast for longer videos
        if (originalVideo.duration > 5) {
          toastId = toast.loading('Processing video with audio...');
        }
        
        // Create media stream from canvas
        const canvasStream = canvas.captureStream();
        
        // Get audio track if possible
        let combinedStream: MediaStream;
        
        try {
          // Try getting the media stream directly from the video element
          const videoStream = (originalVideo as any).captureStream();
          const audioTracks = videoStream.getAudioTracks();
          
          if (audioTracks.length > 0) {
            // If we have audio tracks, combine with canvas stream
            audioTracks.forEach((track: MediaStreamTrack) => canvasStream.addTrack(track));
            combinedStream = canvasStream;
          } else {
            console.warn('No audio tracks found in video');
            combinedStream = canvasStream;
          }
        } catch (e) {
          console.warn('Could not capture audio track, falling back to video only:', e);
          combinedStream = canvasStream;
        }
        
        // Media recorder options with audio support
        const recorderOptions = {
          mimeType: 'video/webm;codecs=vp8,opus', // Include opus for audio
          videoBitsPerSecond: 2500000 // 3 Mbps for good quality
        };
        
        // Fallback if the preferred codec isn't supported
        let mediaRecorder: MediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
        } catch (e) {
          console.warn('Preferred codec not supported, using default:', e);
          mediaRecorder = new MediaRecorder(combinedStream);
        }

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          // Clean up
          if (toastId) {
            toast.dismiss(toastId);
          }
          
          const finalBlob = new Blob(chunks, { type: 'video/webm' });
          resolve(finalBlob);
        };

        // Start playing and recording
        originalVideo.play().then(() => {
          // Start recording
          mediaRecorder.start(100); // Collect data in 100ms chunks for better performance

          // Function to draw a frame
          const drawFrame = () => {
            // Clear canvas
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw video frame
            ctx.drawImage(originalVideo, 0, 0);

            // Choose which style to render
            if (captionStyle === 'handwritten') {
              // Apply handwritten font overlay directly on the video
              drawHandwrittenOverlay(ctx, validatedCaption, videoElement.videoWidth, videoElement.videoHeight);
            } else {
              // Draw standard caption with background
              drawStandardCaption(ctx, validatedCaption, videoElement, captionHeight);
            }

            // Request next frame if video is still playing
            if (!originalVideo.ended && !originalVideo.paused) {
              requestAnimationFrame(drawFrame);
            } else {
              // Make sure we have at least 500ms of data
              setTimeout(() => {
                mediaRecorder.stop();
              }, 500);
            }
          };

          // Start drawing frames
          drawFrame();

          // Stop recording when video ends
          originalVideo.onended = () => {
            setTimeout(() => {
              if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
              }
            }, 500);
          };
        }).catch(err => {
          if (toastId) {
            toast.dismiss(toastId);
          }
          reject(err);
        });
      };
      
      originalVideo.onerror = (e) => {
        if (toastId) {
          toast.dismiss(toastId);
        }
        reject(new Error(`Video loading error: ${e}`));
      };
      
    } catch (error) {
      reject(error);
    }
  });
};

// Function to draw handwritten style overlay
function drawHandwrittenOverlay(
  ctx: CanvasRenderingContext2D,
  caption: Caption,
  width: number,
  height: number
): void {
  // Apply semi-transparent overlay to improve text readability
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, width, height);
  
  // Set handwritten-style font
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Title - Large, handwritten style font
  ctx.font = 'bold 45px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  // Draw title at the top
  const title = caption.title || 'Untitled';
  ctx.fillText(truncateText(title, ctx, width * 0.9), width / 2, height * 0.2);
  
  // Main caption with different handwritten font
  ctx.font = '32px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive';
  const captionText = caption.caption || '';
  
  // Word wrap for caption text
  wrapHandwrittenText(ctx, captionText, width / 2, height / 2, width * 0.8, 40);
  
  // CTA and hashtags at bottom
  if (caption.hashtags && caption.hashtags.length > 0) {
    ctx.font = '28px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive';
    ctx.fillStyle = '#3b82f6'; // Blue for hashtags
    const hashtagText = caption.hashtags.map(tag => `#${tag}`).join(' ');
    ctx.fillText(truncateText(hashtagText, ctx, width * 0.9), width / 2, height * 0.85);
  }
  
  // CTA with subtle styling
  if (caption.cta) {
    ctx.font = '26px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive';
    ctx.fillStyle = '#e2e8f0'; // Light color for CTA
    ctx.fillText(truncateText(caption.cta, ctx, width * 0.9), width / 2, height * 0.92);
  }
}

// Function to draw the standard caption style
function drawStandardCaption(
  ctx: CanvasRenderingContext2D,
  caption: Caption,
  videoElement: HTMLVideoElement,
  captionHeight: number
): void {
  // Draw caption background
  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, videoElement.videoHeight, ctx.canvas.width, captionHeight);

  // Draw caption text with enhanced styling for maximum readability
  ctx.fillStyle = 'white';
  let y = videoElement.videoHeight + 25; // Optimize top margin

  // Apply professional text shadow for better contrast on any background
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 1.5;
  ctx.shadowOffsetY = 1.5;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top'; // Ensures consistent text positioning

  // Title - Bold, title case for emphasis (instead of uppercase)
  ctx.font = 'bold 38px Inter, system-ui, sans-serif'; // Increased size for better visibility
  const title = caption.title 
    ? toTitleCase(caption.title) 
    : 'Untitled';
  ctx.fillText(title, 25, y);
  y += 50; // Increased spacing after title for better visual hierarchy

  // Reset shadow for body text (more subtle)
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // Main caption text with improved readability
  ctx.font = '26px Inter, system-ui, sans-serif'; // Slightly larger for better readability
  const captionText = caption.caption || '';

  // Apply the wrapping with specified constraints
  const maxWidth = ctx.canvas.width - 50; // Leave margins on both sides
  const lineHeight = 32; // Increased line height for better readability
  y = wrapStandardText(ctx, captionText, 25, y, maxWidth, lineHeight);
  y += 10; // Add a little extra space before hashtags

  // Draw hashtags
  const hashtags = Array.isArray(caption.hashtags) ? caption.hashtags : [];
  
  if (hashtags.length > 0) {
    ctx.fillStyle = '#3b82f6';  // Blue color for hashtags
    const hashtagText = hashtags.map(tag => `#${tag}`).join(' ');
    
    // Handle long hashtag text
    const hashtagLines = [];
    let hashtagLine = '';
    const hashtagWords = hashtagText.split(' ');
    
    for (const tag of hashtagWords) {
      const testLine = hashtagLine + tag + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > ctx.canvas.width - 40) {
        hashtagLines.push(hashtagLine.trim());
        hashtagLine = tag + ' ';
      } else {
        hashtagLine = testLine;
      }
    }
    
    // Add remaining line
    if (hashtagLine.trim()) {
      hashtagLines.push(hashtagLine.trim());
    }
    
    // Draw all hashtag lines
    for (const line of hashtagLines) {
      ctx.fillText(line, 20, y);
      y += 25;
    }
  } else {
    y += 5; // Still add some space even if no hashtags
  }

  // CTA
  const cta = caption.cta || '';
  
  if (cta) {
    ctx.fillStyle = '#9ca3af';  // Gray color for CTA
    
    // Handle multi-line CTA if needed
    const ctaLines = [];
    let ctaLine = '';
    const ctaWords = cta.split(' ');
    
    for (const word of ctaWords) {
      const testLine = ctaLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > ctx.canvas.width - 40) {
        ctaLines.push(ctaLine.trim());
        ctaLine = word + ' ';
      } else {
        ctaLine = testLine;
      }
    }
    
    // Add remaining line
    if (ctaLine.trim()) {
      ctaLines.push(ctaLine.trim());
    }
    
    // Draw all CTA lines
    for (const line of ctaLines) {
      ctx.fillText(line, 20, y);
      y += 25;
    }
  }
}

// Helper function to wrap text for handwritten style (centered)
function wrapHandwrittenText(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];
  
  // Calculate wrapped lines first
  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = context.measureText(testLine);
    
    if (metrics.width > maxWidth && line !== '') {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  
  // Add the last line
  if (line.trim() !== '') {
    lines.push(line.trim());
  }
  
  // Now draw all lines centered around centerY
  const totalTextHeight = lines.length * lineHeight;
  let y = centerY - (totalTextHeight / 2) + (lineHeight / 2);
  
  for (const line of lines) {
    context.fillText(line, centerX, y);
    y += lineHeight;
  }
}

// Helper function to wrap text for standard style (left-aligned)
function wrapStandardText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words: string[] = text.split(' ');
  let line: string = '';
  let currentY: number = y;
  
  for (const word of words) {
    const testLine: string = line + word + ' ';
    const metrics: TextMetrics = context.measureText(testLine);
    
    if (metrics.width > maxWidth && line !== '') {
      context.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
      
      // Safety check: Reduce font if we're running out of space
      if (currentY > y + 150) {
        context.font = '20px Inter, system-ui, sans-serif';
      }
    } else {
      line = testLine;
    }
  }
  
  // Draw the last line if it's not empty
  if (line.trim() !== '') {
    context.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  
  return currentY; // Return the new Y position
}

// Helper function to truncate text with ellipsis if too long
function truncateText(text: string, ctx: CanvasRenderingContext2D, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
    truncated = truncated.substring(0, truncated.length - 1);
  }
  
  return truncated + '...';
}

// Helper function to upload to Firebase
const uploadToFirebase = async (blob: Blob, caption: Caption, mediaType: MediaType): Promise<string> => {
  const storage = getStorage();
  const fileName = `previews/${caption.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${mediaType === 'video' ? 'webm' : 'png'}`;
  const storageRef = ref(storage, fileName);
  
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

// Share preview function
export const sharePreview = async (
  previewRef: React.RefObject<HTMLDivElement>,
  caption: Caption,
  mediaType: MediaType
): Promise<{ status: 'shared' | 'fallback' | 'cancelled'; message?: string }> => {
  if (!previewRef.current) throw new Error('Preview element not found');

  try {
    // Target the sharable-content element instead of preview-content
    const sharableContent = previewRef.current.querySelector('#sharable-content');
    if (!sharableContent) throw new Error('Sharable content not found');

    // Format the caption text properly
    const formattedCaption = `${caption.title}\n\n${caption.caption}\n\n${caption.cta}\n\n${caption.hashtags.map(tag => `#${tag}`).join(' ')}`;    
    // Create basic share data
    const shareData: ShareData = {
      title: caption.title,
      text: formattedCaption
    };

    // Check if Web Share API is available
    if (navigator.share) {
      // Handle different media types for file sharing
      if (mediaType !== 'text-only' && navigator.canShare) {
        try {
          let mediaFile: File | undefined;
          
          // Show a loading indicator
          const loadingToastId = toast.loading('Preparing media for sharing...');
          
          if (mediaType === 'video') {
            // For video content
            const video = sharableContent.querySelector('video');
            if (video && video.src) {
              // Fetch the video file
              const response = await fetch(video.src);
              if (!response.ok) throw new Error('Failed to fetch video');
              
              const blob = await response.blob();
              mediaFile = new File([blob], `video-${Date.now()}.mp4`, { 
                type: blob.type || 'video/mp4' 
              });
            }
          } else if (mediaType === 'image') {
            // For image content
            const canvas = await html2canvas(sharableContent as HTMLElement, {
              useCORS: true,
              scale: 2,
              logging: false,
              backgroundColor: getComputedStyle(document.documentElement)
                .getPropertyValue('--background') || '#ffffff',
              ignoreElements: (element) => {
                // Ignore any elements that shouldn't be captured
                return element.classList.contains('social-share-buttons') ||
                      element.classList.contains('preview-controls');
              }
            });
            
            const blob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (b) => b ? resolve(b) : reject(new Error('Failed to create blob')), 
                'image/png', 
                0.95
              );
            });
            
            mediaFile = new File([blob], `image-${Date.now()}.png`, { 
              type: 'image/png' 
            });
          }
          
          // Dismiss loading indicator
          toast.dismiss(loadingToastId);
          
          // Try to share with the media file
          if (mediaFile && navigator.canShare({ files: [mediaFile] })) {
            await navigator.share({
              ...shareData,
              files: [mediaFile]
            });
            
            return { 
              status: 'shared', 
              message: 'Content shared successfully!' 
            };
          }
        } catch (fileError) {
          console.warn('File sharing failed, falling back to text-only share:', fileError);
          // Continue to text-only sharing if file sharing fails
        }
      }
      
      // Text-only sharing as fallback
      await navigator.share(shareData);
      return { status: 'shared', message: 'Caption shared successfully!' };
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(formattedCaption);
        return { 
          status: 'fallback', 
          message: 'Caption copied to clipboard! You can paste it into your social media app.' 
        };
      } catch (clipboardError) {
        console.error('Clipboard fallback failed:', clipboardError);
        throw new Error('Sharing not supported on this browser');
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { status: 'cancelled' };
    }
    console.error('Error sharing content:', error);
    throw error;
  }
};

// Fix the downloadPreview function to properly handle different media types
export const downloadPreview = async (
  previewRef: React.RefObject<HTMLDivElement>,
  mediaType: MediaType,
  caption: Caption,
  filename?: string,
  captionStyle: CaptionStyle = 'standard'
): Promise<void> => {
  if (!previewRef.current) throw new Error('Preview element not found');

  // Target the sharable-content element
  const sharableContent = previewRef.current.querySelector('#sharable-content');
  if (!sharableContent) throw new Error('Sharable content not found');
  
  // Create a loading toast
  const loadingToastId = toast.loading('Preparing download...');

  try {
    // Generate a slugified version of the caption title for the filename
    const slugifiedTitle = caption.title
      ? caption.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special chars
          .replace(/\s+/g, '-')     // Replace spaces with hyphens
          .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
      : 'untitled';
    
    // Use provided filename or generate one based on caption title
    const defaultFilename = `${slugifiedTitle}-${Date.now()}`;

    if (mediaType === 'video') {
      // For video content
      const video = sharableContent.querySelector('video');
      if (!video || !video.src) throw new Error('Video source not found');

      // Create video with selected caption style
      toast.loading(`Creating video with ${captionStyle} style...`, { id: loadingToastId });
      
      try {
        // Pass the caption style to createCaptionedVideo
        const captionedBlob = await createCaptionedVideo(video, caption, captionStyle);
        const url = URL.createObjectURL(captionedBlob);
        
        // Create download link with title-based filename
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename || `${defaultFilename}.webm`;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
        toast.success(`Video with ${captionStyle} captions downloaded!`, { id: loadingToastId });
      } catch (captionError) {
        console.error('Error creating captioned video:', captionError);
        toast.error('Failed to create captioned video, downloading original instead', { id: loadingToastId });
        
        // Fallback to original video, still using title-based filename
        await downloadOriginalVideo(video, filename || `${defaultFilename}-original.mp4`, loadingToastId);
      }
    } else {
      // For image or text, create a screenshot with title-based filename
      const canvas = await html2canvas(sharableContent as HTMLElement, {
        useCORS: true,
        scale: 2,
        logging: false,
        backgroundColor: getComputedStyle(document.documentElement)
          .getPropertyValue('--background') || '#ffffff',
        ignoreElements: (element) => {
          // Ignore any elements that shouldn't be captured
          return element.classList.contains('social-share-buttons') ||
                 element.classList.contains('preview-controls');
        }
      });
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.download = filename || `${defaultFilename}.png`;
      downloadLink.click();
      
      toast.success('Content downloaded successfully!', { id: loadingToastId });
    }
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download content', { id: loadingToastId });
    throw error;
  }
};

// Helper function to download original video
async function downloadOriginalVideo(
  video: HTMLVideoElement, 
  filename?: string, 
  toastId?: string | number
): Promise<void> {
  // Fetch the video
  const response = await fetch(video.src);
  if (!response.ok) throw new Error('Failed to fetch video');
  
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  
  // Create download link
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = filename || `video-${Date.now()}.${blob.type?.split('/')[1] || 'mp4'}`;
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  
  // Clean up the object URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
  
  if (toastId) {
    toast.success('Original video downloaded successfully!', { id: toastId });
  }
}

/**
 * Helper function to check if the Web Share API is available
 */
export const isWebShareSupported = (): boolean => {
  return typeof navigator !== 'undefined' && !!navigator.share;
};

/**
 * Helper function to check if file sharing is supported
 */
export const isFileShareSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 
         !!navigator.share && 
         !!navigator.canShare;
};

/**
 * Tracks social sharing events for analytics
 * @param platform The platform where content was shared
 * @param mediaType The type of media that was shared
 * @param success Whether the sharing was successful
 */
export const trackSocialShare = (
  platform: string,
  mediaType: MediaType,
  success: boolean = true
): void => {
  try {
    // Log the share event
    console.log(`Content shared to ${platform}: ${mediaType} (${success ? 'success' : 'failed'})`);
    
    // Here you would typically send an analytics event
    // Examples (uncomment the one that matches your analytics setup):
    
    // For Google Analytics 4
    // if (typeof window !== 'undefined' && (window as any).gtag) {
    //   (window as any).gtag('event', 'share', {
    //     event_category: 'engagement',
    //     event_label: platform,
    //     content_type: mediaType,
    //     success: success
    //   });
    // }
    
    // For Segment/Amplitude/Mixpanel style analytics
    // if (typeof window !== 'undefined' && (window as any).analytics) {
    //   (window as any).analytics.track('Content Shared', {
    //     platform,
    //     mediaType,
    //     success
    //   });
    // }
    
  } catch (error) {
    // Silently fail to prevent breaking the app flow
    console.error('Error tracking share event:', error);
  }
};

/**
 * Formats a string in Title Case (first letter of each word capitalized)
 * @param text The input string to format
 * @returns The formatted string in Title Case
 */
function toTitleCase(text: string): string {
  return text
    .split(' ')
    .map(word => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
