
import { MediaType } from '@/types/mediaTypes';

export const useMediaType = (
  isTextOnly: boolean,
  selectedMedia: File | null
): MediaType => {
  if (isTextOnly) return 'text-only';
  if (selectedMedia?.type.startsWith('image')) return 'image';
  if (selectedMedia?.type.startsWith('video')) return 'video';
  return 'text-only';
};

export default useMediaType;
