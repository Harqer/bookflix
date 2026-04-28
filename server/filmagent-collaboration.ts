/**
 * FILMAGENT Collaboration Module
 * 
 * Implements multi-agent collaboration for film production.
 * Agents: Director, Screenwriter, Cinematographer, Actor
 * 
 * Collaboration strategies:
 * 1. Critique-Correct-Verify (CCV): Agent proposes → Agent critiques → Agent corrects → Agent verifies
 * 2. Debate-Judge (DJ): Agent A proposes → Agent B proposes → Judge evaluates → Winner refined
 */

import { invokeLLM, type InvokeParams, type InvokeResult, type Message } from './_core/llm';
import type { DirectorDecision, Scene, DirectorialVision } from './ai-director-agent';
import type { CameraTrajectory } from './gendop-integration';

interface CharacterPosition {
  characterId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  animation: string;
  startFrame: number;
  endFrame: number;
}

interface LightingSetup {
  keyLight: { position: { x: number; y: number; z: number }; color: string; intensity: number; temperature: number };
  fillLight: { position: { x: number; y: number; z: number }; color: string; intensity: number; temperature: number };
  backLight: { position: { x: number; y: number; z: number }; color: string; intensity: number; temperature: number };
  ambientLight: { color: string; intensity: number };
}

interface FilmAgentDecisions {
  director: DirectorialVision;
  camera: CameraTrajectory;
  blocking: CharacterPosition[];
  lighting: LightingSetup;
}

interface CritiqueResult {
  agent: string;
  critique: string;
  suggestions: string[];
  score: number; // 0-10
}

interface VerificationResult {
  isValid: boolean;
  issues: string[];
  improvements: string[];
  finalScore: number; // 0-10
}

/**
 * FILMAGENT multi-agent collaboration orchestrator
 */
export class FilmAgentCollaboration {
  /**
   * Critique-Correct-Verify loop
   * Agent 1 proposes → Agent 2 critiques → Agent 1 corrects → Agent 3 verifies
   */
  static async critiqueCorrectVerify(
    decisions: FilmAgentDecisions,
    scene: Scene
  ): Promise<{ refined: FilmAgentDecisions; verification: VerificationResult }> {
    try {
      // Step 1: Cinematographer critiques camera and blocking
      const cameraCritique = await this.cinematographerCritique(decisions, scene);

      // Step 2: Director corrects based on critique
      const corrected = await this.directorCorrect(decisions, cameraCritique, scene);

      // Step 3: Verify final decisions
      const verification = await this.verifyDecisions(corrected, scene);

      return { refined: corrected, verification };
    } catch (error) {
      console.error('Error in critique-correct-verify:', error);
      return {
        refined: decisions,
        verification: {
          isValid: false,
          issues: ['Collaboration failed'],
          improvements: [],
          finalScore: 0
        }
      };
    }
  }

  /**
   * Debate-Judge strategy
   * Director proposes approach A → Actor proposes approach B → Judge evaluates → Winner refined
   */
  static async debateJudge(
    scene: Scene,
    blocking1: CharacterPosition[],
    blocking2: CharacterPosition[]
  ): Promise<CharacterPosition[]> {
    try {
      // Step 1: Judge evaluates both blocking approaches
      const judgment = await this.judgeBlockingApproaches(scene, blocking1, blocking2);

      // Step 2: Return winning approach
      return judgment.winner === 'approach1' ? blocking1 : blocking2;
    } catch (error) {
      console.error('Error in debate-judge:', error);
      return blocking1; // Fallback
    }
  }

  /**
   * Cinematographer critiques camera and blocking decisions
   */
  private static async cinematographerCritique(
    decisions: FilmAgentDecisions,
    scene: Scene
  ): Promise<CritiqueResult> {
    const prompt = `As a cinematographer, critique these film production decisions:

Scene: ${JSON.stringify(scene)}
Camera Trajectory: ${JSON.stringify(decisions.camera)}
Character Blocking: ${JSON.stringify(decisions.blocking)}
Lighting: ${JSON.stringify(decisions.lighting)}

Evaluate:
1. Does the camera movement support the emotional tone?
2. Are characters properly framed and visible?
3. Is lighting appropriate for the mood?
4. Are there any technical issues (clipping, occlusion, etc.)?
5. Does the composition follow cinematographic principles?

Provide a JSON response with:
- critique: detailed critique (2-3 sentences)
- suggestions: array of 3-5 specific suggestions for improvement
- score: overall score 0-10 (10 = excellent, 0 = needs major revision)

Return ONLY valid JSON, no markdown.`;

    const params: InvokeParams = {
      messages: [
        {
          role: 'user' as const,
          content: prompt
        }
      ] as Message[],
      maxTokens: 1000
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      const parsed = JSON.parse(text);
      return {
        agent: 'cinematographer',
        critique: parsed.critique || '',
        suggestions: parsed.suggestions || [],
        score: parsed.score || 5
      };
    } catch {
      return {
        agent: 'cinematographer',
        critique: 'Critique generation failed',
        suggestions: [],
        score: 5
      };
    }
  }

