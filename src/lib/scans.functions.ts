import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

/**
 * Model IDs.
 * `gemini-2.5-flash` / `gemini-2.5-pro` are NOT available on newly-issued API keys
 * (404 "no longer available to new users" / 429 zero-quota). The rolling aliases below
 * always point at the current supported Flash generation.
 */
const PRIMARY_MODEL = "gemini-flash-latest";
const FALLBACK_MODEL = "gemini-flash-lite-latest";

/** Thrown for conditions where retrying is pointless (auth, model, safety). */
class FatalScanError extends Error {}

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new FatalScanError(
      "The AI service isn't configured (missing GEMINI_API_KEY). Please contact support.",
    );
  }
  console.log("[NutriScan] using GEMINI_API_KEY prefix:", apiKey.slice(0, 8));
  return new GoogleGenAI({ apiKey });
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const data = match[2].trim();
  if (data.length < 100) throw new Error("Image data is empty");
  return { mimeType, data };
}

function extractJson(raw: string): unknown {
  let t = raw.trim();
  // Strip markdown fences anywhere in the response.
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) t = fenced[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    // Fall back to the outermost {...} span, ignoring any prose around it.
    const s = t.indexOf("{");
    const e = t.lastIndexOf("}");
    if (s !== -1 && e > s) {
      try {
        return JSON.parse(t.slice(s, e + 1));
      } catch { /* fall through */ }
    }
    throw new Error("Model did not return JSON");
  }
}

/** Turn a raw SDK/network failure into a specific, user-readable message. */
function classifyError(err: unknown): Error {
  if (err instanceof FatalScanError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  const status = Number((err as { status?: number })?.status ?? (msg.match(/\b(4\d\d|5\d\d)\b/)?.[1] ?? 0));

  if (status === 401 || status === 403 || /API key not valid|PERMISSION_DENIED|UNAUTHENTICATED/i.test(msg)) {
    return new FatalScanError("The AI service rejected our API key. Please contact support.");
  }
  if (status === 404 || /no longer available|not found/i.test(msg)) {
    return new FatalScanError("The AI model is unavailable right now. Please try again later.");
  }
  if (status === 429 || /quota|rate limit|RESOURCE_EXHAUSTED/i.test(msg)) {
    return new FatalScanError("The AI service is over its usage limit right now. Please try again in a few minutes.");
  }
  if (/safety|blocked|PROHIBITED_CONTENT/i.test(msg)) {
    return new FatalScanError("The AI declined to analyze this image. Please try a different photo.");
  }
  if (/fetch failed|network|ENOTFOUND|ECONNRESET|timeout|aborted/i.test(msg)) {
    return new Error("Network problem reaching the AI service. Please check your connection and try again.");
  }
  if (/did not return JSON|Unexpected token|Empty response/i.test(msg)) {
    return new Error("The AI response was malformed. Please try that scan again.");
  }
  return new Error(msg || "Something went wrong analyzing this image.");
}

/** Log everything the API told us about the generation, then surface real blocks as errors. */
function inspectResponse(model: string, response: {
  text?: string;
  candidates?: Array<{ finishReason?: string; safetyRatings?: unknown }>;
  promptFeedback?: { blockReason?: string; safetyRatings?: unknown };
  usageMetadata?: unknown;
}) {
  const candidate = response.candidates?.[0];
  console.log("[NutriScan] gemini response", {
    model,
    finishReason: candidate?.finishReason,
    safetyRatings: candidate?.safetyRatings,
    promptFeedback: response.promptFeedback,
    usage: response.usageMetadata,
    textLength: response.text?.length ?? 0,
  });
  if (response.promptFeedback?.blockReason) {
    throw new FatalScanError(
      `The AI blocked this image (${response.promptFeedback.blockReason}). Please try a different photo.`,
    );
  }
  if (candidate?.finishReason === "SAFETY") {
    throw new FatalScanError("The AI blocked this image for safety reasons. Please try a different photo.");
  }
  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new Error("The AI response was cut short. Please try that scan again.");
  }
  if (!response.text) throw new Error("Empty response from Gemini");
  return response.text;
}

const AnalysisSchema = z.object({
  product_name: z.string().describe("Best-guess product name from the package"),
  ingredients: z.array(z.string()).describe("All ingredients found on the label, normalized"),
  harmful_ingredients: z
    .array(
      z.object({
        name: z.string(),
        reason: z.string().describe("Why this ingredient is considered harmful or to be limited"),
        severity: z.enum(["low", "medium", "high"]),
      }),
    )
    .describe("Ingredients that are harmful, controversial, or to be limited"),
  health_score: z.number().min(0).max(100).describe("Overall health score from 0 (very unhealthy) to 100 (very healthy)"),
  summary: z.string().describe("2-3 sentence plain-language summary"),
  alternatives: z
    .array(
      z.object({
        name: z.string(),
        reason: z.string(),
      }),
    )
    .describe("3-5 healthier alternative products or ingredient swaps"),
});

