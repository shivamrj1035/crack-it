/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiProviders from "../aiProviders.js";
import type * as analytics from "../analytics.js";
import type * as candidates from "../candidates.js";
import type * as integrations from "../integrations.js";
import type * as interview from "../interview.js";
import type * as interviewerTypes from "../interviewerTypes.js";
import type * as organizations from "../organizations.js";
import type * as user from "../user.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiProviders: typeof aiProviders;
  analytics: typeof analytics;
  candidates: typeof candidates;
  integrations: typeof integrations;
  interview: typeof interview;
  interviewerTypes: typeof interviewerTypes;
  organizations: typeof organizations;
  user: typeof user;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
