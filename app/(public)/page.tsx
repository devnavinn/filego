import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileImage,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const tools = [
  { name: "Compress Image", href: "/image-squoosh" },
  { name: "Merge PDF", href: "/merge-pdf" },
  { name: "Split PDF", href: "/split-pdf" },
  { name: "JPG to PDF", href: "/jpg-to-pdf" },
  { name: "PDF to JPG", href: "/pdf-to-jpg" },
  { name: "PDF to Word", href: "/pdf-to-word" },
  { name: "Word to PDF", href: "/word-to-pdf" },
  { name: "Unlock PDF", href: "/unlock-pdf" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,120,120,0.10),transparent_40%)]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              Fast file tools for PDF, image, and document workflows
            </div>

            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              All your file tools in one clean workspace
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              Compress images, convert files, merge PDFs, secure documents, and
              batch-process uploads with a fast, privacy-first experience.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-xl px-6">
                <Link href="/bulk-image-compress">
                  Try Bulk Compress Image
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl px-6"
              >
                <Link href="/tools">Browse all tools</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Local-first tools
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Batch processing
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Clean exports
              </span>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => (
              <Link key={tool.name} href={tool.href} className="block">
                <Card className="rounded-2xl border-border/60 bg-card/70 shadow-none transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                      <FileImage className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Fast and simple
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-4 md:px-6">
          {[
            {
              title: "Privacy first",
              desc: "Keep workflows simple with secure file handling.",
              icon: ShieldCheck,
              href: "/security",
            },
            {
              title: "Fast processing",
              desc: "Run conversions and compression without friction.",
              icon: Zap,
              href: "/tools",
            },
            {
              title: "Smart tools",
              desc: "Organize and optimize files in fewer steps.",
              icon: Sparkles,
              href: "/tools",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.title} href={item.href} className="block">
                <div className="rounded-2xl border bg-background p-5 transition-colors hover:bg-muted/40">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        id="compress-image"
        className="mx-auto max-w-7xl px-4 py-16 md:px-6"
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-3 text-sm font-medium text-muted-foreground">
              Featured tool
            </div>

            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Compress images without breaking your workflow
            </h2>

            <p className="mt-4 max-w-xl text-muted-foreground">
              Upload a single image, a full folder, or download a ZIP after
              batch compression. Filego keeps the flow simple and fast with a
              clean, focused interface.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-xl">
                <Link href="/bulk-image-compress">Open Bulk compressor</Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl"
              >
                <Link href="/tools">See all tools</Link>
              </Button>
            </div>
          </div>

          <Link href="/bulk-image-compress" className="block">
            <div className="rounded-3xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/20">
              <div className="rounded-2xl border bg-background p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">Compress Image</div>
                    <div className="text-sm text-muted-foreground">
                      JPG, PNG, folder upload, ZIP export
                    </div>
                  </div>

                  <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    Local-first
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Drop files here or choose a folder to start compression
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-muted p-3">
                    <div className="text-muted-foreground">Quality</div>
                    <div className="mt-1 font-medium">75%</div>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <div className="text-muted-foreground">Effort</div>
                    <div className="mt-1 font-medium">4</div>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <div className="text-muted-foreground">Export</div>
                    <div className="mt-1 font-medium">ZIP</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
