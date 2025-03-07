
import React, { useState, useEffect } from 'react';
import { MOCK_USER_PROFILE } from '@/lib/constants';
import { UserProfile } from '@/types';
import Navbar from '@/components/Navbar';
import ProfileCard from '@/components/ProfileCard';
import UsageStats from '@/components/UsageStats';
import RecentPosts from '@/components/RecentPosts';
import EditProfileModal from '@/components/EditProfileModal';
import { toast } from "@/hooks/use-toast";

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  useEffect(() => {
    // Simulate fetching user data from Firebase
    const fetchUserData = async () => {
      try {
        // In a real app, this would fetch from Firebase
        // For now, use mock data with a slight delay to simulate network request
        setTimeout(() => {
          setUser(MOCK_USER_PROFILE);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
        
        // Show error toast
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    fetchUserData();
  }, []);
  
  const handleSaveProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    // In a real app, this would update Firebase
    // For now, just update the local state
    setUser({
      ...user,
      ...updates
    });
    
    // Show success toast
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully!",
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl shadow-subtle p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile Not Found</h2>
            <p className="text-gray-600">
              Unable to load your profile data. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 gap-8">
          {/* Profile Card */}
          <ProfileCard 
            user={user} 
            onEditProfile={() => setIsEditModalOpen(true)} 
          />
          
          {/* Usage Statistics */}
          <UsageStats 
            stats={user.stats} 
            subscriptionTier={user.subscriptionTier} 
          />
          
          {/* Recent Posts */}
          <RecentPosts posts={user.recentPosts} />
        </div>
      </main>
      
      {/* Edit Profile Modal */}
      <EditProfileModal 
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default Profile;
