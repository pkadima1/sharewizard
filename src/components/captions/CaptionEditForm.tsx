
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, X } from 'lucide-react';
import { GeneratedCaption } from '@/services/openaiService';

interface CaptionEditFormProps {
  editingCaption: GeneratedCaption;
  setEditingCaption: React.Dispatch<React.SetStateAction<GeneratedCaption | null>>;
  onSave: () => void;
  onCancel: () => void;
}

const CaptionEditForm: React.FC<CaptionEditFormProps> = ({
  editingCaption,
  setEditingCaption,
  onSave,
  onCancel
}) => {
  return (
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
        <Button variant="outline" size="sm" onClick={onCancel} className="gap-1">
          <X className="h-4 w-4" /> Cancel
        </Button>
        <Button size="sm" onClick={onSave} className="gap-1">
          <Check className="h-4 w-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
};

export default CaptionEditForm;
