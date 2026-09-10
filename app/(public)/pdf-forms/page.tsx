import Link from "next/link";
import { ChevronRight, ListChecks, Upload } from "lucide-react";
import { FORM_TEMPLATES } from "@/lib/pdf-form-templates";
import { JsonLd } from "@/components/seo/json-ld";
import { buildToolMetadata, buildToolJsonLd } from "@/lib/seo";

const path = "/pdf-forms";
const title = "PDF Forms – Fill & Create Fillable PDF Forms Online | Filego";
const description =
  "Fill in existing PDF forms in your browser, or add new text fields and checkboxes to any PDF and download the completed document. No printing or scanning required.";

export const metadata = buildToolMetadata({
  path,
  title,
  description,
  keywords: [
    "pdf forms",
    "fillable pdf",
    "fill pdf form online free",
    "create pdf form",
    "filego pdf forms",
  ],
});

function TemplateLink({
  href,
  icon: Icon,
  name,
  description,
}: {
  href: string;
  icon: typeof ListChecks;
  name: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/30"
    >
      <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function PdfFormsPage() {
  const jsonLd = buildToolJsonLd({
    path,
    name: title,
    description,
    featureList: [
      "Fill existing PDF forms in the browser",
      "Add text fields and checkboxes to any PDF",
      "Ready-made form templates plus custom uploads",
      "Instant download, no printing or scanning required",
    ],
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <JsonLd data={jsonLd} />
      <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">PDF Forms</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Pick a template, fill in the blanks, and download — no printing or scanning required.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FORM_TEMPLATES.map((template) => (
            <TemplateLink
              key={template.id}
              href={`/pdf-forms/${template.id}`}
              icon={template.icon}
              name={template.name}
              description={template.description}
            />
          ))}
          <TemplateLink
            href="/pdf-forms/mcq-quiz"
            icon={ListChecks}
            name="MCQ / Quiz Builder"
            description="Build a multiple-choice quiz or test with your own questions and answer choices."
          />
        </div>

        <div className="mt-6 border-t border-border/60 pt-4">
          <Link
            href="/pdf-forms/upload"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Upload className="h-3.5 w-3.5" />
            Have your own PDF? Upload it instead
          </Link>
        </div>
      </div>
    </main>
  );
}
