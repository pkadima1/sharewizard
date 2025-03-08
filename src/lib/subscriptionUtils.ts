
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_REQUEST_LIMIT } from './constants';

export const checkUserRequestAvailability = async (userId: string): Promise<{
  canMakeRequest: boolean;
  requestsUsed: number;
  requestsLimit: number;
  planType: string;
}> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { 
        canMakeRequest: false, 
        requestsUsed: 0, 
        requestsLimit: 0,
        planType: 'free'
      };
    }

    const userData = userDoc.data();
    const requestsUsed = userData.requests_used || 0;
    const requestsLimit = userData.requests_limit || DEFAULT_REQUEST_LIMIT.free;
    const planType = userData.plan_type || 'free';
    
    return {
      canMakeRequest: requestsUsed < requestsLimit,
      requestsUsed,
      requestsLimit,
      planType
    };
  } catch (error) {
    console.error("Error checking request availability:", error);
    return { 
      canMakeRequest: false, 
      requestsUsed: 0, 
      requestsLimit: 0,
      planType: 'free'
    };
  }
};

export const checkUserPlan = async (userId: string): Promise<{
  status: 'OK' | 'UPGRADE' | 'LIMIT_REACHED';
  message: string;
  usagePercentage: number;
}> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { 
        status: 'UPGRADE', 
        message: 'User profile not found. Please contact support.',
        usagePercentage: 100
      };
    }

    const userData = userDoc.data();
    const requestsUsed = userData.requests_used || 0;
    const requestsLimit = userData.requests_limit || DEFAULT_REQUEST_LIMIT.free;
    const planType = userData.plan_type || 'free';
    const usagePercentage = calculateUsagePercentage(requestsUsed, requestsLimit);
    
    if (requestsUsed >= requestsLimit) {
      if (planType === 'free') {
        return {
          status: 'UPGRADE',
          message: 'You have used all your free requests. Choose a plan and start a trial to continue.',
          usagePercentage
        };
      } else if (planType === 'trial') {
        return {
          status: 'UPGRADE',
          message: 'Your trial requests are used up. Upgrade to a paid plan to continue.',
          usagePercentage
        };
      } else if (planType === 'basic') {
        return {
          status: 'LIMIT_REACHED',
          message: 'You have reached your monthly request limit. Upgrade to Premium or add Flex packs.',
          usagePercentage
        };
      } else if (planType === 'premium') {
        return {
          status: 'LIMIT_REACHED',
          message: 'You have reached your monthly request limit. Add Flex packs for additional requests.',
          usagePercentage
        };
      } else if (planType === 'flexy') {
        return {
          status: 'LIMIT_REACHED',
          message: 'You have used all your Flex requests. Purchase more to continue.',
          usagePercentage
        };
      }
    }
    
    if (usagePercentage >= 80) {
      return {
        status: 'OK',
        message: `You're running low on requests (${requestsLimit - requestsUsed} left). Consider upgrading soon.`,
        usagePercentage
      };
    }
    
    return {
      status: 'OK',
      message: `You have ${requestsLimit - requestsUsed} requests remaining.`,
      usagePercentage
    };
  } catch (error: any) {
    console.error("Error checking user plan:", error);
    return { 
      status: 'UPGRADE', 
      message: `Error checking plan: ${error.message}`,
      usagePercentage: 0
    };
  }
};

export const calculateUsagePercentage = (used: number, limit: number): number => {
  if (limit === 0) return 100;
  return Math.min((used / limit) * 100, 100);
};

export const formatPlanName = (planType: string): string => {
  switch (planType) {
    case 'free':
      return 'Free Plan';
    case 'trial':
      return 'Trial Plan';
    case 'basic':
      return 'Basic Plan';
    case 'premium':
      return 'Premium Plan';
    case 'flexy':
      return 'Flex Purchase';
    default:
      return 'Unknown Plan';
  }
};

