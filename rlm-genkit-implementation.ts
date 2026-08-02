/**
 * RLM-Enhanced Script Generation Flow for BookFlix
 * 
 * This implementation integrates Recursive Language Models (RLM) methodology
 * with Genkit JS to handle unlimited book lengths while maintaining character
 * consistency and narrative structure.
 */

import { z } from 'zod';
import { defineFlow, aiGenerate } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/google-genai';

// ============================================================================
// Configuration
// ============================================================================

const RLM_CONFIG = {
  // Recursion control (CRITICAL: Never use depth > 1)
  maxDepth: 1,
  maxIterations: 50,
  
  // Cost control
  tokenBudget: 100000, // Max tokens per query
  earlyStopping: true,
  costThreshold: 10.0, // Stop if cost exceeds $10
  
  // Parallel processing
  parallelLimit: 10, // Max parallel sub-LLM calls
  batchSize: 5, // Process 5 scenes at a time
  
  // Timeout
  timeout: 300, // 5 minutes max per phase
  
  // Models
  rootModel: 'gemini-2.5-pro', // For complex orchestration
  subModel: 'gemini-2.5-flash', // For parallel sub-tasks
} as const;

// ============================================================================
// Schema Definitions
// ============================================================================

const BookInput = z.object({
  content: z.string(), // Full book content (can be 500K-2M tokens)
  genre: z.string(),
  targetDuration: z.number(), // Target video duration in minutes
  title: z.string(),
  author: z.string(),
});

const CharacterProfile = z.object({
  name: z.string(),
  physicalTraits: z.array(z.string()),
  wardrobe: z.array(z.string()),
  speechPatterns: z.object({
    vocabulary: z.array(z.string()),
    sentenceStructure: z.string(),
    tone: z.string(),
  }),
  emotionalRange: z.array(z.string()),
  relationships: z.record(z.string()),
  arcProgression: z.array(z.object({
    stage: z.string(),
    chapter: z.number(),
    description: z.string(),
  })),
});

const NarrativeStructure = z.object({
  acts: z.array(z.object({
    actNumber: z.number(),
    startChapter: z.number(),
    endChapter: z.number(),
    description: z.string(),
  })),
  heroJourney: z.array(z.object({
    stage: z.string(),
    chapter: z.number(),
    description: z.string(),
  })),
  keyPlotPoints: z.array(z.object({
    type: z.enum(['inciting_incident', 'midpoint', 'climax', 'resolution']),
    chapter: z.number(),
    description: z.string(),
  })),
  tensionArc: z.array(z.object({
    chapter: z.number(),
    tensionLevel: z.number().min(1).max(10),
  })),
  foreshadowing: z.array(z.object({
    chapter: z.number(),
    foreshadowedEvent: z.string(),
    payoffChapter: z.number(),
  })),
});

const CharacterState = z.object({
  name: z.string(),
  wardrobe: z.string(),
  emotionalState: z.string(),
  physicalState: z.string(),
});

const SceneScript = z.object({
  chapter: z.number(),
  sceneNumber: z.number(),
  slugline: z.string(),
  action: z.string(),
  characters: z.array(z.string()),
  dialogue: z.array(z.object({
    character: z.string(),
    lines: z.string(),
  })),
  metadata: z.object({
    setting: z.string(),
    time: z.string(),
    characterStates: z.array(CharacterState),
  }),
});

const ScriptOutput = z.object({
  scenes: z.array(SceneScript),
  characterProfiles: z.record(CharacterProfile),
  narrativeStructure: NarrativeStructure,
  metadata: z.object({
    totalScenes: z.number(),
    estimatedDuration: z.number(),
    mainCharacters: z.array(z.string()),
  }),
});

// ============================================================================
// Cost Tracking
// ============================================================================

class CostTracker {
  private totalTokens = 0;
  private totalCost = 0;
  private phaseCosts: Record<string, { tokens: number; cost: number }> = {};
  private callCount = 0;

