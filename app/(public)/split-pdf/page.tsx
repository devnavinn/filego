import type { Metadata } from "next";
import { PdfSplitTool } from "@/components/tools/pdf-split-tool";

export const metadata: Metadata = {
  title: "Split PDF – Split PDF Pages Online | Filego",
  description:
    "Split a PDF into separate pages or custom page-range files in your browser. Preview every page and download instantly.",
};

export default function SplitPdfPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <PdfSplitTool />
    </main>
  );
}
