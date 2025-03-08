
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

const defaultUserProfile: UserProfile = {
  id: '',
  fullName: '',
  email: '',
  profilePictureUrl: '/placeholder.svg',
  subscriptionTier: 'free',
  dateJoined: new Date(),
  planExpiryDate: null,
  stats: {
    aiRequestsUsed: 0,
    aiRequestsLimit: 5,
    postsCreated: 0,
    lastActive: new Date()
  },
  recentPosts: []
};

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        const userDoc = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          
          // Create a properly formatted UserProfile object
          const profileData: UserProfile = {
            id: userSnapshot.id,
            fullName: userData.displayName || currentUser.displayName || '',
            email: userData.email || currentUser.email || '',
            profilePictureUrl: userData.photoURL || currentUser.photoURL || '/placeholder.svg',
            subscriptionTier: userData.plan_type || 'free',
            dateJoined: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : new Date(),
            planExpiryDate: userData.reset_date ? new Date(userData.reset_date.seconds * 1000) : null,
            stats: {
              aiRequestsUsed: userData.requests_used || 0,
              aiRequestsLimit: userData.requests_limit || 5,
              postsCreated: userData.posts_created || 0,
              lastActive: userData.last_active ? new Date(userData.last_active.seconds * 1000) : new Date()
            },
            recentPosts: userData.recent_posts || []
          };
          
          setUser(profileData);
          setLoading(false);
        } else {
          // Create default profile with user auth data
          const defaultProfile = {
            ...defaultUserProfile,
            fullName: currentUser.displayName || '',
            email: currentUser.email || '',
            profilePictureUrl: currentUser.photoURL || '/placeholder.svg',
          };
          setUser(defaultProfile);
          setLoading(false);
          
          // Show error toast
          toast({
            title: "Warning",
            description: "Using default profile data. Some features may be limited.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        
        // Create default profile with user auth data
        const defaultProfile = {
          ...defaultUserProfile,
          fullName: currentUser.displayName || '',
          email: currentUser.email || '',
          profilePictureUrl: currentUser.photoURL || '/placeholder.svg',
        };
        setUser(defaultProfile);
        setLoading(false);
        
        // Show error toast
        toast({
          title: "Error",
          description: "Failed to load profile data. Using default profile.",
          variant: "destructive",
        });
      }
    };
    
    fetchUserData();
  }, [currentUser]);

  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !currentUser) return;
    
    try {
      // Update Firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      const updateData: any = {};
      
      if (updates.fullName) {
        updateData.displayName = updates.fullName;
      }
      
      if (updates.profilePictureUrl) {
        updateData.photoURL = updates.profilePictureUrl;
      }
      
      await updateDoc(userRef, updateData);
      
      // Update local state
      setUser({
        ...user,
        ...updates
      });
      
      // Show success toast
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
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
