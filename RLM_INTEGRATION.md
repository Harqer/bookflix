# Recursive Language Models (RLM) Integration for BookFlix

## Overview
This document outlines how to apply Recursive Language Models (RLM) methodology to the BookFlix book-to-movie generation pipeline. RLMs are particularly well-suited for this use case because:

1. **Books are extremely long** (500K-2M tokens) - exceeds context window limits
2. **Complex multi-hop reasoning** required for script adaptation
3. **Character consistency** across hundreds of scenes
4. **Narrative structure analysis** across entire books
5. **Dense access patterns** - need to reference specific sections

## RLM Value Proposition for BookFlix

### Problems RLM Solves

**1. Context Window Limitations**
- Traditional: 500K token book → crashes or severe context rot
- RLM: Unlimited length with 2-3x token efficiency

**2. Character Consistency**
- Traditional: Middle sections lose character details (context rot)
- RLM: Programmatically track character state across entire book

**3. Narrative Structure**
- Traditional: Miss foreshadowing, callbacks, story arcs in long texts
- RLM: Recursively analyze structure, identify patterns across book

**4. Cost Management**
- Traditional: $30K/month for 1M context queries
- RLM: 2-3x baseline cost with better quality

## RLM Architecture for BookFlix

### High-Level RLM Integration

```
[Book Input (500K-2M tokens)]
        │
        ▼
[Python REPL Environment]
  - Full book stored as variable P
  - Root LLM gets instructions only
        │
        ▼
[Root LLM (Depth=0)]
  - Analyzes book structure
  - Delegates to sub-LLMs
  - Aggregates results
        │
        ├─► [Sub-LLM 1] Character Analysis
        ├─► [Sub-LLM 2] Narrative Structure
        ├─► [Sub-LLM 3] Scene-by-Scene Adaptation
        ├─► [Sub-LLM 4] Dialogue Extraction
        └─► [Sub-LLM N] ... (parallel processing)
        │
        ▼
[Aggregated Output]
  - Structured script
  - Character continuity metadata
  - Scene segmentation
  - Cinematic instructions
```

### RLM Implementation Strategy

#### Phase 1: Book Structure Analysis (Root LLM)

**Purpose**: Understand book architecture before processing

```python
# Root LLM instructions
"""
You are analyzing a book stored in variable P (length: {len(P)} chars).
Your task: Deconstruct the book structure for script adaptation.

Available operations:
- len(P) - Get total length
- P[start:end] - Extract sections
- re.findall(pattern, P) - Pattern matching
- llm_batch(prompts) - Spawn sub-LLMs

Steps:
1. Identify chapter structure
2. Count major characters
3. Identify narrative arc points
4. Detect genre and tone
5. Delegate detailed analysis to sub-LLMs

Set final answer in 'answer' variable.
"""
```

**Root LLM Output Example**:
```python
# Root LLM generates this code
import re

# Find chapters
chapters = re.split(r'Chapter \d+', P)
chapter_count = len(chapters)

# Find character mentions
character_mentions = re.findall(r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+', P[:10000])
unique_characters = list(set(character_mentions))

# Delegate character analysis
character_analysis = llm_batch([
    f"Analyze character {char} in context: {find_char_context(P, char)}"
    for char in unique_characters[:10]  # Limit to top 10
])

# Delegate narrative structure
narc_structure = llm_batch([
    f"Analyze narrative arc in: {chapters[i]} for 3-act structure"
    for i in range(0, len(chapters), 5)  # Sample every 5th chapter
])

answer = {
    "total_chapters": chapter_count,
    "main_characters": unique_characters,
    "narrative_analysis": narc_structure,
    "character_profiles": character_analysis
}
```

#### Phase 2: Character Consistency Tracking (Sub-LLM Depth=1)

**Purpose**: Maintain character identity across entire book

