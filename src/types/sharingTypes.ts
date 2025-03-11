
import { MediaType, Caption } from './mediaTypes';

// Web Share API related types
export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

// Platform sharing types
export interface PlatformSharingOptions {
  caption: Caption;
  mediaType: MediaType;
  mediaUrl?: string | null;
}

export interface SharingResult {
  status: 'shared' | 'fallback' | 'cancelled';
  message?: string;
  error?: string;
  success?: boolean;
}

// For detecting browser capabilities
export interface SharingCapabilities {
  webShareSupported: boolean;
  fileShareSupported: boolean;
}

// Interface for platform config
export interface PlatformConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  shareUrl?: string;
  requiresLogin?: boolean;
}

// Adding this to global Window interface for file sharing detection
declare global {
  interface Window {
    ShareData: {
      new(): ShareData;
      prototype: ShareData;
    }
  }
}
