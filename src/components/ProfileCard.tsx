
import React from 'react';
import { UserProfile, SubscriptionTier } from '@/types';
import { formatDate, getDaysRemaining, getSubscriptionBadgeClass } from '@/lib/constants';
import { Calendar, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  user: UserProfile;
  onEditProfile: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onEditProfile }) => {
  const daysRemaining = user.planExpiryDate ? getDaysRemaining(user.planExpiryDate) : null;
  
  // Helper function to map backend subscription types to display names
  const getDisplayTier = (tier: SubscriptionTier): string => {
    switch(tier) {
      case 'Lite': return 'Lite';
      case 'Pro': return 'Pro';
      case 'Flex': return 'Flex';
      case 'Free':
      default: return 'Free';
    }
  };
  
  return (
    <div className="overflow-hidden rounded-xl shadow-md bg-card border border-border">
      <div className="relative h-36 bg-gradient-to-r from-indigo-600 to-violet-600">
        <button 
          onClick={onEditProfile}
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-white/30 focus:ring-2 focus:ring-white/50 focus:outline-none"
        >
          Edit Profile
        </button>
      </div>
      
      <div className="px-4 sm:px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center -mt-16 mb-6">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background shadow-lg overflow-hidden">
            <img 
              src={user.profilePictureUrl} 
              alt={user.fullName || "User"} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          
          <div className="mt-3 sm:mt-0 sm:ml-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {user.fullName || "User"}
            </h1>
            <div className="mt-1 flex items-center space-x-1.5 text-muted-foreground">
              <Mail size={16} />
              <span className="text-sm sm:text-base">{user.email}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="text-sm text-muted-foreground">Subscription Plan</div>
            <div className="flex items-center mt-1">
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", getSubscriptionBadgeClass(user.subscriptionTier))}>
                {getDisplayTier(user.subscriptionTier)}
              </span>
              
              {daysRemaining !== null && (
                <span className="ml-2 text-sm text-muted-foreground">
                  ({daysRemaining} days remaining)
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="text-sm text-muted-foreground">Member Since</div>
            <div className="flex items-center mt-1 text-foreground">
              <Calendar size={16} className="mr-1.5" />
              <span>{formatDate(user.dateJoined)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
