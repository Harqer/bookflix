import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Test: Chapter Splitting Fallback Logic ───────────────────────────────────

describe("Chapter splitting fallback", () => {
  it("splits text by chapter markers", () => {
    const text = "Chapter 1\nSome content here.\nChapter 2\nMore content here.";
    const chapterRegex = /(?:^|\n)(chapter\s+\d+|chapter\s+[ivxlcdm]+|\d+\.|part\s+\d+)/gi;
    const matches = [...text.matchAll(chapterRegex)];
    expect(matches.length).toBe(2);
    expect(matches[0][1].toLowerCase()).toContain("chapter 1");
    expect(matches[1][1].toLowerCase()).toContain("chapter 2");
  });

  it("falls back to word-count splitting when no chapter markers", () => {
    const words = Array.from({ length: 6000 }, (_, i) => `word${i}`);
    const rawText = words.join(" ");
    const chunkSize = 3000;
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push({
        number: Math.floor(i / chunkSize) + 1,
        title: `Chapter ${Math.floor(i / chunkSize) + 1}`,
        content: words.slice(i, i + chunkSize).join(" "),
      });
    }
    expect(chunks.length).toBe(2);
    expect(chunks[0].number).toBe(1);
    expect(chunks[1].number).toBe(2);
  });

  it("returns single chapter when text is short", () => {
    const rawText = "This is a short story with no chapters.";
    const chapterMeta: Array<{ number: number; title: string; startMarker: string }> = [];
    const result = chapterMeta.length === 0
      ? [{ number: 1, title: "Chapter 1", content: rawText }]
      : [];
    expect(result.length).toBe(1);
    expect(result[0].content).toBe(rawText);
  });
});

// ─── Test: World Bible Merge Logic ────────────────────────────────────────────

describe("World Bible merge logic", () => {
  it("merges new characters into existing world bible", () => {
    const currentBible = {
      characters: {
        alice: { fullName: "Alice", aliases: [], appearance: "tall", personality: "brave", relationships: {}, arc: "hero", firstChapter: 1, lastSeenChapter: 1, visualPrompt: "" },
      },
      locations: {},
      timeline: [],
      chapterSummaries: {},
    };

    const updates = {
      newCharacters: {
        bob: { fullName: "Bob", aliases: [], appearance: "short", personality: "clever", relationships: {}, arc: "mentor", firstChapter: 2, lastSeenChapter: 2, visualPrompt: "" },
      },
      updatedCharacters: {},
      newLocations: {},
      updatedLocations: {},
      timelineEvents: [{ chapter: 2, event: "Bob appears", date: undefined }],
      chapterSummary: "Bob is introduced.",
    };

    const updatedBible = {
      ...currentBible,
      characters: {
        ...currentBible.characters,
        ...updates.newCharacters,
        ...updates.updatedCharacters,
      },
      locations: {
        ...currentBible.locations,
        ...updates.newLocations,
        ...updates.updatedLocations,
      },
      timeline: [...currentBible.timeline, ...(updates.timelineEvents || [])],
      chapterSummaries: {
        ...currentBible.chapterSummaries,
        [2]: updates.chapterSummary || "",
      },
    };

    expect(Object.keys(updatedBible.characters)).toContain("alice");
    expect(Object.keys(updatedBible.characters)).toContain("bob");
    expect(updatedBible.timeline.length).toBe(1);
    expect(updatedBible.chapterSummaries[2]).toBe("Bob is introduced.");
  });

  it("preserves existing characters when merging", () => {
    const existing = { alice: { fullName: "Alice" } };
    const newChars = { bob: { fullName: "Bob" } };
    const merged = { ...existing, ...newChars };
    expect(merged.alice.fullName).toBe("Alice");
    expect(merged.bob.fullName).toBe("Bob");
  });
});

// ─── Test: Pipeline Stage Progression ────────────────────────────────────────

describe("Pipeline stage progression", () => {
  const PIPELINE_STAGES = [
    "book_analysis",
    "world_bible_init",
    "screenplay_generation",
    "visual_direction",
    "video_production",
    "final_assembly",
  ];

  it("has 6 stages in correct order", () => {
    expect(PIPELINE_STAGES.length).toBe(6);
    expect(PIPELINE_STAGES[0]).toBe("book_analysis");
    expect(PIPELINE_STAGES[5]).toBe("final_assembly");
  });

  it("calculates chapter progress correctly", () => {
    const totalChapters = 10;
    for (let i = 0; i < totalChapters; i++) {
      const progress = 20 + Math.floor((i / totalChapters) * 75);
      expect(progress).toBeGreaterThanOrEqual(20);
      expect(progress).toBeLessThanOrEqual(95);
    }
  });

  it("identifies current stage index", () => {
    const currentStage = "screenplay_generation";
    const idx = PIPELINE_STAGES.indexOf(currentStage);
    expect(idx).toBe(2);
  });
});

// ─── Test: Book Status Validation ─────────────────────────────────────────────

describe("Book status validation", () => {
  const VALID_STATUSES = ["pending", "analyzing", "scripting", "directing", "filming", "assembling", "complete", "error"];

  it("accepts all valid book statuses", () => {
    VALID_STATUSES.forEach((status) => {
      expect(VALID_STATUSES).toContain(status);
    });
  });

  it("correctly identifies in-production statuses", () => {
    const inProduction = VALID_STATUSES.filter(
      (s) => !["complete", "error", "pending"].includes(s),
    );
    expect(inProduction).toContain("analyzing");
    expect(inProduction).toContain("scripting");
    expect(inProduction).toContain("directing");
    expect(inProduction).toContain("filming");
    expect(inProduction).toContain("assembling");
    expect(inProduction).not.toContain("complete");
    expect(inProduction).not.toContain("pending");
  });
});

// ─── Test: Word Count Estimation ─────────────────────────────────────────────

describe("Word count estimation", () => {
  it("counts words correctly", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const wordCount = text.split(/\s+/).length;
    expect(wordCount).toBe(9);
  });

  it("estimates pages from word count", () => {
    const wordCount = 90000; // typical novel
    const wordsPerPage = 250;
    const estimatedPages = Math.ceil(wordCount / wordsPerPage);
    expect(estimatedPages).toBe(360);
  });

  it("estimates chapters from word count", () => {
    const wordCount = 90000;
    const avgWordsPerChapter = 3000;
    const estimatedChapters = Math.ceil(wordCount / avgWordsPerChapter);
    expect(estimatedChapters).toBe(30);
  });
});

// ─── Test: JSON extraction from LLM response ─────────────────────────────────

describe("JSON extraction from LLM responses", () => {
  it("extracts JSON object from response text", () => {
    const response = `Here is the analysis:\n\n{"chapters": [{"number": 1, "title": "Chapter 1"}], "worldBible": {"era": "1920s"}}`;
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();
    const parsed = JSON.parse(jsonMatch![0]);
    expect(parsed.chapters).toHaveLength(1);
    expect(parsed.worldBible.era).toBe("1920s");
  });

  it("extracts JSON array from response text", () => {
    const response = `Scenes:\n\n[{"sceneNumber": 1, "slugline": "INT. ROOM - DAY"}, {"sceneNumber": 2, "slugline": "EXT. STREET - NIGHT"}]`;
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    expect(jsonMatch).not.toBeNull();
    const parsed = JSON.parse(jsonMatch![0]);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].slugline).toBe("INT. ROOM - DAY");
  });

  it("returns null when no JSON found", () => {
    const response = "I cannot process this request.";
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    expect(jsonMatch).toBeNull();
  });
});
