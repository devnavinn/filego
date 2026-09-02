import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PdfFormsTool } from "@/components/tools/pdf-forms-tool";
import { FORM_TEMPLATES } from "@/lib/pdf-form-templates";

type Props = {
    params: Promise<{ slug: string }>;
};

const MCQ_SLUG = "mcq-quiz";
const UPLOAD_SLUG = "upload";

export async function generateStaticParams() {
    return [
        ...FORM_TEMPLATES.map((template) => ({ slug: template.id })),
        { slug: MCQ_SLUG },
        { slug: UPLOAD_SLUG },
    ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    if (slug === MCQ_SLUG) {
        return {
            title: "MCQ / Quiz Builder – Create a Fillable Quiz PDF | Filego",
            description:
                "Build a multiple-choice quiz or test with your own questions and answer choices, then download it as a fillable PDF.",
        };
    }

    if (slug === UPLOAD_SLUG) {
        return {
            title: "Upload Your PDF Form – Fill or Add Fields Online | Filego",
            description:
                "Upload any PDF to fill in its existing fields, or add new text fields and checkboxes to it, then download the completed document.",
        };
    }

    const template = FORM_TEMPLATES.find((t) => t.id === slug);
    if (!template) return {};

    return {
        title: `${template.name} – Free Fillable PDF Template | Filego`,
        description: template.description,
    };
}

export default async function PdfFormTemplatePage({ params }: Props) {
    const { slug } = await params;

    if (slug === MCQ_SLUG) {
        return (
            <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
                <PdfFormsTool initialMode="mcq" />
            </main>
        );
    }

    if (slug === UPLOAD_SLUG) {
        return (
            <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
                <PdfFormsTool initialMode="upload" />
            </main>
        );
    }

    const template = FORM_TEMPLATES.find((t) => t.id === slug);
    if (!template) notFound();

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
            <PdfFormsTool initialTemplateId={template.id} />
        </main>
    );
}