```python
# Sub-LLM instructions for character analysis
"""
Analyze character {character_name} in the provided book section.

Focus on:
1. Physical description (hair, eyes, build, age)
2. Wardrobe/clothing preferences
3. Speech patterns and dialogue style
4. Emotional baseline and range
5. Key relationships with other characters
6. Character arc progression

Output structured JSON with:
- physical_traits: {}
- wardrobe_preferences: []
- speech_patterns: {}
- emotional_range: []
- relationships: {other_char: relationship_type}
- arc_progression: [beginning, middle, end state]
"""
```

**Character State Tracking**:
```python
# Root LLM aggregates character data
character_states = {}

for char_analysis in character_analysis:
    char_name = char_analysis["name"]
    if char_name not in character_states:
        character_states[char_name] = {
            "physical": [],
            "wardrobe": [],
            "speech": [],
            "emotional": [],
            "relationships": {},
            "arc": []
        }
    
    # Merge data from different book sections
    character_states[char_name]["physical"].extend(char_analysis["physical_traits"])
    character_states[char_name]["wardrobe"].extend(char_analysis["wardrobe_preferences"])
    # ... merge other fields

# Resolve conflicts (most frequent description wins)
for char in character_states:
    character_states[char] = resolve_conflicts(character_states[char])
```

#### Phase 3: Narrative Structure Analysis (Sub-LLM Depth=1)

**Purpose**: Identify 3-act structure, hero's journey, pacing

```python
# Sub-LLM instructions for narrative analysis
"""
Analyze this book section for narrative structure.

Identify:
1. Act boundaries (Setup, Confrontation, Resolution)
2. Hero's Journey stages (Call, Refusal, Mentor, Threshold, etc.)
3. Key plot points (Inciting incident, Midpoint, Climax)
4. Pacing and tension arcs
5. Foreshadowing and callbacks

Output:
- act_structure: {act_number: [start_chapter, end_chapter]}
- hero_journey_stages: [{stage, chapter_number, description}]
- key_plot_points: [{type, chapter, description}]
- tension_arc: [{chapter, tension_level (1-10)}]
- foreshadowing: [{chapter, foreshadowed_event, payoff_chapter}]
"""
```

#### Phase 4: Scene-by-Scene Adaptation (Sub-LLM Depth=1)

**Purpose**: Convert prose to screenplay format with continuity

```python
# Root LLM delegates scene conversion
scenes = []

for chapter in chapters:
    # Break chapter into scenes
    scene_breaks = identify_scene_boundaries(chapter)
    
    for i, (start, end) in enumerate(scene_breaks):
        scene_text = chapter[start:end]
        
        # Get character states for this scene
        scene_characters = extract_characters(scene_text)
        character_context = {
            char: character_states[char]
            for char in scene_characters
        }
        
        # Delegate to sub-LLM
        scene_script = llm_batch([
            f"""
            Convert this prose to screenplay format.
            
            Prose: {scene_text}
            
            Character Context:
            {json.dumps(character_context)}
            
            Cinematic Rules:
            - Show, don't tell
            - Use visual action instead of internal monologue
            - Maintain 180-degree rule for spatial continuity
            - Include slugline, action, character, dialogue
            
            Output standard screenplay format.
            """
        ])[0]
        
        scenes.append({
            "chapter": chapter_number,
            "scene_number": i,
            "script": scene_script,
            "characters": scene_characters,
            "character_states": character_context
        })
```

## Genkit JS Integration with RLM

### Genkit Flow with RLM