export type ScanAnalysis = z.infer<typeof AnalysisSchema>;

const InputSchema = z.object({
  imageDataUrl: z
    .string()
    .min(20)
    .max(7_000_000, "Image too large (max ~5MB). Please use a smaller photo.")
    .refine(
      (v) => /^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(v),
      "Must be a base64-encoded image data URL (jpeg, png, webp, or gif)",
    ),
  concerns: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
});

const BarcodeInputSchema = z.object({
  barcode: z.string().trim().min(3).max(20).regex(/^\d+$/, "Barcode must be digits"),
  concerns: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
});

const GTIN_LENGTHS = new Set([8, 12, 13, 14]);

function isValidGtin(barcode: string) {
  if (!GTIN_LENGTHS.has(barcode.length)) return false;

  let sum = 0;
  let weight = 3;

  for (let i = barcode.length - 2; i >= 0; i -= 1) {
    sum += Number(barcode[i]) * weight;
    weight = weight === 3 ? 1 : 3;
  }

  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  return expectedCheckDigit === Number(barcode.at(-1));
}

export const analyzeFoodImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const ai = getGenAI();
    let image: { mimeType: string; data: string };
    try {
      image = parseDataUrl(data.imageDataUrl);
    } catch {
      throw new Error("Invalid or empty image. Please upload a valid JPEG, PNG, WEBP, or GIF photo.");
    }

    const concerns = data.concerns;
    const concernsText = concerns.length
      ? `\n\nThe user has these personal health concerns: ${concerns.join(", ")}. Treat ingredients risky for these concerns as harmful (raise severity), explain WHY each flagged ingredient matters for these conditions, and tailor the alternatives so they are safe and suitable for someone with these concerns.`
      : "";

    const schemaHint = `Return ONLY a JSON object (no markdown, no prose) with this exact shape:
{
  "product_name": string,
  "ingredients": string[],
  "harmful_ingredients": { "name": string, "reason": string, "severity": "low"|"medium"|"high" }[],
  "health_score": number (0-100),
  "summary": string,
  "alternatives": { "name": string, "reason": string }[]
}`;

    // OCR-first instruction: read the small print before reasoning about it, and
    // always return partial results rather than giving up.
    const systemInstruction =
      "You are NutriScan, an expert nutritionist analyzing packaged food labels.\n" +
      "STEP 1 - OCR: Before anything else, transcribe the ingredients list from the image. " +
      "Zoom mentally into the smallest printed text, including low-contrast, curved, glossy, rotated, or partially blurred packaging. " +
      "Ignore branding, marketing claims, logos, and decoration - you only care about the ingredient statement and any additive/E-number codes. " +
      "If the text is in another language, translate ingredient names to English.\n" +
      "STEP 2 - ANALYSIS: Flag ingredients widely considered harmful, ultra-processed, or to be limited " +
      "(artificial colors, trans fats, HFCS, nitrates, MSG variants, excess sodium, artificial sweeteners, BHA/BHT, palm oil, etc). " +
      "Give an honest health_score 0-100 and suggest healthier real-world alternatives.\n" +
      "NEVER refuse and never return an error. If only part of the list is legible, return the ingredients you COULD read " +
      "and note in the summary that the label was partially readable. If you can identify the product but not the label, " +
      "use the typical ingredients for that product and say so in the summary. " +
      "Only if the image contains no food product at all, return an empty ingredients list with health_score 0 and explain in summary. " +
      schemaHint +
      concernsText;

    console.log("[NutriScan] image request", {
      mimeType: image.mimeType,
      base64Length: image.data.length,
      approxBytes: Math.round((image.data.length * 3) / 4),
      primaryModel: PRIMARY_MODEL,
      responseMimeType: "application/json",
      hasSystemInstruction: systemInstruction.length > 0,
      concerns,
    });

    const tryGenerate = async (modelId: string) => {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  "Transcribe the ingredients list from this packaged food label, then analyze it. " +
                  "Respond with the JSON object only.",
              },
              // Raw base64 only - the `data:` prefix is stripped by parseDataUrl.
              { inlineData: { mimeType: image.mimeType, data: image.data } },
            ],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      });
      const text = inspectResponse(modelId, response);
      const parsed = extractJson(text);
      return AnalysisSchema.parse(parsed);
    };

    try {
      return { analysis: await tryGenerate(PRIMARY_MODEL) };
    } catch (err) {
      const classified = classifyError(err);
      console.error("[NutriScan] image analysis primary failed", { model: PRIMARY_MODEL, raw: err });
      // Only retry transient failures (timeout / empty / malformed JSON / network).
      // Auth, model-availability, quota and safety blocks are fatal - retrying just wastes time.
      if (classified instanceof FatalScanError) throw classified;
      try {
        return { analysis: await tryGenerate(FALLBACK_MODEL) };
      } catch (err2) {
        console.error("[NutriScan] image analysis fallback failed", { model: FALLBACK_MODEL, raw: err2 });
        throw classifyError(err2);
      }
    }
  });

