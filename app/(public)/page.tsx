import type { Metadata } from "next";
import Link from "next/link";
import { categoryIconMap, getToolBySlugs, toolCategories } from "@/lib/tools-data";
import { cn } from "@/lib/utils";
import { Meteors } from "@/components/ui/meteors";
import { ToolSearch } from "@/components/tool-search";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const totalToolCount = toolCategories.reduce((sum, category) => sum + category.tools.length, 0);

const FEATURED_TOOL_SLUGS: [string, string][] = [
  ["image-tools", "image-compressor"],
  ["pdf-tools", "pdf-merge"],
  ["pdf-tools", "pdf-to-word"],
  ["pdf-tools", "jpg-to-pdf"],
  ["image-tools", "background-remover"],
  ["developer-tools", "website-to-markdown"],
  ["developer-tools", "qr-code-generator"],
  ["video-tools", "video-compressor"],
];

const featuredTools = FEATURED_TOOL_SLUGS.map(([categorySlug, toolSlug]) => {
  const data = getToolBySlugs(categorySlug, toolSlug);
  if (!data) return null;

  return {
    name: data.tool.name,
    shortDescription: data.tool.shortDescription,
    href: `/tools/${data.category.slug}/${data.tool.slug}`,
    categoryTitle: data.category.title,
    categorySlug: data.category.slug,
    accent: data.category.accent,
  };
}).filter((tool): tool is NonNullable<typeof tool> => tool !== null);

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
              {totalToolCount}+ tools across {toolCategories.length} categories
            </div>

            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              All your file tools in one clean workspace
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              Compress images, convert files, merge PDFs, secure documents, and
              batch-process uploads with a fast, privacy-first experience.
            </p>

            <div className="mx-auto mt-7 max-w-xl">
              <ToolSearch variant="hero" placeholder={`Search ${totalToolCount}+ tools — try "compress", "merge pdf", "qr code"…`} />
            </div>

            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-xl px-6">
                <Link href="/bulk-image-compressor/editor">
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

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {featuredTools.map((tool) => {
                const Icon = categoryIconMap[tool.categorySlug] ?? Sparkles;

                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="group flex items-start gap-2.5 rounded-xl border border-border/60 p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                        tool.accent
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium tracking-tight">{tool.name}</h3>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </div>
                      <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                        {tool.shortDescription}
                      </p>
                      <span className="mt-1.5 inline-block text-[11px] text-muted-foreground/70">
                        {tool.categoryTitle}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Browse by category</p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Every tool, organized by workflow
            </h2>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {toolCategories.length} categories covering PDF, image, video, audio, document,
            security, archive, developer, and AI-powered workflows.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {toolCategories.map((category) => {
            const Icon = categoryIconMap[category.slug] ?? Sparkles;

            return (
              <Link
                key={category.id}
                href={`/tools/${category.slug}`}
                className="group flex items-start gap-2.5 rounded-xl border border-border/60 p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                    category.accent
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium tracking-tight transition-colors group-hover:text-primary">
                      {category.title}
                    </h3>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
                  <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                    {category.description}
                  </p>
                  <span className="mt-1 inline-block text-[11px] text-muted-foreground/70">
                    {category.tools.length} tools
                  </span>
                </div>
              </Link>
            );
          })}
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

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>

                  <h3 className="mt-3 flex items-center gap-1.5 font-medium tracking-tight transition-colors group-hover:text-primary">
                    {item.title}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {item.desc}
                  </p>
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
                <Link href="/bulk-image-compressor/editor">Open Bulk compressor</Link>
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

          <Link href="/bulk-image-compressor/editor" className="block">
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
