
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createSubscriptionCheckout, createFlexCheckout } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Check, Info, ChevronRight, Gift, Star } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState<{
    [key: string]: boolean;
  }>({});

  const handlePurchase = async (plan: string, priceId: string) => {
    try {
      setIsLoading(prev => ({
        ...prev,
        [plan]: true
      }));
      
      if (!currentUser) {
        // Redirect to signup if user is not logged in
        navigate('/signup', {
          state: {
            from: 'pricing',
            plan
          }
        });
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
        variant: 'destructive'
      });
    } finally {
      setIsLoading(prev => ({
        ...prev,
        [plan]: false
      }));
    }
  };

  const freeTrial = () => {
    if (!currentUser) {
      navigate('/signup', {
        state: {
          from: 'pricing',
          plan: 'trial'
        }
      });
      return;
    }

    // In a real implementation, we would call an API to activate the trial
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-[#1A1F2C] to-[#221F26] text-white">
      <div className="px-4 py-[100px] animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">Simple, Transparent Pricing</h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">Choose the plan that's right for you</p>
          
          {/* Billing cycle switch with yearly highlighted as default */}
          <div className="inline-flex items-center bg-gray-800/60 backdrop-blur-sm rounded-full p-1 mb-6 border border-gray-700/30">
            <button 
              className={cn(
                "py-2 px-4 rounded-full transition-colors duration-200", 
                billingCycle === 'monthly' 
                  ? 'bg-violet-600 text-white' 
                  : 'text-gray-300 hover:text-white'
              )} 
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button 
              className={cn(
                "py-2 px-4 rounded-full transition-colors duration-200", 
                billingCycle === 'yearly' 
                  ? 'bg-violet-600 text-white' 
                  : 'text-gray-300 hover:text-white'
              )} 
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
            </button>
          </div>
          {billingCycle === 'yearly' && (
            <div className="text-sm text-green-400 font-medium mb-4">
              Save significantly with our yearly plans!
            </div>
          )}
        </div>

        {/* Free Trial Banner */}
        <div className="bg-gradient-to-r from-violet-700 to-indigo-600 rounded-xl p-6 shadow-lg mb-10 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <Gift className="h-8 w-8 text-white mr-4" />
              <div>
                <h3 className="text-xl font-bold text-white">Start with a 5-day Free Trial</h3>
                <p className="text-white/90">Subscribe to any plan and get 5 free requests to try out all features</p>
              </div>
            </div>
            <Button 
              className="bg-white text-violet-700 hover:bg-white/90 px-6 py-5 text-base font-medium shadow-md"
              onClick={freeTrial}
            >
              Start Your Free Trial
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Pricing Cards - Mobile responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 mb-16 max-w-6xl mx-auto">
          {/* Lite Plan */}
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/30 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1">
            <div className="p-6 border-b border-gray-700/30">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-white">Lite Plan</h3>
                  <p className="text-sm text-gray-300">
                    Perfect for casual users
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">
                    {billingCycle === 'monthly' ? '£9.99' : '£59.99'}
                  </span>
                  <span className="text-gray-300 text-sm ml-2">
                    {billingCycle === 'monthly' ? '/month' : '/year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-400 font-medium mt-1">
                    Save £59.89/year (~50%)
                  </div>
                )}
              </div>
              
              <div className="mt-4 inline-flex items-center bg-violet-600/10 px-3 py-1 rounded-full">
                <Gift className="h-4 w-4 text-violet-400 mr-1" />
                <span className="text-xs font-medium text-violet-400">5-DAY FREE TRIAL INCLUDED</span>
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">5 free requests during trial</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">
                    {billingCycle === 'monthly' ? '75 requests/month' : '900 requests/year'}
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Single platform support</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Post ideas and captions (image only support)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Basic analytics</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-6 text-base shadow-lg" 
                onClick={() => handlePurchase('basic', getStripePriceId('basic', billingCycle))} 
                disabled={isLoading['basic']}
              >
                {isLoading['basic'] ? 'Processing...' : 'Start Free Trial with Lite'}
              </Button>
              <p className="text-xs text-center text-gray-400 mt-3">
                Subscription begins after 5-day trial. Cancel anytime during trial.
              </p>
            </div>
          </div>
          
          {/* Pro Plan */}
          <div className="relative bg-gradient-to-b from-gray-800/60 via-gray-800/60 to-gray-800/60 backdrop-blur-sm border border-violet-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-1 transform scale-105 z-10">
            <div className="absolute top-0 right-0 left-0">
              <div className="bg-violet-600 text-white text-xs font-medium py-1 text-center rounded-t-lg">
                Most Popular
              </div>
            </div>
            
            <div className="p-6 pt-8 border-b border-gray-700/30">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-white">Pro Plan</h3>
                  <p className="text-sm text-gray-300">
                    Ideal for small businesses
                  </p>
                </div>
                <Star className="h-5 w-5 text-yellow-400" />
              </div>
              
              <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">
                    {billingCycle === 'monthly' ? '£59.99' : '£199.99'}
                  </span>
                  <span className="text-gray-300 text-sm ml-2">
                    {billingCycle === 'monthly' ? '/month' : '/year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-400 font-medium mt-1">
                    Save £519.89/year (~43%)
                  </div>
                )}
              </div>
              
              <div className="mt-4 inline-flex items-center bg-violet-600/20 px-3 py-1 rounded-full">
                <Gift className="h-4 w-4 text-violet-400 mr-1" />
                <span className="text-xs font-medium text-violet-400">5-DAY FREE TRIAL INCLUDED</span>
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">
                    {billingCycle === 'monthly' ? '250 requests/month' : '3000 requests/year'}
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Multi-platform support</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Advanced Post ideas and captions</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Multi-media support (image/video)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Priority support</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Custom templates</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 text-base shadow-lg" 
                onClick={() => handlePurchase('premium', getStripePriceId('premium', billingCycle))} 
                disabled={isLoading['premium']}
              >
                {isLoading['premium'] ? 'Processing...' : 'Start Free Trial with Pro'}
              </Button>
              <p className="text-xs text-center text-gray-400 mt-3">
                Subscription begins after 5-day trial. Cancel anytime during trial.
              </p>
            </div>
          </div>
          
          {/* Flex Add-On */}
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/30 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1">
            <div className="p-6 border-b border-gray-700/30">
              <h3 className="text-xl font-bold mb-1 text-white">Flex Add-On</h3>
              <p className="text-sm text-gray-300 mb-4">
                Pay as you go option for extra content
              </p>
              
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">£1.99</span>
                <span className="text-gray-300 text-sm ml-2"> per pack</span>
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">No monthly commitment</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Works with Lite or Pro plan</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Same features as your base plan</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Usage analytics included</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">20 additional requests per pack</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-6 text-base shadow-lg" 
                onClick={() => handlePurchase('flexy', getStripePriceId('flexy', 'monthly'))} 
                disabled={isLoading['flexy']}
              >
                {isLoading['flexy'] ? 'Processing...' : 'Add Flex Pack'}
              </Button>
              <p className="text-xs text-center text-gray-400 mt-3">
                One-time purchase, no subscription required.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto px-4 bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30 mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Frequently Asked Questions</h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">What's included in the free trial?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                All plans include a 5-day free trial with 5 free requests. You can test all features available in your chosen plan during this period. Your subscription will begin after the trial period unless you cancel.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">How does the 5-day free trial work?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                When you subscribe to any paid plan, you'll get a 5-day trial period with 5 free requests. If you don't cancel before the trial ends, you'll be automatically charged for your selected plan. You can cancel anytime during the trial with no charges.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">Can I change plans later?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">How does the Flex Add-On work?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                The Flex Add-On allows you to purchase additional requests when you need them. Each purchase gives you 20 extra requests that never expire.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border-b border-gray-700/50">
              <AccordionTrigger className="text-left text-white py-4">Do you offer refunds?</AccordionTrigger>
              <AccordionContent className="text-gray-300 pb-4">
                We offer a 14-day money-back guarantee if you're not satisfied with your subscription. Contact our support team to process your refund.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Call to action */}
        <div className="text-center mt-16 mb-10">
          <h2 className="text-2xl font-bold mb-4 text-white">Ready to get started?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of content creators and businesses who use EngagePerfect AI to create engaging content that resonates with their audience.
          </p>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 rounded-lg text-lg shadow-lg" onClick={freeTrial}>
            Start Your Free Trial Today
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
