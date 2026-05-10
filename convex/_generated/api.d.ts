/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_arcjet_security from "../actions/arcjet_security.js";
import type * as agents_audio_director from "../agents/audio_director.js";
import type * as agents_blender_mcp from "../agents/blender_mcp.js";
import type * as agents_book_analyst from "../agents/book_analyst.js";
import type * as agents_chapter_writer from "../agents/chapter_writer.js";
import type * as agents_character_generator from "../agents/character_generator.js";
import type * as agents_cinematographer from "../agents/cinematographer.js";
import type * as agents_comfy_refiner from "../agents/comfy_refiner.js";
import type * as agents_concept_generator from "../agents/concept_generator.js";
import type * as agents_critic from "../agents/critic.js";
import type * as agents_deepgram_orchestrator from "../agents/deepgram_orchestrator.js";
import type * as agents_director from "../agents/director.js";
import type * as agents_feature_assembler from "../agents/feature_assembler.js";
import type * as agents_finisher from "../agents/finisher.js";
import type * as agents_houdini_orchestrator from "../agents/houdini_orchestrator.js";
import type * as agents_kimodo_orchestrator from "../agents/kimodo_orchestrator.js";
import type * as agents_librescholar_author from "../agents/librescholar_author.js";
import type * as agents_llama_scripter from "../agents/llama_scripter.js";
import type * as agents_longcat_orchestrator from "../agents/longcat_orchestrator.js";
import type * as agents_master_orchestrator from "../agents/master_orchestrator.js";
import type * as agents_maya_animator from "../agents/maya_animator.js";
import type * as agents_maya_mcp from "../agents/maya_mcp.js";
import type * as agents_narrative_orchestrator from "../agents/narrative_orchestrator.js";
import type * as agents_nif_controller from "../agents/nif_controller.js";
import type * as agents_nuke_mcp from "../agents/nuke_mcp.js";
import type * as agents_nuke_orchestrator from "../agents/nuke_orchestrator.js";
import type * as agents_nvidia_nim_bridge from "../agents/nvidia_nim_bridge.js";
import type * as agents_outliner from "../agents/outliner.js";
import type * as agents_researcher from "../agents/researcher.js";
import type * as agents_riggs_agent from "../agents/riggs_agent.js";
import type * as agents_td_agent from "../agents/td_agent.js";
import type * as agents_test_orchestrator from "../agents/test_orchestrator.js";
import type * as agents_unity_orchestrator from "../agents/unity_orchestrator.js";
import type * as agents_unreal_orchestrator from "../agents/unreal_orchestrator.js";
import type * as agents_vercel_rescue_agent from "../agents/vercel_rescue_agent.js";
import type * as agents_vimax_orchestrator from "../agents/vimax_orchestrator.js";
import type * as agents_voice_master from "../agents/voice_master.js";
import type * as agents_world_builder from "../agents/world_builder.js";
import type * as agents_worldlabs_bridge from "../agents/worldlabs_bridge.js";
import type * as arcjet from "../arcjet.js";
import type * as http from "../http.js";
import type * as ingest from "../ingest.js";
import type * as lib_ai from "../lib/ai.js";
import type * as lib_ai_service from "../lib/ai_service.js";
import type * as lib_langsmith from "../lib/langsmith.js";
import type * as lib_model_registry from "../lib/model_registry.js";
import type * as lib_observability from "../lib/observability.js";
import type * as lib_sentry from "../lib/sentry.js";
import type * as lib_siphon_service from "../lib/siphon_service.js";
import type * as lib_storage from "../lib/storage.js";
import type * as neon_archive from "../neon_archive.js";
import type * as studio from "../studio.js";
import type * as studio_siphon_registry from "../studio/siphon_registry.js";
import type * as submission from "../submission.js";
import type * as sync from "../sync.js";
import type * as test_nuke from "../test_nuke.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/arcjet_security": typeof actions_arcjet_security;
  "agents/audio_director": typeof agents_audio_director;
  "agents/blender_mcp": typeof agents_blender_mcp;
  "agents/book_analyst": typeof agents_book_analyst;
  "agents/chapter_writer": typeof agents_chapter_writer;
  "agents/character_generator": typeof agents_character_generator;
  "agents/cinematographer": typeof agents_cinematographer;
  "agents/comfy_refiner": typeof agents_comfy_refiner;
  "agents/concept_generator": typeof agents_concept_generator;
  "agents/critic": typeof agents_critic;
  "agents/deepgram_orchestrator": typeof agents_deepgram_orchestrator;
  "agents/director": typeof agents_director;
  "agents/feature_assembler": typeof agents_feature_assembler;
  "agents/finisher": typeof agents_finisher;
  "agents/houdini_orchestrator": typeof agents_houdini_orchestrator;
  "agents/kimodo_orchestrator": typeof agents_kimodo_orchestrator;
  "agents/librescholar_author": typeof agents_librescholar_author;
  "agents/llama_scripter": typeof agents_llama_scripter;
  "agents/longcat_orchestrator": typeof agents_longcat_orchestrator;
  "agents/master_orchestrator": typeof agents_master_orchestrator;
  "agents/maya_animator": typeof agents_maya_animator;
  "agents/maya_mcp": typeof agents_maya_mcp;
  "agents/narrative_orchestrator": typeof agents_narrative_orchestrator;
  "agents/nif_controller": typeof agents_nif_controller;
  "agents/nuke_mcp": typeof agents_nuke_mcp;
  "agents/nuke_orchestrator": typeof agents_nuke_orchestrator;
  "agents/nvidia_nim_bridge": typeof agents_nvidia_nim_bridge;
  "agents/outliner": typeof agents_outliner;
  "agents/researcher": typeof agents_researcher;
  "agents/riggs_agent": typeof agents_riggs_agent;
  "agents/td_agent": typeof agents_td_agent;
  "agents/test_orchestrator": typeof agents_test_orchestrator;
  "agents/unity_orchestrator": typeof agents_unity_orchestrator;
  "agents/unreal_orchestrator": typeof agents_unreal_orchestrator;
  "agents/vercel_rescue_agent": typeof agents_vercel_rescue_agent;
  "agents/vimax_orchestrator": typeof agents_vimax_orchestrator;
  "agents/voice_master": typeof agents_voice_master;
  "agents/world_builder": typeof agents_world_builder;
  "agents/worldlabs_bridge": typeof agents_worldlabs_bridge;
  arcjet: typeof arcjet;
  http: typeof http;
  ingest: typeof ingest;
  "lib/ai": typeof lib_ai;
  "lib/ai_service": typeof lib_ai_service;
  "lib/langsmith": typeof lib_langsmith;
  "lib/model_registry": typeof lib_model_registry;
  "lib/observability": typeof lib_observability;
  "lib/sentry": typeof lib_sentry;
  "lib/siphon_service": typeof lib_siphon_service;
  "lib/storage": typeof lib_storage;
  neon_archive: typeof neon_archive;
  studio: typeof studio;
  "studio/siphon_registry": typeof studio_siphon_registry;
  submission: typeof submission;
  sync: typeof sync;
  test_nuke: typeof test_nuke;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
