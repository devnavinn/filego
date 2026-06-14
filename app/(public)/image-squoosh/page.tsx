import type { Metadata } from "next";
import { ImageSquooshLanding } from "@/components/image-squoosh-landing";

export const metadata: Metadata = {
  title: "Free Image Compressor Without Losing Quality Online | PDFMatcher",
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
    title: "Free Image Compressor Without Losing Quality | PDFMatcher",
    description:
      "Free browser-based image compressor with live preview, resize controls, and private local processing.",
    url: "/image-squoosh",
    siteName: "PDFMatcher",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Image Compressor Without Losing Quality | PDFMatcher",
    description:
      "Compress JPG, PNG, WebP, and AVIF locally in your browser with live preview and instant download.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ImageCompressPage() {
  return <ImageSquooshLanding />;
}
