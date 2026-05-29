import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

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
  imageDataUrl: z.string().min(20),
  concerns: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
});

const BarcodeInputSchema = z.object({
  barcode: z.string().trim().min(6).max(20).regex(/^\d+$/, "Barcode must be digits"),
  concerns: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
});

export const analyzeFoodImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-2.5-flash");

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

    const messages = [
      {
        role: "system" as const,
        content:
          "You are NutriScan, an expert nutritionist analyzing packaged food labels. Read the ingredient list carefully. Flag ingredients widely considered harmful, ultra-processed, or to be limited (artificial colors, trans fats, HFCS, nitrates, MSG variants, excess sodium, artificial sweeteners, BHA/BHT, palm oil, etc). Give an honest health_score 0-100. Suggest healthier real-world alternatives. If the image is not a food label, return an empty ingredients list, health_score 0, and explain in summary. " +
          schemaHint +
          concernsText,
      },
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: "Analyze this packaged food label. Respond with the JSON object only." },
          { type: "image" as const, image: data.imageDataUrl },
        ],
      },
    ];

    const extractJson = (raw: string): unknown => {
      const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      try {
        return JSON.parse(trimmed);
      } catch {
        const start = trimmed.indexOf("{");
        const end = trimmed.lastIndexOf("}");
        if (start !== -1 && end > start) {
          return JSON.parse(trimmed.slice(start, end + 1));
        }
        throw new Error("Model did not return JSON");
      }
    };

    const tryGenerate = async (modelId: string) => {
      const { text } = await generateText({ model: gateway(modelId), messages });
      const parsed = extractJson(text);
      return AnalysisSchema.parse(parsed);
    };

    try {
      return { analysis: await tryGenerate("google/gemini-2.5-flash") };
    } catch (err) {
      console.error("NutriScan first attempt failed", err);
      try {
        return { analysis: await tryGenerate("google/gemini-2.5-pro") };
      } catch (err2) {
        console.error("NutriScan second attempt failed", err2);
        throw new Error(
          "Couldn't read this image clearly. Try a sharper, well-lit photo of the ingredients list.",
        );
      }
    }
  });