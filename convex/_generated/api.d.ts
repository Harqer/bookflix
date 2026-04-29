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
import type * as agents_nif_controller from "../agents/nif_controller.js";
import type * as http from "../http.js";
import type * as lib_observability from "../lib/observability.js";
import type * as lib_sentry from "../lib/sentry.js";
import type * as studio from "../studio.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "agents/book_analyst": typeof agents_book_analyst;
  "agents/nif_controller": typeof agents_nif_controller;
  http: typeof http;
  "lib/observability": typeof lib_observability;
  "lib/sentry": typeof lib_sentry;
  studio: typeof studio;
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
