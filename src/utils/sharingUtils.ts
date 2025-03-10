import html2canvas from 'html2canvas';
import { toast } from "sonner";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MediaType, Caption, CaptionStyle, DownloadOptions } from '@/types/mediaTypes';

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

      // Create a canvas with space for video and caption
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Set canvas dimensions based on caption style
      canvas.width = videoElement.videoWidth;
      const captionHeight = captionStyle === 'standard' ? 260 : 0; // Increased height for caption
      canvas.height = videoElement.videoHeight + (captionStyle === 'standard' ? captionHeight : 0);

      // Clone video element to preserve original
      const originalVideo = document.createElement('video');
      originalVideo.src = videoElement.src;
      originalVideo.crossOrigin = 'anonymous';
      originalVideo.muted = false;
      originalVideo.volume = 1.0;
      originalVideo.playsInline = true; // Add playsInline for better compatibility

      // Progress tracking for long videos
      let toastId: string | number | undefined;

      originalVideo.onloadedmetadata = () => {
        if (originalVideo.duration > 5) {
          toastId = toast.loading('Processing video with captions...');
        }

        // Create media stream from canvas
        const canvasStream = canvas.captureStream(30); // Specify 30fps for better quality
        let combinedStream: MediaStream;

        try {
          const videoStream = (originalVideo as any).captureStream();
          const audioTracks = videoStream.getAudioTracks();

          if (audioTracks.length > 0) {
            audioTracks.forEach((track: MediaStreamTrack) => canvasStream.addTrack(track));
          }
          combinedStream = canvasStream;
        } catch (e) {
          console.warn('Could not capture audio track:', e);
          combinedStream = canvasStream;
        }

        // Use higher quality encoding settings
        const recorderOptions = {
          mimeType: 'video/webm;codecs=vp9,opus', // Use VP9 for better quality
          videoBitsPerSecond: 8000000 // Increase bitrate for better quality (8 Mbps)
        };

        let mediaRecorder: MediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
        } catch (e) {
          console.warn('Preferred codec not supported, trying vp8:', e);
          try {
            mediaRecorder = new MediaRecorder(combinedStream, {
              mimeType: 'video/webm;codecs=vp8,opus',
              videoBitsPerSecond: 6000000 // 6 Mbps fallback
            });
          } catch (e2) {
            console.warn('Falling back to default codec:', e2);
            mediaRecorder = new MediaRecorder(combinedStream);
          }
        }

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (toastId) {
            toast.dismiss(toastId);
          }
          const finalBlob = new Blob(chunks, { type: 'video/webm' });
          resolve(finalBlob);
        };

        // Start playing and recording
        originalVideo.play().then(() => {
          mediaRecorder.start(100);

          // Function to draw a frame
          const drawFrame = () => {
            // Clear canvas
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw video frame
            ctx.drawImage(originalVideo, 0, 0);

            // Draw caption based on style
            if (captionStyle === 'handwritten') {
              drawHandwrittenOverlay(ctx, validatedCaption, videoElement.videoWidth, videoElement.videoHeight);
            } else {
              drawStandardCaption(ctx, validatedCaption, videoElement, captionHeight);
            }

            // Request next frame if video is still playing
            if (!originalVideo.ended && !originalVideo.paused) {
              requestAnimationFrame(drawFrame);
            } else {
              setTimeout(() => {
                mediaRecorder.stop();
              }, 500);
            }
          };

          // Start drawing frames
          drawFrame();

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
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Increased opacity for better contrast
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
  
  // CTA with proper styling
  if (caption.cta) {
    ctx.font = '28px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive';
    ctx.fillStyle = '#e2e8f0'; // Light color for CTA
    ctx.fillText(truncateText(caption.cta, ctx, width * 0.9), width / 2, height * 0.75);
  }
  
  // Hashtags at the very bottom
  if (caption.hashtags && caption.hashtags.length > 0) {
    ctx.font = '28px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive';
    ctx.fillStyle = '#3b82f6'; // Blue for hashtags
    
    // Handle multiple hashtags with wrapping if needed
    const hashtagText = caption.hashtags.map(tag => `#${tag}`).join(' ');
    
    // Multiple lines for longer hashtag lists
    if (ctx.measureText(hashtagText).width > width * 0.9) {
      const hashtagLines = [];
      let currentLine = '';
      const tags = hashtagText.split(' ');
      
      for (const tag of tags) {
        const testLine = currentLine + tag + ' ';
        if (ctx.measureText(testLine).width > width * 0.9) {
          hashtagLines.push(currentLine.trim());
          currentLine = tag + ' ';
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine.trim()) {
        hashtagLines.push(currentLine.trim());
      }
      
      // Draw each line of hashtags
      let lineY = height * 0.85;
      for (const line of hashtagLines) {
        ctx.fillText(line, width / 2, lineY);
        lineY += 35; // Line spacing
      }
    } else {
      ctx.fillText(hashtagText, width / 2, height * 0.85);
    }
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
  let y = videoElement.videoHeight + 25; // Starting position

  // Apply professional text shadow for better contrast
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 1.5;
  ctx.shadowOffsetY = 1.5;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Title - Bold, title case for emphasis
  ctx.font = 'bold 38px Inter, system-ui, sans-serif';
  const title = caption.title 
    ? toTitleCase(caption.title) 
    : 'Untitled';
  ctx.fillText(title, 25, y);
  y += 45;

  // Main caption text with improved readability
  ctx.font = '26px Inter, system-ui, sans-serif';
  const captionText = caption.caption || '';

  // Apply the wrapping with specified constraints
  const maxWidth = ctx.canvas.width - 50; // Leave margins on both sides
  const lineHeight = 32; // Increased line height for better readability
  y = wrapStandardText(ctx, captionText, 25, y, maxWidth, lineHeight);
  y += 15; // Add extra space before CTA

  // Draw CTA
  if (caption.cta) {
    ctx.fillStyle = '#e2e8f0';  // Light color for CTA
    ctx.font = 'italic 24px Inter, system-ui, sans-serif';
    
    // Handle multi-line CTA if needed
    y = wrapStandardText(ctx, caption.cta, 25, y, maxWidth, 30);
    y += 20; // Add space after CTA
  }

  // Draw hashtags with improved visibility
  const hashtags = Array.isArray(caption.hashtags) ? caption.hashtags : [];
  
  if (hashtags.length > 0) {
    ctx.fillStyle = '#3b82f6';  // Blue color for hashtags
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    
    // Create hashtag text with # symbol
    let hashtagsText = '';
    const hashtagLines = [];
    let currentLine = '';
    
    // Process hashtags to ensure they all fit
    for (const tag of hashtags) {
      const hashtagWithSymbol = `#${tag} `;
      const testLine = currentLine + hashtagWithSymbol;
      
      if (ctx.measureText(testLine).width > maxWidth) {
        hashtagLines.push(currentLine.trim());
        currentLine = hashtagWithSymbol;
      } else {
        currentLine = testLine;
      }
    }
    
    // Add the last line
    if (currentLine.trim()) {
      hashtagLines.push(currentLine.trim());
    }
    
    // Draw each line of hashtags
    for (const line of hashtagLines) {
      ctx.fillText(line, 25, y);
      y += 28;
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
  // Split by words to handle wrapping properly
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  
  // Process each word
  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = context.measureText(testLine);
    
    if (metrics.width > maxWidth && line !== '') {
      context.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  
  // Draw the last line
  if (line.trim()) {
    context.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  
  return currentY; // Return the new Y position for next content
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

// Share preview function - Updated for proper media sharing
export const sharePreview = async (
  previewRef: React.RefObject<HTMLDivElement>,
  caption: Caption,
  mediaType: MediaType
): Promise<{ status: 'shared' | 'fallback' | 'cancelled'; message?: string }> => {
  if (!previewRef.current) throw new Error('Preview element not found');

  try {
    console.log("Starting share process for media type:", mediaType);
    
    // Target the sharable-content element instead of preview-content
    const sharableContent = previewRef.current.querySelector('#sharable-content');
    if (!sharableContent) throw new Error('Sharable content not found');
    
    // Format the caption text properly
    const formattedCaption = `${caption.title}\n\n${caption.caption}\n\n${caption.cta}\n\n${caption.hashtags.map(tag => `#${tag}`).join(' ')}`;
    console.log("Formatted caption ready for sharing");
    
    // Create basic share data
    const shareData: ShareData = {
      title: caption.title,
      text: formattedCaption
    };

    // Check if Web Share API is available
    if (navigator.share) {
      console.log("Web Share API is available");
      
      // Handle different media types for file sharing
      if (mediaType !== 'text-only' && navigator.canShare) {
        try {
          let mediaFile: File | undefined;
          let mediaBlob: Blob | undefined;
          
          // Show a loading indicator
          const loadingToastId = toast.loading('Preparing media for sharing...');
          
          if (mediaType === 'video') {
            console.log("Preparing video for sharing");
            // For video content, we need to capture the processed video with captions
            const video = sharableContent.querySelector('video');
            if (!video || !video.src) {
              toast.error('Video element not found', { id: loadingToastId });
              throw new Error('Video element not found');
            }
            
            try {
              // Make sure the video is properly loaded before processing
              if (video.readyState < 2) { // HAVE_CURRENT_DATA or higher
                await new Promise<void>((resolve) => {
                  const checkLoaded = () => {
                    if (video.readyState >= 2) {
                      resolve();
                    } else {
                      requestAnimationFrame(checkLoaded);
                    }
                  };
                  checkLoaded();
                });
              }
              
              console.log("Video loaded, creating captioned version");
              
              // Create captioned video with caption overlay
              const captionedVideoBlob = await createCaptionedVideo(video, caption);
              mediaBlob = captionedVideoBlob;
              console.log("Captioned video created successfully:", captionedVideoBlob.size, "bytes");
              
              // Create a file from the blob
              mediaFile = new File([captionedVideoBlob], `video-${Date.now()}.webm`, { 
                type: 'video/webm' 
              });
              
              console.log('Prepared captioned video for sharing:', mediaFile.size, 'bytes');
            } catch (videoProcessingError) {
              console.error('Error processing video for sharing:', videoProcessingError);
              toast.error('Error processing video for sharing', { id: loadingToastId });
              
              // Fallback to the original video if processing fails
              try {
                const response = await fetch(video.src);
                if (!response.ok) throw new Error('Failed to fetch video');
                
                const blob = await response.blob();
                mediaBlob = blob;
                mediaFile = new File([blob], `video-${Date.now()}.mp4`, { 
                  type: blob.type || 'video/mp4' 
                });
                
                console.log('Falling back to original video for sharing');
              } catch (fetchError) {
                console.error('Error fetching original video:', fetchError);
                toast.error('Could not prepare video for sharing', { id: loadingToastId });
                toast.dismiss(loadingToastId);
                
                // Try text-only sharing as last resort
                if (navigator.share) {
                  await navigator.share(shareData);
                  return { status: 'shared', message: 'Caption shared (without media)' };
                }
                throw new Error('Failed to prepare video for sharing');
              }
            }
          } else if (mediaType === 'image') {
            console.log("Preparing image for sharing");
            // For image content, capture the entire content including caption
            try {
              const canvas = await html2canvas(sharableContent as HTMLElement, {
                useCORS: true,
                scale: 2,
                logging: false,
                backgroundColor: getComputedStyle(document.documentElement)
                  .getPropertyValue('--background') || '#1e1e1e',
                ignoreElements: (element) => {
                  // Ignore any elements that shouldn't be captured
                  return element.classList.contains('social-share-buttons') ||
                        element.classList.contains('preview-controls');
                }
              });
              
              mediaBlob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                  (b) => b ? resolve(b) : reject(new Error('Failed to create blob')), 
                  'image/png', 
                  0.95
                );
              });
              
              mediaFile = new File([mediaBlob], `image-${Date.now()}.png`, { 
                type: 'image/png' 
              });
              
              console.log("Image prepared for sharing");
            } catch (imageError) {
              console.error('Error preparing image for sharing:', imageError);
              toast.error('Could not prepare image for sharing', { id: loadingToastId });
              toast.dismiss(loadingToastId);
              
              // Try text-only sharing as last resort
              if (navigator.share) {
                await navigator.share(shareData);
                return { status: 'shared', message: 'Caption shared (without media)' };
              }
              throw new Error('Failed to prepare image for sharing');
            }
          }
          
          // Dismiss loading indicator
          toast.dismiss(loadingToastId);
          
          // Upload the media to Firebase to get a stable URL for sharing
          if (mediaBlob) {
            try {
              const storage = getStorage();
              const timestamp = Date.now();
              const safeTitle = caption.title
                ? caption.title.toLowerCase().replace(/[^\w]/g, '-').substring(0, 30)
                : 'share';
              const fileExtension = mediaType === 'video' ? 'webm' : 'png';
              const fileName = `shared-media/${safeTitle}-${timestamp}.${fileExtension}`;
              const storageRef = ref(storage, fileName);
              
              console.log(`Uploading ${mediaType} to Firebase...`);
              await uploadBytes(storageRef, mediaBlob);
              const downloadUrl = await getDownloadURL(storageRef);
              console.log('Media uploaded to Firebase:', downloadUrl);
              
              // Set the URL for sharing
              shareData.url = downloadUrl;
            } catch (uploadError) {
              console.error('Error uploading to Firebase:', uploadError);
              // Continue with file sharing even if Firebase upload fails
            }
          }
          
          // Try to share with the media file
          if (mediaFile && navigator.canShare && navigator.canShare({ files: [mediaFile] })) {
            console.log("Sharing with media file:", mediaFile.name, mediaFile.size, "bytes");
            
            try {
              await navigator.share({
                ...shareData,
                files: [mediaFile]
              });
              
              return { 
                status: 'shared', 
                message: 'Content shared successfully!' 
              };
            } catch (fileShareError) {
              console.error('Error sharing with file:', fileShareError);
              
              // If AbortError, user cancelled
              if (fileShareError instanceof Error && fileShareError.name === 'AbortError') {
                return { status: 'cancelled' };
              }
              
              // Fall back to URL sharing if available
              if (shareData.url) {
                console.log("Falling back to URL sharing");
                await navigator.share(shareData);
                return { 
                  status: 'shared', 
                  message: 'Content shared with URL link!' 
                };
              }
              
              // Last resort: text-only sharing
              console.log("Falling back to text-only sharing");
              await navigator.share({
                title: shareData.title,
                text: shareData.text
              });
              
              return { 
                status: 'shared', 
                message: 'Caption shared (without media)' 
              };
            }
          } else if (shareData.url) {
            // If we can't share the file directly, try with the URL
            console.log("Sharing with URL:", shareData.url);
            try {
              await navigator.share(shareData);
              
              return { 
                status: 'shared', 
                message: 'Content shared with link!' 
              };
            } catch (urlShareError) {
              console.error('Error sharing with URL:', urlShareError);
              
              // If AbortError, user cancelled
              if (urlShareError instanceof Error && urlShareError.name === 'AbortError') {
                return { status: 'cancelled' };
              }
              
              // Last resort: text-only sharing
              console.log("Falling back to text-only sharing");
              await navigator.share({
                title: shareData.title,
                text: shareData.text
              });
              
              return { 
                status: 'shared', 
                message: 'Caption shared (without media)' 
              };
            }
          }
        } catch (mediaError) {
          console.warn('Media sharing failed, falling back to text-only share:', mediaError);
          // Continue to text-only sharing if media sharing fails
        }
      }
      
      // Text-only sharing as fallback
      console.log("Using text-only sharing");
      try {
        await navigator.share(shareData);
        return { status: 'shared', message: 'Caption shared successfully!' };
      } catch (textShareError) {
        console.error('Text sharing error:', textShareError);
        
        // If AbortError, user cancelled
        if (textShareError instanceof Error && textShareError.name === 'AbortError') {
          return { status: 'cancelled' };
        }
        
        // Fall back to clipboard if even text sharing fails
        await navigator.clipboard.writeText(formattedCaption);
        return { 
          status: 'fallback', 
          message: 'Caption copied to clipboard! You can paste it into your social media app.' 
        };
      }
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

// Fixed downloadPreview function with proper caption overlay for videos
export const downloadPreview = async (
  previewRef: React.RefObject<HTMLDivElement>,
  mediaType: MediaType,
  caption: Caption,
  filename?: string,
  captionStyle: CaptionStyle = 'standard'
): Promise<void> => {
  if (!previewRef.current) {
    toast.error('Preview element not found');
    throw new Error('Preview element not found');
  }

  // Target the sharable-content element
  const sharableContent = previewRef.current.querySelector('#sharable-content');
  if (!sharableContent) {
    toast.error('Sharable content not found');
    throw new Error('Sharable content not found');
  }
  
  // Create a loading toast
  const loadingToastId = toast.loading('Preparing download...');

  try {
    console.log(`Starting download process for media type: ${mediaType}`);
    
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
      if (!video) {
        toast.error('Video element not found', { id: loadingToastId });
        throw new Error('Video element not found');
      }
      
      // Make sure video is loaded properly
      if (video.readyState < 2) { // HAVE_CURRENT_DATA or higher
        toast.loading('Waiting for video to load...', { id: loadingToastId });
        // Wait for video to be loaded enough to get dimensions
        await new Promise<void>((resolve) => {
          const checkReadyState = () => {
            if (video.readyState >= 2) {
              resolve();
            } else {
              setTimeout(checkReadyState, 100);
            }
          };
          checkReadyState();
        });
      }
      
      toast.loading('Processing video with captions...', { id: loadingToastId });
      console.log('Processing video with dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      try {
        // Create captioned video with overlay
        const captionedVideoBlob = await createCaptionedVideo(video, caption, captionStyle);
        console.log('Captioned video blob created:', captionedVideoBlob.size, 'bytes');
        
        // Download the processed video
        downloadBlobAsFile(
          captionedVideoBlob,
          filename || `${defaultFilename}.webm`, 
          loadingToastId
        );
      } catch (videoProcessingError) {
        console.error('Video processing error:', videoProcessingError);
        toast.error('Failed to process video with captions', { id: loadingToastId });
        throw videoProcessingError;
      }
    } else {
      // For image or text, create a screenshot
      try {
        toast.loading(`Capturing content...`, { id: loadingToastId });
        
        // Use a more reliable way to capture the content
        html2canvas(sharableContent as HTMLElement, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
          logging: false,
          backgroundColor: '#1e1e1e',
          onclone: (clonedDoc) => {
            // Apply any specific styles to the cloned document before capturing
            const clonedContent = clonedDoc.querySelector('#sharable-content');
            if (clonedContent) {
              (clonedContent as HTMLElement).style.padding = '20px';
              (clonedContent as HTMLElement).style.background = '#1e1e1e';
            }
          }
        }).then(canvas => {
          // Use the simpler download approach
          canvas.toBlob(
            (blob) => {
              if (blob) {
                downloadBlobAsFile(
                  blob, 
                  filename || `${defaultFilename}.png`,
                  loadingToastId
                );
              } else {
                toast.error('Failed to create image file', { id: loadingToastId });
              }
            },
            'image/png',
            0.95
          );
        }).catch(canvasError => {
          console.error('Error capturing canvas:', canvasError);
          toast.error('Failed to capture content', { id: loadingToastId });
          throw canvasError;
        });
      } catch (captureError) {
        console.error('Error capturing content:', captureError);
        toast.error('Failed to capture content for download', { id: loadingToastId });
        throw captureError;
      }
    }
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download content', { id: loadingToastId });
    throw error;
  }
};

// Reliable function to download a blob as a file
function downloadBlobAsFile(blob: Blob, filename: string, toastId?: string | number): void {
  try {
    console.log(`Downloading blob as file: ${filename} (${blob.size} bytes, type: ${blob.type})`);
    
    // Create a Blob URL
    const url = URL.createObjectURL(blob);
    
    // Create a link element
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = 'none';
    
    // Add to DOM, click it, and clean up
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      
      // Show success message
      if (toastId) {
        toast.success(`Downloaded successfully as ${filename}`, { id: toastId });
      }
    }, 100);
  } catch (error) {
    console.error('Error downloading file:', error);
    if (toastId) {
      toast.error('Download failed. Please try again.', { id: toastId });
    }
    throw error;
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
