import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Heart, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMyProfile, updateHealthConcerns } from "@/lib/profile.functions";

const PRESETS = [
  "Diabetic",
  "Gluten allergy",
  "Lactose intolerant",
  "Nut allergy",
  "High blood pressure",
  "High cholesterol",
  "Pregnancy",
  "Heart disease",
  "Kidney disease",
  "Low sodium",
  "Vegan",
  "Keto",
];

export function HealthConcerns({ compact = false }: { compact?: boolean }) {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const save = useServerFn(updateHealthConcerns);

  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (data?.profile?.health_concerns) {
      setSelected(data.profile.health_concerns as string[]);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (concerns: string[]) => save({ data: { concerns } }),
    onSuccess: () => {
      toast.success("Concerns updated — future scans will personalize for you");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const toggle = (c: string) => {
    setSelected((prev) => (prev.includes(c) ? prev.filter((p) => p !== c) : [...prev, c]));
  };

  const addCustom = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = custom.trim();
    if (!trimmed) return;
    if (selected.includes(trimmed)) return setCustom("");
    if (selected.length >= 20) return toast.error("Max 20 concerns");
    setSelected((prev) => [...prev, trimmed]);
    setCustom("");
  };

  const onSave = () => mutation.mutate(selected);

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] ${compact ? "" : "animate-fade-in"}`}>
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[image:var(--gradient-primary)] opacity-10 blur-3xl" />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Your health concerns</h2>
              <p className="text-xs text-muted-foreground">We tailor every scan and alternative to your needs.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((c, i) => {
            const active = selected.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                style={{ animationDelay: `${i * 30}ms` }}
                className={`animate-fade-in inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
                  active
                    ? "border-primary bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]"
                    : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent"
                }`}
              >
                {active && <Check className="h-3 w-3" />}
                {c}
              </button>
            );
          })}
          {selected.filter((s) => !PRESETS.includes(s)).map((c) => (
            <span
              key={c}
              className="animate-scale-in inline-flex items-center gap-1.5 rounded-full border border-primary bg-[image:var(--gradient-primary)] px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              {c}
              <button onClick={() => toggle(c)} aria-label={`Remove ${c}`} className="hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={addCustom} className="mt-4 flex gap-2">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Add your own (e.g. iron deficiency)"
            maxLength={60}
            className="h-10"
          />
          <Button type="submit" variant="outline" size="icon" className="h-10 w-10 shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {selected.length} concern{selected.length === 1 ? "" : "s"} selected
          </p>
          <Button
            onClick={onSave}
            disabled={mutation.isPending}
            size="sm"
            className="shadow-[var(--shadow-soft)]"
          >
            {mutation.isPending ? "Saving…" : "Save concerns"}
          </Button>
        </div>
      </div>
    </div>
  );
}