
import React from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Share2, Star } from "lucide-react";

export const CopyToClipboard: React.FC<{ text: string }> = ({ text }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      <Copy className="h-4 w-4 mr-2" />
      Copy
    </Button>
  );
};

export const ShareToSocial: React.FC<{ platform: string; content: string }> = ({ platform, content }) => {
  const handleShare = () => {
    // In a real implementation, this would use the Web Share API or specific platform SDKs
    toast.success(`Shared to ${platform}!`);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      <Share2 className="h-4 w-4 mr-2" />
      Share
    </Button>
  );
};

export const SaveAsFavorite: React.FC<{ content: string }> = ({ content }) => {
  const handleSave = () => {
    // In a real implementation, this would save to a user's favorites in the database
    toast.success("Saved to favorites!");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSave}>
      <Star className="h-4 w-4 mr-2" />
      Save
    </Button>
  );
};
