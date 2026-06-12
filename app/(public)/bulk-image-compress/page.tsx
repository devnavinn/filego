import type { Metadata } from "next";
import { ImageCompressor } from "@/components/image-compressor";

const siteUrl = "https://filego.in";
const pageUrl = `${siteUrl}/bulk-image-compress`;
const title =
  "Free Bulk Image Compressor Online – Compress Multiple Images | Filego";

const description =
  "Compress multiple images free online. Batch compress JPG, PNG, WebP, and AVIF in your browser with local processing, quality controls, and instant downloads.";

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
    canonical: "/bulk-image-compress",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Filego Bulk Image Compressor",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    url: pageUrl,
    description,
    browserRequirements: "Requires JavaScript and a modern browser.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    creator: {
      "@type": "Organization",
      name: "Filego",
      url: siteUrl,
    },
    featureList: [
      "Bulk image compression",
      "Batch image conversion",
      "Browser-based local processing",
      "JPG, PNG, WebP, AVIF, GIF, and BMP support",
      "Quality and resize controls",
      "No server upload required",
    ],
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Bulk image compressor and converter
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            Compress and convert JPG, PNG, WebP, AVIF, GIF, and BMP images locally
            in your browser. Optimize multiple images without server uploads,
            compare results, fine-tune quality, resize dimensions, and export in
            batches.
          </p>
        </header>

        <ImageCompressor />

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-background p-6">
            <h2 className="text-lg font-semibold">Why use Filego</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Filego processes images locally in your browser, which helps protect
              privacy while improving speed for compression and conversion tasks.
            </p>
          </div>

          <div className="rounded-2xl border bg-background p-6">
            <h2 className="text-lg font-semibold">Supported formats</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload and optimize JPG, PNG, WebP, AVIF, GIF, and BMP files with
              flexible quality and export options for web, sharing, and storage.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}