export const analyzeBarcode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BarcodeInputSchema.parse(input))
  .handler(async ({ data }) => {
    const ai = getGenAI();

    const barcode = data.barcode.trim();
    if (!isValidGtin(barcode)) {
      return { invalid: true as const, notFound: false as const, barcode };
    }

    const hosts = [
      "https://world.openfoodfacts.org",
      "https://in.openfoodfacts.org",
      "https://world.openfoodfacts.net",
    ];
    let res: Response | null = null;
    let lastStatus = 0;
    let lastErr: unknown = null;
    outer: for (const host of hosts) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const r = await fetch(
            `${host}/api/v2/product/${barcode}.json?fields=product_name,brands,ingredients_text,ingredients_text_en,categories`,
            { headers: { "User-Agent": "NutriScan/1.0 (https://nutriscan.app)" }, signal: AbortSignal.timeout(8000) },
          );
          if (r.ok || r.status === 404) {
            res = r;
            break outer;
          }
          lastStatus = r.status;
          // Retry on 5xx / 429
          if (r.status < 500 && r.status !== 429) {
            res = r;
            break outer;
          }
        } catch (e) {
          lastErr = e;
        }
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
    if (!res) {
      console.error("OpenFoodFacts unreachable", { lastStatus, lastErr });
      return {
        invalid: false as const,
        notFound: true as const,
        barcode,
        reason: "upstream-unavailable" as const,
      };
    }
    if (res.status === 404) {
      return { invalid: false as const, notFound: true as const, barcode };
    }
    if (!res.ok) {
      return {
        invalid: false as const,
        notFound: true as const,
        barcode,
        reason: "upstream-unavailable" as const,
      };
    }
    const json = (await res.json()) as {
      status?: number;
      product?: {
        product_name?: string;
        brands?: string;
        ingredients_text?: string;
        ingredients_text_en?: string;
        categories?: string;
      };
    };
    if (json.status !== 1 || !json.product) {
      return { invalid: false as const, notFound: true as const, barcode };
    }
    const p = json.product;
    const ingredientsText = (p.ingredients_text_en || p.ingredients_text || "").trim();
    if (!ingredientsText) {
      return { invalid: false as const, notFound: true as const, barcode, reason: "no-ingredients" as const };
    }
    const productName = [p.brands, p.product_name].filter(Boolean).join(" — ") || "Unknown product";

    const concernsText = data.concerns.length
      ? `\n\nThe user has these personal health concerns: ${data.concerns.join(", ")}. Treat ingredients risky for these concerns as harmful (raise severity), explain WHY each flagged ingredient matters for these conditions, and tailor the alternatives.`
      : "";

    const schemaHint = `Return ONLY a JSON object (no markdown) with this exact shape:
{
  "product_name": string,
  "ingredients": string[],
  "harmful_ingredients": { "name": string, "reason": string, "severity": "low"|"medium"|"high" }[],
  "health_score": number (0-100),
  "summary": string,
  "alternatives": { "name": string, "reason": string }[]
}`;

    const systemInstruction =
      "You are NutriScan, an expert nutritionist. Analyze the ingredient list of a packaged food. Flag harmful preservatives, excess sugar, palm oil, artificial colors, trans fats, HFCS, nitrates, MSG variants, artificial sweeteners, BHA/BHT. Give an honest health_score 0-100, explain WHY it's unhealthy in summary, and suggest healthier real-world alternatives. " +
      schemaHint +
      concernsText;

    const userPrompt = `Product: ${productName}\n${p.categories ? `Categories: ${p.categories}\n` : ""}Ingredients: ${ingredientsText}\n\nReturn the JSON object only.`;

    const run = async (modelId: string) => {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });
      const text = inspectResponse(modelId, response);
      const parsed = extractJson(text) as Record<string, unknown>;
      if (!parsed.product_name) parsed.product_name = productName;
      return AnalysisSchema.parse(parsed);
    };

    try {
      return { invalid: false as const, notFound: false as const, analysis: await run(PRIMARY_MODEL) };
    } catch (err) {
      const classified = classifyError(err);
      console.error("[NutriScan] barcode analysis primary failed", { model: PRIMARY_MODEL, raw: err });
      if (classified instanceof FatalScanError) throw classified;
      try {
        return { invalid: false as const, notFound: false as const, analysis: await run(FALLBACK_MODEL) };
      } catch (err2) {
        console.error("[NutriScan] barcode analysis fallback failed", { model: FALLBACK_MODEL, raw: err2 });
        throw classifyError(err2);
      }
    }
  });