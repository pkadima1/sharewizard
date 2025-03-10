
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

interface GenerationLoadingProps {
  selectedMedia: File | null;
  previewUrl: string | null;
  isTextOnly: boolean;
  selectedPlatform: string;
  selectedTone: string;
  selectedNiche: string;
}

const GenerationLoading: React.FC<GenerationLoadingProps> = ({
  selectedMedia,
  previewUrl,
  isTextOnly,
  selectedPlatform,
  selectedTone,
  selectedNiche
}) => {
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
};

export default GenerationLoading;
