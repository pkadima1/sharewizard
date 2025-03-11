import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateCaptions, CaptionResponse, GeneratedCaption } from '@/services/openaiService';
import { useAuth } from '@/contexts/AuthContext';
import { sharePreview, downloadPreview } from '@/utils/sharingUtils';
import { CaptionStyle, MediaType } from '@/types/mediaTypes';
import useMediaType from '@/hooks/useMediaType';

// Import our components
import CaptionsList from './captions/CaptionsList';
import CaptionEditForm from './captions/CaptionEditForm';
import MediaPreview from './captions/MediaPreview';
import SocialSharing from './captions/SocialSharing';
import ErrorDisplay from './captions/ErrorDisplay';
import GenerationLoading from './captions/GenerationLoading';
import EmptyState from './captions/EmptyState';

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
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const { incrementRequestUsage, checkRequestAvailability } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCaption, setEditingCaption] = useState<GeneratedCaption | null>(null);
  
  const mediaType = useMediaType(isTextOnly, selectedMedia);
  
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

  const handleDownload = async () => {
    if (!previewRef.current) {
      toast.error("Preview container not found. Please try again.");
      console.error("Preview ref is null:", previewRef.current);
      return;
    }
    
    try {
      setIsDownloading(true);
      console.log("Starting download, media type:", mediaType);
      
      const caption = captions[selectedCaption];
      if (!caption) {
        toast.error("No caption selected for download");
        return;
      }
      
      const timestamp = new Date().getTime();
      const filename = `${caption.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;
      
      const captionStyle: CaptionStyle = captionOverlayMode === 'overlay' ? 'handwritten' : 'standard';
      
      await downloadPreview(
        previewRef,
        mediaType,
        caption,
        filename,
        captionStyle
      );
    } catch (error) {
      console.error("Error in download process:", error);
      toast.error("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareToSocial = async () => {
    if (!previewRef.current) {
      toast.error("Preview container not found. Please try again.");
      console.error("Preview ref is null:", previewRef.current);
      return;
    }
    
    if (!captions[selectedCaption]) {
      toast.error("No caption selected to share");
      return;
    }
    
    try {
      setIsSharing(true);
      
      const result = await sharePreview(
        previewRef,
        captions[selectedCaption],
        mediaType
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
    return <ErrorDisplay error={error} onTryAgainClick={handleRegenerateClick} />;
  }

  if (isGenerating) {
    return (
      <GenerationLoading 
        selectedMedia={selectedMedia}
        previewUrl={previewUrl}
        isTextOnly={isTextOnly}
        selectedPlatform={selectedPlatform}
        selectedTone={selectedTone}
        selectedNiche={selectedNiche}
      />
    );
  }

  if (captions.length === 0 && !isGenerating) {
    return <EmptyState onGenerateClick={handleRegenerateClick} />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
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
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/5">
          <CaptionsList 
            captions={captions}
            selectedCaption={selectedCaption}
            setSelectedCaption={setSelectedCaption}
          />
        </div>
        
        <div className="lg:w-3/5">
          <div className="sticky top-6 space-y-4">
            {isEditing ? (
              <CaptionEditForm 
                editingCaption={editingCaption!}
                setEditingCaption={setEditingCaption}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
              />
            ) : (
              <MediaPreview 
                ref={previewRef}
                previewUrl={previewUrl}
                selectedMedia={selectedMedia}
                captionOverlayMode={captionOverlayMode}
                onCaptionOverlayModeChange={onCaptionOverlayModeChange || (() => {})}
                currentCaption={captions[selectedCaption]}
                isTextOnly={isTextOnly}
                onEditClick={handleEditCaption}
                onShareClick={handleShareToSocial}
                onDownloadClick={handleDownload}
                isSharing={isSharing}
                isDownloading={isDownloading}
                isEditing={isEditing}
              />
            )}
            
            <SocialSharing 
              isEditing={isEditing}
              isSharing={isSharing}
              onShareClick={handleShareToSocial}
              selectedPlatform={selectedPlatform}
              caption={captions[selectedCaption]}
              mediaType={mediaType}
              previewUrl={previewUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedCaptions;
