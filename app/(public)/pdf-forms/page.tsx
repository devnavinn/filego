import type { Metadata } from "next";
import { PdfFormsTool } from "@/components/tools/pdf-forms-tool";

export const metadata: Metadata = {
  title: "PDF Forms – Fill & Create Fillable PDF Forms Online | Filego",
  description:
    "Fill in existing PDF forms in your browser, or add new text fields and checkboxes to any PDF and download the completed document. No printing or scanning required.",
};

export default function PdfFormsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <PdfFormsTool />
    </main>
  );
}