  /**
   * Director corrects decisions based on critique
   */
  private static async directorCorrect(
    decisions: FilmAgentDecisions,
    critique: CritiqueResult,
    scene: Scene
  ): Promise<FilmAgentDecisions> {
    const prompt = `As a film director, revise these production decisions based on cinematographer feedback:

Original Decisions:
- Camera: ${JSON.stringify(decisions.camera)}
- Blocking: ${JSON.stringify(decisions.blocking)}
- Lighting: ${JSON.stringify(decisions.lighting)}

Cinematographer Critique:
- Issues: ${critique.critique}
- Suggestions: ${critique.suggestions.join('; ')}

Scene Context: ${JSON.stringify(scene)}

Provide corrected decisions as JSON with:
- camera: revised camera trajectory (keep same structure)
- blocking: revised character positions (keep same structure)
- lighting: revised lighting setup (keep same structure)

Focus on addressing the cinematographer's suggestions while maintaining the creative vision.
Return ONLY valid JSON, no markdown.`;

    const params: InvokeParams = {
      messages: [
        {
          role: 'user' as const,
          content: prompt
        }
      ] as Message[],
      maxTokens: 2000
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      const parsed = JSON.parse(text);
      return {
        ...decisions,
        camera: parsed.camera || decisions.camera,
        blocking: parsed.blocking || decisions.blocking,
        lighting: parsed.lighting || decisions.lighting
      };
    } catch {
      return decisions; // Fallback to original
    }
  }

  /**
   * Verify final decisions for quality and consistency
   */
  private static async verifyDecisions(
    decisions: FilmAgentDecisions,
    scene: Scene
  ): Promise<VerificationResult> {
    const prompt = `As a film production supervisor, verify these final decisions:

Scene: ${JSON.stringify(scene)}
Camera: ${JSON.stringify(decisions.camera)}
Blocking: ${JSON.stringify(decisions.blocking)}
Lighting: ${JSON.stringify(decisions.lighting)}

Check for:
1. Technical feasibility (no impossible camera moves, clipping, etc.)
2. Narrative alignment (does this serve the story?)
3. Cinematographic quality (follows best practices?)
4. Consistency (all elements work together?)
5. Safety (no hazards for actors/crew?)

Provide JSON response with:
- isValid: boolean (true if production-ready)
- issues: array of any issues found
- improvements: array of suggestions for final polish
- finalScore: 0-10 rating

Return ONLY valid JSON, no markdown.`;

    const params: InvokeParams = {
      messages: [
        {
          role: 'user' as const,
          content: prompt
        }
      ] as Message[],
      maxTokens: 1000
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      const parsed = JSON.parse(text);
      return {
        isValid: parsed.isValid || true,
        issues: parsed.issues || [],
        improvements: parsed.improvements || [],
        finalScore: parsed.finalScore || 7
      };
    } catch {
      return {
        isValid: true,
        issues: [],
        improvements: [],
        finalScore: 7
      };
    }
  }

  /**
   * Judge two competing blocking approaches
   */
  private static async judgeBlockingApproaches(
    scene: Scene,
    blocking1: CharacterPosition[],
    blocking2: CharacterPosition[]
  ): Promise<{ winner: 'approach1' | 'approach2'; reasoning: string; score1: number; score2: number }> {
    const prompt = `As a film judge, evaluate two character blocking approaches:

Scene: ${JSON.stringify(scene)}

Approach 1 Blocking:
${JSON.stringify(blocking1)}

Approach 2 Blocking:
${JSON.stringify(blocking2)}

Evaluate both on:
1. Cinematographic clarity (can audience see key characters/actions?)
2. Emotional impact (does blocking enhance the scene's emotion?)
3. Narrative support (does blocking serve the story?)
4. Visual composition (follows rule of thirds, leading lines, etc.?)
5. Practicality (can actors realistically perform these movements?)

Provide JSON response with:
- winner: 'approach1' or 'approach2'
- reasoning: explanation of why winner is better
- score1: 0-10 rating for approach 1
- score2: 0-10 rating for approach 2

Return ONLY valid JSON, no markdown.`;

    const params: InvokeParams = {
      messages: [
        {
          role: 'user' as const,
          content: prompt
        }
      ] as Message[],
      maxTokens: 800
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      const parsed = JSON.parse(text);
      return {
        winner: parsed.winner || 'approach1',
        reasoning: parsed.reasoning || '',
        score1: parsed.score1 || 5,
        score2: parsed.score2 || 5
      };
    } catch {
      return {
        winner: 'approach1',
        reasoning: 'Judgment failed, defaulting to approach 1',
        score1: 5,
        score2: 5
      };
    }
  }

