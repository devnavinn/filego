import type { Metadata } from "next";
import { PdfRotateTool } from "@/components/tools/pdf-rotate-tool";

export const metadata: Metadata = {
  title: "Rotate PDF – Rotate PDF Pages Online | Filego",
  description:
    "Rotate individual PDF pages or the whole document in your browser. Fix page orientation and download instantly.",
};

export default function RotatePdfPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <PdfRotateTool />
    </main>
  );
}
