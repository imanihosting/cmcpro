-- Update subscription status from old values to PREMIUM
UPDATE User SET subscriptionStatus = 'PREMIUM' WHERE subscriptionStatus = 'BASIC';
UPDATE User SET subscriptionStatus = 'PREMIUM' WHERE subscriptionStatus = 'PRO';
UPDATE User SET subscriptionStatus = 'PREMIUM' WHERE subscriptionStatus = 'active';

-- Verify the update
SELECT subscriptionStatus, COUNT(*) FROM User GROUP BY subscriptionStatus; 