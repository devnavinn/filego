import type { Metadata } from "next";
import { BulkImageUploadEntry } from "@/components/bulk-image-upload-entry";

const siteUrl = "https://www.filego.in";
const pageUrl = `${siteUrl}/bulk-image-compress`;
const title =
  "Bulk Image Compressor Online Free – Compress Multiple Images Without Losing Visible Quality | Filego";

const description =
  "Compress multiple images online with local browser processing. Batch optimize JPG, PNG, WebP, AVIF, GIF, and BMP with quality controls, folder support, and instant downloads.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "free bulk image compressor",
    "bulk image compressor",
    "compress multiple images",
    "batch image compression",
    "compress images online free",
    "reduce image file size",
    "compress jpg",
    "compress png",
    "compress webp",
    "compress avif",
    "browser image compressor",
    "local image compression",
    "private image compressor",
    "batch photo compressor",
    "bulk image optimizer",
    "filego bulk image compressor",
  ],
  alternates: {
    canonical: pageUrl,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: pageUrl,
    title,
    description,
    siteName: "Filego",
    locale: "en_US",
    images: [
      {
        url: `${siteUrl}/og/bulk-image-compress.jpg`,
        width: 1200,
        height: 630,
        alt: "Filego bulk image compressor for JPG, PNG, WebP and AVIF",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/og/bulk-image-compress.jpg`],
  },
  category: "technology",
  metadataBase: new URL(siteUrl),
};

export default function BulkImageCompressPage() {
  const benefits = [
    {
      title: "Compress in bulk",
      text: "Optimize many images in one go instead of repeating the same steps one by one.",
    },
    {
      title: "Visible quality preserved",
      text: "Reduce file size while keeping images sharp and clean for websites, products, and social media.",
    },
    {
      title: "Private local processing",
      text: "Files stay in your browser, which helps protect privacy and keeps the workflow fast.",
    },
    {
      title: "Folder and batch support",
      text: "Upload files, batches, or folders and continue to the editor for conversion and export.",
    },
  ];

  const faqs = [
    {
      q: "Can I compress multiple images without losing quality?",
      a: "You can usually reduce file size significantly without obvious visual loss by choosing the right format, balanced quality settings, and sensible dimensions.",
    },
    {
      q: "Does Filego upload my images to a server?",
      a: "The workflow is designed around local browser processing, so images can be compressed without a server upload step.",
    },
    {
      q: "Can I upload a whole folder?",
      a: "Yes. The editor supports folder selection, including a Chromium folder picker and a fallback folder input.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        description,
        isPartOf: {
          "@id": `${siteUrl}#website`,
        },
        about: {
          "@id": `${pageUrl}#app`,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: "Filego",
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}#organization`,
        name: "Filego",
        url: siteUrl,
      },
      {
        "@type": "WebApplication",
        "@id": `${pageUrl}#app`,
        name: "Filego Bulk Image Compressor",
        url: pageUrl,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript and a modern browser.",
        description,
        publisher: {
          "@id": `${siteUrl}#organization`,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
        featureList: [
          "Bulk image compression",
          "Batch image conversion",
          "Browser-based local processing",
          "JPG, PNG, WebP, AVIF, GIF, and BMP support",
          "Quality controls",
          "Folder upload support",
          "ZIP download",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="border-b bg-gradient-to-b from-muted/40 via-background to-background">
        <div className="container mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground">
                Bulk image compression • local processing • folder support
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                Bulk image compressor with editor
              </h1>

              <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
                Compress multiple JPG, PNG, WebP, AVIF, GIF, and BMP images in your
                browser, then continue to the editor to fine-tune quality, convert
                formats, add folders, and export optimized files in bulk.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="rounded-full border px-3 py-1">Choose or drop files</span>
                <span className="rounded-full border px-3 py-1">Folder upload</span>
                <span className="rounded-full border px-3 py-1">WebP and AVIF</span>
                <span className="rounded-full border px-3 py-1">ZIP download</span>
              </div>
            </div>

            <div>
              <BulkImageUploadEntry />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((item) => (
            <div key={item.title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>

        <section className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Bulk image compression for websites and uploads
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
              Large image libraries can slow websites, increase storage usage, and
              make uploads harder to manage. Compressing images in batches helps
              reduce file size, improve page speed, and keep media workflows more
              efficient across blogs, ecommerce pages, portfolios, and social content.
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
              Better results usually come from using a modern format like WebP or
              AVIF, keeping quality balanced, and resizing oversized originals to the
              dimensions actually needed on screen.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Why use a browser-based bulk image editor
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
              A browser-based workflow makes it easier to preview batches, convert
              formats, and download ZIP exports without sending media to a remote
              service first. It also simplifies repeated optimization tasks when you
              need to process many files or whole folders at once.
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
              That makes this kind of tool useful for content teams, developers,
              designers, ecommerce managers, and anyone preparing images for the web.
            </p>
          </div>
        </section>

        <section className="mt-14 max-w-4xl">
          <h2 className="text-2xl font-semibold tracking-tight">
            Frequently asked questions
          </h2>

          <div className="mt-6 space-y-4">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-2xl border p-5">
                <h3 className="text-base font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}