import { invokeLLM, Message } from "../_core/llm";
import * as db from "../db";
import { log, extractText } from "./base";
import { WorldBibleData } from "../types";

export async function runScreenwriter(
  jobId: string,
  chapterId: string,
  chapterNumber: number,
  chapterContent: string,
  worldBible: WorldBibleData,
): Promise<string> {
  log(jobId, "Screenwriter", "info", `Writing screenplay for chapter ${chapterNumber}`);

  const characterContext = Object.entries(worldBible.characters)
    .slice(0, 5)
    .map(([key, char]) => `${char.fullName}: ${char.personality}. Appearance: ${char.appearance}`)
    .join("\n");

  const screenplayPrompt = `You are a professional Hollywood screenwriter adapting a book chapter into a screenplay.

WORLD BIBLE CONTEXT:
- Title: ${worldBible.title} by ${worldBible.author}
- Era: ${worldBible.era}
- Tone: ${worldBible.tone}
- Themes: ${worldBible.themes.join(", ")}

KEY CHARACTERS:
${characterContext}

CHAPTER ${chapterNumber} CONTENT:
${chapterContent.slice(0, 5000)}

Write a professional screenplay following standard format (INT./EXT. LOCATION - DAY/NIGHT).
FADE IN: ... FADE OUT.`;

  try {
    const screenplayResult = await invokeLLM({
      messages: [
        { role: "system", content: "You are an award-winning Hollywood screenwriter." },
        { role: "user", content: screenplayPrompt },
      ] as Message[],
    });
    const screenplay = extractText(screenplayResult);

    await db.updateChapterScreenplay(chapterId, screenplay);
    log(jobId, "Screenwriter", "success", `Screenplay written`);
    return screenplay;
  } catch (err) {
    const fallback = generateFallbackScreenplay(chapterNumber, chapterContent, worldBible);
    await db.updateChapterScreenplay(chapterId, fallback);
    log(jobId, "Screenwriter", "warning", `Used fallback screenplay`);
    return fallback;
  }
}

function generateFallbackScreenplay(chapterNumber: number, content: string, worldBible: WorldBibleData): string {
  return `FADE IN:\n\nINT. UNKNOWN LOCATION - DAY\n\nChapter ${chapterNumber} of "${worldBible.title}".\n\n${content.slice(0, 200)}...\n\nFADE OUT.`;
}