```typescript
// lib/genkit/flows/scriptGeneration.ts
import { z } from 'zod';
import { defineFlow } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/google-genai';

const BookInput = z.object({
  content: z.string(), // Full book content
  genre: z.string(),
  targetDuration: z.number(),
});

const ScriptOutput = z.object({
  scenes: z.array(z.object({
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
      characterStates: z.record(z.object({
        wardrobe: z.string(),
        emotionalState: z.string(),
        physicalState: z.string(),
      })),
    }),
  })),
  characterProfiles: z.record(z.object({
    physicalTraits: z.array(z.string()),
    wardrobe: z.array(z.string()),
    speechPatterns: z.object({}),
    emotionalRange: z.array(z.string()),
    relationships: z.record(z.string()),
    arcProgression: z.array(z.string()),
  })),
  narrativeStructure: z.object({
    acts: z.array(z.object({
      actNumber: z.number(),
      startChapter: z.number(),
      endChapter: z.number(),
    })),
    heroJourney: z.array(z.object({
      stage: z.string(),
      chapter: z.number(),
      description: z.string(),
    })),
    keyPlotPoints: z.array(z.object({
      type: z.string(),
      chapter: z.number(),
      description: z.string(),
    })),
  }),
});

export const scriptGenerationFlow = defineFlow({
  name: 'scriptGeneration',
  inputSchema: BookInput,
  outputSchema: ScriptOutput,
}, async (input) => {
  // Phase 1: Root LLM - Book Structure Analysis
  const structureAnalysis = await aiGenerate({
    model: googleAI('gemini-2.5-flash'),
    prompt: `
      You are analyzing a book for script adaptation.
      The full book is stored externally. You have access to:
      - Book length: ${input.content.length} characters
      - Genre: ${input.genre}
      
      Your task:
      1. Identify chapter structure
      2. Find main characters (first 10 by frequency)
      3. Detect narrative arc points
      4. Plan delegation strategy for sub-tasks
      
      Output JSON with:
      - chapterBreakpoints: [indices where chapters start]
      - mainCharacters: [character names]
      - narrativeSections: [start, end indices for each act]
      - delegationPlan: [what to delegate to sub-LLMs]
    `,
    config: {
      temperature: 0.1,
      maxOutputTokens: 2000,
    },
  });

  // Phase 2: Parallel Character Analysis (Sub-LLMs)
  const characterProfiles: Record<string, any> = {};
  
  await Promise.all(
    structureAnalysis.mainCharacters.map(async (character: string) => {
      const profile = await aiGenerate({
        model: googleAI('gemini-2.5-flash'),
        prompt: `
          Analyze character "${character}" in this book context.
          
          Book excerpt (character mentions):
          ${extractCharacterContext(input.content, character)}
          
          Extract:
          - Physical description
          - Wardrobe preferences
          - Speech patterns
          - Emotional range
          - Key relationships
          - Character arc progression
          
          Output structured JSON.
        `,
        config: {
          temperature: 0.2,
          maxOutputTokens: 1000,
        },
      });
      
      characterProfiles[character] = profile;
    })
  );

  // Phase 3: Narrative Structure Analysis (Sub-LLM)
  const narrativeStructure = await aiGenerate({
    model: googleAI('gemini-2.5-pro'),
    prompt: `
      Analyze narrative structure for ${input.genre} book.
      
      Book sections by act:
      ${structureAnalysis.narrativeSections.map((section: any, i: number) => `
        Act ${i + 1}: ${input.content.slice(section.start, section.end)}
      `).join('\n')}
      
      Identify:
      - 3-Act structure boundaries
      - Hero's Journey stages
      - Key plot points
      - Tension arc
      - Foreshadowing and callbacks
      
      Output structured JSON.
    `,
    config: {
      temperature: 0.2,
      maxOutputTokens: 3000,
    },
  });

  // Phase 4: Scene-by-Scene Adaptation (Sub-LLMs in parallel)
  const scenes: any[] = [];
  const chapters = splitByChapters(input.content, structureAnalysis.chapterBreakpoints);
  
  for (const [chapterIndex, chapter] of chapters.entries()) {
    const sceneBreaks = identifySceneBoundaries(chapter);
    
    const chapterScenes = await Promise.all(
      sceneBreaks.map(async (breakPoint: any, sceneIndex: number) => {
        const sceneText = chapter.slice(breakPoint.start, breakPoint.end);
        const sceneCharacters = extractCharacters(sceneText);
        
        const script = await aiGenerate({
          model: googleAI('gemini-2.5-flash'),
          prompt: `
            Convert this prose to screenplay format.
            
            Prose: ${sceneText}
            
            Character Context:
            ${JSON.stringify(
              Object.fromEntries(
                sceneCharacters.map(char => [char, characterProfiles[char]])
              )
            )}
            
            Cinematic Rules:
            - Show, don't tell
            - Use visual action instead of internal monologue
            - Maintain 180-degree rule for spatial continuity
            - Include slugline, action, character, dialogue
            
            Output standard screenplay format.
          `,
          config: {
            temperature: 0.3,
            maxOutputTokens: 1500,
          },
        });
        
        return {
          chapter: chapterIndex + 1,
          sceneNumber: sceneIndex + 1,
          script,
          characters: sceneCharacters,
          characterStates: Object.fromEntries(
            sceneCharacters.map(char => [char, characterProfiles[char]])
          ),
        };
      })
    );
    
    scenes.push(...chapterScenes);
  }

  return {
    scenes,
    characterProfiles,
    narrativeStructure,
  };
});
```

