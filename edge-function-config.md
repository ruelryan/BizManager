# Edge Functions JWT Configuration

After deploying functions, manually set JWT verification in Supabase Dashboard:

## 🔓 JWT Verification OFF (Turn OFF these functions):
- [ ] paypal-webhook-handler
- [ ] setup-paypal-products  
- [ ] verify-paypal-payment
- [ ] retry-subscription-payment
- [ ] fix-subscription-state
- [ ] webhook-test-simulator
- [ ] manual-subscription-fix

## 🔒 JWT Verification ON (Turn ON these functions):
- [ ] cancel-subscription
- [ ] reactivate-subscription
- [ ] sync-paypal-subscription

## Quick Access:
Supabase Dashboard → Edge Functions → Click function name → Function Configuration → Toggle "Verify JWT with legacy secret"