
import html2canvas from 'html2canvas';
import { toast } from "sonner";

export type MediaType = 'image' | 'video' | 'text-only';

export interface Caption {
  title: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export type CaptionStyle = 'standard' | 'overlay';

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
      let toastId: string | undefined;
      
      // Set up video recording with audio
      originalVideo.onloadedmetadata = () => {
        // Create a loading toast for longer videos
        if (originalVideo.duration > 5) {
          // Fix: Convert number to string for toastId to match the expected type
          toastId = `${toast.success('Processing video with audio...', {
            id: 'video-processing',
            duration: 0
          })}`;
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
          videoBitsPerSecond: 2500000 // 2.5 Mbps for good quality
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
            if (captionStyle === 'overlay') {
              // Apply overlay caption directly on the video
              drawOverlayCaption(ctx, validatedCaption, videoElement.videoWidth, videoElement.videoHeight);
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

// Function to draw overlay style caption
function drawOverlayCaption(
  ctx: CanvasRenderingContext2D,
  caption: Caption,
  width: number,
  height: number
): void {
  // Apply semi-transparent overlay at the bottom for text readability
  const overlayHeight = height * 0.25; // 25% of the height for the overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, height - overlayHeight, width, overlayHeight);
  
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Set position for text - 20px from the bottom of the overlay
  let y = height - overlayHeight + 20;
  
  // Title with larger font
  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.fillText(truncateText(caption.title, ctx, width - 40), 20, y);
  y += 38;
  
  // Main caption with smaller font
  ctx.font = '22px Inter, sans-serif';
  
  // Word wrap the caption
  const captionLines = wrapText(ctx, caption.caption, width - 40, 24);
  for (const line of captionLines) {
    ctx.fillText(line, 20, y);
    y += 28;
    
    // Limit to 2 lines for overlay to prevent overflow
    if (captionLines.indexOf(line) === 1 && captionLines.length > 2) {
      ctx.fillText('...', 20, y);
      break;
    }
  }
  
  // Draw hashtags at the bottom right
  if (caption.hashtags.length > 0) {
    ctx.font = '18px Inter, sans-serif';
    ctx.fillStyle = '#3b82f6'; // Blue color for hashtags
    
    const hashtagText = caption.hashtags.map(tag => `#${tag}`).join(' ');
    ctx.textAlign = 'right';
    ctx.fillText(truncateText(hashtagText, ctx, width / 2), width - 20, height - 30);
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

  // Draw caption text
  ctx.fillStyle = 'white';
  let y = videoElement.videoHeight + 25;

  // Title
  ctx.font = 'bold 30px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const title = caption.title || 'Untitled';
  ctx.fillText(title, 25, y);
  y += 50;

  // Main caption text
  ctx.font = '24px Inter, sans-serif';
  const captionLines = wrapText(ctx, caption.caption || '', ctx.canvas.width - 50, 28);
  
  for (const line of captionLines) {
    ctx.fillText(line, 25, y);
    y += 32;
  }
  
  y += 10;

  // Draw hashtags
  if (caption.hashtags.length > 0) {
    ctx.fillStyle = '#3b82f6';  // Blue color for hashtags
    ctx.font = '22px Inter, sans-serif';
    
    const hashtagText = caption.hashtags.map(tag => `#${tag}`).join(' ');
    ctx.fillText(truncateText(hashtagText, ctx, ctx.canvas.width - 50), 25, y);
    y += 35;
  }

  // CTA if present
  if (caption.cta) {
    ctx.fillStyle = '#9ca3af';  // Gray color for CTA
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText(caption.cta, 25, y);
  }
}

// Helper function to wrap text
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
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

// Function to download video with captions
export const downloadCaptionedVideo = async (
  videoElement: HTMLVideoElement | null,
  caption: Caption,
  captionStyle: CaptionStyle = 'standard'
): Promise<void> => {
  if (!videoElement) {
    throw new Error("Video element not found");
  }
  
  // Show loading toast
  const toastId = toast.loading("Creating captioned video...");
  
  try {
    // Generate captioned video
    const captionedBlob = await createCaptionedVideo(videoElement, caption, captionStyle);
    
    // Create a download link
    const url = URL.createObjectURL(captionedBlob);
    const downloadLink = document.createElement('a');
    
    // Create filename from caption title or use default
    const filename = caption.title 
      ? `${caption.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.webm`
      : `captioned-video-${Date.now()}.webm`;
    
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast.success("Video downloaded successfully!", { id: toastId });
    
  } catch (error) {
    console.error("Error creating captioned video:", error);
    toast.error("Failed to download video", { id: toastId });
  }
};

// Download image with caption
export const downloadCaptionedImage = async (
  previewRef: React.RefObject<HTMLDivElement>
): Promise<void> => {
  if (!previewRef.current) {
    throw new Error("Preview element not found");
  }
  
  // Show loading toast
  const toastId = toast.loading("Creating image...");
  
  try {
    // Find the sharable content
    const sharableContent = previewRef.current.querySelector('#sharable-content');
    if (!sharableContent) {
      throw new Error("Sharable content not found");
    }
    
    // Create a canvas from the preview element
    const canvas = await html2canvas(sharableContent as HTMLElement, {
      useCORS: true,
      scale: 2,
      logging: false,
      backgroundColor: getComputedStyle(document.documentElement)
        .getPropertyValue('--background') || '#ffffff',
      ignoreElements: (element) => {
        // Ignore elements that shouldn't be captured
        return element.classList.contains('social-share-buttons') ||
               element.classList.contains('preview-controls');
      }
    });
    
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = canvas.toDataURL('image/png');
    downloadLink.download = `caption-image-${Date.now()}.png`;
    downloadLink.click();
    
    toast.success("Image downloaded successfully!", { id: toastId });
    
  } catch (error) {
    console.error("Error creating image:", error);
    toast.error("Failed to download image", { id: toastId });
  }
};

// Share content function that handles different media types
export const shareContent = async (
  previewRef: React.RefObject<HTMLDivElement>,
  caption: Caption,
  mediaType: MediaType,
  captionStyle: CaptionStyle = 'standard'
): Promise<void> => {
  if (!previewRef.current) {
    throw new Error("Preview element not found");
  }
  
  // Show loading toast
  const toastId = toast.loading("Preparing to share...");
  
  try {
    // Format caption text
    const formattedCaption = `${caption.title}\n\n${caption.caption}` + 
      (caption.cta ? `\n\n${caption.cta}` : '') + 
      (caption.hashtags.length > 0 ? `\n\n${caption.hashtags.map(tag => `#${tag}`).join(' ')}` : '');
    
    // Web Share API with file sharing if available
    if (navigator.share) {
      const shareData: ShareData = {
        title: caption.title,
        text: formattedCaption
      };
      
      // Try to share with file if possible
      if (mediaType !== 'text-only' && navigator.canShare) {
        // Find the media element
        const sharableContent = previewRef.current.querySelector('#sharable-content');
        if (!sharableContent) {
          throw new Error("Sharable content not found");
        }
        
        try {
          let file: File | undefined;
          
          if (mediaType === 'video') {
            // Get video element
            const video = sharableContent.querySelector('video');
            if (video) {
              // Create captioned video
              const captionedBlob = await createCaptionedVideo(video, caption, captionStyle);
              file = new File([captionedBlob], `video-${Date.now()}.webm`, { type: 'video/webm' });
            }
          } else if (mediaType === 'image') {
            // Create image from content
            const canvas = await html2canvas(sharableContent as HTMLElement, {
              useCORS: true,
              scale: 2,
              logging: false,
              backgroundColor: getComputedStyle(document.documentElement)
                .getPropertyValue('--background') || '#ffffff',
              ignoreElements: (element) => {
                return element.classList.contains('social-share-buttons') ||
                      element.classList.contains('preview-controls');
              }
            });
            
            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob(blob => resolve(blob!), 'image/png', 0.95);
            });
            
            file = new File([blob], `image-${Date.now()}.png`, { type: 'image/png' });
          }
          
          // Try to share with file
          if (file && navigator.canShare({ files: [file] })) {
            await navigator.share({
              ...shareData,
              files: [file]
            });
            
            toast.success("Content shared successfully!", { id: toastId });
            return;
          }
        } catch (fileError) {
          console.warn("File sharing failed, falling back to text-only share:", fileError);
        }
      }
      
      // Fallback to text-only sharing
      await navigator.share(shareData);
      toast.success("Caption shared successfully!", { id: toastId });
      
    } else {
      // Fallback for browsers without Web Share API
      await navigator.clipboard.writeText(formattedCaption);
      toast.success("Caption copied to clipboard!", { id: toastId });
    }
    
  } catch (error) {
    console.error("Error sharing content:", error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      // User cancelled the share
      toast.error("Sharing cancelled", { id: toastId });
    } else {
      toast.error("Failed to share content", { id: toastId });
    }
  }
};
