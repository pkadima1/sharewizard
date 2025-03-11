
import { useState, useEffect } from 'react';
import { MediaType } from '@/types/mediaTypes';
import { SharingCapabilities } from '@/types/sharingTypes';

/**
 * Custom hook to detect browser sharing capabilities
 */
export function useSharingCapabilities(mediaType: MediaType = 'text-only'): {
  capabilities: SharingCapabilities;
  isChecking: boolean;
} {
  const [capabilities, setCapabilities] = useState<SharingCapabilities>({
    webShareSupported: false,
    fileShareSupported: false
  });
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkCapabilities = async () => {
      setIsChecking(true);
      
      // Check if Web Share API is supported
      const webShareSupported = typeof navigator !== 'undefined' && !!navigator.share;
      let fileShareSupported = false;
      
      if (webShareSupported) {
        try {
          if (mediaType === 'image') {
            // Create a small test image file
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 10;
            testCanvas.height = 10;
            const testBlob = await new Promise<Blob>((resolve) => 
              testCanvas.toBlob((blob) => resolve(blob!), 'image/png')
            );
            const testFile = new File([testBlob], 'test.png', { type: 'image/png' });
            
            fileShareSupported = navigator.canShare && navigator.canShare({ files: [testFile] });
            console.log('File sharing capability for images:', fileShareSupported);
          } else if (mediaType === 'video') {
            // We can't easily create a test video, so we'll make a conservative estimate
            fileShareSupported = 
              typeof navigator.canShare === 'function' && 
              typeof navigator.share === 'function' && 
              'files' in (window.ShareData ? new window.ShareData() : {});
            console.log('File sharing capability for videos (estimated):', fileShareSupported);
          }
        } catch (error) {
          console.warn('Error testing file sharing capability:', error);
          fileShareSupported = false;
        }
      }
      
      setCapabilities({
        webShareSupported,
        fileShareSupported
      });
      
      setIsChecking(false);
      console.log('Web Share API supported:', webShareSupported);
      console.log('File sharing supported:', fileShareSupported);
    };
    
    checkCapabilities();
  }, [mediaType]);

  return { capabilities, isChecking };
}

export default useSharingCapabilities;
