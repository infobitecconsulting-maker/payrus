"use node";

import { v } from "convex/values";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { action } from "./_generated/server";

// AI-backed address autosuggest for the registration form
// (src/pages/register/page.tsx, and ops-console's mirror of it via the HTTP
// routes in convex/http.ts) — no licensed street/postal database is wired
// into this demo (see addressRegister.ts's own note on why one isn't
// fabricated wholesale as static data), so Claude proposes plausible real
// values instead. Two independent lookups:
//   - suggestPostalCodes: fires once country+city+province are all chosen,
//     before the user types anything.
//   - suggestStreets: fires as the user types in the street field.
// Needs ANTHROPIC_API_KEY set via `npx convex env set ANTHROPIC_API_KEY ...`
// — an unset key degrades to an empty suggestion list rather than throwing,
// same convention as isSupabaseConfigured on the frontend.

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return apiKey ? new Anthropic({ apiKey }) : null;
}

const StreetSuggestions = z.object({
  suggestions: z.array(z.string().describe("A plausible real street name in the given city")).max(6),
});

export async function generateStreetSuggestions(params: {
  country: string;
  city: string;
  province: string;
  query: string;
}): Promise<string[]> {
  const client = getClient();
  const query = params.query.trim();
  if (!client || query.length < 2) return [];

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_format: betaZodOutputFormat(StreetSuggestions),
      messages: [
        {
          role: "user",
          content:
            `List up to 6 real, plausible street names in ${params.city}, ${params.province}, ${params.country} ` +
            `that start with or closely match "${query}". Only include streets that plausibly exist there — ` +
            `no placeholders like "Main St" unless it's a genuine local street name.`,
        },
      ],
    });
    return response.parsed_output?.suggestions ?? [];
  } catch (err) {
    console.error("Street suggestion request failed:", err);
    return [];
  }
}

const PostalCodeSuggestion = z.object({
  postalCode: z.string().describe("A realistic postal code used in this city/region, in the local format"),
  area: z.string().optional().describe("The district or neighbourhood this postal code covers, if the city has more than one postal zone"),
});
const PostalCodeSuggestions = z.object({ suggestions: z.array(PostalCodeSuggestion).max(8) });

export async function generatePostalCodeSuggestions(params: {
  country: string;
  city: string;
  province: string;
}): Promise<{ postalCode: string; area?: string }[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_format: betaZodOutputFormat(PostalCodeSuggestions),
      messages: [
        {
          role: "user",
          content:
            `List up to 8 realistic, plausible postal codes used in ${params.city}, ${params.province}, ${params.country}, ` +
            `in the local postal format. If the city has more than one postal zone or district, give one entry per ` +
            `zone and label each with its area/neighbourhood name.`,
        },
      ],
    });
    return response.parsed_output?.suggestions ?? [];
  } catch (err) {
    console.error("Postal code suggestion request failed:", err);
    return [];
  }
}

// Called directly by the frontend (useAction) and, via ctx.runAction, by the
// plain HTTP routes in convex/http.ts — httpAction handlers can't live in a
// "use node" file themselves (Node-only packages like @anthropic-ai/sdk are
// only allowed inside `action`s), so the HTTP routes call these actions
// rather than importing the Node logic directly.
export const suggestStreets = action({
  args: { country: v.string(), city: v.string(), province: v.string(), query: v.string() },
  handler: async (_ctx, args) => ({ suggestions: await generateStreetSuggestions(args) }),
});

export const suggestPostalCodes = action({
  args: { country: v.string(), city: v.string(), province: v.string() },
  handler: async (_ctx, args) => ({ suggestions: await generatePostalCodeSuggestions(args) }),
});
