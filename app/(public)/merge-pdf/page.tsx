import type { Metadata } from "next";
import { PdfMergeTool } from "@/components/tools/pdf-merge-tool";

export const metadata: Metadata = {
  title: "Merge PDF – Combine PDF Files Online | Filego",
  description:
    "Combine multiple PDF files into one document in your browser. Reorder files, merge instantly, and download — no upload to a server required.",
};

export default function MergePdfPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <PdfMergeTool />
    </main>
  );
}