  trackPhase(phaseName: string, tokens: number, cost: number) {
    this.totalTokens += tokens;
    this.totalCost += cost;
    this.callCount += 1;
    
    if (!this.phaseCosts[phaseName]) {
      this.phaseCosts[phaseName] = { tokens: 0, cost: 0 };
    }
    this.phaseCosts[phaseName].tokens += tokens;
    this.phaseCosts[phaseName].cost += cost;
    
    // Check thresholds
    if (this.totalCost > RLM_CONFIG.costThreshold) {
      console.warn(`⚠️ Cost threshold exceeded: $${this.totalCost.toFixed(2)}`);
      console.warn(`Phase breakdown:`, this.phaseCosts);
      throw new Error(`Cost threshold exceeded: $${this.totalCost.toFixed(2)}`);
    }
  }

  getReport() {
    return {
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
      callCount: this.callCount,
      phaseBreakdown: this.phaseCosts,
      efficiency: this.totalTokens / this.totalCost, // Tokens per dollar
      averageCostPerCall: this.totalCost / this.callCount,
    };
  }

  reset() {
    this.totalTokens = 0;
    this.totalCost = 0;
    this.phaseCosts = {};
    this.callCount = 0;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract character context from book content
 */
function extractCharacterContext(bookContent: string, characterName: string, contextSize = 2000): string {
  const regex = new RegExp(characterName, 'gi');
  const matches = Array.from(bookContent.matchAll(regex));
  
  if (matches.length === 0) return '';
  
  // Extract context around each mention
  const contexts = matches.slice(0, 5).map(match => {
    const start = Math.max(0, match.index - contextSize);
    const end = Math.min(bookContent.length, match.index + characterName.length + contextSize);
    return bookContent.slice(start, end);
  });
  
  return contexts.join('\n...\n');
}

/**
 * Split book content by chapters
 */
function splitByChapters(bookContent: string, breakpoints: number[]): string[] {
  const chapters: string[] = [];
  for (let i = 0; i < breakpoints.length; i++) {
    const start = breakpoints[i];
    const end = breakpoints[i + 1] || bookContent.length;
    chapters.push(bookContent.slice(start, end));
  }
  return chapters;
}

/**
 * Identify scene boundaries within a chapter
 */
function identifySceneBoundaries(chapter: string): Array<{ start: number; end: number }> {
  const boundaries: Array<{ start: number; end: number }> = [];
  
  // Simple heuristic: split by paragraph breaks, location changes, time jumps
  const sceneMarkers = chapter.match(/(?:INT\.|EXT\.|DAY|NIGHT|LATER|CONTINUOUS)/gi);
  
  if (sceneMarkers) {
    let lastIndex = 0;
    for (const marker of sceneMarkers) {
      const index = chapter.indexOf(marker, lastIndex);
      if (index > lastIndex) {
        boundaries.push({ start: lastIndex, end: index });
      }
      lastIndex = index;
    }
    boundaries.push({ start: lastIndex, end: chapter.length });
  } else {
    // Fallback: split by double line breaks
    const paragraphs = chapter.split(/\n\n+/);
    let currentIndex = 0;
    for (const paragraph of paragraphs) {
      boundaries.push({ start: currentIndex, end: currentIndex + paragraph.length });
      currentIndex += paragraph.length + 2;
    }
  }
  
  return boundaries;
}

/**
 * Extract character names from scene text
 */
function extractCharacters(sceneText: string): string[] {
  // Simple heuristic: capitalized words that appear multiple times
  const words = sceneText.match(/\b[A-Z][a-z]+\b/g) || [];
  const frequency: Record<string, number> = {};
  
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }
  
  // Filter characters (appear at least twice, not common words)
  const commonWords = ['The', 'A', 'An', 'And', 'But', 'Or', 'So', 'He', 'She', 'It', 'They'];
  return Object.entries(frequency)
    .filter(([word, count]) => count >= 2 && !commonWords.includes(word))
    .map(([word]) => word);
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate cost based on tokens (approximate Gemini pricing)
 */
function estimateCost(tokens: number, model: string): number {
  const rates: Record<string, { input: number; output: number }> = {
    'gemini-2.5-pro': { input: 0.00000125, output: 0.000005 }, // $1.25/1M input, $5/1M output
    'gemini-2.5-flash': { input: 0.000000075, output: 0.0000003 }, // $0.075/1M input, $0.30/1M output
  };
  
  const rate = rates[model] || rates['gemini-2.5-flash'];
  // Assume 50% input, 50% output
  return (tokens * 0.5 * rate.input) + (tokens * 0.5 * rate.output);
}

// ============================================================================
// RLM-Enhanced Script Generation Flow
// ============================================================================

export const rlmScriptGenerationFlow = defineFlow({
  name: 'rlmScriptGeneration',
  inputSchema: BookInput,
  outputSchema: ScriptOutput,
}, async (input) => {
  const costTracker = new CostTracker();
  console.log(`🚀 Starting RLM script generation for: ${input.title}`);
  console.log(`📖 Book length: ${input.content.length} characters (~${estimateTokens(input.content)} tokens)`);
  
  try {
    // =========================================================================
    // Phase 1: Root LLM - Book Structure Analysis
    // =========================================================================
    console.log('📊 Phase 1: Book structure analysis...');
    
    const structureAnalysis = await aiGenerate({
      model: googleAI(RLM_CONFIG.rootModel),
      prompt: `You are analyzing a book for script adaptation using Recursive Language Model methodology.

Book Information:
- Title: ${input.title}
- Author: ${input.author}
- Genre: ${input.genre}
- Total length: ${input.content.length} characters (~${estimateTokens(input.content)} tokens)
- Target duration: ${input.targetDuration} minutes

Your task (Root LLM, Depth=0):
The full book is stored externally. You cannot read it all at once. Instead, you must:
1. Strategically sample the book to understand its structure
2. Identify chapter boundaries
3. Find main characters (by frequency of mentions)
4. Detect narrative arc points (inciting incident, midpoint, climax)
5. Plan delegation strategy for sub-LLMs

Available operations:
- Book length: ${input.content.length} characters
- You can request specific sections using indices
- You can use regex to find patterns

Output JSON with this structure:
{
  "chapterBreakpoints": [indices where chapters start],
  "mainCharacters": ["character names ordered by frequency"],
  "narrativeSections": [
    {"act": 1, "start": index, "end": index, "description": "Setup"},
    {"act": 2, "start": index, "end": index, "description": "Confrontation"},
    {"act": 3, "start": index, "end": index, "description": "Resolution"}
  ],
  "delegationPlan": {
    "characterAnalysis": "how to delegate character tracking",
    "narrativeAnalysis": "how to delegate structure analysis",
    "sceneAdaptation": "how to delegate scene conversion"
  }
}

Sample the book strategically - don't try to read everything. Focus on:
- First 10% (setup)
- Middle 10% (confrontation)
- Last 10% (resolution)
- Chapter headers
- Character introductions`,
      config: {
        temperature: 0.1,
        maxOutputTokens: 2000,
      },
    });

    const structureData = JSON.parse(structureAnalysis.text);
    costTracker.trackPhase('structure_analysis', estimateTokens(structureAnalysis.text), estimateCost(estimateTokens(structureAnalysis.text), RLM_CONFIG.rootModel));
    
    console.log(`✅ Structure analysis complete: ${structureData.mainCharacters.length} main characters, ${structureData.chapterBreakpoints.length} chapters`);

    // =========================================================================
    // Phase 2: Parallel Character Analysis (Sub-LLMs, Depth=1)
    // =========================================================================
    console.log('👥 Phase 2: Character consistency tracking...');
    
    const characterProfiles: Record<string, z.infer<typeof CharacterProfile>> = {};
    
    // Process characters in parallel batches
    const characterBatches = [];
    for (let i = 0; i < structureData.mainCharacters.length; i += RLM_CONFIG.batchSize) {
      characterBatches.push(structureData.mainCharacters.slice(i, i + RLM_CONFIG.batchSize));
    }
    
    for (const batch of characterBatches) {
      const batchResults = await Promise.all(
        batch.map(async (character: string) => {
          const characterContext = extractCharacterContext(input.content, character);
          
          const profile = await aiGenerate({
            model: googleAI(RLM_CONFIG.subModel),
            prompt: `Analyze character "${character}" for script adaptation.

Book context containing this character:
${characterContext}

Extract comprehensive character profile:
1. Physical description (hair, eyes, build, age, distinguishing features)
2. Wardrobe preferences (clothing style, accessories, colors)
3. Speech patterns (vocabulary, sentence structure, tone, catchphrases)
4. Emotional range (baseline emotions, triggers, extremes)
5. Key relationships with other characters
6. Character arc progression (beginning state, middle development, end state)

Output JSON with this structure:
{
  "name": "${character}",
  "physicalTraits": ["trait1", "trait2"],
  "wardrobe": ["clothing1", "clothing2"],
  "speechPatterns": {
    "vocabulary": ["word1", "word2"],
    "sentenceStructure": "description",
    "tone": "description"
  },
  "emotionalRange": ["emotion1", "emotion2"],
  "relationships": {"otherCharacter": "relationship type"},
  "arcProgression": [
    {"stage": "beginning", "chapter": 1, "description": "initial state"},
    {"stage": "middle", "chapter": 5, "description": "development"},
    {"stage": "end", "chapter": 10, "description": "final state"}
  ]
}

Focus on consistency - this profile will be used to maintain character identity across all scenes.`,
            config: {
              temperature: 0.2,
              maxOutputTokens: 1000,
            },
          });
          
          costTracker.trackPhase('character_analysis', estimateTokens(profile.text), estimateCost(estimateTokens(profile.text), RLM_CONFIG.subModel));
          
          return {
            character,
            profile: JSON.parse(profile.text),
          };
        })
      );
      
      // Merge results
      for (const { character, profile } of batchResults) {
        characterProfiles[character] = profile;
      }
      
      console.log(`✅ Processed batch: ${batch.join(', ')}`);
    }
    
    console.log(`✅ Character analysis complete: ${Object.keys(characterProfiles).length} profiles`);

    // =========================================================================
    // Phase 3: Narrative Structure Analysis (Sub-LLM, Depth=1)
    // =========================================================================
    console.log('📚 Phase 3: Narrative structure analysis...');
    
    // Extract narrative sections
    const narrativeSectionsText = structureData.narrativeSections.map((section: any) => {
      return {
        act: section.act,
        description: section.description,
        text: input.content.slice(section.start, Math.min(section.end, section.start + 50000)), // Limit to 50K chars per act
      };
    });
    
    const narrativeStructure = await aiGenerate({
      model: googleAI(RLM_CONFIG.rootModel),
      prompt: `Analyze narrative structure for ${input.genre} book "${input.title}" by ${input.author}.

Narrative sections by act:
${narrativeSectionsText.map((section: any) => `
Act ${section.act} (${section.description}):
${section.text}
`).join('\n---\n')}

Identify narrative elements:
1. 3-Act structure boundaries (Setup, Confrontation, Resolution)
2. Hero's Journey stages (Call to Adventure, Refusal, Mentor, Threshold, Tests, Ordeal, Reward, Return)
3. Key plot points (Inciting Incident, Midpoint, Climax, Resolution)
4. Tension arc across chapters (tension level 1-10)
5. Foreshadowing and callbacks (setup in early chapters, payoff in later chapters)

Output JSON with this structure:
{
  "acts": [
    {"actNumber": 1, "startChapter": 1, "endChapter": 5, "description": "Setup"},
    {"actNumber": 2, "startChapter": 6, "endChapter": 15, "description": "Confrontation"},
    {"actNumber": 3, "startChapter": 16, "endChapter": 20, "description": "Resolution"}
  ],
  "heroJourney": [
    {"stage": "Call to Adventure", "chapter": 2, "description": "event description"},
    {"stage": "Refusal", "chapter": 3, "description": "event description"}
  ],
  "keyPlotPoints": [
    {"type": "inciting_incident", "chapter": 1, "description": "event description"},
    {"type": "midpoint", "chapter": 10, "description": "event description"},
    {"type": "climax", "chapter": 18, "description": "event description"},
    {"type": "resolution", "chapter": 20, "description": "event description"}
  ],
  "tensionArc": [
    {"chapter": 1, "tensionLevel": 3},
    {"chapter": 2, "tensionLevel": 5}
  ],
  "foreshadowing": [
    {"chapter": 2, "foreshadowedEvent": "event description", "payoffChapter": 15}
  ]
}

Focus on identifying patterns that span across the entire narrative.`,
      config: {
        temperature: 0.2,
        maxOutputTokens: 3000,
      },
    });

    const narrativeData = JSON.parse(narrativeStructure.text);
    costTracker.trackPhase('narrative_analysis', estimateTokens(narrativeStructure.text), estimateCost(estimateTokens(narrativeStructure.text), RLM_CONFIG.rootModel));
    
    console.log(`✅ Narrative analysis complete: ${narrativeData.acts.length} acts, ${narrativeData.heroJourney.length} journey stages`);

    // =========================================================================
    // Phase 4: Scene-by-Scene Adaptation (Sub-LLMs, Depth=1, Parallel)
    // =========================================================================
    console.log('🎬 Phase 4: Scene-by-scene adaptation...');
    
    const scenes: z.infer<typeof SceneScript>[] = [];
    const chapters = splitByChapters(input.content, structureData.chapterBreakpoints);
    
    for (const [chapterIndex, chapter] of chapters.entries()) {
      console.log(`  Processing chapter ${chapterIndex + 1}/${chapters.length}...`);
      
      const sceneBreaks = identifySceneBoundaries(chapter);
      
      // Process scenes in parallel batches
      const sceneBatches = [];
      for (let i = 0; i < sceneBreaks.length; i += RLM_CONFIG.batchSize) {
        sceneBatches.push(sceneBreaks.slice(i, i + RLM_CONFIG.batchSize));
      }
      
      for (const batch of sceneBatches) {
        const batchScenes = await Promise.all(
          batch.map(async (breakPoint: any, sceneIndex: number) => {
            const sceneText = chapter.slice(breakPoint.start, breakPoint.end);
            const sceneCharacters = extractCharacters(sceneText);
            
            // Get character states for this scene
            const characterStates = sceneCharacters.map(charName => {
              const profile = characterProfiles[charName];
              if (!profile) return null;
              
              // Determine character state based on narrative arc
              const currentChapter = chapterIndex + 1;
              const arcStage = profile.arcProgression.find((arc: any) => arc.chapter <= currentChapter);
              
              return {
                name: charName,
                wardrobe: profile.wardrobe[0] || 'Not specified',
                emotionalState: arcStage?.description || profile.emotionalRange[0] || 'Neutral',
                physicalState: profile.physicalTraits[0] || 'Not specified',
              };
            }).filter(Boolean);
            
            const script = await aiGenerate({
              model: googleAI(RLM_CONFIG.subModel),
              prompt: `Convert this prose to screenplay format using cinematic rules.

Original prose:
${sceneText}

Character Context (for continuity):
${JSON.stringify(characterStates, null, 2)}

Cinematic Rules to follow:
1. SHOW, DON'T TELL - Convert internal monologues to visual actions
2. Use standard screenplay format: SLUGLINE, ACTION, CHARACTER, DIALOGUE
3. Maintain 180-degree rule for spatial continuity
4. Include camera directions only when motivated by action
5. Keep dialogue natural and concise
6. Use present tense for action lines
7. Format: INT./EXT. LOCATION - TIME

Output standard screenplay format.

Character state consistency:
- Maintain wardrobe continuity from context
- Respect emotional state progression
- Keep physical descriptions consistent`,
              config: {
                temperature: 0.3,
                maxOutputTokens: 1500,
              },
            });
            
            costTracker.trackPhase('scene_adaptation', estimateTokens(script.text), estimateCost(estimateTokens(script.text), RLM_CONFIG.subModel));
            
            // Parse the script into structured format
            const lines = script.text.split('\n');
            let slugline = '';
            let action = '';
            const dialogue: Array<{ character: string; lines: string }> = [];
            let currentCharacter = '';
            let currentDialogue = '';
            
            for (const line of lines) {
              if (line.match(/^(INT\.|EXT\.)/)) {
                // New scene
                if (slugline) {
                  scenes.push({
                    chapter: chapterIndex + 1,
                    sceneNumber: scenes.filter(s => s.chapter === chapterIndex + 1).length + 1,
                    slugline,
                    action,
                    characters: sceneCharacters,
                    dialogue,
                    metadata: {
                      setting: slugline.split(' - ')[0] || 'Unknown',
                      time: slugline.split(' - ')[1] || 'Unknown',
                      characterStates: characterStates as any[],
                    },
                  });
                }
                slugline = line;
                action = '';
                dialogue.length = 0;
              } else if (line.match(/^[A-Z\s]+$/) && line.length < 50) {
                // Character name
                if (currentDialogue) {
                  dialogue.push({ character: currentCharacter, lines: currentDialogue.trim() });
                  currentDialogue = '';
                }
                currentCharacter = line;
              } else if (currentCharacter) {
                // Dialogue
                currentDialogue += line + '\n';
              } else {
                // Action
                action += line + '\n';
              }
            }
            
            // Don't forget the last scene
            if (slugline) {
              if (currentDialogue) {
                dialogue.push({ character: currentCharacter, lines: currentDialogue.trim() });
              }
              scenes.push({
                chapter: chapterIndex + 1,
                sceneNumber: scenes.filter(s => s.chapter === chapterIndex + 1).length + 1,
                slugline,
                action,
                characters: sceneCharacters,
                dialogue,
                metadata: {
                  setting: slugline.split(' - ')[0] || 'Unknown',
                  time: slugline.split(' - ')[1] || 'Unknown',
                  characterStates: characterStates as any[],
                },
              });
            }
            
            return { sceneText, script: script.text };
          })
        );
        
        console.log(`    ✅ Processed ${batch.length} scenes in chapter ${chapterIndex + 1}`);
      }
    }
    
    console.log(`✅ Scene adaptation complete: ${scenes.length} scenes generated`);

    // =========================================================================
    // Final Output
    // =========================================================================
    
    const result: z.infer<typeof ScriptOutput> = {
      scenes,
      characterProfiles,
      narrativeStructure: narrativeData,
      metadata: {
        totalScenes: scenes.length,
        estimatedDuration: scenes.length * 2, // Rough estimate: 2 minutes per scene
        mainCharacters: structureData.mainCharacters,
      },
    };
    
    const costReport = costTracker.getReport();
    console.log('\n💰 Cost Report:');
    console.log(JSON.stringify(costReport, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ RLM script generation failed:', error);
    throw error;
  }
});

// ============================================================================
// Fallback: Standard Script Generation (Non-RLM)
// ============================================================================

export const standardScriptGenerationFlow = defineFlow({
  name: 'standardScriptGeneration',
  inputSchema: BookInput,
  outputSchema: ScriptOutput,
}, async (input) => {
  console.log('🔄 Using fallback: standard script generation with truncated context');
  
  // Truncate context to first 100K characters
  const truncatedContent = input.content.slice(0, 100000);
  console.log(`📖 Truncated content: ${truncatedContent.length} characters (~${estimateTokens(truncatedContent)} tokens)`);
  
  // Single-pass generation (no RLM)
  const script = await aiGenerate({
    model: googleAI(RLM_CONFIG.rootModel),
    prompt: `Convert this book excerpt to screenplay format.

Book: ${input.title} by ${input.author}
Genre: ${input.genre}
Target duration: ${input.targetDuration} minutes

Book content (truncated):
${truncatedContent}

Generate a complete screenplay with:
1. Scene-by-scene adaptation
2. Character consistency
3. Narrative structure
4. Cinematic formatting

Output structured JSON with scenes, character profiles, and narrative structure.`,
    config: {
      temperature: 0.3,
      maxOutputTokens: 8000,
    },
  });
  
  return JSON.parse(script.text);
});

// ============================================================================
// Hybrid Flow with Automatic Fallback
// ============================================================================

export const hybridScriptGenerationFlow = defineFlow({
  name: 'hybridScriptGeneration',
  inputSchema: BookInput,
  outputSchema: ScriptOutput,
}, async (input) => {
  console.log(`🎯 Hybrid flow: RLM with automatic fallback`);
  
  try {
    // Try RLM first
    return await rlmScriptGenerationFlow(input);
  } catch (error) {
    console.warn(`⚠️ RLM failed, falling back to standard approach: ${error}`);
    
    // Fallback to standard approach
    return await standardScriptGenerationFlow({
      ...input,
      content: input.content.slice(0, 100000), // Truncate for fallback
    });
  }
});

// ============================================================================
// Export for use in Cloud Functions
// ============================================================================

export { BookInput, ScriptOutput, CharacterProfile, NarrativeStructure, SceneScript, RLM_CONFIG };
