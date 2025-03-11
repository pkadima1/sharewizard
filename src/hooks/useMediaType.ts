
import { MediaType } from '@/types/mediaTypes';

export const useMediaType = (
  isTextOnly: boolean,
  selectedMedia: File | null
): MediaType => {
  // If text-only mode is enabled, return text-only regardless of media
  if (isTextOnly) return 'text-only';
  
  // If no media is selected, default to text-only
  if (!selectedMedia) return 'text-only';
  
  // Check the MIME type to determine the media type
  if (selectedMedia.type.startsWith('image/')) return 'image';
  if (selectedMedia.type.startsWith('video/')) return 'video';
  
  // If media type couldn't be determined, default to text-only
  console.log('Media type could not be determined, defaulting to text-only', selectedMedia.type);
  return 'text-only';
};

export default useMediaType;
