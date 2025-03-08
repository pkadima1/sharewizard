
export type MediaType = 'image' | 'video' | 'text-only';

// Export additional caption-related types
export interface Caption {
  title: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export type CaptionStyle = 'standard' | 'handwritten';
