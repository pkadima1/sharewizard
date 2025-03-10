
export type MediaType = 'image' | 'video' | 'text-only';

// Export additional caption-related types
export interface Caption {
  title: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export type CaptionStyle = 'standard' | 'handwritten';

// Add a more specific interface for download options
export interface DownloadOptions {
  quality?: number;
  fileName?: string;
  includeCaption?: boolean;
}