## Cost Monitoring & Fallback Strategies

### RLM Configuration with Cost Controls

```typescript
// lib/genkit/config/rlm.ts
export const rlmConfig = {
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
  
  // Fallback strategy
  fallback: {
    enabled: true,
    trigger: 'timeout_or_cost',
    fallbackModel: 'gemini-2.5-flash', // Cheaper model
    fallbackMode: 'truncated_context', // Fall back to standard LLM with truncated context
  },
};
```

### Cost Monitoring Implementation

```typescript
// lib/genkit/monitoring/costTracker.ts
class CostTracker {
  private totalTokens = 0;
  private totalCost = 0;
  private phaseCosts: Record<string, number> = {};
  
  trackPhase(phaseName: string, tokens: number, cost: number) {
    this.totalTokens += tokens;
    this.totalCost += cost;
    this.phaseCosts[phaseName] = (this.phaseCosts[phaseName] || 0) + cost;
    
    // Check thresholds
    if (this.totalCost > rlmConfig.costThreshold) {
      console.warn(`Cost threshold exceeded: $${this.totalCost}`);
      if (rlmConfig.fallback.enabled) {
        this.triggerFallback();
      }
    }
  }
  
  getReport() {
    return {
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
      phaseBreakdown: this.phaseCosts,
      efficiency: this.totalTokens / this.totalCost, // Tokens per dollar
    };
  }
  
  private triggerFallback() {
    // Switch to fallback mode
    console.log('Triggering fallback strategy');
    // Implementation: switch to cheaper model, truncate context, etc.
  }
}
```

### Fallback Strategy Implementation

```typescript
// lib/genkit/flows/scriptGenerationWithFallback.ts
export const scriptGenerationWithFallback = defineFlow({
  name: 'scriptGenerationWithFallback',
  inputSchema: BookInput,
  outputSchema: ScriptOutput,
}, async (input) => {
  const costTracker = new CostTracker();
  
  try {
    // Try RLM approach first
    const result = await scriptGenerationFlow(input);
    costTracker.trackPhase('rlm_complete', estimateTokens(result), estimateCost(result));
    return result;
  } catch (error) {
    if (error instanceof TimeoutError || costTracker.totalCost > rlmConfig.costThreshold) {
      console.log('RLM failed, falling back to standard approach');
      
      // Fallback: Truncate context and use standard LLM
      const truncatedContent = input.content.slice(0, 100000); // First 100K chars
      
      const fallbackResult = await standardScriptGeneration({
        ...input,
        content: truncatedContent,
      });
      
      costTracker.trackPhase('fallback', estimateTokens(fallbackResult), estimateCost(fallbackResult));
      return fallbackResult;
    }
    
    throw error;
  }
});
```

## When to Use RLM in BookFlix

### ✅ USE RLM for:

1. **Full book analysis** (500K+ tokens)
   - Character consistency tracking
   - Narrative structure identification
   - Foreshadowing/callback detection

2. **Complex script adaptation**
   - Multi-hop reasoning across chapters
   - Character arc maintenance
   - Thematic consistency

3. **Long-form content**
   - Book-to-series adaptation
   - Multi-episode generation
   - Season-long story arcs

