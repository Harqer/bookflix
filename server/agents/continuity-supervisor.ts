import { invokeLLM, Message } from "../_core/llm";
import * as db from "../db";
import { log, extractText } from "./base";
import { WorldBibleData } from "../types";

export async function runContinuitySupervisor(
  jobId: string,
  bookId: string,
  chapterNumber: number,
  chapterContent: string,
  currentWorldBible: WorldBibleData,
): Promise<WorldBibleData> {
  log(jobId, "Continuity Supervisor", "info", `Reviewing chapter ${chapterNumber} for continuity`);

  const supervisionPrompt = `You are a professional script continuity supervisor for a major film production.
Review Chapter ${chapterNumber} and update the World Bible to track any new or changed information.

CURRENT WORLD BIBLE:
${JSON.stringify(currentWorldBible, null, 2).slice(0, 3000)}

CHAPTER ${chapterNumber} CONTENT:
${chapterContent.slice(0, 4000)}

Return a JSON object with ONLY the changes/additions to the World Bible:
{
  "newCharacters": {},
  "updatedCharacters": {},
  "newLocations": {},
  "updatedLocations": {},
  "timelineEvents": [],
  "chapterSummary": "...",
  "continuityNotes": []
}`;

  try {
    const llmRes = await invokeLLM({
      messages: [
        { role: "system", content: "You are a continuity supervisor. Respond with valid JSON only." },
        { role: "user", content: supervisionPrompt },
      ] as Message[],
    });
    const response = extractText(llmRes);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const updates = JSON.parse(jsonMatch[0]);
      const updatedBible: WorldBibleData = {
        ...currentWorldBible,
        characters: { ...currentWorldBible.characters, ...updates.newCharacters, ...updates.updatedCharacters },
        locations: { ...currentWorldBible.locations, ...updates.newLocations, ...updates.updatedLocations },
        timeline: [...currentWorldBible.timeline, ...(updates.timelineEvents || [])],
        chapterSummaries: { ...currentWorldBible.chapterSummaries, [chapterNumber]: updates.chapterSummary || "" },
      };

      await db.upsertWorldBible(bookId, updatedBible as unknown as Record<string, unknown>);
      log(jobId, "Continuity Supervisor", "success", `World Bible updated`);
      return updatedBible;
    }
  } catch (err) {
    log(jobId, "Continuity Supervisor", "warning", `World Bible update skipped`);
  }

  return currentWorldBible;
}
