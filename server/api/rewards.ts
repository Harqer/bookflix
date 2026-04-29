import { Router } from "express";
import { deductCredits, getUserById, getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * 📺 Reward & Ad Monetization Router
 * Converts 'Attention' into 'Render Credits'.
 */
const rewardRouter = Router();

const REWARD_AMOUNT = 10; // Credits earned per ad view
const AD_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between ads

rewardRouter.post("/claim-ad-reward", async (req, res) => {
  const { userId, google_signature, key_id } = req.body;

  try {
    // 1. Digital Signature Verification (Sound & Logical Security)
    // We verify that this request actually came from Google's SSV servers
    // using their public keys.
    const isVerified = await verifyGoogleAdSignature(req.body, google_signature, key_id);
    if (!isVerified) {
      return res.status(403).json({ error: "Invalid Ad Signature" });
    }
    const now = new Date();
    // (LastAd check logic would go here)

    // 2. Inject Credits
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    await db.update(users)
      .set({ 
        credits: user.credits + REWARD_AMOUNT,
        updatedAt: now 
      })
      .where(eq(users.id, userId));

    return res.json({ 
      success: true, 
      newBalance: user.credits + REWARD_AMOUNT,
      message: `You earned ${REWARD_AMOUNT} credits for watching the production sponsor!`
    });

  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
});

export default rewardRouter;
