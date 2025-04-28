
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GeneratedCaption } from '@/services/openaiService';
import CaptionEditForm from './CaptionEditForm';
import MediaPreview from './MediaPreview';

interface CaptionEditorProps {
  selectedMedia: File | null;
  previewUrl: string | null;
  captions: GeneratedCaption[];
  selectedCaption: number;
  setCaptions: React.Dispatch<React.SetStateAction<GeneratedCaption[]>>;
  isTextOnly?: boolean;
  captionOverlayMode?: 'overlay' | 'below';
  onCaptionOverlayModeChange?: (mode: 'overlay' | 'below') => void;
  onShareClick: () => void;
  onDownloadClick: () => void;
  isSharing: boolean;
  isDownloading: boolean;
}

const CaptionEditor: React.FC<CaptionEditorProps> = ({
  selectedMedia,
  previewUrl,
  captions,
  selectedCaption,
  setCaptions,
  isTextOnly = false,
  captionOverlayMode = 'below',
  onCaptionOverlayModeChange,
  onShareClick,
  onDownloadClick,
  isSharing,
  isDownloading
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingCaption, setEditingCaption] = useState<GeneratedCaption | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="space-y-4">
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
          onShareClick={onShareClick}
          onDownloadClick={onDownloadClick}
          isSharing={isSharing}
          isDownloading={isDownloading}
          isEditing={isEditing}
        />
      )}

      {/* Return the ref so parent components can access it */}
      <div className="hidden">{previewRef.current}</div>
    </div>
  );
};

export default CaptionEditor;
