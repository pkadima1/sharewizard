
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useCaptionGeneration } from '@/hooks/useCaptionGeneration';
import useMediaType from '@/hooks/useMediaType';
import CaptionsList from './captions/CaptionsList';
import CaptionEditor from './captions/CaptionEditor';
import CaptionSharingActions from './captions/CaptionSharingActions';
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
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const previewRef = useRef<HTMLDivElement>(null);
  
  const mediaType = useMediaType(isTextOnly, selectedMedia);
  
  // Use our custom hook for caption generation
  const {
    captions,
    setCaptions,
    selectedCaption,
    setSelectedCaption,
    error,
    requestsRemaining
  } = useCaptionGeneration({
    selectedNiche,
    selectedPlatform,
    selectedGoal,
    selectedTone,
    isGenerating,
    setIsGenerating,
    postIdea
  });

  const handleRegenerateClick = () => {
    setCaptions([]);
    setIsGenerating(true);
  };

  // Handle error state
  if (error) {
    return <ErrorDisplay error={error} onTryAgainClick={handleRegenerateClick} />;
  }

  // Handle loading state
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

  // Handle empty state
  if (captions.length === 0 && !isGenerating) {
    return <EmptyState onGenerateClick={handleRegenerateClick} />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold dark:text-white">Choose Your Caption</h2>
        <div className="flex items-center gap-4">
          {requestsRemaining !== null && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {requestsRemaining} requests remaining
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRegenerateClick}
          >
            Regenerate
          </Button>
        </div>
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
            <CaptionEditor
              selectedMedia={selectedMedia}
              previewUrl={previewUrl}
              captions={captions}
              selectedCaption={selectedCaption}
              setCaptions={setCaptions}
              isTextOnly={isTextOnly}
              captionOverlayMode={captionOverlayMode}
              onCaptionOverlayModeChange={onCaptionOverlayModeChange}
              onShareClick={() => {
                if (previewRef.current) {
                  setIsSharing(true);
                } else {
                  console.error("Preview ref is null");
                }
              }}
              onDownloadClick={() => {
                if (previewRef.current) {
                  setIsDownloading(true);
                } else {
                  console.error("Preview ref is null");
                }
              }}
              isSharing={isSharing}
              isDownloading={isDownloading}
            />
            
            <CaptionSharingActions
              previewRef={previewRef}
              captions={captions}
              selectedCaption={selectedCaption}
              isEditing={isEditing}
              isSharing={isSharing}
              setIsSharing={setIsSharing}
              isDownloading={isDownloading}
              setIsDownloading={setIsDownloading}
              selectedPlatform={selectedPlatform}
              previewUrl={previewUrl}
              mediaType={mediaType}
              captionOverlayMode={captionOverlayMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedCaptions;