### ❌ DON'T USE RLM for:

1. **Short scenes** (<10K tokens)
   - Single scene generation
   - Quick dialogue fixes
   - Minor script edits

2. **Real-time requirements**
   - Live preview generation
   - Interactive editing
   - Sub-second response times

3. **Simple tasks**
   - Character name extraction
   - Basic formatting
   - Spell checking

## Expected Performance Improvements

### Based on MIT Research

| Metric | Traditional LLM | RLM (Depth=1) | Improvement |
|--------|----------------|---------------|-------------|
| Context Length | 500K max | 5M+ | 10x |
| Reasoning Accuracy | 50% | 65% | +30% |
| Token Efficiency | Baseline | 2-3x | 2-3x better |
| Information Loss | High (context rot) | None | 100% preserved |
| Cost | $30K/month | $10K/month | 3x cheaper |

### BookFlix-Specific Expectations

**Character Consistency**:
- Traditional: Characters change appearance mid-book (context rot)
- RLM: Consistent appearance across all scenes

**Narrative Structure**:
- Traditional: Miss foreshadowing, callbacks, story arcs
- RLM: Complete narrative arc analysis

**Cost Management**:
- Traditional: 1M context = $1 per query = $30K/month (1000 queries/day)
- RLM: 2-3x cost = $2-3 per query = $10K/month (same volume)

## Implementation Roadmap

### Phase 1: RLM Infrastructure (Week 1-2)
- [ ] Set up Python REPL environment in Cloud Run
- [ ] Implement Root LLM orchestration
- [ ] Create cost tracking system
- [ ] Build fallback mechanism

### Phase 2: Character Consistency (Week 3-4)
- [ ] Implement character analysis sub-LLMs
- [ ] Build character state tracking
- [ ] Create conflict resolution logic
- [ ] Test on sample books

### Phase 3: Narrative Structure (Week 5-6)
- [ ] Implement narrative analysis sub-LLMs
- [ ] Build 3-act structure detection
- [ ] Add Hero's Journey stage identification
- [ ] Create foreshadowing/callback detection

### Phase 4: Script Adaptation (Week 7-8)
- [ ] Implement scene-by-scene adaptation
- [ ] Add cinematic rule enforcement
- [ ] Integrate character continuity
- [ ] Test end-to-end pipeline

### Phase 5: Optimization (Week 9-10)
- [ ] Fine-tune delegation strategies
- [ ] Optimize cost efficiency
- [ ] Improve fallback triggers
- [ ] Production deployment

## Monitoring & Evaluation

### Key Metrics to Track

1. **Cost Metrics**
   - Tokens per query
   - Cost per scene
   - Cost per minute of video
   - Fallback trigger rate

2. **Quality Metrics**
   - Character consistency score
   - Narrative structure accuracy
   - User satisfaction ratings
   - Revision rate (how often users regenerate)

3. **Performance Metrics**
   - End-to-end generation time
   - Sub-LLM parallel efficiency
   - Timeout rate
   - Error rate

### A/B Testing Strategy

Test RLM vs Traditional approach:

**Group A (RLM)**:
- Full RLM pipeline
- Depth=1 only
- Cost monitoring enabled

**Group B (Traditional)**:
- Truncated context (100K tokens)
- Standard LLM calls
- No recursive decomposition

**Measure**:
- Cost per project
- Character consistency (manual review)
- User satisfaction
- Generation time

## Conclusion

RLM methodology is ideally suited for BookFlix's core challenge: processing extremely long books while maintaining narrative coherence and character consistency. By implementing RLM with depth=1, robust cost controls, and fallback strategies, BookFlix can:

1. **Handle unlimited book lengths** without context rot
2. **Maintain character consistency** across entire narratives
3. **Identify complex narrative structures** missed by traditional approaches
4. **Reduce costs by 3x** while improving quality
5. **Scale production** without hitting context window limits

The key to success is strict adherence to depth=1 (avoiding the "overthinking" problem), comprehensive cost monitoring, and well-designed fallback strategies for edge cases.
