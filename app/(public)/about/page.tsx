import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { categoryIconMap, toolCategories } from "@/lib/tools-data";

export const metadata: Metadata = {
  title: "About | Filego",
  description:
    "Filego is a fast, privacy-first workspace for PDF, image, video, and document tools. Learn what we build and why.",
};

const totalToolCount = toolCategories.reduce((sum, category) => sum + category.tools.length, 0);

const principles = [
  {
    title: "Simple by default",
    description: "Fewer steps, no clutter — open a tool and get straight to the task.",
    icon: Sparkles,
  },
  {
    title: "Privacy aware",
    description: "Processing stays local where possible; we don't hold onto your files.",
    icon: ShieldCheck,
  },
  {
    title: "Built for speed",
    description: "Every tool is tuned to feel instant, even on slower connections.",
    icon: Zap,
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,120,120,0.10),transparent_40%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              About Filego
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              File tools that feel lighter, faster, and easier to trust.
            </h1>

            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Filego is a browser-based workspace for the file tasks people run
              every day — {totalToolCount}+ tools across {toolCategories.length}{" "}
              categories, from PDF and image editing to video, audio, and
              developer utilities.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-xl">
                <Link href="/tools">
                  Browse all tools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-muted-foreground">Our story</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              We built Filego because file tasks are still more frustrating
              than they should be.
            </h2>
          </div>

          <div className="mt-6 grid gap-5 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 md:grid-cols-3">
            <p>
              Too many tools feel cluttered, slow, or aggressive about
              uploads, paywalls, and confusing flows. Filego focuses on the
              core job: get from input to output with less friction.
            </p>
            <p>
              Every tool runs in the browser where possible, so files don't
              need to leave your device just to get compressed, converted, or
              cleaned up.
            </p>
            <p>
              We're not trying to do everything at once — we'd rather make
              the operations people actually use dependable, fast, and easy
              to come back to.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">What we cover</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {toolCategories.length} categories, {totalToolCount}+ tools
              </h2>
            </div>
            <Link
              href="/tools"
              className="hidden shrink-0 items-center gap-1 text-sm font-medium text-foreground/80 transition-colors hover:text-primary sm:inline-flex"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {toolCategories.map((category) => {
              const Icon = categoryIconMap[category.slug] ?? Sparkles;

              return (
                <Link
                  key={category.slug}
                  href={`/tools/${category.slug}`}
                  className="group flex items-start gap-2.5 rounded-xl border border-border/60 p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                      category.accent
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium tracking-tight transition-colors group-hover:text-primary">
                        {category.title}
                      </h3>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                      {category.tools.length} tools
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-muted-foreground">Principles</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              What guides the way we build
            </h2>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {principles.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-xl border border-border/60 bg-background p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 text-sm font-medium">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-4 py-12 text-center md:px-6 md:py-16">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Start with one task and see how fast file work can feel.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            No steep learning curve — just focused tools built for getting
            work done.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="rounded-xl">
              <Link href="/bulk-image-compressor/editor">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/privacy">Privacy</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
