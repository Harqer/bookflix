import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { upsertUser } from '../../db';

/**
 * Clerk Webhook Handler (Enterprise Verified)
 * Uses Svix to verify signatures, ensuring user sync is authentic.
 */
export async function handleClerkWebhook(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
  }

  // Get headers for Svix verification
  const headerPayload = req.headers;
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', { status: 400 });
  }

  // Handle Event
  const eventType = evt.type;
  
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, first_name, last_name, email_addresses, image_url } = evt.data;
    await upsertUser({
      id,
      name: `${first_name} ${last_name}`,
      email: email_addresses[0].email_address,
      imageUrl: image_url,
    });
    console.log(`[Enterprise Sync] User ${id} synchronized via verified webhook.`);
  }

  return new Response('', { status: 200 });
}
