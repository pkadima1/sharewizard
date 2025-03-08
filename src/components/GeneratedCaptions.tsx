import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateCaptions, CaptionResponse, GeneratedCaption } from '@/services/openaiService';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Download, Share, CheckCircle, Copy, Twitter, Facebook, Linkedin, Instagram, ArrowLeft, ArrowRight, Radio, RadioTower, Edit, Check, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sharePreview, downloadPreview, MediaType } from '@/utils/sharingUtils';
import { Badge } from "@/components/ui/badge";

interface GeneratedCaptionsProps {
  selectedMedia: File | null;
  previewUrl: string | null;
  selectedNiche: string;
  selectedPlatform: string;
  selectedGoal: string;
  selectedTone: string;
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  isTextOnly?: boolean;
  captionOverlayMode?: 'overlay' | 'below';
  onCaptionOverlayModeChange?: (mode: 'overlay' | 'below') => void;
  postIdea?: string;
}

const GeneratedCaptions: React.FC<GeneratedCaptionsProps> = ({
  selectedMedia,
  previewUrl,
  selectedNiche,
  selectedPlatform,
  selectedGoal,
  selectedTone,
  isGenerating,
  setIsGenerating,
  isTextOnly = false,
  captionOverlayMode = 'below',
  onCaptionOverlayModeChange,
  postIdea
}) => {
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCaption, setHoveredCaption] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const { incrementRequestUsage, checkRequestAvailability } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCaption, setEditingCaption] = useState<GeneratedCaption | null>(null);
  
  const getMediaType = (): MediaType => {
    if (isTextOnly) return 'text-only';
    if (selectedMedia?.type.startsWith('image')) return 'image';
    if (selectedMedia?.type.startsWith('video')) return 'video';
    return 'text-only';
  };
  
  useEffect(() => {
    const fetchCaptions = async () => {
      if (!isGenerating) return;

      try {
        setError(null);
        
        const availability = await checkRequestAvailability();
        
        if (!availability.canMakeRequest) {
          setIsGenerating(false);
          setError(availability.message);
          return;
        }
        
        const captionResponse = await generateCaptions(
          selectedPlatform,
          selectedTone,
          selectedNiche,
          selectedGoal,
          postIdea
        );

        if (captionResponse && captionResponse.captions) {
          await incrementRequestUsage();
          
          setCaptions(captionResponse.captions);
          setSelectedCaption(0);
          console.log("Captions generated successfully:", captionResponse.captions);
        } else {
          setError("Failed to generate captions. Please try again.");
          console.error("Error fetching captions - empty response");
        }
      } catch (err) {
        console.error("Error fetching captions:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    };

    fetchCaptions();
  }, [isGenerating]);

  const handleRegenerateClick = () => {
    setCaptions([]);
    setIsGenerating(true);
  };

  const handleCopyCaption = (index: number) => {
    if (captions[index]) {
      const text = `${captions[index].caption}\n\n${captions[index].cta}\n\n${captions[index].hashtags.map(h => `#${h}`).join(' ')}`;
      navigator.clipboard.writeText(text);
      toast.success("Caption copied to clipboard!");
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    
    try {
      setIsDownloading(true);
      
      await downloadPreview(
        previewRef,
        getMediaType(),
        captions[selectedCaption],
        undefined,
        'standard'
      );
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Failed to download. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareToSocial = async () => {
    if (!captions[selectedCaption]) return;
    
    try {
      setIsSharing(true);
      
      const result = await sharePreview(
        previewRef,
        captions[selectedCaption],
        getMediaType()
      );
      
      if (result.message) {
        toast.success(result.message);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleToggleOverlayMode = () => {
    if (onCaptionOverlayModeChange) {
      onCaptionOverlayModeChange(captionOverlayMode === 'overlay' ? 'below' : 'overlay');
    }
  };

  const handleEditCaption = () => {
    if (captions[selectedCaption]) {
      setEditingCaption({ ...captions[selectedCaption] });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (editingCaption) {
      const updatedCaptions = [...captions];
      updatedCaptions[selectedCaption] = editingCaption;
      setCaptions(updatedCaptions);
      setIsEditing(false);
      toast.success("Caption updated successfully!");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingCaption(null);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Generation Failed</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">{error}</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Start Over
          </Button>
          <Button
            onClick={handleRegenerateClick}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2 lg:w-3/5">
            <h2 className="text-xl font-semibold mb-4">Generating Captions...</h2>
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
          
          {!isTextOnly && previewUrl && (
            <div className="md:w-1/2 lg:w-2/5">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                {selectedMedia && selectedMedia.type.startsWith('image') ? (
                  <div className="aspect-square w-full">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : selectedMedia && selectedMedia.type.startsWith('video') ? (
                  <div className="aspect-video w-full">
                    <video src={previewUrl} className="w-full h-full object-cover" controls />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-200 dark:bg-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">Media preview</span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Creating engaging {selectedTone} captions for {selectedPlatform} 
                  in the {selectedNiche} niche...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (captions.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Captions Generated</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Click the button below to generate captions for your content.</p>
        <Button onClick={handleRegenerateClick}>Generate Captions</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold dark:text-white">Choose Your Caption</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRegenerateClick}
        >
          Regenerate
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 lg:w-3/5">
          <div className="space-y-4">
            {captions.map((caption, index) => (
              <div 
                key={index}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-all 
                  hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:bg-blue-900/20
                  ${selectedCaption === index 
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'}
                `}
                onClick={() => setSelectedCaption(index)}
                onMouseEnter={() => setHoveredCaption(index)}
                onMouseLeave={() => setHoveredCaption(null)}
              >
                <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">{caption.title}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">{caption.caption}</p>
                <p className="text-sm italic text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">{caption.cta}</p>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {caption.hashtags.slice(0, 5).map((hashtag, idx) => (
                    <span key={idx} className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs text-blue-600 dark:text-blue-400">
                      #{hashtag}
                    </span>
                  ))}
                  {caption.hashtags.length > 5 && (
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-500 dark:text-gray-400">
                      +{caption.hashtags.length - 5} more
                    </span>
                  )}
                </div>
                <div className="flex justify-end mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`
                      text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 
                      dark:hover:text-blue-300 dark:hover:bg-blue-900/30
                      ${(hoveredCaption === index || selectedCaption === index) ? 'opacity-100' : 'opacity-0'}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCaption(index);
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Caption
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="md:w-1/2 lg:w-2/5">
          <div className="sticky top-6 space-y-4">
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <div className="flex justify-between items-center p-4 border-b border-border">
                <h3 className="font-medium">Preview</h3>
                <div className="flex gap-2">
                  {!isEditing && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit"
                        onClick={handleEditCaption}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Share"
                        onClick={handleShareToSocial}
                        disabled={isSharing}
                      >
                        {isSharing ? (
                          <div className="h-4 w-4 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>
                        ) : (
                          <Share className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Download"
                        onClick={handleDownload}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <div className="h-4 w-4 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div 
                ref={previewRef}
                className="caption-preview"
              >
                {isEditing ? (
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-700 dark:text-gray-300">
                        Title
                      </label>
                      <Input 
                        value={editingCaption?.title || ''} 
                        onChange={(e) => setEditingCaption(prev => prev ? {...prev, title: e.target.value} : null)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-700 dark:text-gray-300">
                        Caption
                      </label>
                      <Textarea 
                        value={editingCaption?.caption || ''} 
                        onChange={(e) => setEditingCaption(prev => prev ? {...prev, caption: e.target.value} : null)}
                        className="w-full min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-700 dark:text-gray-300">
                        Call to action
                      </label>
                      <Input 
                        value={editingCaption?.cta || ''} 
                        onChange={(e) => setEditingCaption(prev => prev ? {...prev, cta: e.target.value} : null)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-700 dark:text-gray-300">
                        Hashtags (comma separated)
                      </label>
                      <Input 
                        value={editingCaption?.hashtags.join(', ') || ''} 
                        onChange={(e) => {
                          const hashtags = e.target.value.split(',').map(tag => tag.trim().replace(/^#/, ''));
                          setEditingCaption(prev => prev ? {...prev, hashtags} : null);
                        }}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} className="gap-1">
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit} className="gap-1">
                        <Check className="h-4 w-4" /> Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div id="sharable-content" className="w-full">
                    {!isTextOnly && previewUrl && (
                      <div className="relative">
                        {selectedMedia && selectedMedia.type.startsWith('image') ? (
                          <div className="aspect-square w-full relative">
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="w-full h-full object-cover" 
                            />
                            {captionOverlayMode === 'overlay' && captions.length > 0 && (
                              <div className="caption-overlay">
                                <p className="text-white text-lg font-semibold mb-2">{captions[selectedCaption]?.title}</p>
                                <p className="text-white text-sm">{captions[selectedCaption]?.caption}</p>
                                <p className="text-white text-sm italic mt-2">{captions[selectedCaption]?.cta}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {captions[selectedCaption]?.hashtags.map((hashtag, idx) => (
                                    <span key={idx} className="text-blue-300 text-xs">
                                      #{hashtag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : selectedMedia && selectedMedia.type.startsWith('video') ? (
                          <div className="aspect-video w-full relative">
                            <video 
                              ref={videoRef}
                              src={previewUrl} 
                              className="w-full h-full object-cover" 
                              controls
                            />
                            {captionOverlayMode === 'overlay' && captions.length > 0 && (
                              <div className="caption-overlay">
                                <p className="text-white text-lg font-semibold mb-2">{captions[selectedCaption]?.title}</p>
                                <p className="text-white text-sm">{captions[selectedCaption]?.caption}</p>
                                <p className="text-white text-sm italic mt-2">{captions[selectedCaption]?.cta}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {captions[selectedCaption]?.hashtags.map((hashtag, idx) => (
                                    <span key={idx} className="text-blue-300 text-xs">
                                      #{hashtag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-64 bg-gray-200 dark:bg-gray-700">
                            <span className="text-gray-500 dark:text-gray-400">No media preview</span>
                          </div>
                        )}
                      </div>
                    )}
                  
                    {captions.length > 0 && (captionOverlayMode === 'below' || isTextOnly) && (
                      <div className={`caption-text-container ${!isTextOnly && captionOverlayMode === 'below' ? 'border-t border-border' : ''}`}>
                        <h3 className="caption-title">{captions[selectedCaption]?.title}</h3>
                        <p className="caption-body">{captions[selectedCaption]?.caption}</p>
                        <p className="caption-cta">{captions[selectedCaption]?.cta}</p>
                        <div className="caption-hashtags">
                          {captions[selectedCaption]?.hashtags.map((hashtag, idx) => (
                            <span key={idx} className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full text-xs">
                              #{hashtag}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground pt-3 mt-3 border-t border-border">
                          Created with EngagePerfect • https://engageperfect.com
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {!isTextOnly && selectedMedia && !isEditing && (
                <div className="p-4 border-t border-border flex items-center justify-end">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Caption below</span>
                    <Switch 
                      checked={captionOverlayMode === 'overlay'} 
                      onCheckedChange={handleToggleOverlayMode} 
                    />
                    <span className="text-xs text-muted-foreground">Caption overlay</span>
                  </div>
                </div>
              )}
            </div>
            
            {!isEditing && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Share to Social Media</h3>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleShareToSocial}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Share className="h-4 w-4 mr-2" />
                  )}
                  Share with Image and Text
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  Or share directly to:
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Instagram className="h-4 w-4 mr-1" />
                    Instagram
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Facebook className="h-4 w-4 mr-1" />
                    Facebook
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Twitter className="h-4 w-4 mr-1" />
                    Twitter
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedCaptions;
