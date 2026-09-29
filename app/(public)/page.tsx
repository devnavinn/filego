import type { Metadata } from "next";
import Link from "next/link";
import { getToolBySlugs, toolCategories } from "@/lib/tools-data";
import { ToolSearch } from "@/components/tool-search";
import { ToolCard, CategoryCard } from "@/components/tool-card";
import { JsonLd } from "@/components/seo/json-ld";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Download,
  Gauge,
  Layers,
  Lock,
  MousePointerClick,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UploadCloud,
  Wand2,
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

const POPULAR_SEARCHES: { label: string; href: string }[] = [
  { label: "Compress image", href: "/tools/image-tools/image-compressor" },
  { label: "Merge PDF", href: "/tools/pdf-tools/pdf-merge" },
  { label: "PDF to Word", href: "/tools/pdf-tools/pdf-to-word" },
  { label: "Remove background", href: "/tools/image-tools/background-remover" },
  { label: "Compress video", href: "/tools/video-tools/video-compressor" },
];

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Pick a tool",
    desc: "Search or browse over 100 tools for PDFs, images, video, audio and more.",
  },
  {
    icon: UploadCloud,
    title: "Drop your files",
    desc: "Drag files in. Most tools process them right in your browser.",
  },
  {
    icon: Download,
    title: "Download the result",
    desc: "Get your file in seconds, with no watermarks and no waiting in a queue.",
  },
];

const FEATURES = [
  {
    icon: Lock,
    title: "Private by design",
    desc: "Most tools run locally, so your files never leave your device.",
    tint: "from-emerald-500 to-teal-400",
  },
  {
    icon: Gauge,
    title: "Seriously fast",
    desc: "No uploads and no queues. Results appear as quickly as your device can process them.",
    tint: "from-amber-500 to-orange-400",
  },
  {
    icon: BadgeCheck,
    title: "No watermarks",
    desc: "Clean output every time, ready to send, print, or publish.",
    tint: "from-sky-500 to-indigo-500",
  },
  {
    icon: Layers,
    title: "Batch friendly",
    desc: "Compress, convert, and rename whole folders in one go.",
    tint: "from-rose-500 to-pink-500",
  },
  {
    icon: Wand2,
    title: "AI when you need it",
    desc: "Summarize, OCR, transcribe, and chat with your documents.",
    tint: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: Smartphone,
    title: "Works everywhere",
    desc: "Phone, tablet, or desktop. Nothing to install.",
    tint: "from-cyan-500 to-blue-500",
  },
];

