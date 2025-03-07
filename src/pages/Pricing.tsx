
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createSubscriptionCheckout, createFlexCheckout } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Check, Info, ChevronRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { getStripePriceId } from '@/lib/subscriptionUtils';
import { cn } from '@/lib/utils';

const Pricing: React.FC = () => {
  // Set yearly as the default billing cycle
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});

  const handlePurchase = async (plan: string, priceId: string) => {
    try {
      setIsLoading((prev) => ({ ...prev, [plan]: true }));
      
      if (!currentUser) {
        // Redirect to signup if user is not logged in
        navigate('/signup', { state: { from: 'pricing', plan } });
        return;
      }

      if (plan === 'flexy') {
        const checkoutUrl = await createFlexCheckout(currentUser.uid, priceId);
        window.location.href = checkoutUrl;
      } else {
        const checkoutUrl = await createSubscriptionCheckout(currentUser.uid, priceId);
        window.location.href = checkoutUrl;
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: `Failed to create checkout: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, [plan]: false }));
    }
  };

  const freeTrial = () => {
    if (!currentUser) {
      navigate('/signup', { state: { from: 'pricing', plan: 'trial' } });
      return;
    }
    
    // In a real implementation, we would call an API to activate the trial
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="py-12 px-4 animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">Choose the plan that's right for you</p>
          
          {/* Billing cycle switch with yearly highlighted as default */}
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 mb-6">
            <button
              className={cn(
                "py-2 px-4 rounded-full transition-colors duration-200",
                billingCycle === 'monthly' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-foreground/80'
              )}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={cn(
                "py-2 px-4 rounded-full transition-colors duration-200",
                billingCycle === 'yearly' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-foreground/80'
              )}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
            </button>
          </div>
          {billingCycle === 'yearly' && (
            <div className="text-sm text-green-500 dark:text-green-400 font-medium mb-4">
              Save significantly with our yearly plans!
            </div>
          )}
        </div>

        {/* Pricing Cards - Mobile responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 mb-16 max-w-6xl mx-auto">
          {/* Lite Plan */}
          <div className="pricing-card">
            <div className="flex-grow">
              <h3 className="text-xl font-bold mb-1 text-foreground">Lite Plan</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Perfect for casual users managing a single social media platform.
              </p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-foreground">
                  {billingCycle === 'monthly' ? '£9.99' : '£59.99'}
                </span>
                <span className="text-muted-foreground text-sm ml-1">
                  {billingCycle === 'monthly' ? '/month' : '/year'}
                </span>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-500 dark:text-green-400 font-medium mt-1">
                    Save £59.89/year (~50%)
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">5 free requests during trial</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">
                    {billingCycle === 'monthly' ? '75 requests/month' : '900 requests/year'}
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">Single platform support</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">Post ideas and captions (image only support)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">Basic analytics</span>
                </li>
              </ul>
            </div>
            <div className="pt-5 border-t border-border/50 space-y-3">
              <Button 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={() => handlePurchase(
                  'basic', 
                  getStripePriceId('basic', billingCycle)
                )}
                disabled={isLoading['basic']}
              >
                {isLoading['basic'] ? 'Processing...' : 'Choose Lite'}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Payment details required. Cancel anytime.
              </p>
            </div>
          </div>
          
          {/* Pro Plan */}
          <div className="pricing-card relative">
            <div className="absolute top-0 right-0 left-0">
              <div className="bg-primary text-primary-foreground text-xs font-medium py-1 text-center rounded-t-lg">
                Most Popular
              </div>
            </div>
            <div className="flex-grow pt-6">
              <h3 className="text-xl font-bold mb-1 text-foreground">Pro Plan</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ideal for small businesses managing multiple platforms.
              </p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-foreground">
                  {billingCycle === 'monthly' ? '£59.99' : '£199.99'}
                </span>
                <span className="text-muted-foreground text-sm ml-1">
                  {billingCycle === 'monthly' ? '/month' : '/year'}
                </span>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-500 dark:text-green-400 font-medium mt-1">
                    Save £519.89/year (~43%)
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">
                    {billingCycle === 'monthly' ? '250 requests/month' : '3000 requests/year'}
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">Multi-platform support</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">Advanced Post ideas and captions</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">Multi-media support (image/video)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">Priority support</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">Custom templates</span>
                </li>
              </ul>
            </div>
            <div className="pt-5 border-t border-border/50">
              <Button 
                className="w-full bg-violet-600 hover:bg-violet-700"
                onClick={() => handlePurchase(
                  'premium', 
                  getStripePriceId('premium', billingCycle)
                )}
                disabled={isLoading['premium']}
              >
                {isLoading['premium'] ? 'Processing...' : 'Choose Pro'}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Includes 5-day free trial. Cancel anytime.
              </p>
            </div>
          </div>
          
          {/* Flex Add-On */}
          <div className="pricing-card">
            <div className="flex-grow">
              <h3 className="text-xl font-bold mb-1 text-foreground">Flex Add-On</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Pay as you go option for additional content generations.
              </p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-foreground">£1.99</span>
                <span className="text-muted-foreground text-sm ml-1"> per pack</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">No monthly commitment</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">Works with Lite or Pro plan</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">Same features as your base plan</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">Usage analytics included</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">20 additional requests per pack</span>
                </li>
              </ul>
            </div>
            <div className="pt-5 border-t border-border/50">
              <Button 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={() => handlePurchase('flexy', getStripePriceId('flexy', 'monthly'))}
                disabled={isLoading['flexy']}
              >
                {isLoading['flexy'] ? 'Processing...' : 'Add Flex Pack'}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                One-time purchase, no subscription required.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center text-foreground">Frequently Asked Questions</h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b border-border/50">
              <AccordionTrigger className="text-left text-foreground py-4">What's included in the free trial?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                All plans come with a 5-day free trial that includes 5 free requests. You can test all features available in your chosen plan during this period. Credit card details are required to start a trial.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-b border-border/50">
              <AccordionTrigger className="text-left text-foreground py-4">Can I change plans later?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border-b border-border/50">
              <AccordionTrigger className="text-left text-foreground py-4">How does the Flex Add-On work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                The Flex Add-On allows you to purchase additional requests when you need them. Each purchase gives you 20 extra requests that never expire.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border-b border-border/50">
              <AccordionTrigger className="text-left text-foreground py-4">How is billing handled?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                For monthly and yearly plans, you'll be billed automatically at the start of each billing cycle. You can cancel anytime before your next billing date.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border-b border-border/50">
              <AccordionTrigger className="text-left text-foreground py-4">Do you offer refunds?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                We offer a 14-day money-back guarantee if you're not satisfied with your subscription. Contact our support team to process your refund.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of content creators and businesses who use EngagePerfect AI to create engaging content that resonates with their audience.
          </p>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-lg text-lg"
            onClick={freeTrial}
          >
            Start Your Free Trial Today
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
