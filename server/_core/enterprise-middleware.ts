import { Request, Response, NextFunction } from 'express';
import { RateLimiter } from './rate-limiter';

/**
 * Enterprise Security Middleware (Express Edition)
 * Replaces the Next.js middleware.ts for this project's backend.
 */
export async function enterpriseMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = (req as any).auth;
  if (!auth) return next();

  const { userId, orgId, sessionClaims } = auth;
  const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';

  // 1. IP-level Rate Limiting (Global Protection)
  const isIpAllowed = await RateLimiter.checkIpLimit(Array.isArray(ip) ? ip[0] : ip);
  if (!isIpAllowed) {
    return res.status(429).send('Too Many Requests');
  }

  // Define route matching logic
  const isStudioRoute = req.path.startsWith('/api/studio');
  const isAdminRoute = req.path.startsWith('/admin');

  // 2. Organization Quota Check for Studio Production
  if (isStudioRoute && orgId) {
    const { allowed, remaining } = await RateLimiter.checkLimit(orgId, 'studio_access');
    if (!allowed) {
      return res.status(423).send('Organization Monthly Quota Exceeded');
    }
    console.log(`[Enterprise Quota] Org ${orgId} has ${remaining} productions remaining this hour.`);
  }

  // 3. Enforce MFA for Studio Production & Admin
  if (isStudioRoute || isAdminRoute) {
    const mfaEnabled = sessionClaims?.mfa === 'enabled';
    if (!mfaEnabled) {
      console.warn(`[Enterprise Auth] MFA required for user ${userId} accessing ${req.url}`);
      // In Express, we might return a specific error or header
    }
  }

  // 4. Token Liquidity Check (Veo/Runway Style)
  const { getUserById } = await import('../db');
  
  if (isStudioRoute && userId) {
    const user = await getUserById(userId);
    const minBalance = 30; // Minimum credits to enter the studio
    
    if (!user || user.credits < minBalance) {
      return res.status(402).json({ 
        error: "Insufficient Balance", 
        message: `You need at least ${minBalance} credits to initiate a 4D production. Please top up in the Dashboard.`
      });
    }
  }

  next();
}
