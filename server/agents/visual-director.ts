import { invokeLLM, Message } from "../_core/llm";
import * as db from "../db";
import { log, extractText } from "./base";
import { WorldBibleData } from "../types";

export async function runVisualDirector(
  jobId: string,
  chapterId: string,
  chapterNumber: number,
  screenplay: string,
  worldBible: WorldBibleData,
): Promise<Array<{ sceneNumber: number; slugline: string; visualPrompt: string; dialogue: string }>> {
  log(jobId, "Visual Director", "info", `Creating visual direction for chapter ${chapterNumber}`);

  const directionPrompt = `You are a visionary film director creating visual prompts for AI video generation.
FILM CONTEXT: ${worldBible.title}, Era: ${worldBible.era}, Tone: ${worldBible.tone}

SCREENPLAY:
${screenplay.slice(0, 4000)}

Return a JSON array of scenes with visual prompts:
[{ "sceneNumber": 1, "slugline": "...", "visualPrompt": "...", "dialogue": "..." }]`;

  try {
    const dirResult = await invokeLLM({
      messages: [
        { role: "system", content: "You are a master film director. Respond with valid JSON array only." },
        { role: "user", content: directionPrompt },
      ] as Message[],
    });
    const response = extractText(dirResult);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const scenes = JSON.parse(jsonMatch[0]);
      for (const scene of scenes) {
        await db.createVideoScene({
          chapterId,
          bookId: worldBible.bookId,
          sceneNumber: scene.sceneNumber,
          slugline: scene.slugline,
          actionLines: scene.actionLines,
          dialogue: scene.dialogue,
          visualPrompt: scene.visualPrompt,
          status: "pending",
        });
      }
      await db.updateChapterStatus(chapterId, "filming");
      return scenes;
    }
  } catch (err) {
    log(jobId, "Visual Director", "warning", `Visual direction failed`);
  }
  return [];
}
