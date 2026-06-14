import type { Metadata } from "next";
import { JpgToPdfTool } from "@/components/tools/jpg-to-pdf-tool";

export const metadata: Metadata = {
  title: "Free JPG to PDF Converter Online – Convert Images to PDF | Filego",
  description:
    "Convert JPG to PDF free online. Upload images, reorder pages, choose page size & margins, and download a clean PDF instantly. No signup required, browser-based.",
  keywords: [
    "free jpg to pdf",
    "free image to pdf",
    "convert jpg to pdf free",
    "convert image to pdf online free",
    "jpg to pdf free online",
    "jpeg to pdf free",
    "free pdf converter",
    "filego jpg to pdf",
    "online jpg to pdf free",
    "private jpg to pdf",
  ],
  alternates: {
    canonical: "https://www.filego.in/jpg-to-pdf",
  },
  openGraph: {
    title: "Free JPG to PDF Converter Online | Filego",
    description:
      "Convert JPG images to PDF free in your browser. Reorder pages, adjust layout & margins, and download clean PDFs instantly.",
    url: "/jpg-to-pdf",
    siteName: "Filego",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free JPG to PDF Converter | Filego",
    description:
      "Free online JPG to PDF converter with page ordering, layout controls, and instant browser-based download.",
  },
};

export default function JpgToPdfPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <JpgToPdfTool />
    </main>
  );
}
