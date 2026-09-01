import type { Metadata } from "next";
import { PdfWatermarkTool } from "@/components/tools/pdf-watermark-tool";

export const metadata: Metadata = {
  title: "Add Watermark to PDF Online | Filego",
  description:
    "Stamp a text watermark across every page of a PDF in your browser. Control size, opacity, rotation, and color, then download instantly.",
};

export default function AddWatermarkPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <PdfWatermarkTool />
    </main>
  );
}
