
import React, { useState } from 'react';
import { UserProfile } from '@/types';
import { X, Upload, Loader2 } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';

interface EditProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<UserProfile>) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  user, 
  isOpen, 
  onClose,
  onSave 
}) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsUploading(true);
      // Create updates object with only changed fields
      const updates: Partial<UserProfile> = {};
      
      if (fullName !== user.fullName) {
        updates.fullName = fullName;
      }
      
      // Handle image upload to Firebase Storage if a new image was selected
      if (imageFile) {
        const storage = getStorage();
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
          await uploadBytes(storageRef, imageFile);
          const downloadURL = await getDownloadURL(storageRef);
          
          updates.profilePictureUrl = downloadURL;
          
          // Update Auth profile as well
          await updateProfile(currentUser, {
            photoURL: downloadURL
          });
        }
      }
      
      onSave(updates);
      setIsUploading(false);
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      setIsUploading(false);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    setIsUploading(true);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfileImage(event.target.result as string);
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-gray-800 rounded-2xl shadow-xl max-w-md w-full animate-scale-in border border-gray-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 space-y-5">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700">
              <img 
                src={profileImage || user.profilePictureUrl} 
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
              
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <label className="mt-3 cursor-pointer">
              <div className="flex items-center text-sm text-violet-400 hover:text-violet-300 transition-colors">
                <Upload size={14} className="mr-1" />
                Change Photo
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
                disabled={isUploading}
              />
            </label>
          </div>
          
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white"
            />
          </div>
          
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              Email cannot be changed
            </p>
          </div>
        </div>
        
        <div className="p-5 border-t border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center"
            disabled={isUploading}
          >
            {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