export const getDaysRemainingInPlan = (endDate: any): number => {
  if (!endDate) return 0;
  
  const endDateTime = endDate.seconds ? 
    new Date(endDate.seconds * 1000) : 
    new Date(endDate);
    
  const now = new Date();
  const diffTime = endDateTime.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

export const getSuggestedUpgrade = (currentPlan: string): string => {
  switch (currentPlan) {
    case 'free':
      return 'Choose a plan and start your 5-day free trial with your preferred plan.';
    case 'trial':
      return 'Your trial will end soon. Upgrade to Basic or Premium to continue.';
    case 'basic':
      return 'Upgrade to Premium for more requests (250/month) and advanced features.';
    case 'premium':
      return 'You\'re on our best plan! Need more? Add Flex packs for additional requests.';
    case 'flexy':
      return 'Need more requests? Purchase additional Flex packs anytime.';
    default:
      return 'Upgrade your plan to access more features.';
  }
};

export const resetUsageCounter = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      requests_used: 0
    });
    return true;
  } catch (error) {
    console.error("Error resetting usage counter:", error);
    return false;
  }
};

export const handleMidSessionLimitReaching = async (userId: string): Promise<boolean> => {
  const { canMakeRequest, requestsUsed, requestsLimit } = await checkUserRequestAvailability(userId);
  return requestsUsed === requestsLimit - 1;
};

export const addFlexRequests = async (userId: string, additionalRequests: number): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      requests_limit: increment(additionalRequests),
      plan_type: 'flexy'
    });
    return true;
  } catch (error) {
    console.error("Error adding flex requests:", error);
    return false;
  }
};

// Fix for sharing and downloading - these are helper functions to prevent DataCloneError
export const prepareDataForSharing = (data: any): any => {
  // Remove request objects and other non-serializable data
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  // Convert to a regular object if it's a File or Blob
  if (data instanceof File || data instanceof Blob) {
    return {
      type: data instanceof File ? 'file' : 'blob',
      name: data instanceof File ? data.name : 'blob',
      size: data.size,
      lastModified: data instanceof File ? data.lastModified : Date.now(),
    };
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => prepareDataForSharing(item));
  }
  
  // Handle objects
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    // Skip functions, symbols, and non-serializable objects
    if (typeof value !== 'function' && typeof value !== 'symbol') {
      result[key] = prepareDataForSharing(value);
    }
  }
  
  return result;
};

// Safe sharing function to prevent DataCloneError
export const safeShareContent = async (content: any, title: string = 'Check out this caption!'): Promise<boolean> => {
  try {
    const shareData = prepareDataForSharing({
      title: title,
      text: typeof content === 'string' ? content : JSON.stringify(content),
      url: window.location.href
    });
    
    if (navigator.share) {
      await navigator.share(shareData);
      return true;
    } else {
      // Fallback for browsers that don't support the Web Share API
      console.log('Web Share API not supported, copying to clipboard instead');
      await navigator.clipboard.writeText(shareData.text);
      return true;
    }
  } catch (error) {
    console.error('Error sharing content:', error);
    return false;
  }
};

// Safe download function to prevent errors
export const safeDownloadContent = (content: string, filename: string): boolean => {
  try {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error downloading content:', error);
    return false;
  }
};

// The trial setup is now only marking the user for trial
// The actual activation happens after the subscription is confirmed
export const markUserForTrial = async (userId: string, planSelected: 'basic' | 'premium' = 'basic'): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error("User document not found");
      return false;
    }
    
    const userData = userDoc.data();
    
    if (userData.plan_type !== 'free') {
      console.error("User is not on free plan, cannot mark for trial");
      return false;
    }
    
    console.log("Marking user for trial:", userId);
    console.log("Selected plan for trial:", planSelected);
    
    await updateDoc(userRef, {
      selected_plan: planSelected,
      trial_pending: true
    });
    
    console.log("User marked for trial, redirecting to Stripe");
    return true;
  } catch (error: any) {
    console.error("Error marking user for trial:", error);
    return false;
  }
};

