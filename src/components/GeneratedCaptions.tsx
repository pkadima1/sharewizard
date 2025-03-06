
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Share, Download, Copy, Check, Edit3, RefreshCw, AlertCircle } from 'lucide-react';
import { generateCaptions, GeneratedCaption } from '@/services/openaiService';
import { toast } from "sonner";
import html2canvas from 'html2canvas';

interface GeneratedCaptionsProps {
  selectedMedia: File | null;
  previewUrl: string | null;
  selectedNiche: string;
  selectedPlatform: string;
  selectedGoal: string;
  selectedTone: string;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

const GeneratedCaptions: React.FC<GeneratedCaptionsProps> = ({
  selectedMedia,
  previewUrl,
  selectedNiche,
  selectedPlatform,
  selectedGoal,
  selectedTone,
  isGenerating,
  setIsGenerating
}) => {
  const [generatedCaptions, setGeneratedCaptions] = useState<GeneratedCaption[]>([]);
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState<number>(0);
  const [editedCaption, setEditedCaption] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Fetch captions on component mount
  useEffect(() => {
    const generateInitialCaptions = async () => {
      if (!isGenerating) {
        await handleGenerateCaptions();
      }
    };
    
    generateInitialCaptions();
  }, []);

  const handleGenerateCaptions = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log("Generating captions with inputs:", {
        platform: selectedPlatform,
        tone: selectedTone,
        niche: selectedNiche,
        goal: selectedGoal
      });
      
      const captions = await generateCaptions(
        selectedPlatform,
        selectedTone,
        selectedNiche,
        selectedGoal
      );
      
      if (captions && captions.captions && captions.captions.length > 0) {
        setGeneratedCaptions(captions.captions);
        setSelectedCaptionIndex(0);
        setEditedCaption(formatCaption(captions.captions[0]));
        toast.success("Captions generated successfully!");
      } else {
        setError("No captions were generated. Please try again.");
        toast.error("Failed to generate captions. Please try again.");
      }
    } catch (error) {
      console.error("Error in component when generating captions:", error);
      setError("Failed to generate captions. Please check console for details.");
      toast.error("Failed to generate captions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCaption = (caption: GeneratedCaption): string => {
    const hashtagsFormatted = caption.hashtags.map(tag => `#${tag}`).join(' ');
    return `${caption.title}\n\n${caption.caption}\n\n${caption.cta}\n\n${hashtagsFormatted}`;
  };

  const handleCaptionSelect = (index: number) => {
    setSelectedCaptionIndex(index);
    setEditedCaption(formatCaption(generatedCaptions[index]));
    setIsEditing(false);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(editedCaption);
    setIsCopied(true);
    toast.success("Caption copied to clipboard!");
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleShareCaption = async () => {
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        let shareData: any = {
          title: "My Social Media Post",
          text: editedCaption
        };

        // If we have media and it's shareable
        if (selectedMedia && previewUrl) {
          try {
            // Try to create a share image with caption
            const imageBlob = await createShareImage();
            if (imageBlob) {
              const file = new File([imageBlob], "caption-image.png", { type: "image/png" });
              shareData.files = [file];
            }
          } catch (error) {
            console.error("Error creating share image:", error);
            // If we can't create a share image, just share the text
          }
        }

        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (error) {
        console.error("Error sharing:", error);
        toast.error("Sharing failed. Try downloading instead.");
      }
    } else {
      toast.error("Web Share API not supported on this device. Try downloading instead.");
    }
  };

  const createShareImage = async (): Promise<Blob | null> => {
    if (!previewRef.current) return null;
    
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 0.95);
      });
    } catch (error) {
      console.error("Error creating image:", error);
      return null;
    }
  };

  const handleDownloadImage = async () => {
    try {
      const imageBlob = await createShareImage();
      
      if (imageBlob) {
        // Create download link
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedPlatform}-post.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success("Image downloaded successfully!");
      }
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image. Please try again.");
    }
  };

  const getWatermark = () => {
    // Add your premium user logic here
    const isPremiumUser = false;
    return !isPremiumUser ? "Created with EngagePerfect.com" : "";
  };

  // Platform-specific templates with CSS
  const getTemplateStyles = () => {
    switch (selectedPlatform) {
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'facebook':
        return 'bg-blue-600 text-white';
      case 'twitter':
        return 'bg-blue-400 text-white';
      case 'linkedin':
        return 'bg-blue-700 text-white';
      case 'tiktok':
        return 'bg-black text-white';
      case 'youtube':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Caption Options */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Generated Captions
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGenerateCaptions}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </>
            )}
          </Button>
        </div>

        {generatedCaptions.length > 0 ? (
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="0" onClick={() => handleCaptionSelect(0)}>Caption 1</TabsTrigger>
              <TabsTrigger value="1" onClick={() => handleCaptionSelect(1)}>Caption 2</TabsTrigger>
              <TabsTrigger value="2" onClick={() => handleCaptionSelect(2)}>Caption 3</TabsTrigger>
            </TabsList>
            
            {generatedCaptions.map((caption, index) => (
              <TabsContent key={index} value={index.toString()} className="mt-4">
                <div className="border rounded-lg p-4 shadow-sm bg-white dark:bg-gray-800">
                  <h4 className="font-medium mb-2">{caption.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{caption.caption}</p>
                  <p className="text-sm text-primary font-medium mb-3">{caption.cta}</p>
                  <div className="flex flex-wrap gap-2">
                    {caption.hashtags.map((tag, tagIndex) => (
                      <span 
                        key={tagIndex} 
                        className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
            
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">
                  {isEditing ? "Edit Caption" : "Selected Caption"}
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-8"
                >
                  {isEditing ? "Preview" : <Edit3 className="h-4 w-4" />}
                </Button>
              </div>
              
              {isEditing ? (
                <Textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  className="min-h-[200px] w-full"
                  placeholder="Edit your caption here..."
                />
              ) : (
                <div className="border rounded-lg p-4 min-h-[200px] whitespace-pre-wrap text-sm">
                  {editedCaption}
                </div>
              )}
              
              <Button 
                onClick={handleCopyCaption} 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Caption
                  </>
                )}
              </Button>
            </div>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-40 border rounded-lg">
            {isGenerating ? (
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p>Generating captions for your content...</p>
                <p className="text-xs text-gray-500 mt-2">This may take a few moments</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-4" />
                <p>{error}</p>
                <p className="text-xs mt-2">Check the console for more details or try again</p>
                <Button 
                  onClick={handleGenerateCaptions} 
                  className="mt-4"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p>No captions generated yet</p>
                <Button 
                  onClick={handleGenerateCaptions} 
                  className="mt-4"
                >
                  Generate Captions
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview & Sharing */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Preview & Share
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
          </div>
        </div>

        <div 
          ref={previewRef}
          className={`border rounded-lg overflow-hidden shadow-md ${getTemplateStyles()}`}
        >
          {/* Media Preview */}
          <div className="bg-white dark:bg-gray-900 aspect-square flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <>
                {selectedMedia?.type.startsWith('video/') ? (
                  <video 
                    src={previewUrl} 
                    controls={false}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </>
            ) : (
              <div className="text-center text-gray-400 p-6">
                <p>No media uploaded</p>
              </div>
            )}
          </div>
          
          {/* Caption Preview */}
          <div className="p-4 whitespace-pre-wrap text-sm">
            {editedCaption}
            
            {/* Watermark */}
            {getWatermark() && (
              <div className="text-xs opacity-60 mt-4 text-right">
                {getWatermark()}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleShareCaption}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Share className="h-4 w-4" />
            Share
          </Button>
          <Button 
            onClick={handleDownloadImage}
            variant="outline" 
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <h4 className="font-medium mb-2">Sharing Tips</h4>
          {selectedPlatform === 'instagram' && (
            <p>For Instagram, download the image and upload it through the Instagram app.</p>
          )}
          {selectedPlatform === 'tiktok' && (
            <p>For TikTok, download the image and add it to your TikTok post through the app.</p>
          )}
          {selectedPlatform === 'twitter' && (
            <p>You can directly share to Twitter using the Share button if your device supports it.</p>
          )}
          {selectedPlatform === 'facebook' && (
            <p>You can directly share to Facebook using the Share button or download and upload manually.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratedCaptions;
