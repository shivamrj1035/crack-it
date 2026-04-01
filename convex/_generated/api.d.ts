/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiProviders from "../aiProviders.js";
import type * as analytics from "../analytics.js";
import type * as candidates from "../candidates.js";
import type * as helpers from "../helpers.js";
import type * as integrations from "../integrations.js";
import type * as interview from "../interview.js";
import type * as interviewerTypes from "../interviewerTypes.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as proctoring from "../proctoring.js";
import type * as user from "../user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiProviders: typeof aiProviders;
  analytics: typeof analytics;
  candidates: typeof candidates;
  helpers: typeof helpers;
  integrations: typeof integrations;
  interview: typeof interview;
  interviewerTypes: typeof interviewerTypes;
  notifications: typeof notifications;
  organizations: typeof organizations;
  proctoring: typeof proctoring;
  user: typeof user;
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
