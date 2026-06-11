import type { Metadata } from "next";
import { JpgToPdfTool } from "@/components/tools/jpg-to-pdf-tool";

export const metadata: Metadata = {
  title: "JPG to PDF Converter – Fast, Private Image to PDF Tool | Filego",
  description:
    "Convert JPG images to PDF in seconds with a fast browser-based tool. Reorder images, choose page size, add margins, and download a clean PDF without uploading files.",
  keywords: [
    "jpg to pdf",
    "image to pdf",
    "convert jpg to pdf",
    "jpg pdf converter",
    "filego",
    "online jpg to pdf",
    "private jpg to pdf tool",
  ],
  alternates: {
    canonical: "/jpg-to-pdf",
  },
  openGraph: {
    title: "JPG to PDF Converter | Filego",
    description:
      "Convert multiple JPG images into one PDF with fast in-browser processing, clean layout controls, and instant download.",
    url: "/jpg-to-pdf",
    siteName: "Filego",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JPG to PDF Converter | Filego",
    description:
      "Fast browser-based JPG to PDF conversion with page ordering, layout controls, and instant download.",
  },
};

export default function JpgToPdfPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <JpgToPdfTool />
    </main>
  );
}