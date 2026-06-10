import type { Metadata } from "next";
import { ImageSquooshEditor } from "@/components/image-squoosh-editor";

export const metadata: Metadata = {
  title: "Single Image Optimizer",
  description:
    "Optimize one image at a time with a Squoosh-style local editor. Compare before and after, resize, tune quality and effort, and export locally.",
  alternates: {
    canonical: "/image-squoosh",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Single image optimizer
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Upload one image, compare before and after with a live slider,
            adjust quality and effort, and download the optimized result without
            server upload.
          </p>
        </div>

        <ImageSquooshEditor />
      </div>
    </main>
  );
}