  /**
   * Multi-agent consensus building
   * All agents vote on a decision, majority wins
   */
  static async buildConsensus(
    decisions: FilmAgentDecisions,
    scene: Scene
  ): Promise<{ consensus: FilmAgentDecisions; agreement: number }> {
    try {
      // Get votes from each agent
      const directorVote = await this.directorVote(decisions, scene);
      const cinematographerVote = await this.cinematographerVote(decisions, scene);
      const screenwriterVote = await this.screenwriterVote(decisions, scene);
      const actorVote = await this.actorVote(decisions, scene);

      // Calculate agreement percentage
      const votes = [directorVote, cinematographerVote, screenwriterVote, actorVote];
      const approvals = votes.filter(v => v.approved).length;
      const agreement = (approvals / votes.length) * 100;

      return {
        consensus: decisions,
        agreement
      };
    } catch (error) {
      console.error('Error in consensus building:', error);
      return {
        consensus: decisions,
        agreement: 50
      };
    }
  }

  /**
   * Director votes on decisions
   */
  private static async directorVote(
    decisions: FilmAgentDecisions,
    scene: Scene
  ): Promise<{ approved: boolean; feedback: string }> {
    const prompt = `As a film director, do you approve these production decisions?

Scene: ${JSON.stringify(scene)}
Decisions: ${JSON.stringify(decisions)}

Provide JSON with:
- approved: boolean
- feedback: brief reason

Return ONLY valid JSON, no markdown.`;

    const params: InvokeParams = {
      messages: [{ role: 'user' as const, content: prompt }] as Message[],
      maxTokens: 300
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      const parsed = JSON.parse(text);
      return { approved: parsed.approved || true, feedback: parsed.feedback || '' };
    } catch {
      return { approved: true, feedback: '' };
    }
  }

  /**
   * Cinematographer votes on decisions
   */
  private static async cinematographerVote(
    decisions: FilmAgentDecisions,
    scene: Scene
  ): Promise<{ approved: boolean; feedback: string }> {
    const prompt = `As a cinematographer, do you approve these camera and lighting decisions?

Scene: ${JSON.stringify(scene)}
Camera: ${JSON.stringify(decisions.camera)}
Lighting: ${JSON.stringify(decisions.lighting)}

Provide JSON with:
- approved: boolean
- feedback: brief reason

Return ONLY valid JSON, no markdown.`;

    const params: InvokeParams = {
      messages: [{ role: 'user' as const, content: prompt }] as Message[],
      maxTokens: 300
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      const parsed = JSON.parse(text);
      return { approved: parsed.approved || true, feedback: parsed.feedback || '' };
    } catch {
      return { approved: true, feedback: '' };
    }
  }

  /**
   * Screenwriter votes on decisions
   */
  private static async screenwriterVote(
    decisions: FilmAgentDecisions,
    scene: Scene
  ): Promise<{ approved: boolean; feedback: string }> {
    const prompt = `As a screenwriter, do these blocking and directorial decisions serve the story?

Scene: ${JSON.stringify(scene)}
Decisions: ${JSON.stringify(decisions)}

Provide JSON with:
- approved: boolean
- feedback: brief reason

Return ONLY valid JSON, no markdown.`;

    const params: InvokeParams = {
      messages: [{ role: 'user' as const, content: prompt }] as Message[],
      maxTokens: 300
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      const parsed = JSON.parse(text);
      return { approved: parsed.approved || true, feedback: parsed.feedback || '' };
    } catch {
      return { approved: true, feedback: '' };
    }
  }

  /**
   * Actor votes on decisions
   */
  private static async actorVote(
    decisions: FilmAgentDecisions,
    scene: Scene
  ): Promise<{ approved: boolean; feedback: string }> {
    const prompt = `As an actor, can you realistically perform these blocking movements?

Scene: ${JSON.stringify(scene)}
Blocking: ${JSON.stringify(decisions.blocking)}

Provide JSON with:
- approved: boolean
- feedback: brief reason

Return ONLY valid JSON, no markdown.`;

    const params: InvokeParams = {
      messages: [{ role: 'user' as const, content: prompt }] as Message[],
      maxTokens: 300
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      const parsed = JSON.parse(text);
      return { approved: parsed.approved || true, feedback: parsed.feedback || '' };
    } catch {
      return { approved: true, feedback: '' };
    }
  }
}

export type { FilmAgentDecisions, CritiqueResult, VerificationResult };
export default FilmAgentCollaboration;
