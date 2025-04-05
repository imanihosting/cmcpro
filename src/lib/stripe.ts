import Stripe from "stripe";

// Instead of initializing Stripe directly, use a function to create and cache the instance
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }
  
  // Make sure we have a key before trying to initialize
  const apiKey = process.env.STRIPE_SECRET_KEY;
  
  if (!apiKey) {
    // During build time, we might not have the key
    // This will prevent errors during build but will throw at runtime if missing
    console.warn("Stripe API key is missing. This will cause errors in production.");
    
    // Return a mock object during build time
    if (process.env.NODE_ENV === 'production') {
      throw new Error("Stripe API key is required in production");
    }
    
    // For development/build, return a dummy instance that will be replaced
    // This is just to prevent build errors
    return new Stripe('dummy_key_for_build_time', {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  
  // Initialize with the real key
  stripeInstance = new Stripe(apiKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
  
  return stripeInstance;
}

// For backward compatibility - most places expect to use a direct import
// This ensures existing code doesn't break
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    // Only initialize Stripe when methods are actually called
    const instance = getStripe();
    // @ts-ignore
    return instance[prop];
  },
}); 