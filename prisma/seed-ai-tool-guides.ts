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
    {
        slug: "how-to-translate-a-pdf-or-word-document-online-with-ai",
        title: "How to Translate a PDF or Word Document Online with AI (Free)",
        excerpt:
            "Translate a whole PDF, DOCX, or text file into Hindi, Tamil, Bengali, Spanish, Arabic and 35+ other languages, then download it as Word or PDF.",
        seoTitle: "Translate PDF or Word Document Online Free with AI | Filego",
        seoDescription:
            "Translate PDF, DOCX, and TXT files online with AI into Hindi, Tamil, Bengali, Marathi, Spanish, Arabic and 35+ languages. Download the translation as Word or PDF.",
        category: "AI Guides",
        tags: ["translate pdf", "document translator", "ai tools", "hindi translation"],
        toolLabel: "AI Document Translator",
        toolPath: "/tools/ai-tools/document-translator",
        content: `Copy-pasting a document into a translator page by page is slow, and it breaks the formatting. An AI document translator reads the whole file, translates it while keeping paragraphs and lists in place, and hands you back a file you can actually use.

## When document translation is useful

- Translating a government form, notice, or circular into Hindi or your regional language
- Turning an English assignment, report, or study material into Tamil, Bengali, Marathi or another language
- Reading a contract, manual, or research paper that arrived in a language you don't know
- Sharing a policy or announcement with a team that works in several languages

## How to translate a document, step by step

1. Open the [AI Document Translator](/tools/ai-tools/document-translator) and sign in (AI tools require an account).
2. Upload a PDF, DOCX, or TXT file.
3. Leave **From** on *Detect automatically*, or pick the source language yourself.
4. Choose the language you want in **To** (Hindi, Tamil, Telugu, Bengali, Urdu, Spanish, Arabic, Chinese and more).
5. Click **Translate**. Long documents can take up to a minute.
6. Review and edit the result in the text box, then download it as **Word (.docx)**, save it as **PDF**, or copy it.

## Supported languages

The translator covers 35+ languages, including 11 Indian languages: Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, and Urdu. It also handles major world languages such as Spanish, French, German, Portuguese, Russian, Arabic, Persian, Hebrew, Chinese, Japanese, Korean, Indonesian, Thai, and Vietnamese. Right-to-left languages like Arabic and Urdu are exported with the correct text direction.

## Limits to know about

- **Length:** free accounts can translate up to 20,000 characters per document (roughly 8–10 pages). Pro raises this to 60,000 characters.
- **Daily use:** each translation uses one AI generation from your daily quota.
- **Scanned PDFs:** image-only PDFs have no text layer to read. Run them through [PDF OCR](/tools/ai-tools/pdf-ocr) first, then translate the extracted text.
- **Layout:** the translation keeps paragraphs, line breaks, and lists, but not images, tables, or exact page design.

## Tips for better translations

- Pick the source language yourself when a document mixes several languages.
- Proofread names, figures, and legal or medical terms. AI translation is very good, but it is not a certified translation.
- Split very long books or reports into chapters for faster results.

Need a document in another language? [Translate your file now →](/tools/ai-tools/document-translator)`,
    },
    {
        slug: "how-to-summarize-a-youtube-video-with-ai",
        title: "How to Summarize a YouTube Video with AI (Free, with Timestamps)",
        excerpt:
            "Turn a long YouTube video into a short summary, key points, and clickable chapters in seconds, in English, Hindi, or 35+ other languages.",
        seoTitle: "YouTube Video Summarizer: Summarize Any Video with AI Free | Filego",
        seoDescription:
            "Summarize any public YouTube video with AI. Get a summary, key points, and timestamped chapters in English, Hindi, Tamil, and 35+ languages. Free daily use.",
        category: "AI Guides",
        tags: ["youtube summarizer", "video summary", "ai tools", "youtube to text"],
        toolLabel: "YouTube Summarizer",
        toolPath: "/tools/ai-tools/youtube-summarizer",
        content: `A 40-minute lecture or podcast often has five minutes of ideas you actually need. An AI YouTube summarizer watches the video for you and gives you the main points, plus chapters with timestamps so you can jump straight to the part that matters.

## When a YouTube summary is useful

- Revising a long lecture, tutorial, or exam-prep video before a test
- Deciding whether a podcast or interview is worth watching in full
- Taking notes from a conference talk or product demo
- Getting the gist of a video in a language you don't speak. Pick your own language for the summary.

## How to summarize a YouTube video, step by step

1. Copy the video's link from YouTube (the Share button, or the address bar).
2. Open the [YouTube Summarizer](/tools/ai-tools/youtube-summarizer) and sign in (AI tools require an account).
3. Paste the link. Regular videos, Shorts, live replays, and youtu.be links all work.
4. Choose **Quick** for a short overview or **Detailed** for fuller notes.
5. Pick the language you want the summary in.
6. Click **Summarize**. Long videos can take a minute or two.
7. Click any chapter timestamp to open the video at that moment, or copy or download the notes as Markdown.

## What you get

- **Summary:** a short paragraph (Quick) or several paragraphs (Detailed) covering the whole video
- **Key points:** the main ideas as a bullet list
- **Chapters:** the sections of the video with start times, a title, and one line about each

The AI uses both what is said and what is shown on screen, so it works for slides, coding tutorials, and demos as well as talking-head videos.

## Limits to know about

- **Public videos only:** private, members-only, and age-restricted videos can't be opened.
- **Length:** free accounts get summaries of the first 60 minutes of a video; Pro covers up to 2 hours.
- **Daily use:** each summary uses one AI generation from your daily quota. If the AI fails, the generation is refunded.
- **Accuracy:** summaries are very good but can miss details. Check the chapter timestamps for anything important.

## Tips for better summaries

- Use **Detailed** for lectures and tutorials, **Quick** for news and vlogs.
- For a written transcript instead of a summary, download the audio and use [Speech to Text](/tools/ai-tools/speech-to-text).
- Long video? Summarize it in your own language, then use the chapter links to rewatch only the parts you need.

Got a long video to get through? [Summarize it now →](/tools/ai-tools/youtube-summarizer)`,
    },
    {
        slug: "how-to-add-subtitles-to-a-video-with-ai",
        title: "How to Create Subtitles for a Video with AI (Free SRT & VTT)",
        excerpt:
            "Turn any video or audio file into timed SRT or VTT subtitles for YouTube, Instagram Reels, and Shorts, in the spoken language or translated into 35+ others.",
        seoTitle: "AI Subtitle Generator: Free SRT & VTT Captions for YouTube and Reels | Filego",
        seoDescription:
            "Create SRT and VTT subtitles from any video with AI. Captions for YouTube, Reels, and Shorts, with translation into Hindi, Tamil, and 35+ languages. Free daily use.",
        category: "AI Guides",
        tags: ["subtitle generator", "srt generator", "auto captions", "ai tools", "reels captions"],
        toolLabel: "Subtitle Generator",
        toolPath: "/tools/ai-tools/subtitle-generator",
        content: `Most people watch social videos with the sound off, so captions decide whether a viewer stays or scrolls past. Typing subtitles by hand takes hours; an AI subtitle generator listens to your video and writes timed captions you can upload straight to YouTube or drop into your editor.

## Who this is for

- **YouTubers:** upload an SRT file so viewers get accurate captions instead of YouTube's auto-generated ones, and reach viewers in other languages
- **Reels and Shorts creators:** get short, punchy one-line captions to import into CapCut, Premiere Pro, or DaVinci Resolve
- **Teachers and course creators:** make lectures accessible and searchable
- **Podcasters:** turn an episode into captions for video clips

## How to generate subtitles, step by step

1. Open the [Subtitle Generator](/tools/ai-tools/subtitle-generator) and sign in (AI tools require an account).
2. Upload your video or audio: MP4, MOV, WEBM, MKV, MP3, WAV, or M4A.
3. Pick a caption style: **YouTube** for standard two-line subtitles, or **Reels / Shorts** for short one-line captions.
4. Choose the subtitle language: keep the spoken language, or translate into Hindi, Tamil, Spanish, Arabic, and 35+ others.
5. Click **Generate subtitles**. Long videos are processed in parts, and lines appear as each part is ready.
6. Play the video to check the captions. Click any time to jump to it, fix any word, and use **Shift all** if the timing is slightly early or late.
7. Download **SRT** (YouTube, Premiere, CapCut, VLC) or **VTT** (web players).

## SRT or VTT: which one do you need?

- **SRT** is the most widely supported format. Use it for YouTube, Facebook, LinkedIn, and almost every video editor.
- **VTT (WebVTT)** is the format HTML5 web players use. Choose it if you host videos on your own website.

## How to add the subtitles to YouTube

In YouTube Studio, open the video, go to **Subtitles**, choose the language, click **Add** next to Subtitles, then **Upload file** and select **With timing**. Pick the SRT file you downloaded.

## Privacy and limits

- **Your video stays on your device.** The audio is extracted in your browser; only the compressed audio is sent to the AI.
- **Length:** free accounts can subtitle videos up to 30 minutes; Pro covers up to 2 hours.
- **Daily use:** each video uses one AI generation from your daily quota, however many parts it is split into. If the first part fails, the generation is refunded.
- **Accuracy:** clear speech gives the best results. Check names and technical terms before publishing.

## Tips for better captions

- Reduce background music before exporting if you can; clear voice means more accurate subtitles.
- For a plain transcript without timings, use [Speech to Text](/tools/ai-tools/speech-to-text).
- Want a summary of a YouTube video instead? Try the [YouTube Summarizer](/tools/ai-tools/youtube-summarizer).

Ready to caption your next video? [Generate subtitles now →](/tools/ai-tools/subtitle-generator)`,
    },
    {
        slug: "how-to-check-resume-ats-score",
        title: "How to Check Your Resume's ATS Score Against a Job Description (Free)",
        excerpt:
            "Most resumes are filtered by software before a recruiter sees them. Check your ATS score, find missing keywords, and fix the problems that get resumes rejected.",
        seoTitle: "ATS Resume Checker: Free Resume Score & Keyword Match for Any Job | Filego",
        seoDescription:
            "Check your resume's ATS score against any job description. Find missing keywords, formatting problems, and weak bullet points, with fixes for Naukri, LinkedIn, and company portals.",
        category: "AI Guides",
        tags: ["ats resume checker", "resume score", "ats score", "resume keywords", "job search"],
        toolLabel: "ATS Resume Checker",
        toolPath: "/tools/ai-tools/ats-resume-checker",
        content: `Large companies and job portals receive hundreds of applications for every opening, so they use an applicant tracking system (ATS) to read resumes and rank them against the job description. If your resume doesn't use the job's keywords, or the software can't read it properly, it can be filtered out before a recruiter ever opens it.

## What an ATS looks for

- **Keywords from the job description:** skills, tools, certifications, and qualifications, usually in the exact words the job uses
- **Readable text:** scanned PDFs, text inside images, and icon fonts can turn into gibberish or nothing at all
- **Standard sections:** headings like Experience, Education, and Skills, so it knows where each detail belongs
- **Contact details:** an email and phone number it can pick out
- **Relevant experience:** job titles, years of experience, and achievements that match the role

## How to check your resume, step by step

1. Open the [ATS Resume Checker](/tools/ai-tools/ats-resume-checker) and sign in.
2. Upload your resume as a PDF, DOCX, or TXT file.
3. Copy the full job description from Naukri, LinkedIn, Indeed, or the company's careers page and paste it in.
4. Click **Check match**. In about 20 seconds you get your score.
5. Work through the report: add the missing keywords you genuinely have, fix any failed checks, then upload the updated resume and check again.

No job description yet? Leave the box empty for a general ATS check of your resume's formatting, sections, and impact.

## What's in the report

- **ATS score out of 100**, split into keyword match, experience fit, impact, ATS formatting, and sections & contact
- **Job keywords**, found and missing, with the required ones marked
- **ATS checks** for contact details, standard headings, length, measurable results, unreadable characters, and unnecessary personal details
- **Prioritised fixes** telling you exactly what to change and where
- **With Pro:** the full fix list, your weakest bullet points rewritten with action verbs and results, and a profile summary written for the job

## Common reasons resumes get rejected

- **Scanned or image-only PDF.** If the checker can't read your resume, neither can an ATS. Export it from Word or Google Docs as a PDF instead.
- **Missing exact keywords.** The job says "React.js" and your resume says "frontend frameworks". Use the job's own words where they're true for you.
- **Personal details.** Date of birth, marital status, father's name, and religion are still common on Indian resumes but aren't needed. Remove them to save space and avoid bias.
- **Duties instead of results.** "Responsible for testing" is weaker than "Cut regression bugs by 30% by automating 200 test cases".
- **Creative layouts.** Tables, text boxes, and two-column templates can scramble the order an ATS reads your resume in.

## Tips for a higher score

- Tailor your resume for each job. Ten minutes per application makes a real difference.
- Mirror the job title in your summary if it matches your experience.
- Add numbers to at least a third of your bullet points.
- Never add skills you don't have. Interviews will expose them.

Applying for a job this week? [Check your resume's ATS score now →](/tools/ai-tools/ats-resume-checker)`,
    },
    {
        slug: "how-to-make-a-quiz-and-flashcards-from-a-pdf",
        title: "How to Turn a PDF into a Quiz and Flashcards with AI (Free)",
        excerpt:
            "Turn class notes, textbook chapters, and lecture slides into a practice quiz with answers and explanations, plus flashcards you can export to Anki or Quizlet.",
        seoTitle: "PDF to Quiz & Flashcards: Free AI Quiz Generator for Students | Filego",
        seoDescription:
            "Upload a PDF, notes, or NCERT chapter and get a multiple-choice quiz with answers and explanations, plus flashcards for Anki and Quizlet. Works in Hindi and 35+ languages.",
        category: "AI Guides",
        tags: ["pdf to quiz", "flashcard maker", "quiz generator", "study tools", "exam preparation"],
        toolLabel: "PDF to Quiz & Flashcards",
        toolPath: "/tools/ai-tools/pdf-to-quiz-flashcards",
        content: `Re-reading notes feels productive, but testing yourself is what makes things stick. Students who practise recalling answers remember far more than those who only read. The problem is that writing good quiz questions and flashcards takes hours. An AI quiz generator does it in under a minute from the material you already have.

## What you can use it for

- **School and board exams:** turn an NCERT or textbook chapter into chapter-wise MCQs
- **Competitive exams:** practise from your coaching notes for NEET, JEE, UPSC, SSC, or banking exams
- **College:** revise lecture slides and handouts before tests
- **Teachers:** create a quick class test or worksheet with an answer key
- **Work:** learn training material, policies, or certification guides

## How to make a quiz from a PDF, step by step

1. Open [PDF to Quiz & Flashcards](/tools/ai-tools/pdf-to-quiz-flashcards) and sign in.
2. Upload a PDF, DOCX, or TXT file, or paste your notes as text.
3. For a long PDF, choose the page range, for example a single chapter.
4. Choose **Quiz + flashcards**, **Quiz**, or **Flashcards**, then how many questions and cards you want.
5. Pick a difficulty (Mixed works well for revision) and the language. Choose Hindi or another language to study in it, even if the PDF is in English.
6. Click **Generate**. It takes 20 to 60 seconds.

## Practising with your quiz

- Click an answer to see straight away whether you're right, with a short explanation and the exact line from your document it came from, including the page number.
- When you finish, you get your score. **Retry the ones I missed** quizzes you only on your mistakes.
- **Retake all** shuffles the answer order, so you can't just remember the position.
- **Print quiz** creates a worksheet with an answer key on a separate page. Save it as a PDF or print it for class.

## Studying with flashcards

- Tap a card or press Space to flip it.
- Mark each card **Got it** or **Still learning**. At the end of a round, review only the cards you're still learning, until you know them all.
- Export to **Anki or Quizlet**: download the .txt file and import it. Front and back are separated by a tab, which both apps detect automatically.

## Scanned PDFs and photos of notes

If your PDF is a scan (pages saved as images), the AI reads the page images directly. Select up to 15 pages at a time on a free account, or 50 with Pro.

## Limits

- **Free:** up to 15 questions and 25 flashcards per set, from about 16 pages of text
- **Pro:** up to 40 questions and 60 flashcards per set, from about 60 pages
- Each set uses one AI generation from your daily quota. If generation fails, it's refunded.

## Tips for better questions

- Use one chapter or topic per set. Focused material gives sharper questions.
- Use **Hard** difficulty the week before an exam to test application, not just recall.
- AI can make mistakes. If an answer looks wrong, check the quoted line and page.

Got an exam coming up? [Make your quiz now →](/tools/ai-tools/pdf-to-quiz-flashcards)`,
    },
    {
        slug: "how-to-edit-photos-with-ai-remove-objects-change-background",
        title: "How to Edit Photos with AI: Remove Objects and Change Backgrounds (Free)",
        excerpt:
            "Remove people and objects, change the background, or turn a selfie into a professional headshot just by describing the edit. No Photoshop skills needed.",
        seoTitle: "AI Photo Editor: Remove Objects & Change Backgrounds by Typing | Filego",
        seoDescription:
            "Edit photos with AI by describing what you want. Remove people and objects, replace or whiten backgrounds, create LinkedIn headshots and product photos. Free to try.",
        category: "AI Guides",
        tags: ["ai photo editor", "object remover", "change background", "magic eraser", "headshot generator"],
        toolLabel: "AI Photo Editor",
        toolPath: "/tools/ai-tools/ai-photo-editor",
        content: `Removing a stranger from a holiday photo or swapping a messy background used to take an hour in Photoshop. With an AI photo editor, you just type what you want, like "remove the man on the left" or "change the background to a beach", and get the edited photo in seconds.

## What you can do

- **Remove people and objects:** photobombers, power lines, bins, cars, or anything that spoils a shot
- **Change the background:** a clean white background, an office, a beach, a city at night
- **Professional headshots:** turn a casual photo into a LinkedIn-ready headshot with a studio background
- **Product photos:** clean, evenly lit e-commerce photos for Amazon, Flipkart, Meesho, or Instagram shops
- **Fix and enhance:** better lighting, colour, and sharpness, or a warm golden-hour look

## How to edit a photo, step by step

1. Open the [AI Photo Editor](/tools/ai-tools/ai-photo-editor) and sign in.
2. Upload a JPG, PNG, or WebP photo.
3. Pick a **quick edit**, or type what you want in your own words.
4. To change only one part, tap **Brush an area**, paint over it, then choose **Erase what I brushed** or describe what should go there (for example "replace with a plant").
5. Wait 10 to 40 seconds for the result.
6. Keep editing: each edit builds on the last. Use **Compare** to see before and after, **Undo** to step back, or tap any earlier version in the history.
7. Click **Download** to save your photo.

## Tips for better results

- **Be specific:** "remove the woman in the red dress on the right" works better than "remove the person".
- **Use the brush for small things:** painting over the object tells the AI exactly what to remove.
- **One change at a time:** do "remove the car", then "change the sky to sunset", rather than both in one go.
- **Say what to keep:** add "keep my face exactly the same" for portraits.
- **Pro HD mode** uses a higher-quality model at 2K resolution, better for prints and close-ups.

## Things to know

- Each edit uses one AI generation from your daily quota. If an edit fails, it's refunded.
- Edited images carry Google's invisible SynthID watermark, which identifies them as AI-edited.
- Some edits are blocked by safety rules, such as edits that sexualise people or are meant to deceive.
- Only edit photos you have the right to use, and never use edits to mislead or impersonate anyone.
- Need a transparent PNG cut-out? Use the free [Background Remover](/tools/image-tools/background-remover), which runs in your browser.

Got a photo to fix? [Edit it now →](/tools/ai-tools/ai-photo-editor)`,
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
