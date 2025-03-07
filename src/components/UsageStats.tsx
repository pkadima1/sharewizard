
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
import { 
  calculateUsagePercentage, 
  formatPlanName, 
  getDaysRemainingInPlan, 
  getSuggestedUpgrade,
  getStripePriceId,
  STRIPE_CUSTOMER_PORTAL_URL
} from '@/lib/subscriptionUtils';
import { Button } from '@/components/ui/button';
import { createSubscriptionCheckout, createFlexCheckout } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from 'react-router-dom';

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
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('basic');
  
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
      
      // First mark user as trial in the database
      const success = await activateFreeTrial(selectedPlan);
      
      if (!success) {
        toast({
          title: "Trial Activation Failed",
          description: "Unable to activate your trial. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      // Then redirect to Stripe checkout for the selected plan with trial period
      const priceId = getStripePriceId(selectedPlan, 'monthly');
      
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
  const handleUpgrade = async (plan: 'basic' | 'premium' = 'basic') => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to upgrade your plan",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the correct Stripe price ID
      const priceId = getStripePriceId(plan, 'monthly');
      
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
      const priceId = getStripePriceId('flexy', 'monthly');
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
    try {
      window.location.href = STRIPE_CUSTOMER_PORTAL_URL;
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: `Failed to open customer portal: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  // Show plan selection dialog for trial
  const [isTrialPlanDialogOpen, setIsTrialPlanDialogOpen] = useState(false);
  
  const openTrialPlanDialog = () => {
    setIsTrialPlanDialogOpen(true);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold">Usage Statistics</h2>
      
      <div className="space-y-6">
        {/* Plan Information */}
        <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CircleDollarSign className="w-5 h-5 text-primary mr-2" />
              <h3 className="font-medium">Current Plan: {formatPlanName(planType)}</h3>
            </div>
            {endDate && (
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground mr-1" />
                <span className="text-muted-foreground">
                  {planType === 'trial' ? (
                    <span className="flex items-center">
                      <Timer className="w-4 h-4 text-primary mr-1" />
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
          
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out ${
                usagePercentage > 90 ? 'bg-destructive' : usagePercentage > 75 ? 'bg-orange-500 dark:bg-orange-600' : 'bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700'
              }`}
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground flex justify-between">
            <div>{requestsLimit - requestsUsed} requests remaining</div>
            {isRunningLow && (
              <div className={isOutOfRequests ? 'text-destructive font-medium flex items-center' : 'text-orange-500 dark:text-orange-400 flex items-center'}>
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
          <div className={`mt-4 p-4 rounded-lg border ${
            isOutOfRequests 
              ? 'bg-destructive/10 border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30' 
              : isRunningLow 
                ? 'bg-orange-50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30' 
                : 'bg-muted/50 border-border'
          }`}>
            <p className="text-sm text-card-foreground mb-3">{upgradeMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Show different buttons based on plan type */}
              {planType === 'free' && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full sm:w-auto"
                  onClick={openTrialPlanDialog}
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
                    asChild
                  >
                    <Link to="/pricing">Upgrade Now</Link>
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
                    asChild
                  >
                    <Link to="/pricing">Upgrade to Premium</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 dark:bg-green-900/20 dark:border-green-800/30 dark:text-green-400 dark:hover:bg-green-900/40 dark:hover:text-green-300"
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
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
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
          <div className="bg-card text-card-foreground rounded-lg p-4 shadow-sm flex items-start">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <MessageSquareText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <div className="text-sm text-muted-foreground">Posts Generated</div>
              <div className="text-xl font-semibold">{stats.postsGenerated}</div>
              <div className="text-xs text-muted-foreground">Limit: {planLimits.postsPerMonth}/month</div>
            </div>
          </div>
          
          {/* Drafts Saved */}
          <div className="bg-card text-card-foreground rounded-lg p-4 shadow-sm flex items-start">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <FileEdit className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <div className="text-sm text-muted-foreground">Drafts Saved</div>
              <div className="text-xl font-semibold">{stats.postsDrafted}</div>
              <div className="text-xs text-muted-foreground">Limit: {planLimits.drafts}</div>
            </div>
          </div>
          
          {/* Posts Shared */}
          <div className="bg-card text-card-foreground rounded-lg p-4 shadow-sm flex items-start">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <Share2 className="w-5 h-5 text-green-500 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <div className="text-sm text-muted-foreground">Posts Shared</div>
              <div className="text-xl font-semibold">{stats.postsShared.total}</div>
              <div className="text-xs text-muted-foreground">Across all platforms</div>
            </div>
          </div>
        </div>
        
        {/* Shares by Platform */}
        <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm">
          <h3 className="font-medium mb-4">Shares by Platform</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Twitter className="w-5 h-5 text-blue-400" />
              </div>
              <div className="mt-2 text-sm font-medium">{stats.postsShared.byPlatform.twitter}</div>
              <div className="text-xs text-muted-foreground">Twitter</div>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-blue-700 dark:text-blue-500" />
              </div>
              <div className="mt-2 text-sm font-medium">{stats.postsShared.byPlatform.linkedin}</div>
              <div className="text-xs text-muted-foreground">LinkedIn</div>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              </div>
              <div className="mt-2 text-sm font-medium">{stats.postsShared.byPlatform.facebook}</div>
              <div className="text-xs text-muted-foreground">Facebook</div>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Share className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="mt-2 text-sm font-medium">{stats.postsShared.byPlatform.other}</div>
              <div className="text-xs text-muted-foreground">Other Apps</div>
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
                    className={`flex-1 ${selectedQuantity === qty ? 'bg-primary' : ''}`}
                  >
                    {qty} {qty === 1 ? 'pack' : 'packs'}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Price per pack:</span>
                <span className="font-medium">$9.99</span>
              </div>
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span>${(9.99 * selectedQuantity).toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Each pack gives you 50 additional requests that never expire.
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBuyFlex} className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Purchase Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Trial Plan Selection Dialog */}
      <Dialog open={isTrialPlanDialogOpen} onOpenChange={setIsTrialPlanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Your Trial Plan</DialogTitle>
            <DialogDescription>
              Select a plan to try free for 5 days. Your card will be charged after the trial period ends.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedPlan === 'basic' 
                  ? 'border-primary bg-primary/10 dark:bg-primary/20' 
                  : 'border-border bg-card'
              }`}
              onClick={() => setSelectedPlan('basic')}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Basic Plan</h3>
                <div className="text-sm font-semibold">£9.99/month</div>
              </div>
              <ul className="text-sm space-y-1">
                <li className="flex items-start">
                  <div className="text-green-500 dark:text-green-400 mr-2">✓</div>
                  <span>75 requests/month</span>
                </li>
                <li className="flex items-start">
                  <div className="text-green-500 dark:text-green-400 mr-2">✓</div>
                  <span>Single platform support</span>
                </li>
                <li className="flex items-start">
                  <div className="text-green-500 dark:text-green-400 mr-2">✓</div>
                  <span>Basic analytics</span>
                </li>
              </ul>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedPlan === 'premium' 
                  ? 'border-primary bg-primary/10 dark:bg-primary/20' 
                  : 'border-border bg-card'
              }`}
              onClick={() => setSelectedPlan('premium')}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Premium Plan</h3>
                <div className="text-sm font-semibold">£59.99/month</div>
              </div>
              <ul className="text-sm space-y-1">
                <li className="flex items-start">
                  <div className="text-green-500 dark:text-green-400 mr-2">✓</div>
                  <span>250 requests/month</span>
                </li>
                <li className="flex items-start">
                  <div className="text-green-500 dark:text-green-400 mr-2">✓</div>
                  <span>Multi-platform support</span>
                </li>
                <li className="flex items-start">
                  <div className="text-green-500 dark:text-green-400 mr-2">✓</div>
                  <span>Advanced analytics and features</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
              By starting a trial, you agree to provide payment details. Your selected plan will automatically begin after the 5-day trial period ends unless canceled.
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTrialPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartTrial} disabled={isActivatingTrial}>
              {isActivatingTrial ? "Processing..." : "Start 5-Day Free Trial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsageStats;
