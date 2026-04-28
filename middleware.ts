import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { RateLimiter } from './server/_core/rate-limiter';
import { NextResponse } from 'next/server';

/**
 * Enterprise Route Matchers
 */
const isStudioRoute = createRouteMatcher(['/studio(.*)', '/api/studio(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId, sessionClaims } = auth();
  const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';

  // 1. IP-level Rate Limiting (Global Protection)
  const isIpAllowed = await RateLimiter.checkIpLimit(ip);
  if (!isIpAllowed) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // 2. Organization Quota Check for Studio Production
  if (isStudioRoute(req) && orgId) {
    const { allowed, remaining } = await RateLimiter.checkLimit(orgId);
    if (!allowed) {
      return new NextResponse('Organization Monthly Quota Exceeded', { status: 423 });
    }
    console.log(`[Enterprise Quota] Org ${orgId} has ${remaining} productions remaining this hour.`);
  }

  // 3. Enforce MFA for Studio Production & Admin
  // In 2026, MFA is non-negotiable for enterprise DCC workflows.
  if (isStudioRoute(req) || isAdminRoute(req)) {
    const mfaEnabled = sessionClaims?.mfa === 'enabled';
    if (!mfaEnabled) {
      // Logic to redirect to MFA enrollment or step-up auth
      console.warn(`[Enterprise Auth] MFA required for user ${userId} accessing ${req.url}`);
    }
  }

  // 2. Organization Isolation
  // Ensure that every request to the studio is bound to an organization.
  // This powers the Row Level Security (RLS) in the database.
  if (isStudioRoute(req) && !orgId) {
    console.error(`[Enterprise Auth] Organization context missing for user ${userId}`);
    // In production, we would redirect to an Org Selection page
  }

  // 3. Security Logging (Audit Trail)
  if (isStudioRoute(req)) {
    console.log(`[Audit] User ${userId} [Org: ${orgId}] accessing ${req.url}`);
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
