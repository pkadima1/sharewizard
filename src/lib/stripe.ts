
import { doc, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from './firebase';
import { STRIPE_CUSTOMER_PORTAL_URL } from './subscriptionUtils';

/**
 * Creates a checkout session for a subscription
 */
export const createSubscriptionCheckout = async (userId: string, priceId: string) => {
  try {
    const docRef = await addDoc(
      collection(db, "customers", userId, "checkout_sessions"), 
      {
        price: priceId,
        success_url: window.location.origin,
        cancel_url: window.location.origin,
      }
    );

    return new Promise<string>((resolve, reject) => {
      const unsubscribe = onSnapshot(docRef, (snap) => {
        const { error, url } = snap.data() as { error?: { message: string }, url?: string };
        
        if (error) {
          unsubscribe();
          reject(new Error(`Error: ${error.message}`));
        }
        
        if (url) {
          unsubscribe();
          resolve(url);
        }
      }, (error) => {
        unsubscribe();
        reject(error);
      });
    });
  } catch (error: any) {
    console.error("Error creating subscription checkout:", error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
};

/**
 * Creates a checkout session for a one-time Flex purchase
 */
export const createFlexCheckout = async (userId: string, priceId: string, quantity: number = 1) => {
  try {
    const docRef = await addDoc(
      collection(db, "customers", userId, "checkout_sessions"),
      {
        mode: "payment",
        price: priceId,
        quantity: quantity,
        success_url: window.location.origin,
        cancel_url: window.location.origin,
      }
    );

    return new Promise<string>((resolve, reject) => {
      const unsubscribe = onSnapshot(docRef, (snap) => {
        const { error, url } = snap.data() as { error?: { message: string }, url?: string };
        
        if (error) {
          unsubscribe();
          reject(new Error(`Error: ${error.message}`));
        }
        
        if (url) {
          unsubscribe();
          resolve(url);
        }
      }, (error) => {
        unsubscribe();
        reject(error);
      });
    });
  } catch (error: any) {
    console.error("Error creating flex checkout:", error);
    throw new Error(`Failed to create flex checkout session: ${error.message}`);
  }
};

/**
 * Opens the Stripe Customer Portal
 */
export const openCustomerPortal = async (userId: string) => {
  try {
    // Instead of using the Firebase function, use the direct Stripe Customer Portal URL
    return STRIPE_CUSTOMER_PORTAL_URL;
  } catch (error: any) {
    console.error("Error opening customer portal:", error);
    throw new Error(`Failed to open customer portal: ${error.message}`);
  }
};

/**
 * Gets user role from Firebase custom claims
 */
export const getUserRole = async (): Promise<string | null> => {
  try {
    // Force refresh token to get the latest custom claims
    await auth.currentUser?.getIdToken(true);
    const decodedToken = await auth.currentUser?.getIdTokenResult();
    
    return decodedToken?.claims?.stripeRole as string || null;
  } catch (error: any) {
    console.error("Error getting user role:", error);
    return null;
  }
};

/**
 * Checks if user has access to specified tier
 */
export const checkUserAccess = async (requiredTier: 'basic' | 'premium' | 'flexy'): Promise<boolean> => {
  try {
    const role = await getUserRole();
    
    if (!role) return false;
    
    switch (requiredTier) {
      case 'basic':
        // Basic, Premium, and Flexy users can access basic features
        return role === 'basic' || role === 'premium' || role === 'flexy';
      case 'premium':
        // Only Premium and Flexy users can access premium features
        return role === 'premium' || role === 'flexy';
      case 'flexy':
        // Only Flexy users can access flexy features
        return role === 'flexy';
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking user access:", error);
    return false;
  }
};
