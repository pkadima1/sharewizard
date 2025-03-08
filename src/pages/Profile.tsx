import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
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
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          setUser(userSnapshot.data() as UserProfile);
          setLoading(false);
        } else {
          setUser(null);
          setLoading(false);
          
          // Show error toast
          toast({
            title: "Error",
            description: "Failed to load profile data. Please try again.",
            variant: "destructive",
          });
        }
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
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-primary border-primary/30 rounded-full animate-spin"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="bg-card text-card-foreground rounded-2xl shadow-subtle p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground">
              Unable to load your profile data. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl pt-24 sm:pt-32">
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
