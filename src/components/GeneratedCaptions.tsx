
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateCaptions, CaptionResponse, GeneratedCaption } from '@/services/openaiService';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Download, Share } from 'lucide-react';

interface GeneratedCaptionsProps {
  selectedMedia: File | null;
  previewUrl: string | null;
  selectedNiche: string;
  selectedPlatform: string;
  selectedGoal: string;
  selectedTone: string;
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
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
  postIdea
}) => {
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const { incrementRequestUsage, checkRequestAvailability } = useAuth();

  useEffect(() => {
    const fetchCaptions = async () => {
      if (!isGenerating) return;

      try {
        setError(null);
        
        // First check if the user can make the request without incrementing
        const availability = await checkRequestAvailability();
        
        if (!availability.canMakeRequest) {
          setIsGenerating(false);
          setError(availability.message);
          return;
        }
        
        // Generate captions
        const captionResponse = await generateCaptions(
          selectedPlatform,
          selectedTone,
          selectedNiche,
          selectedGoal,
          postIdea
        );

        // Only increment the usage counter if generation was successful
        if (captionResponse && captionResponse.captions) {
          // Increment the counter only after successful generation
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

  const handleShareToSocial = () => {
    // Create a simple share functionality
    if (navigator.share && captions[selectedCaption]) {
      navigator.share({
        title: `${captions[selectedCaption].title} - EngagePerfect AI`,
        text: `${captions[selectedCaption].caption}\n\n${captions[selectedCaption].cta}\n\n${captions[selectedCaption].hashtags.map(h => `#${h}`).join(' ')}`,
        url: window.location.href,
      })
      .then(() => toast.success("Content shared successfully!"))
      .catch(error => console.error("Error sharing:", error));
    } else {
      toast.info("Browser share functionality not available. Copy and share manually.");
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Generation Failed</h3>
        <p className="text-gray-600 mb-6 max-w-md">{error}</p>
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
          
          {previewUrl && (
            <div className="md:w-1/2 lg:w-2/5">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                {selectedMedia && selectedMedia.type.startsWith('image') ? (
                  <div className="aspect-square w-full">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-200">
                    <span className="text-gray-500">Media preview</span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Captions Generated</h3>
        <p className="text-gray-600 mb-6">Click the button below to generate captions for your content.</p>
        <Button onClick={handleRegenerateClick}>Generate Captions</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Choose Your Caption</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRegenerateClick}
        >
          Regenerate
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Captions List - Left Side */}
        <div className="md:w-1/2 lg:w-3/5">
          <div className="space-y-4">
            {captions.map((caption, index) => (
              <div 
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
                  selectedCaption === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedCaption(index)}
              >
                <h3 className="font-medium mb-2">{caption.title}</h3>
                <p className="text-sm text-gray-700 mb-3">{caption.caption.substring(0, 120)}...</p>
                <div className="flex flex-wrap gap-1">
                  {caption.hashtags.slice(0, 3).map((hashtag, idx) => (
                    <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      #{hashtag}
                    </span>
                  ))}
                  {caption.hashtags.length > 3 && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      +{caption.hashtags.length - 3} more
                    </span>
                  )}
                </div>
                <div className="flex justify-end mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      const text = `${caption.caption}\n\n${caption.cta}\n\n${caption.hashtags.map(h => `#${h}`).join(' ')}`;
                      navigator.clipboard.writeText(text);
                      toast.success("Caption copied to clipboard!");
                    }}
                  >
                    Copy Caption
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Preview - Right Side */}
        <div className="md:w-1/2 lg:w-2/5">
          <div className="sticky top-6 space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Preview</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Share"
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {previewUrl && (
                <div className="aspect-square w-full mb-4 rounded-md overflow-hidden">
                  {selectedMedia && selectedMedia.type.startsWith('image') ? (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200">
                      <span className="text-gray-500">Media preview</span>
                    </div>
                  )}
                </div>
              )}
              
              {captions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">{captions[selectedCaption]?.title}</h3>
                  <p className="text-sm whitespace-pre-line">{captions[selectedCaption]?.caption}</p>
                  <p className="text-sm italic">{captions[selectedCaption]?.cta}</p>
                  <div className="flex flex-wrap gap-1">
                    {captions[selectedCaption]?.hashtags.map((hashtag, idx) => (
                      <span key={idx} className="text-blue-600 text-sm">
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 pt-3 mt-3 border-t">
                    Created with EngagePerfect • https://engageperfect.com
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium">Share to Social Media</h3>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleShareToSocial}
              >
                <Share className="h-4 w-4 mr-2" />
                Share via Browser (WhatsApp, Telegram, etc.)
              </Button>
              
              <div className="text-sm text-gray-500">
                Or share directly to:
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="w-full">
                  {selectedPlatform || "Instagram"}
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Facebook
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Twitter
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedCaptions;
