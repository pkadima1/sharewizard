
export type MediaType = 'image' | 'video' | 'text-only';

// Export additional caption-related types
export interface Caption {
  title: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export type CaptionStyle = 'standard' | 'handwritten';

// Enhanced download options for better video quality
export interface DownloadOptions {
  quality?: 'low' | 'medium' | 'high' | 'ultra'; // Quality presets
  videoBitrate?: number; // Explicit bitrate control in bps
  fileName?: string;
  includeCaption?: boolean;
  captionStyle?: CaptionStyle;
  format?: 'webm' | 'mp4' | 'png' | 'jpg'; // Output format options
  fontScale?: number; // Control text size
  showAllHashtags?: boolean; // Ensure all hashtags are shown
  preserveCaptionOrder?: boolean; // Maintain order: title, caption, CTA, hashtags
  overlayOpacity?: number; // Control opacity of caption overlay
  textColor?: string; // Control text color
  fontFamily?: string; // Specify font family for captions
  maxHashtagsPerLine?: number; // Limit hashtags per line to avoid overflow
  maxCaptionWidth?: number; // Max width for captions to ensure readability
}
