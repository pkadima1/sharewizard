import React, { useState } from 'react';
import { UserStats, SubscriptionTier } from '@/types';
import { PLAN_LIMITS, DEFAULT_REQUEST_LIMIT } from '@/lib/constants';
import { 
  BarChart3, 
  MessageSquareText, 
  Share2, 
  FileEdit,
  Twitter,
  Linkedin,
  Facebook,
  Share,
  Calendar,
  CircleDollarSign,
  ExternalLink,
  AlertTriangle,
  ShoppingCart,
  Timer
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { calculateUsagePercentage, formatPlanName, getDaysRemainingInPlan, getSuggestedUpgrade } from '@/lib/subscriptionUtils';
import { Button } from '@/components/ui/button';
import { createSubscriptionCheckout, createFlexCheckout, openCustomerPortal } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UsageStatsProps {
  stats: UserStats;
  subscriptionTier: SubscriptionTier;
}

const UsageStats: React.FC<UsageStatsProps> = ({ stats, subscriptionTier }) => {
  const { userProfile, subscription, currentUser, activateFreeTrial } = useAuth();
  const { toast } = useToast();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);
  
  // Calculate usage percentages
  const aiUsagePercentage = Math.min(
    (stats.aiRequestsUsed / stats.aiRequestsLimit) * 100, 
    100
  );
  
  const planLimits = PLAN_LIMITS[subscriptionTier];
  
  // Get actual subscription data from Auth context if available
  const planType = userProfile?.plan_type || 'free';
  const requestsUsed = userProfile?.requests_used || 0;
  const requestsLimit = userProfile?.requests_limit || DEFAULT_REQUEST_LIMIT.free;
  const usagePercentage = calculateUsagePercentage(requestsUsed, requestsLimit);

  // Get trial or reset date
  const endDate = userProfile?.trial_end_date || userProfile?.reset_date || null;
  const daysRemaining = endDate ? getDaysRemainingInPlan(endDate) : 0;
  
  // Determine if user is running low on requests
  const isRunningLow = usagePercentage >= 80;
  const isOutOfRequests = usagePercentage >= 100;
  
  // Suggested upgrade message
  const upgradeMessage = getSuggestedUpgrade(planType);

  // Handle starting free trial
  const handleStartTrial = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to start a trial",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsActivatingTrial(true);
      const success = await activateFreeTrial();
      
      if (!success) {
        toast({
          title: "Trial Activation Failed",
          description: "Unable to activate your trial. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error starting trial:", error);
      toast({
        title: "Error",
        description: `Failed to start trial: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsActivatingTrial(false);
    }
  };

  // Handle plan upgrade
  const handleUpgrade = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to upgrade your plan",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the correct Stripe price ID using the utility function
      const priceId = getStripePriceId(planType === 'free' || planType === 'trial' ? 'basic' : 'premium', 'monthly');
      
      if (!priceId) {
        toast({
          title: "Error",
          description: "Invalid plan selection",
          variant: "destructive",
        });
        return;
      }

      const url = await createSubscriptionCheckout(currentUser.uid, priceId);
      window.location.assign(url);
    } catch (error: any) {
      console.error("Error upgrading plan:", error);
      toast({
        title: "Error",
        description: `Failed to upgrade plan: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Helper function to get the correct Stripe price ID
  const getStripePriceId = (planType: string, cycle: 'monthly' | 'yearly'): string => {
    // Return actual Stripe price IDs from your Stripe dashboard
    // These should match the IDs in your Stripe account
    switch (planType) {
      case 'basic':
        return cycle === 'monthly' 
          ? 'price_1QzLExGCd9fidigrcqSSEhSM'  // Use your actual Stripe price ID
          : 'price_1QzLIQGCd9fidigre35Wc90Y'; // Use your actual Stripe price ID
      case 'premium':
        return cycle === 'monthly'
          ? 'price_1QzL3bGCd9fidigrpAXemWMN'  // Use your actual Stripe price ID
          : 'price_1QzL6ZGCd9fidigrckYnMw6w'; // Use your actual Stripe price ID
      case 'flexy':
        return 'price_1QzLOMGCd9fidigrt9Bk0C67'; // Use your actual Stripe price ID
      default:
        return '';
    }
  };

  // Handle buying Flex packs
  const handleBuyFlex = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to purchase Flex packs",
        variant: "destructive",
      });
      return;
    }

    try {
      // Close the modal
      setIsUpgradeModalOpen(false);
      
      // Buy flex pack
      const priceId = "price_flex_pack"; // Replace with your actual price ID
      const url = await createFlexCheckout(currentUser.uid, priceId, selectedQuantity);
      window.location.assign(url);
    } catch (error: any) {
      console.error("Error purchasing Flex pack:", error);
      toast({
        title: "Error",
        description: `Failed to purchase Flex pack: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Handle opening customer portal
  const handleOpenPortal = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to manage your subscription",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = await openCustomerPortal(currentUser.uid);
      window.location.assign(url);
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: `Failed to open customer portal: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold">Usage Statistics</h2>
      
      <div className="space-y-6">
        {/* Plan Information */}
        <div className="stats-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CircleDollarSign className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="font-medium">Current Plan: {formatPlanName(planType)}</h3>
            </div>
            {endDate && (
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                <span>
                  {planType === 'trial' ? (
                    <span className="flex items-center">
                      <Timer className="w-4 h-4 text-blue-500 mr-1" />
                      Trial ends in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span>Resets in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span>
                  )}
                </span>
              </div>
            )}
          </div>
          
          {/* Requests Progress */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Request Usage</span>
            <span className="text-sm font-medium">
              {requestsUsed}/{requestsLimit}
            </span>
          </div>
          
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out ${
                usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-orange-500' : 'bg-gradient-to-r from-blue-400 to-blue-600'
              }`}
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
          
          <div className="mt-2 text-sm text-gray-500 flex justify-between">
            <div>{requestsLimit - requestsUsed} requests remaining</div>
            {isRunningLow && (
              <div className={isOutOfRequests ? 'text-red-500 font-medium flex items-center' : 'text-orange-500 flex items-center'}>
                {isOutOfRequests ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Out of requests!
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Running low on requests
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Upgrade Prompt */}
          <div className={`mt-4 p-4 rounded-lg border ${isOutOfRequests ? 'bg-red-50 border-red-100' : isRunningLow ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
            <p className="text-sm text-gray-700 mb-3">{upgradeMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Show different buttons based on plan type */}
              {planType === 'free' && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full sm:w-auto"
                  onClick={handleStartTrial}
                  disabled={isActivatingTrial}
                >
                  {isActivatingTrial ? "Activating..." : "Start 5-Day Free Trial"}
                </Button>
              )}
              
              {planType === 'trial' && (
                <>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full sm:w-auto"
                    onClick={handleUpgrade}
                  >
                    Upgrade Now
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto"
                    onClick={handleOpenPortal}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Cancel Trial
                  </Button>
                </>
              )}
              
              {planType === 'basic' && (
                <>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full sm:w-auto"
                    onClick={handleUpgrade}
                  >
                    Upgrade to Premium
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                    onClick={() => setIsUpgradeModalOpen(true)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy Flex Pack
                  </Button>
                </>
              )}
              
              {(planType === 'premium' || planType === 'flexy') && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  onClick={() => setIsUpgradeModalOpen(true)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy More Requests
                </Button>
              )}
              
              {/* Only show manage subscription button for paid users */}
              {(planType === 'basic' || planType === 'premium' || planType === 'trial') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto"
                  onClick={handleOpenPortal}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Subscription
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Posts Generated */}
          <div className="stats-card flex items-start">
            <div className="p-2 rounded-full bg-blue-50">
              <MessageSquareText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <div className="text-sm text-gray-500">Posts Generated</div>
              <div className="text-xl font-semibold">{stats.postsGenerated}</div>
              <div className="text-xs text-gray-400">Limit: {planLimits.postsPerMonth}/month</div>
            </div>
          </div>
          
          {/* Drafts Saved */}
          <div className="stats-card flex items-start">
            <div className="p-2 rounded-full bg-purple-50">
              <FileEdit className="w-5 h-5 text-purple-500" />
            </div>
            <div className="ml-3">
              <div className="text-sm text-gray-500">Drafts Saved</div>
              <div className="text-xl font-semibold">{stats.postsDrafted}</div>
              <div className="text-xs text-gray-400">Limit: {planLimits.drafts}</div>
            </div>
          </div>
          
          {/* Posts Shared */}
          <div className="stats-card flex items-start">
            <div className="p-2 rounded-full bg-green-50">
              <Share2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="ml-3">
              <div className="text-sm text-gray-500">Posts Shared</div>
              <div className="text-xl font-semibold">{stats.postsShared.total}</div>
              <div className="text-xs text-gray-400">Across all platforms</div>
            </div>
          </div>
        </div>
        
        {/* Shares by Platform */}
        <div className="stats-card">
          <h3 className="font-medium mb-4">Shares by Platform</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                <Twitter className="w-5 h-5 text-blue-400" />
              </div>
              <div className="mt-2 text-sm font-medium">{stats.postsShared.byPlatform.twitter}</div>
              <div className="text-xs text-gray-500">Twitter</div>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-blue-700" />
              </div>
              <div className="mt-2 text-sm font-medium">{stats.postsShared.byPlatform.linkedin}</div>
              <div className="text-xs text-gray-500">LinkedIn</div>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                <Facebook className="w-5 h-5 text-blue-600" />
              </div>
              <div className="mt-2 text-sm font-medium">{stats.postsShared.byPlatform.facebook}</div>
              <div className="text-xs text-gray-500">Facebook</div>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-gray-50 rounded-full flex items-center justify-center">
                <Share className="w-5 h-5 text-gray-600" />
              </div>
              <div className="mt-2 text-sm font-medium">{stats.postsShared.byPlatform.other}</div>
              <div className="text-xs text-gray-500">Other Apps</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Buy Flex Modal */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Additional Requests</DialogTitle>
            <DialogDescription>
              Flex packs give you additional requests that never expire. Buy as many as you need.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Select quantity:</h4>
              <div className="flex gap-2">
                {[1, 2, 5, 10].map(qty => (
                  <Button
                    key={qty}
                    variant={selectedQuantity === qty ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedQuantity(qty)}
                    className={`flex-1 ${selectedQuantity === qty ? 'bg-blue-500' : ''}`}
                  >
                    {qty} {qty === 1 ? 'pack' : 'packs'}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Price per pack:</span>
                <span className="font-medium">$9.99</span>
              </div>
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span>${(9.99 * selectedQuantity).toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Each pack gives you 50 additional requests that never expire.
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBuyFlex} className="bg-green-600 hover:bg-green-700">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Purchase Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsageStats;
