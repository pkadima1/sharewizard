
import React from 'react';
import { Button } from "@/components/ui/button";
import { Share, Instagram, Facebook, Twitter } from 'lucide-react';
import { toast } from "sonner";

interface SocialSharingProps {
  isEditing: boolean;
  isSharing: boolean;
  onShareClick: () => void;
}

const SocialSharing: React.FC<SocialSharingProps> = ({
  isEditing,
  isSharing,
  onShareClick
}) => {
  if (isEditing) return null;

  const handleDirectShare = (platform: string) => {
    toast.info(`Preparing to share on ${platform}...`);
    // First run the browser share, which will generate the image/video
    onShareClick();
  };

  return (
    <div className="space-y-3">
      <h3 className="font-medium dark:text-white">Share to Social Media</h3>
      <Button
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        onClick={onShareClick}
        disabled={isSharing}
      >
        {isSharing ? (
          <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
        ) : (
          <Share className="h-4 w-4 mr-2" />
        )}
        Share via Browser (WhatsApp, Telegram, etc.)
      </Button>
      
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Or share directly to:
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" className="w-full" onClick={() => handleDirectShare('Instagram')}>
          <Instagram className="h-4 w-4 mr-1" />
          Instagram
        </Button>
        <Button variant="outline" size="sm" className="w-full" onClick={() => handleDirectShare('Facebook')}>
          <Facebook className="h-4 w-4 mr-1" />
          Facebook
        </Button>
        <Button variant="outline" size="sm" className="w-full" onClick={() => handleDirectShare('Twitter')}>
          <Twitter className="h-4 w-4 mr-1" />
          Twitter
        </Button>
      </div>
    </div>
  );
};

export default SocialSharing;
