/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addressRegister from "../addressRegister.js";
import type * as addressSuggestions from "../addressSuggestions.js";
import type * as addresses from "../addresses.js";
import type * as admin from "../admin.js";
import type * as aiOrgCaseAssist from "../aiOrgCaseAssist.js";
import type * as aiSupportAssist from "../aiSupportAssist.js";
import type * as cards from "../cards.js";
import type * as crons from "../crons.js";
import type * as financialData from "../financialData.js";
import type * as fx from "../fx.js";
import type * as fxRates from "../fxRates.js";
import type * as geo from "../geo.js";
import type * as geolocate from "../geolocate.js";
import type * as http from "../http.js";
import type * as linkedPaymentMethods from "../linkedPaymentMethods.js";
import type * as localAuth from "../localAuth.js";
import type * as marketplacePartners from "../marketplacePartners.js";
import type * as shopOrders from "../shopOrders.js";
import type * as supabaseAdmin from "../supabaseAdmin.js";
import type * as supabaseAuth from "../supabaseAuth.js";
import type * as testUsers from "../testUsers.js";
import type * as transactions from "../transactions.js";
import type * as userRoles from "../userRoles.js";
import type * as users from "../users.js";
import type * as walletMeta from "../walletMeta.js";
import type * as wallets from "../wallets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addressRegister: typeof addressRegister;
  addressSuggestions: typeof addressSuggestions;
  addresses: typeof addresses;
  admin: typeof admin;
  aiOrgCaseAssist: typeof aiOrgCaseAssist;
  aiSupportAssist: typeof aiSupportAssist;
  cards: typeof cards;
  crons: typeof crons;
  financialData: typeof financialData;
  fx: typeof fx;
  fxRates: typeof fxRates;
  geo: typeof geo;
  geolocate: typeof geolocate;
  http: typeof http;
  linkedPaymentMethods: typeof linkedPaymentMethods;
  localAuth: typeof localAuth;
  marketplacePartners: typeof marketplacePartners;
  shopOrders: typeof shopOrders;
  supabaseAdmin: typeof supabaseAdmin;
  supabaseAuth: typeof supabaseAuth;
  testUsers: typeof testUsers;
  transactions: typeof transactions;
  userRoles: typeof userRoles;
  users: typeof users;
  walletMeta: typeof walletMeta;
  wallets: typeof wallets;
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
