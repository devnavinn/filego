import type { Metadata } from "next";
import { ImageSquooshLanding } from "@/components/image-squoosh-landing";
import { JsonLd } from "@/components/seo/json-ld";
import { buildToolJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Free Image Compressor Without Losing Quality Online | Filego",
  description:
    "Compress JPG, PNG, WebP, and AVIF images online for free with private browser-based processing, live quality preview, resize controls, and instant download.",
  keywords: [
    "free image compressor",
    "image compressor without losing quality",
    "compress image online free",
    "compress jpg online",
    "compress png online",
    "compress webp online",
    "compress avif online",
    "private browser image compressor",
    "local image compression",
  ],
  alternates: {
    canonical: "https://www.filego.in/image-squoosh",
  },
  openGraph: {
    title: "Free Image Compressor Without Losing Quality | Filego",
    description:
      "Free browser-based image compressor with live preview, resize controls, and private local processing.",
    url: "/image-squoosh",
    siteName: "Filego",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Image Compressor Without Losing Quality | Filego",
    description:
      "Compress JPG, PNG, WebP, and AVIF locally in your browser with live preview and instant download.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ImageCompressPage() {
  const jsonLd = buildToolJsonLd({
    path: "/image-squoosh",
    name: "Free Image Compressor Without Losing Quality | Filego",
    description:
      "Free browser-based image compressor with live preview, resize controls, and private local processing.",
    featureList: [
      "Compress JPG, PNG, WebP, and AVIF images",
      "Live quality preview and resize controls",
      "Private, browser-based local processing",
      "Instant download, no signup required",
    ],
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <ImageSquooshLanding />
    </>
  );
}
