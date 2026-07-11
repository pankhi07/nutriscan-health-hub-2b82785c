import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Compass, Home, RefreshCw } from "lucide-react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-mesh)] opacity-70" />
      <div className="pointer-events-none absolute -left-24 top-24 h-80 w-80 animate-blob rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-24 h-72 w-72 animate-blob rounded-full bg-[color-mix(in_oklab,var(--success)_55%,transparent)] blur-3xl" style={{ animationDelay: "3s" }} />
      <div className="relative w-full max-w-md animate-slide-up text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
          <Compass className="h-8 w-8" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Error 404</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Off the label.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you're looking for isn't in our pantry. Let's get you back to something nutritious.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)]"
          >
            <Home className="mr-2 h-4 w-4" /> Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-mesh)] opacity-60" />
      <div className="relative w-full max-w-md animate-slide-up rounded-3xl border border-border/60 glass p-8 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try again, or head back home.
        </p>
        {error?.message && (
          <p className="mx-auto mt-3 max-w-full overflow-hidden text-ellipsis rounded-lg bg-muted/60 px-3 py-2 text-left text-[11px] text-muted-foreground">
            {error.message}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)]"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Home className="mr-2 h-4 w-4" /> Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NutriScan — Scan packaged food, get a health score" },
      { name: "description", content: "Snap a packaged food label and instantly get a 0-100 health score, harmful flags, and healthier alternatives." },
      { name: "author", content: "NutriScan" },
      { property: "og:title", content: "NutriScan — Scan packaged food, get a health score" },
      { property: "og:description", content: "Snap a packaged food label and instantly get a 0-100 health score, harmful flags, and healthier alternatives." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "NutriScan — Scan packaged food, get a health score" },
      { name: "twitter:description", content: "Snap a packaged food label and instantly get a 0-100 health score, harmful flags, and healthier alternatives." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e3aa8025-51eb-4d8e-81bf-1ca55538d038/id-preview-6f9f70c0--6873fec5-7a5d-4155-a677-49f1b711baa4.lovable.app-1780561646085.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e3aa8025-51eb-4d8e-81bf-1ca55538d038/id-preview-6f9f70c0--6873fec5-7a5d-4155-a677-49f1b711baa4.lovable.app-1780561646085.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('nutriscan-theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
