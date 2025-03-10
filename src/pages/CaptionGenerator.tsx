import React, { useState, useRef, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Check } from 'lucide-react';
import MediaPreview from '@/components/captions/MediaPreview';
import SocialSharing from '@/components/captions/SocialSharing';
import { generateCaption } from '@/services/openaiService';
import { downloadPreview, sharePreview } from '@/utils/sharingUtils';
import { MediaType, CaptionStyle } from '@/types/mediaTypes';
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

const CaptionGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [generatedCaptions, setGeneratedCaptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState<number | null>(null);
  const [isTextOnly, setIsTextOnly] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captionOverlayMode, setCaptionOverlayMode] = useState<'overlay' | 'below'>('below');
  const [currentCaption, setCurrentCaption] = useState<any | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
  };

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setKeywords(e.target.value);
  };

  const handleCaptionOverlayModeChange = (mode: 'overlay' | 'below') => {
    setCaptionOverlayMode(mode);
  };

  const handleTemperatureChange = useCallback((value: number[]) => {
    setTemperature(value[0] / 100);
  }, []);

  const handleGenerateClick = async () => {
    if (!topic) {
      toast.error('Please enter a topic.');
      return;
    }

    setIsLoading(true);
    try {
      const newCaptions = await generateCaption(topic, keywords, temperature);
      setGeneratedCaptions(newCaptions);
      setSelectedCaptionIndex(0);
      setCurrentCaption(newCaptions[0]);
      toast.success('Captions generated successfully!');
    } catch (error: any) {
      console.error('Error generating captions:', error);
      toast.error(error?.message || 'Failed to generate captions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyClick = (text: string) => {
    setIsCopying(true);
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('Caption copied to clipboard!');
      })
      .catch(err => {
        console.error("Could not copy text: ", err);
        toast.error('Failed to copy caption to clipboard.');
      })
      .finally(() => {
        setTimeout(() => setIsCopying(false), 2000);
      });
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedMedia(file);
      setIsTextOnly(false);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedMedia(null);
      setIsTextOnly(true);
      setPreviewUrl(null);
    }
  };

  const handleSelectCaption = (index: number) => {
    setSelectedCaptionIndex(index);
    setCurrentCaption(generatedCaptions[index]);
  };

  const handleTextOnlyToggle = () => {
    setIsTextOnly(!isTextOnly);
    setSelectedMedia(null);
    setPreviewUrl(null);
  };

  const handleShareClick = async () => {
    setIsSharing(true);
    try {
      if (!previewRef.current || !currentCaption) {
        throw new Error('Preview or caption not available for sharing.');
      }
      
      const mediaType: MediaType = isTextOnly ? 'text-only' : selectedMedia?.type.startsWith('video') ? 'video' : 'image';
      await sharePreview(previewRef, currentCaption, mediaType);
      toast.success('Content shared successfully!');
    } catch (error: any) {
      console.error('Sharing error:', error);
      toast.error(error?.message || 'Failed to share content.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadClick = async () => {
    setIsDownloading(true);
    try {
      if (!previewRef.current || !currentCaption) {
        throw new Error('Preview or caption not available for download.');
      }
      
      const mediaType: MediaType = isTextOnly ? 'text-only' : selectedMedia?.type.startsWith('video') ? 'video' : 'image';
      await downloadPreview(previewRef, mediaType, currentCaption);
      toast.success('Content downloaded successfully!');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error?.message || 'Failed to download content.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center dark:text-white">
        AI Caption Generator
      </h1>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        {/* Left column with input fields */}
        <div className="md:col-span-1">
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  type="text"
                  id="topic"
                  placeholder="Enter topic"
                  value={topic}
                  onChange={handleTopicChange}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2">
                <Label htmlFor="keywords">Keywords (optional)</Label>
                <Textarea
                  id="keywords"
                  placeholder="Enter keywords"
                  value={keywords}
                  onChange={handleKeywordsChange}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4">
                <Label>Creativity</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Less Creative</span>
                  <Slider
                    defaultValue={[temperature * 100]}
                    max={100}
                    step={1}
                    onValueChange={handleTemperatureChange}
                    aria-label="Creativity level"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">More Creative</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="media">Media (optional)</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Text only</span>
                    <Switch id="textOnly" checked={isTextOnly} onCheckedChange={handleTextOnlyToggle} />
                  </div>
                </div>
                {!isTextOnly && (
                  <Input
                    type="file"
                    id="media"
                    accept="image/*, video/*"
                    onChange={handleMediaUpload}
                  />
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full"
              onClick={handleGenerateClick}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
              ) : 'Generate Captions'}
            </Button>
          </div>
        </div>

        {/* Middle column with generated captions */}
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold dark:text-white">Generated Captions</h2>
          <div className="space-y-3">
            {generatedCaptions.map((caption, index) => (
              <Card key={index} className={`cursor-pointer ${selectedCaptionIndex === index ? 'border-2 border-blue-500' : ''}`} onClick={() => handleSelectCaption(index)}>
                <CardContent className="space-y-3">
                  <p className="text-lg font-semibold">{caption.title}</p>
                  <p className="whitespace-pre-line">{caption.caption}</p>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyClick(`${caption.title}\n\n${caption.caption}\n\n${caption.cta}\n\n${caption.hashtags.map(tag => `#${tag}`).join(' ')}`);
                      }}
                      disabled={isCopying}
                    >
                      {isCopying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Right column with preview */}
        <div className="md:col-span-2 space-y-6">
          {/* Pass the previewRef to MediaPreview */}
          <MediaPreview
            ref={previewRef}
            previewUrl={previewUrl}
            selectedMedia={selectedMedia}
            captionOverlayMode={captionOverlayMode}
            onCaptionOverlayModeChange={handleCaptionOverlayModeChange}
            currentCaption={currentCaption}
            isTextOnly={isTextOnly}
            onEditClick={handleEditClick}
            onShareClick={handleShareClick}
            onDownloadClick={handleDownloadClick}
            isSharing={isSharing}
            isDownloading={isDownloading}
            isEditing={isEditing}
          />
        </div>
      </div>
    </div>
  );
};

export default CaptionGenerator;
