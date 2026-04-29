import { invokeLLM, Message } from "../_core/llm";
import * as db from "../db";
import { log, extractText } from "./base";
import { WorldBibleData } from "../types";

export async function runBookAnalyst(
  jobId: string,
  bookId: string,
  rawText: string,
  title: string,
  author: string,
  genre: string,
): Promise<{ chapters: Array<{ number: number; title: string; content: string }> }> {
  log(jobId, "Book Analyst", "info", `Starting analysis of "${title}" by ${author}`);

  const wordCount = rawText.split(/\s+/).length;
  log(jobId, "Book Analyst", "info", `Book has approximately ${wordCount.toLocaleString()} words`);

  const analysisPrompt = `You are an expert literary analyst and book editor.
Analyze the following book text and:
1. Split it into chapters (identify natural chapter breaks)
2. Extract the initial World Bible (characters, locations, themes, era, tone)

Book: "${title}" by ${author}
Genre: ${genre}

TEXT (first 8000 chars for analysis):
${rawText.slice(0, 8000)}

Return a JSON object with this exact structure:
{
  "chapters": [
    {
      "number": 1,
      "title": "Chapter title or 'Chapter 1' if unnamed",
      "startMarker": "First few words of this chapter",
      "estimatedWordCount": 2500
    }
  ],
  "worldBible": {
    "era": "Time period",
    "tone": "Overall tone",
    "themes": ["theme1"],
    "characters": { "name": { "fullName": "name", "visualPrompt": "..." } },
    "locations": { "name": { "name": "name", "visualPrompt": "..." } }
  }
}`;

  let analysisResult: any;
  try {
    const llmResult = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert literary analyst. Always respond with valid JSON only." },
        { role: "user", content: analysisPrompt },
      ] as Message[],
    });
    const response = extractText(llmResult);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!analysisResult) throw new Error("No JSON found");
  } catch (err) {
    log(jobId, "Book Analyst", "warning", "LLM analysis failed, using fallback");
    analysisResult = fallbackChapterSplit(rawText);
  }

  const chapterTexts = splitTextIntoChapters(rawText, analysisResult.chapters || []);

  const worldBible: WorldBibleData = {
    bookId,
    title,
    author,
    genre,
    era: analysisResult.worldBible?.era || "Contemporary",
    tone: analysisResult.worldBible?.tone || "dramatic",
    themes: analysisResult.worldBible?.themes || [],
    characters: analysisResult.worldBible?.characters || {},
    locations: analysisResult.worldBible?.locations || {},
    timeline: [],
    chapterSummaries: {},
  };

  await db.upsertWorldBible(bookId, worldBible as unknown as Record<string, unknown>);
  log(jobId, "Book Analyst", "success", `World Bible initialized`);

  for (const chapter of chapterTexts) {
    await db.createChapter({
      bookId,
      chapterNumber: chapter.number,
      title: chapter.title,
      rawContent: chapter.content,
      wordCount: chapter.content.split(/\s+/).length,
      status: "pending",
    });
  }

  log(jobId, "Book Analyst", "success", `Identified ${chapterTexts.length} chapters`);
  return { chapters: chapterTexts };
}

function fallbackChapterSplit(rawText: string) {
  const words = rawText.split(/\s+/);
  const chunkSize = 3000;
  const chapters = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chapters.push({
      number: Math.floor(i / chunkSize) + 1,
      title: `Chapter ${Math.floor(i / chunkSize) + 1}`,
      startMarker: words.slice(i, i + 5).join(" "),
      estimatedWordCount: chunkSize,
    });
  }
  return { chapters, worldBible: {} };
}

function splitTextIntoChapters(rawText: string, chapterMeta: any[]) {
  const words = rawText.split(/\s+/);
  const wordsPerChapter = Math.ceil(words.length / (chapterMeta.length || 1));
  return (chapterMeta.length ? chapterMeta : [{ number: 1, title: "Chapter 1" }]).map((meta, i) => ({
    number: meta.number,
    title: meta.title,
    content: words.slice(i * wordsPerChapter, (i + 1) * wordsPerChapter).join(" "),
  }));
}
