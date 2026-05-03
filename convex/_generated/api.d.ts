/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents_book_analyst from "../agents/book_analyst.js";
import type * as agents_comfy_refiner from "../agents/comfy_refiner.js";
import type * as agents_critic from "../agents/critic.js";
import type * as agents_director from "../agents/director.js";
import type * as agents_feature_assembler from "../agents/feature_assembler.js";
import type * as agents_finisher from "../agents/finisher.js";
import type * as agents_maya_animator from "../agents/maya_animator.js";
import type * as agents_nif_controller from "../agents/nif_controller.js";
import type * as agents_unreal_orchestrator from "../agents/unreal_orchestrator.js";
import type * as agents_voice_master from "../agents/voice_master.js";
import type * as arcjet from "../arcjet.js";
import type * as http from "../http.js";
import type * as ingest from "../ingest.js";
import type * as lib_ai from "../lib/ai.js";
import type * as lib_langsmith from "../lib/langsmith.js";
import type * as lib_observability from "../lib/observability.js";
import type * as lib_sentry from "../lib/sentry.js";
import type * as neon_archive from "../neon_archive.js";
import type * as studio from "../studio.js";
import type * as submission from "../submission.js";
import type * as sync from "../sync.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "agents/book_analyst": typeof agents_book_analyst;
  "agents/comfy_refiner": typeof agents_comfy_refiner;
  "agents/critic": typeof agents_critic;
  "agents/director": typeof agents_director;
  "agents/feature_assembler": typeof agents_feature_assembler;
  "agents/finisher": typeof agents_finisher;
  "agents/maya_animator": typeof agents_maya_animator;
  "agents/nif_controller": typeof agents_nif_controller;
  "agents/unreal_orchestrator": typeof agents_unreal_orchestrator;
  "agents/voice_master": typeof agents_voice_master;
  arcjet: typeof arcjet;
  http: typeof http;
  ingest: typeof ingest;
  "lib/ai": typeof lib_ai;
  "lib/langsmith": typeof lib_langsmith;
  "lib/observability": typeof lib_observability;
  "lib/sentry": typeof lib_sentry;
  neon_archive: typeof neon_archive;
  studio: typeof studio;
  submission: typeof submission;
  sync: typeof sync;
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
