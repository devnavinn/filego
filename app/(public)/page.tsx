import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toolCategories } from "@/lib/tools-data";
import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";
import { Meteors } from "@/components/ui/meteors";
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

const featuredTools = toolCategories.flatMap((category) =>
  category.tools.slice(0, 2).map((tool) => ({
    name: tool.name,
    shortDescription: tool.shortDescription,
    href: `/tools/${category.slug}/${tool.slug}`,
    categoryTitle: category.title,
    accent: category.accent,
  }))
).slice(0, 8);

const siteUrl = "https://www.filego.in";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Free PDF, Image & Document Tools Online | Filego",
    template: "%s | Filego",
  },

  description:
    "Free online file tools for PDF, image, and document workflows. Compress images, merge PDFs, split files, convert JPG to PDF, PDF to JPG, Word to PDF, and more with a fast, privacy-first experience.",

  keywords: [
    "filego",
    "free file tools",
    "online file tools",
    "pdf tools",
    "free pdf tools",
    "image tools",
    "document tools",
    "merge pdf",
    "split pdf",
    "compress image",
    "image compressor",
    "jpg to pdf",
    "pdf to jpg",
    "pdf to word",
    "word to pdf",
    "file conversion tools",
    "privacy first file tools",
    "browser-based file tools",
  ],
  alternates: {
    canonical: "https://www.filego.in",
  },

  applicationName: "Filego",
  category: "technology",

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Free PDF, Image & Document Tools Online | Filego",
    description:
      "Compress images, merge PDFs, split files, and convert documents with fast, privacy-first online tools.",
    siteName: "Filego",
    locale: "en_IN",
    images: [
      {
        url: "/web-app-manifest-192x192.png",
        width: 1200,
        height: 630,
        alt: "Filego file tools platform preview",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Free PDF, Image & Document Tools Online | Filego",
    description:
      "Compress images, merge PDFs, split files, and convert documents with fast, privacy-first online tools.",
    images: ["/web-app-manifest-192x192.png"],
  },

  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },

  verification: {
    google: "w3_i8bMsxgPtWnzLjemY6GnNZj9r4EWfU27RSHCnkD8",
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden">
        <Meteors number={24} className="opacity-40" />

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
                <Link href="/bulk-image-compress/editoror/editor">
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

          <div className="mt-14">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Featured tools</p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Start with popular workflows
                </h2>
              </div>

              <Button asChild variant="ghost" className="rounded-full">
                <Link href="/tools">
                  View all tools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {featuredTools.map((tool) => (
                <Link key={tool.href} href={tool.href} className="group block">
                  <MagicCard
                    className="rounded-3xl border border-border/60 bg-background/90 p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    gradientColor="rgba(1, 105, 111, 0.12)"
                  >
                    <Card className="rounded-3xl border-0 bg-transparent shadow-none">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm",
                              tool.accent
                            )}
                          >
                            <FileImage className="h-5 w-5" />
                          </div>

                          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                        </div>

                        <div className="mt-4 space-y-2">
                          <h3 className="text-lg font-semibold tracking-tight">
                            {tool.name}
                          </h3>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {tool.shortDescription}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge
                            variant="secondary"
                            className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-foreground/90"
                          >
                            {tool.categoryTitle}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-foreground/90"
                          >
                            Open tool
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </MagicCard>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Why teams use Filego
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Built for fast, focused file workflows
              </h2>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Clean utilities, quick processing, and dedicated tool pages designed for
              real conversion workflows.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Privacy first",
                desc: "Keep workflows simple with secure file handling and clear user trust messaging.",
                icon: ShieldCheck,
                href: "/security",
              },
              {
                title: "Fast processing",
                desc: "Run conversions, compression, and exports with less friction across common tasks.",
                icon: Zap,
                href: "/tools",
              },
              {
                title: "Smart tools",
                desc: "Organize, convert, and optimize files in fewer steps with cleaner UX patterns.",
                icon: Sparkles,
                href: "/tools",
              },
              {
                title: "Dedicated pages",
                desc: "Each tool gets a focused landing page for SEO, clarity, and stronger conversion intent.",
                icon: ArrowRight,
                href: "/tools",
              },
            ].map((item) => {
              const Icon = item.icon

              return (
                <Link key={item.title} href={item.href} className="group block">
                  <Card className="h-full rounded-3xl border-border/60 bg-background/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <CardContent className="p-5">
                      <div className="flex h-full flex-col justify-between">
                        <div>
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted">
                              <Icon className="h-5 w-5 text-foreground" />
                            </div>

                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                          </div>

                          <h3 className="text-base font-semibold tracking-tight">
                            {item.title}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>

                        <div className="mt-5">
                          <span className="inline-flex rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-foreground/90">
                            Learn more
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
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
                <Link href="/bulk-image-compress/editor">Open Bulk compressor</Link>
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

          <Link href="/bulk-image-compress/editor" className="block">
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