const FAQS = [
  {
    q: "Is Filego free to use?",
    a: "Yes. Every tool on Filego can be used for free. A Pro plan with higher limits and extra features is coming soon for people who need more.",
  },
  {
    q: "Are my files uploaded to your servers?",
    a: "Most tools run entirely in your browser, so your files never leave your device. A few AI features send content to a secure processing service, and those tools say so clearly.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. You can use tools without signing up. A free account lets you track your activity and unlocks AI tools.",
  },
  {
    q: "Which file types are supported?",
    a: "PDF, Word, Excel, PowerPoint, JPG, PNG, WebP, AVIF, HEIC, MP4, MP3, ZIP, 7z and many more, across 9 tool categories.",
  },
  {
    q: "Will my output have a watermark?",
    a: "Never. Filego doesn't add watermarks to anything you create.",
  },
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
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-background text-foreground">
      <JsonLd data={faqSchema} />

      {/* Hero */}
      <section className="relative isolate">
        <div className="bg-hero-mesh pointer-events-none absolute inset-0 -z-10" />
        <div className="bg-grid-faint pointer-events-none absolute inset-0 -z-10" />

        <div className="mx-auto max-w-7xl px-4 pt-16 pb-14 md:px-6 md:pt-24 md:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <Link
              href="/tools"
              className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 py-1 pr-3 pl-1 text-xs font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40"
            >
              <span className="bg-gradient-brand rounded-full px-2 py-0.5 text-[11px] font-semibold text-white">
                {totalToolCount}+ tools
              </span>
              Free, private and no sign-up needed
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>

            <h1 className="mt-6 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              Every file tool you need.{" "}
              <span className="text-gradient-brand">Free, fast &amp; private.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-pretty text-muted-foreground md:text-lg">
              Compress, convert, merge, edit, and secure PDFs, images, videos, and documents
              right in your browser. No installs, no watermarks, no waiting.
            </p>

            <div className="mx-auto mt-8 max-w-xl rounded-full shadow-xl shadow-primary/10">
              <ToolSearch variant="hero" placeholder={`Search ${totalToolCount}+ tools…`} />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-muted-foreground">Popular:</span>
              {POPULAR_SEARCHES.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-border/70 bg-background/70 px-3 py-1 font-medium text-foreground/80 backdrop-blur transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: `${totalToolCount}+`, label: "Free tools" },
              { value: `${toolCategories.length}`, label: "Categories" },
              { value: "0", label: "Watermarks" },
              { value: "100%", label: "In-browser core" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-center backdrop-blur"
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-heading text-2xl font-extrabold tracking-tight text-foreground">{stat.value}</dd>
                <dd className="text-xs text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Popular tools */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <SectionHeading
          eyebrow="Most popular"
          title="Start with the tools people love"
          action={{ href: "/tools", label: "View all tools" }}
        />

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featuredTools.map((tool) => (
            <ToolCard
              key={tool.href}
              href={tool.href}
              name={tool.name}
              description={tool.shortDescription}
              categorySlug={tool.categorySlug}
              accent={tool.accent}
              meta={tool.categoryTitle}
            />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <SectionHeading
          eyebrow="Browse by category"
          title="Every tool, organized by what you're working on"
          description={`${toolCategories.length} categories covering PDF, image, video, audio, documents, security, archives, developer utilities and AI.`}
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toolCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card px-6 py-12 md:px-12">
          <div className="bg-hero-mesh pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <SectionHeading eyebrow="How it works" title="Done in three simple steps" centered />

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="relative text-center">
                    <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-lg shadow-primary/10 ring-1 ring-border">
                      <Icon className="h-6 w-6 text-primary" />
                      <span className="bg-gradient-brand absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold tracking-tight">{step.title}</h3>
                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{step.desc}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* Why Filego */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <SectionHeading
          eyebrow="Why Filego"
          title="Built to be the only file toolkit you need"
          action={{ href: "/security", label: "How we protect your files" }}
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-3xl border border-border/70 bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${feature.tint}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold tracking-tight">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="bg-gradient-brand relative overflow-hidden rounded-[2rem] px-6 py-12 text-center text-white shadow-2xl shadow-primary/25 md:px-12 md:py-16">
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <Sparkles className="mx-auto h-8 w-8 text-white/90" />
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
              Get more done with a free Filego account
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/85">
              Unlock AI tools, track your activity, and be first in line for Filego Pro, with bigger
              files, no ads and priority processing.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-white px-7 text-base font-semibold text-violet-700 shadow-lg hover:bg-white/90"
              >
                <Link href="/register">
                  Create free account
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 rounded-full px-7 text-base font-semibold text-white hover:bg-white/15 hover:text-white"
              >
                <Link href="/tools">Explore tools</Link>
              </Button>
            </div>
            <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-white/75">
              <ShieldCheck className="h-3.5 w-3.5" />
              No credit card. No spam.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" centered />

        <div className="mt-8 space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border/70 bg-card px-5 py-4 open:shadow-md open:shadow-primary/5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  centered?: boolean;
}) {
  if (centered) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance md:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-muted-foreground">{description}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance md:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">{description}</p> : null}
      </div>
      {action ? (
        <Button asChild variant="outline" className="shrink-0 self-start rounded-full md:self-auto">
          <Link href={action.href}>
            {action.label}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