// This function is called after subscription confirmation
export const activateTrialAfterPayment = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error("User document not found");
      return false;
    }
    
    const userData = userDoc.data();
    
    if (!userData.trial_pending) {
      console.error("No pending trial for this user");
      return false;
    }
    
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 5);
    
    await updateDoc(userRef, {
      plan_type: 'trial',
      requests_limit: DEFAULT_REQUEST_LIMIT.trial,
      trial_end_date: trialEndDate,
      requests_used: 0,
      has_used_trial: true,
      trial_pending: false
    });
    
    console.log("Trial activated successfully after payment confirmation");
    return true;
  } catch (error: any) {
    console.error("Error activating trial after payment:", error);
    return false;
  }
};

export const isPlanEligibleForTrial = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data();
    
    return userData.plan_type === 'free' && !userData.has_used_trial;
  } catch (error) {
    console.error("Error checking trial eligibility:", error);
    return false;
  }
};

export const getPlanFeatures = (planType: string): string[] => {
  const baseFeatures = [
    '5 free requests during trial',
  ];
  
  switch (planType) {
    case 'basic':
      return [
        ...baseFeatures,
        '75 requests/month',
        'Single platform support',
        'Post ideas and captions (image only support)',
        'Basic analytics'
      ];
    case 'premium':
      return [
        ...baseFeatures,
        '250 requests/month',
        'Multi-platform support',
        'Advanced Post ideas and captions',
        'Multi-media support (image/video)',
        'Priority support',
        'Advanced analytics',
        'Custom templates'
      ];
    case 'flexy':
      return [
        'No monthly commitment',
        'Works with Basic or Premium plan',
        'Same features as your base plan',
        'Usage analytics included',
        '20 additional requests per pack'
      ];
    default:
      return baseFeatures;
  }
};

export const getPlanBilling = (planType: string, cycle: 'monthly' | 'yearly'): { price: string, saving?: string } => {
  switch (planType) {
    case 'basic':
      return cycle === 'monthly' 
        ? { price: '£9.99/month' }
        : { price: '£59.99/year', saving: 'Save £59.89/year (~50%)' };
    case 'premium':
      return cycle === 'monthly'
        ? { price: '£59.99/month' }
        : { price: '£199.99/year', saving: 'Save £519.89/year (~43%)' };
    case 'flexy':
      return { price: '£1.99 per pack' };
    default:
      return { price: 'Free' };
  }
};

export const getStripePriceId = (planType: string, cycle: 'monthly' | 'yearly'): string => {
  switch (planType) {
    case 'basic':
      return cycle === 'monthly' 
        ? 'price_1QzLExGCd9fidigrcqSSEhSM'
        : 'price_1QzLIQGCd9fidigre35Wc90Y';
    case 'premium':
      return cycle === 'monthly'
        ? 'price_1QzL3bGCd9fidigrpAXemWMN'
        : 'price_1QzL6ZGCd9fidigrckYnMw6w';
    case 'flexy':
      return 'price_1QzLOMGCd9fidigrt9Bk0C67';
    default:
      return '';
  }
};

export const getStripeProductId = (planType: string): string => {
  switch (planType) {
    case 'basic':
      return 'prod_Rt7TMmGREKGxH3';
    case 'premium':
      return 'prod_Rt7Ic7caEVdtQW';
    case 'flexy':
      return 'prod_Rt7dTWahmAAQ98';
    default:
      return '';
  }
};

export const getStripePurchaseUrl = (planType: string, cycle: 'monthly' | 'yearly'): string => {
  switch (planType) {
    case 'basic':
      return cycle === 'monthly' 
        ? 'https://buy.stripe.com/test_4gw9EH9Lndy74y43cj'
        : 'https://buy.stripe.com/test_4gw2cf9Ln8dN5C85kq';
    case 'premium':
      return cycle === 'monthly'
        ? 'https://buy.stripe.com/test_fZeeZ12iV79J6Gc4gp'
        : 'https://buy.stripe.com/test_6oEbMPe1D51B3u09AI';
    case 'flexy':
      return 'https://buy.stripe.com/test_3csg35cXzdy7d4AfZ8';
    default:
      return '';
  }
};

export const STRIPE_CUSTOMER_PORTAL_URL = 'https://billing.stripe.com/p/login/test_7sI01W9bs7V07sYdQQ';

export { createSubscriptionCheckout, createFlexCheckout, openCustomerPortal } from './stripe';
