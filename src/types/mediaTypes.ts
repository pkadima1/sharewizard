
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
}
