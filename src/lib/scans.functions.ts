import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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
  imageUrl: z.string().url().nullable().optional(),
});

export const analyzeFoodImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-2.5-flash");

    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("health_concerns")
      .eq("id", userId)
      .maybeSingle();
    const concerns = (profile?.health_concerns ?? []) as string[];
    const concernsText = concerns.length
      ? `\n\nThe user has these personal health concerns: ${concerns.join(", ")}. Treat ingredients risky for these concerns as harmful (raise severity), explain WHY each flagged ingredient matters for these conditions, and tailor the alternatives so they are safe and suitable for someone with these concerns.`
      : "";

    const { output } = await generateText({
      model,
      output: Output.object({ schema: AnalysisSchema }),
      messages: [
        {
          role: "system",
          content:
            "You are NutriScan, an expert nutritionist analyzing packaged food labels. Read the ingredient list carefully. Flag ingredients that are widely considered harmful, ultra-processed, or to be limited (artificial colors, trans fats, high-fructose corn syrup, nitrates, MSG variants, excess sodium, artificial sweeteners like aspartame, BHA/BHT, palm oil, etc). Give an honest health_score 0-100. Suggest healthier real-world alternatives. If the image is not a food label, return an empty ingredients list, health_score 0, and explain in summary." +
            concernsText,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this packaged food label." },
            { type: "image", image: data.imageDataUrl },
          ],
        },
      ],
    });

    const { data: inserted, error } = await supabase
      .from("scans")
      .insert({
        user_id: userId,
        product_name: output.product_name,
        image_url: data.imageUrl ?? null,
        ingredients: output.ingredients,
        harmful_ingredients: output.harmful_ingredients,
        health_score: Math.round(output.health_score),
        summary: output.summary,
        alternatives: output.alternatives,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { scan: inserted, analysis: output };
  });

export const getScans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { scans: data ?? [] };
  });

export const deleteScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("scans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });