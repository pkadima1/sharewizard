
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateCaptions, CaptionResponse, GeneratedCaption } from '@/services/openaiService';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from 'lucide-react';

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
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex mb-8">
          {previewUrl && (
            <div className="w-1/3 pr-6">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {selectedMedia && selectedMedia.type.startsWith('image') ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200">
                    <span className="text-gray-500">Media preview</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className={`${previewUrl ? 'w-2/3' : 'w-full'}`}>
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
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                Creating engaging {selectedTone} captions for {selectedPlatform} 
                in the {selectedNiche} niche...
              </p>
            </div>
          </div>
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
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="flex flex-col md:flex-row mb-8 gap-6">
        {previewUrl && (
          <div className="md:w-1/3">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden sticky top-6">
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
          </div>
        )}
        
        <div className={`${previewUrl ? 'md:w-2/3' : 'w-full'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Generated Captions</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRegenerateClick}
            >
              Regenerate
            </Button>
          </div>
          
          <Tabs defaultValue="0" className="w-full" onValueChange={(value) => setSelectedCaption(parseInt(value))}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="0">Caption 1</TabsTrigger>
              <TabsTrigger value="1">Caption 2</TabsTrigger>
              <TabsTrigger value="2">Caption 3</TabsTrigger>
            </TabsList>
            
            {captions.map((caption, index) => (
              <TabsContent key={index} value={index.toString()} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{caption.title}</CardTitle>
                    <CardDescription>
                      Platform: {selectedPlatform} • Tone: {selectedTone}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Caption</h4>
                        <p className="text-gray-700 whitespace-pre-line">{caption.caption}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Call-to-Action</h4>
                        <p className="text-gray-700">{caption.cta}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Hashtags</h4>
                        <div className="flex flex-wrap gap-2">
                          {caption.hashtags.map((hashtag, idx) => (
                            <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm">
                              #{hashtag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const text = `${caption.caption}\n\n${caption.cta}\n\n${caption.hashtags.map(h => `#${h}`).join(' ')}`;
                        navigator.clipboard.writeText(text);
                        toast.success("Caption copied to clipboard!");
                      }}
                    >
                      Copy Caption
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        toast.success(`Caption saved for ${selectedPlatform}!`);
                      }}
                    >
                      Use This Caption
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GeneratedCaptions;
