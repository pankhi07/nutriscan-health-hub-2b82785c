import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfile, updateProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — NutriScan" }] }),
  component: ProfilePage,
});

const DIETS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "jain", label: "Jain" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "non_vegetarian", label: "Non-Vegetarian" },
] as const;
const CONDITIONS = ["Diabetes", "PCOS", "High Blood Pressure", "High Cholesterol", "Heart Disease"];
const ALLERGIES = ["Milk", "Nuts", "Gluten", "Soy", "Egg", "Seafood"];

function ProfilePage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getProfile);
  const updateFn = useServerFn(updateProfile);
  const profQ = useQuery({ queryKey: ["profile"], queryFn: () => getFn() });

  const [form, setForm] = useState({
    full_name: "", avatar_url: "", age: "", gender: "", height_cm: "", weight_kg: "",
    dietary_preference: "" as "" | typeof DIETS[number]["value"],
    allergies: [] as string[], health_concerns: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profQ.data) return;
    const p: any = profQ.data;
    setForm({
      full_name: p.full_name ?? "",
      avatar_url: p.avatar_url ?? "",
      age: p.age?.toString() ?? "",
      gender: p.gender ?? "",
      height_cm: p.height_cm?.toString() ?? "",
      weight_kg: p.weight_kg?.toString() ?? "",
      dietary_preference: p.dietary_preference ?? "",
      allergies: p.allergies ?? [],
      health_concerns: p.health_concerns ?? [],
    });
  }, [profQ.data]);

  function toggle(field: "allergies" | "health_concerns", v: string) {
    setForm((f) => ({ ...f, [field]: f[field].includes(v) ? f[field].filter((x) => x !== v) : [...f[field], v] }));
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userData.user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: signed, error: sErr } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr) throw sErr;
      setForm((f) => ({ ...f, avatar_url: signed.signedUrl }));
      toast.success("Avatar uploaded — remember to save.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await updateFn({
        data: {
          full_name: form.full_name || null,
          avatar_url: form.avatar_url || null,
          age: form.age ? Number(form.age) : null,
          gender: form.gender || null,
          height_cm: form.height_cm ? Number(form.height_cm) : null,
          weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
          dietary_preference: (form.dietary_preference || null) as any,
          allergies: form.allergies,
          health_concerns: form.health_concerns,
        },
      });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="animate-slide-up rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)] sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personalize scans by adding your health info.</p>

        <div className="mt-6 flex items-center gap-4">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="" className="h-20 w-20 rounded-full border border-border object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-muted-foreground"><User className="h-8 w-8" /></div>
          )}
          <div>
            <Label htmlFor="avatar" className="cursor-pointer text-sm font-medium text-primary hover:underline">
              {uploading ? "Uploading…" : "Change photo"}
            </Label>
            <input id="avatar" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            <p className="text-xs text-muted-foreground">JPG or PNG</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={100} /></Field>
          <Field label="Age"><Input type="number" min={1} max={130} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
          <Field label="Gender">
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Diet">
            <select value={form.dietary_preference} onChange={(e) => setForm({ ...form, dietary_preference: e.target.value as any })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">—</option>
              {DIETS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
          <Field label="Height (cm)"><Input type="number" min={30} max={300} value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} /></Field>
          <Field label="Weight (kg)"><Input type="number" min={1} max={500} value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} /></Field>
        </div>

        <ChipGroup label="Health conditions" options={CONDITIONS} selected={form.health_concerns} onToggle={(v) => toggle("health_concerns", v)} />
        <ChipGroup label="Food allergies" options={ALLERGIES} selected={form.allergies} onToggle={(v) => toggle("allergies", v)} />

        <div className="mt-6 flex justify-end">
          <Button size="lg" onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save profile
          </Button>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function ChipGroup({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="mt-6">
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button key={o} type="button" onClick={() => onToggle(o)} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${on ? "border-transparent bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]" : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent"}`}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}