// prisma/seed-ai-tool-guides.ts
//
// Seeds one high-intent, SEO-oriented guide per AI-Powered tool into the
// `blog_posts` table (Neon/Postgres via Prisma). Mirrors
// prisma/seed-tool-guides.ts, but for the AI-Powered Tools category
// (OCR, handwriting recognition, summarization, resume parsing, and
// document Q&A). These tools require sign-in and share a daily AI
// generation quota (5/day free, 100/day Pro), which the guides note
// accurately rather than overclaiming "unlimited free" access.
//
// Run with: npm run seed:ai-guides

import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { prisma } from "@/lib/prisma";

neonConfig.webSocketConstructor = ws;

interface ToolGuide {
    slug: string;
    title: string;
    excerpt: string;
    seoTitle: string;
    seoDescription: string;
    category: string;
    tags: string[];
    toolLabel: string;
    toolPath: string;
    content: string;
}

const guides: ToolGuide[] = [
    {
        slug: "how-to-extract-text-from-an-image-online-with-ai",
        title: "How to Extract Text from an Image Online with AI (Free)",
        excerpt:
            "Turn a screenshot, photo, or scanned document into editable text in seconds — no typing required. Here's how AI-powered OCR works.",
        seoTitle: "How to Extract Text from an Image Online with AI Free | Filego",
        seoDescription:
            "Extract readable text from any image online using AI — screenshots, photos, signs, and printed documents. Free daily use, no software needed.",
        category: "AI Guides",
        tags: ["ocr", "image to text", "ai tools"],
        toolLabel: "OCR Image to Text",
        toolPath: "/tools/ai-tools/ocr-image-to-text",
        content: `Retyping text from a photo or screenshot is slow and error-prone. Optical character recognition (OCR) reads the image and gives you back real, editable text — and with an AI model behind it, it handles messy backgrounds, odd fonts, and low-quality photos far better than older OCR engines.

## When image-to-text OCR is useful

- Pulling a quote or paragraph out of a screenshot instead of retyping it
- Digitizing text from a photographed sign, whiteboard, or printed page
- Extracting text from a scanned document image before editing it
- Getting a block of text out of a meme or graphic to search or translate it

## How to extract text from an image, step by step

1. Open the [OCR Image to Text tool](/tools/ai-tools/ocr-image-to-text) and sign in (AI tools require an account).
2. Upload a PNG, JPG, WEBP, or HEIC image — up to 12 MB.
3. The AI reads the image and returns the text in an editable box.
4. Edit the result directly if anything needs a fix.
5. Copy it, or download it as a .txt, .pdf, or .png file.

## Tips for the most accurate results

- **Use good lighting and focus.** A sharp, well-lit photo gives the AI far more to work with than a blurry or dim one.
- **Crop out distractions first** — if the image has a lot of background clutter around the text, cropping tighter usually improves accuracy.
- **Review the output before relying on it.** AI OCR is very accurate but not perfect — always skim the result, especially for numbers, names, or codes.

## Common questions

**Is this free to use?**
Yes — free accounts get 5 AI generations per day across all AI tools, including this one. Pro accounts get 100 per day.

**Do I need an account?**
Yes, AI-powered tools require signing in, unlike Filego's regular conversion and compression tools.

**Can it read handwriting too?**
This tool is tuned for printed and typed text. For handwritten notes, use the [Handwriting to Text tool](/tools/ai-tools/handwriting-to-text) instead.

**What if my image is a scanned PDF page, not a photo?**
Use [PDF OCR](/tools/ai-tools/pdf-ocr) to run OCR directly on a PDF file, page by page.

Have an image full of text you need in editable form? [Extract the text for free →](/tools/ai-tools/ocr-image-to-text)`,
    },
    {
        slug: "how-to-ocr-a-scanned-pdf-online",
        title: "How to OCR a Scanned PDF and Make Its Text Usable",
        excerpt:
            "A scanned PDF is just a picture of a document — you can't select, copy, or search its text. Here's how to run OCR on it with AI.",
        seoTitle: "How to OCR a Scanned PDF Online Free | Filego",
        seoDescription:
            "Run AI-powered OCR on a scanned PDF to extract its text, page by page. Works on documents with no selectable text layer. Free daily use.",
        category: "AI Guides",
        tags: ["pdf ocr", "scanned pdf", "ai tools"],
        toolLabel: "PDF OCR",
        toolPath: "/tools/ai-tools/pdf-ocr",
        content: `A scanned PDF — one made from a photocopier, scanner, or a stack of photographed pages — looks like a normal document, but there's no real text underneath it. You can't select a sentence, search for a word, or copy a paragraph, because to the computer it's just an image. OCR fixes that by reading the image and giving you back real text.

## When you need PDF OCR

- A scanned contract, form, or report that you need to search or copy text from
- An old document that only exists as a scanned image, not a digital original
- A PDF built from photographed pages that you want to make text-searchable
- Extracting the content of a scanned document to paste elsewhere

## How to OCR a scanned PDF, step by step

1. Open [PDF OCR](/tools/ai-tools/pdf-ocr) and sign in.
2. Upload the scanned PDF — up to 12 pages are processed per document.
3. Each page is rendered and read by the AI in one pass.
4. Review the extracted text, organized page by page, in an editable box.
5. Copy it, or download it as .txt, .pdf, or .png.

## Tips for better OCR accuracy on scans

- **Higher-resolution scans OCR better.** A crisp 300 DPI scan will read far more accurately than a low-resolution photo of a page.
- **Straighten skewed pages before scanning** where possible — heavily tilted text is harder for any OCR engine to read reliably.
- **Split very long documents.** Since processing is capped per document, split an especially long scan into smaller PDFs first with the [PDF Split tool](/tools/pdf-tools/pdf-split) if it exceeds the page limit.

## Common questions

**Does this work on any scanned PDF?**
It works best on reasonably clear scans. Very low-resolution, heavily skewed, or badly damaged scans will read less reliably.

**Is there a page limit?**
Yes — up to 12 pages are processed per PDF in one run. For longer documents, split them first.

**Do I need to sign in?**
Yes, like all AI-powered tools, PDF OCR requires an account. Free accounts get 5 AI generations per day; Pro gets 100.

**What if my PDF already has selectable text?**
You don't need OCR for that — regular PDF tools like [PDF to Word](/tools/pdf-tools/pdf-to-word) will work directly and more accurately.

Have a scanned document you need real text from? [Run PDF OCR for free →](/tools/ai-tools/pdf-ocr)`,
    },
    {
        slug: "how-to-convert-handwriting-to-text-with-ai",
        title: "How to Convert Handwritten Notes to Text with AI",
        excerpt:
            "Handwritten notes are hard to search, share, or paste anywhere. Here's how to turn a photo of handwriting into clean, editable text.",
        seoTitle: "How to Convert Handwriting to Text with AI Free | Filego",
        seoDescription:
            "Convert a photo of handwritten notes into editable text using AI. Works on notebooks, sticky notes, and whiteboards. Free daily use.",
        category: "AI Guides",
        tags: ["handwriting to text", "handwriting recognition", "ai tools"],
        toolLabel: "Handwriting to Text",
        toolPath: "/tools/ai-tools/handwriting-to-text",
        content: `Handwritten notes are great for thinking fast, but painful to search, share, or reuse later. Instead of retyping a page of notes by hand, a photo and an AI model can do it for you — including notes with arrows, abbreviations, and less-than-perfect handwriting.

## When handwriting-to-text conversion helps

- Digitizing lecture or meeting notes taken on paper
- Turning a whiteboard photo into a text summary you can share
- Converting a handwritten to-do list or recipe into a searchable note
- Archiving old handwritten letters, journals, or records as text

## How to convert handwriting to text, step by step

1. Open [Handwriting to Text](/tools/ai-tools/handwriting-to-text) and sign in.
2. Upload a clear photo of the handwritten page — PNG, JPG, WEBP, or HEIC, up to 12 MB.
3. The AI transcribes the handwriting into plain text, marking anything genuinely illegible.
4. Edit the transcript directly to fix any misreads.
5. Copy it, or download it as .txt, .pdf, or .png.

## Tips for a cleaner transcription

- **Flatten the page and avoid shadows** — a flat, evenly lit photo transcribes far more accurately than one taken at an angle or in dim light.
- **Fix illegible words manually.** The AI marks words it genuinely can't read rather than guessing — a quick manual pass usually resolves those.
- **Neater handwriting transcribes better**, but the model is built to handle natural variation, cursive, and messier notes reasonably well.

## Common questions

**Does it work on cursive handwriting?**
Yes, though very messy or highly stylized cursive is harder for any handwriting recognition system, human or AI, to read perfectly.

**What happens to words it can't read?**
They're marked with [illegible] in the output so you know exactly where to double-check the original.

**Is this the same as regular OCR?**
It uses the same underlying engine tuned specifically for handwriting. For printed or typed text, use [OCR Image to Text](/tools/ai-tools/ocr-image-to-text) instead — it's tuned for that case.

**How many times can I use it for free?**
Free accounts get 5 AI generations per day across all AI tools; Pro accounts get 100.

Have handwritten notes to digitize? [Convert handwriting to text for free →](/tools/ai-tools/handwriting-to-text)`,
    },
    {
        slug: "how-to-summarize-a-document-with-ai",
        title: "How to Summarize a Long Document with AI in Seconds",
        excerpt:
            "Don't read 20 pages to find the gist. Upload the document and get a clear summary with key points pulled out automatically.",
        seoTitle: "How to Summarize a Document with AI Free | Filego",
        seoDescription:
            "Summarize a long PDF, DOCX, or TXT document with AI — get a concise summary and key points in seconds. Free daily use, no signup wall to try it out.",
        category: "AI Guides",
        tags: ["document summarizer", "summarize pdf", "ai tools"],
        toolLabel: "Document Summarizer",
        toolPath: "/tools/ai-tools/document-summarizer",
        content: `A long report, contract, or research paper often has one or two pages of substance buried in twenty. Rather than reading the whole thing to find out if it's relevant, an AI summary gives you the gist and the key points up front — then you decide if it's worth reading in full.

## When document summarization saves time

- Deciding whether a long report or paper is worth reading in detail
- Getting the key points of a contract before a meeting
- Catching up quickly on a document a colleague sent over
- Reviewing the substance of a long document without skimming line by line

## How to summarize a document, step by step

1. Open the [Document Summarizer](/tools/ai-tools/document-summarizer) and sign in.
2. Upload a PDF, DOCX, or TXT file.
3. The AI reads the document and generates a short summary paragraph plus a list of key points.
4. Copy the summary or key points to use wherever you need them.

## Tips for a more useful summary

- **Use text-based files, not scanned images.** This tool reads the document's real text layer — a scanned PDF with no selectable text won't summarize correctly; run it through [PDF OCR](/tools/ai-tools/pdf-ocr) first if needed.
- **Summarize sections separately for very long documents**, since extremely long inputs are truncated to a manageable length for the AI to process reliably.
- **Use the key points as a checklist** when you do read the full document, to confirm nothing important was missed.

## Common questions

**How long can the document be?**
Very long documents are truncated to a maximum length the AI can process in one pass — for most reports, articles, and contracts, this isn't a practical limit.

**Can it summarize a scanned document?**
Not directly — it needs a document with real, selectable text. Run [PDF OCR](/tools/ai-tools/pdf-ocr) on a scanned file first to get text you can summarize.

**Is my document sent to a server?**
Yes — summarization requires server-side AI processing, unlike Filego's browser-based conversion tools.

**How many summaries can I generate for free?**
5 per day on the free plan, shared across all AI tools; 100 per day on Pro.

Have a long document to get through quickly? [Summarize it for free →](/tools/ai-tools/document-summarizer)`,
    },
    {
        slug: "how-to-parse-a-resume-with-ai",
        title: "How to Extract Structured Data from a Resume with AI",
        excerpt:
            "Pulling contact info, skills, and work history out of resumes by hand doesn't scale. Here's how to parse a resume into structured data automatically.",
        seoTitle: "How to Parse a Resume with AI Free | Filego",
        seoDescription:
            "Extract contact info, skills, work experience, and education from a resume automatically with AI. Free daily use — upload PDF, DOCX, or TXT.",
        category: "AI Guides",
        tags: ["resume parser", "cv parser", "ai tools"],
        toolLabel: "Resume Parser",
        toolPath: "/tools/ai-tools/resume-parser",
        content: `Reading through resumes to manually pull out contact details, skills, and work history is repetitive and slow, especially with more than a handful to review. A resume parser reads the document once and hands back structured data — name, contact info, skills, experience, and education — ready to scan or reuse.

## When resume parsing helps

- Quickly reviewing a candidate's skills and experience without reading the full document
- Pulling structured contact info out of a resume to add to a spreadsheet or tracker
- Comparing a batch of resumes' skills and experience at a glance
- Extracting your own resume's details to reuse in a different format or application

## How to parse a resume, step by step

1. Open the [Resume Parser](/tools/ai-tools/resume-parser) and sign in.
2. Upload a resume as PDF, DOCX, or TXT.
3. The AI extracts name, email, phone, summary, skills, work experience, and education.
4. Review the structured result, organized into clear sections.
5. Copy the data as JSON for use elsewhere.

## Tips for the most complete extraction

- **Use a text-based resume file**, not a scanned image — a resume exported directly from Word or Google Docs parses far more reliably than a photographed or scanned copy.
- **Standard resume formats parse best.** Clearly labeled sections (Experience, Education, Skills) help the AI extract cleanly; highly unconventional layouts may need a manual double-check.
- **A field left blank means it wasn't found**, not that parsing failed — the tool intentionally leaves a field empty rather than guessing at missing information.

## Common questions

**What file formats are supported?**
PDF, DOCX, and TXT. A scanned image of a resume isn't supported directly — convert it with [PDF OCR](/tools/ai-tools/pdf-ocr) first if that's what you have.

**Can I export the parsed data?**
Yes — copy it as structured JSON to import into a spreadsheet, applicant tracker, or another tool.

**Will it work on any resume layout?**
It handles most standard resume formats well; very unconventional or heavily designed layouts may need a quick manual review afterward.

**Is this free to use?**
Yes, within the shared AI daily limit — 5 generations per day free, 100 per day on Pro.

Need to pull structured data out of a resume? [Parse a resume for free →](/tools/ai-tools/resume-parser)`,
    },
    {
        slug: "how-to-chat-with-a-pdf-using-ai",
        title: "How to Chat with a PDF or Document Using AI",
        excerpt:
            "Instead of scrolling through a long document looking for one detail, just ask it a question. Here's how AI file chat works.",
        seoTitle: "How to Chat with a PDF Using AI Free | Filego",
        seoDescription:
            "Ask questions about a PDF, DOCX, or TXT file and get direct answers from its content with AI. Free daily use — no more scrolling for one detail.",
        category: "AI Guides",
        tags: ["chat with pdf", "ai file chat", "ai tools"],
        toolLabel: "AI File Chat",
        toolPath: "/tools/ai-tools/ai-file-chat",
        content: `Sometimes you don't need the whole document — you need the answer to one question buried somewhere in it. Instead of scrolling and searching manually, you can upload the file and just ask, in plain language, and get an answer sourced directly from its content.

## When chatting with a document is faster than reading it

- Finding one specific clause or number in a long contract
- Asking follow-up questions about a report instead of re-reading sections
- Getting a quick answer from a manual or reference document
- Checking whether a document even covers a topic before reading further

## How to chat with a document, step by step

1. Open [AI File Chat](/tools/ai-tools/ai-file-chat) and sign in.
2. Upload a PDF, DOCX, or TXT file.
3. Type a question about the document in the chat box and send it.
4. The AI answers using only the document's content, and tells you if the answer isn't in it.
5. Ask follow-up questions — the conversation keeps context as you go.

## Tips for better answers

- **Ask specific questions.** "What's the notice period in this contract?" gets a more precise answer than "tell me about this document."
- **Use a text-based file.** Like the other AI document tools, this needs a file with real, selectable text — run a scanned file through [PDF OCR](/tools/ai-tools/pdf-ocr) first if needed.
- **Trust "it's not in the document" answers.** The AI is instructed to say so rather than guess, which is exactly what you want from a document Q&A tool.

## Common questions

**Will it answer questions using outside knowledge, not just the document?**
No — it's designed to answer only from the uploaded document's content, and to say clearly when something isn't covered in it.

**Can I ask multiple questions in a row?**
Yes — the conversation keeps recent context, so follow-up questions work naturally.

**Does this work on scanned PDFs?**
Not directly — it needs real text content. Run [PDF OCR](/tools/ai-tools/pdf-ocr) on a scanned document first, or use [Document Summarizer](/tools/ai-tools/document-summarizer) for a quick overview instead.

**How many questions can I ask for free?**
Each question uses one of your daily AI generations — 5 per day free, 100 per day on Pro.

Have a document you'd rather ask than read? [Chat with your file for free →](/tools/ai-tools/ai-file-chat)`,
    },
    {
        slug: "how-to-transcribe-audio-to-text-with-ai",
        title: "How to Transcribe Audio to Text with AI (Free)",
        excerpt:
            "Turn a voice memo, lecture, or interview recording into a real transcript — no manual typing. Here's how AI audio transcription works.",
        seoTitle: "How to Transcribe Audio to Text with AI Free | Filego",
        seoDescription:
            "Transcribe MP3, WAV, M4A, and other audio recordings into text with AI, for free. Voice memos, lectures, interviews, and podcasts.",
        category: "AI Guides",
        tags: ["speech to text", "audio transcription", "ai tools"],
        toolLabel: "Speech to Text",
        toolPath: "/tools/ai-tools/speech-to-text",
        content: `Typing out a recording by hand — replaying a few seconds at a time, pausing, rewinding — is one of the slowest ways to turn spoken audio into text. An AI transcription tool listens to the whole file and gives you a written transcript in the time it takes to upload it.

## When audio transcription saves time

- Turning a recorded lecture or meeting into notes you can search and skim
- Getting an interview or podcast episode into text for quotes or show notes
- Transcribing a voice memo instead of replaying it to type it out
- Creating a text record of a call or conversation for reference

## How to transcribe audio to text, step by step

1. Open the [Speech to Text tool](/tools/ai-tools/speech-to-text) and sign in.
2. Upload an MP3, WAV, M4A, AAC, OGG, or FLAC file — up to 12 MB.
3. The AI listens to the audio and returns a transcript, split into natural paragraphs.
4. Edit the transcript directly to fix anything that needs a correction.
5. Copy it, or download it as .txt, .pdf, or .png.

## Tips for the most accurate transcript

- **Clear audio transcribes best.** Background noise, overlapping speakers, or heavy accents can reduce accuracy — a clean recording gives the AI the most to work with.
- **Keep files under the size limit.** If a recording is longer than fits in 12 MB, trim it down first with the [MP3 Cutter](/tools/audio-tools/mp3-cutter) or compress it with the [Audio Compressor](/tools/audio-tools/audio-compressor).
- **Review names, numbers, and jargon.** These are the most common spots where any transcription — human or AI — can slip, so give them a quick check.

## Common questions

**Does it label who's speaking?**
It generally transcribes as continuous text, starting a new paragraph when the speaker or topic changes, rather than adding speaker labels — since reliably identifying who's speaking isn't guaranteed from audio alone.

**What if my recording has background noise?**
The AI does its best with imperfect audio, but heavy noise or overlapping speech will reduce accuracy — a cleaner recording always transcribes better.

**Can I transcribe a video's audio instead of a standalone audio file?**
Pull the audio out first with [Extract Audio from Video](/tools/video-tools/extract-audio-from-video) or [Video to MP3](/tools/video-tools/video-to-mp3), then upload the result here.

**How many transcriptions can I run for free?**
5 per day on the free plan, shared across all AI tools; 100 per day on Pro.

Have a recording you'd rather read than replay? [Transcribe your audio for free →](/tools/ai-tools/speech-to-text)`,
    },
];

function withToolLink(guide: ToolGuide) {
    const callout = `> **Try it now:** [${guide.toolLabel} →](${guide.toolPath})`;
    return `${callout}\n\n${guide.content}`;
}

async function main() {
    for (const guide of guides) {
        const content = withToolLink(guide);

        await prisma.blogPost.upsert({
            where: { slug: guide.slug },
            create: {
                slug: guide.slug,
                title: guide.title,
                excerpt: guide.excerpt,
                content,
                category: guide.category,
                tags: guide.tags,
                seoTitle: guide.seoTitle,
                seoDescription: guide.seoDescription,
                status: "PUBLISHED",
                publishedAt: new Date(),
            },
            update: {
                title: guide.title,
                excerpt: guide.excerpt,
                content,
                category: guide.category,
                tags: guide.tags,
                seoTitle: guide.seoTitle,
                seoDescription: guide.seoDescription,
            },
        });
        console.log(`Seeded: ${guide.slug}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
