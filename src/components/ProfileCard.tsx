
import React from 'react';
import { UserProfile } from '@/types';
import { formatDate, getDaysRemaining, getSubscriptionBadgeClass } from '@/lib/constants';
import { Calendar, Mail } from 'lucide-react';

interface ProfileCardProps {
  user: UserProfile;
  onEditProfile: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onEditProfile }) => {
  const daysRemaining = user.planExpiryDate ? getDaysRemaining(user.planExpiryDate) : null;
  
  return (
    <div className="profile-card animate-scale-in">
      <div className="relative h-32 profile-header-gradient">
        <button 
          onClick={onEditProfile}
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-white/30 focus:ring-2 focus:ring-white/50 focus:outline-none"
        >
          Edit Profile
        </button>
      </div>
      
      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center -mt-12 sm:-mt-16 mb-6">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background shadow-lg overflow-hidden">
            <img 
              src={user.profilePictureUrl} 
              alt={user.fullName} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          
          <div className="mt-4 sm:mt-0 sm:ml-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{user.fullName}</h1>
            <div className="mt-1 flex items-center space-x-1.5 text-muted-foreground">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Subscription Plan</div>
              <div className="flex items-center mt-1">
                <span className={`status-badge ${getSubscriptionBadgeClass(user.subscriptionTier)}`}>
                  {user.subscriptionTier}
                </span>
                
                {daysRemaining !== null && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({daysRemaining} days remaining)
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Member Since</div>
              <div className="flex items-center mt-1 text-muted-foreground">
                <Calendar size={16} className="mr-1.5" />
                <span>{formatDate(user.dateJoined)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
