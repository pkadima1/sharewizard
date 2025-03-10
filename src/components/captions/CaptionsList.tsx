
import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';
import { GeneratedCaption } from '@/services/openaiService';
import { toast } from "sonner";

interface CaptionsListProps {
  captions: GeneratedCaption[];
  selectedCaption: number;
  setSelectedCaption: (index: number) => void;
}

const CaptionsList: React.FC<CaptionsListProps> = ({
  captions,
  selectedCaption,
  setSelectedCaption,
}) => {
  const [hoveredCaption, setHoveredCaption] = React.useState<number | null>(null);

  const handleCopyCaption = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (captions[index]) {
      const text = `${captions[index].caption}\n\n${captions[index].cta}\n\n${captions[index].hashtags.map(h => `#${h}`).join(' ')}`;
      navigator.clipboard.writeText(text);
      toast.success("Caption copied to clipboard!");
    }
  };

  return (
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
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{caption.caption}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-2">{caption.cta}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {caption.hashtags.map((hashtag, idx) => (
              <span key={idx} className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs text-blue-600 dark:text-blue-400">
                #{hashtag}
              </span>
            ))}
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
              onClick={(e) => handleCopyCaption(index, e)}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CaptionsList;
