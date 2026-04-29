/**
 * Cinematic Studio Core Types
 * Centralized here to avoid circular dependencies between db and pipelines.
 */

export interface PipelineLogEntry {
  timestamp: string;
  agent: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

export interface WorldBibleCharacter {
  fullName: string;
  visualPrompt: string;
  personality?: string;
  importance?: "primary" | "secondary" | "background";
}

export interface WorldBibleLocation {
  name: string;
  visualPrompt: string;
  description?: string;
}

export interface WorldBibleData {
  bookId: string;
  title: string;
  author: string;
  genre: string;
  era: string;
  tone: string;
  themes: string[];
  characters: Record<string, WorldBibleCharacter>;
  locations: Record<string, WorldBibleLocation>;
  timeline: Array<{
    event: string;
    significance: string;
  }>;
  chapterSummaries: Record<number, string>;
}
