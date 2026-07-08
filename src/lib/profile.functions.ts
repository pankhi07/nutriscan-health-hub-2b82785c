import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DietaryEnum = z.enum(["vegetarian", "vegan", "jain", "eggetarian", "non_vegetarian"]);

const ProfileUpdateSchema = z.object({
  full_name: z.string().trim().max(100).nullable().optional(),
  avatar_url: z.string().trim().max(2048).nullable().optional(),
  age: z.number().int().min(1).max(130).nullable().optional(),
  gender: z.string().trim().max(30).nullable().optional(),
  height_cm: z.number().min(30).max(300).nullable().optional(),
  weight_kg: z.number().min(1).max(500).nullable().optional(),
  dietary_preference: DietaryEnum.nullable().optional(),
  allergies: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  health_concerns: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
});

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });