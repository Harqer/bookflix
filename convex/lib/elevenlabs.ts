import { logger } from "./observability";

export interface VoiceArchetype {
  gender: string;
  age: string;
  accent: string;
  tone: string;
}

/**
 * 🎙️ Sovereign Voice Matcher
 * Finds the best voice in the ElevenLabs account matching a character archetype.
 */
export async function findBestVoice(apiKey: string, archetype: VoiceArchetype): Promise<string | null> {
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey }
    });

    if (!response.ok) throw new Error("Failed to fetch ElevenLabs voices");

    const { voices } = await response.json();
    if (!voices || voices.length === 0) return null;

    // 🎯 Scoring Algorithm: Find best semantic match
    const scoredVoices = voices.map((v: any) => {
      let score = 0;
      
      // Match Gender (Labels or Category)
      const labels = v.labels || {};
      const genderLabel = (labels.gender || "").toLowerCase();
      if (genderLabel === archetype.gender.toLowerCase()) score += 10;
      
      // Match Age
      const ageLabel = (labels.age || "").toLowerCase();
      if (ageLabel === archetype.age.toLowerCase()) score += 5;

      // Match Accent
      const accentLabel = (labels.accent || "").toLowerCase();
      if (accentLabel.includes(archetype.accent.toLowerCase())) score += 5;

      // Professional voices get a boost
      if (v.category === "professional") score += 2;

      return { voice_id: v.voice_id, score };
    });

    // Sort by score descending
    scoredVoices.sort((a: any, b: any) => b.score - a.score);
    
    return scoredVoices[0].voice_id;
  } catch (err) {
    console.error("❌ Voice Matcher Error:", err);
    return null;
  }
}
