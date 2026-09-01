import type { Metadata } from "next";
import { PdfEditorTool } from "@/components/tools/pdf-editor-tool";

export const metadata: Metadata = {
  title: "Edit PDF – Add Text, Images, Shapes & More Online | Filego",
  description:
    "Edit a PDF in your browser: add text, images, shapes, freehand drawing, and whiteout, plus rotate, reorder, and delete pages — all before downloading.",
};

export default function EditPdfPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <PdfEditorTool />
    </main>
  );
}
