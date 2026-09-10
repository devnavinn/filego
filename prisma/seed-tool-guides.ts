// prisma/seed-tool-guides.ts
//
// Seeds one high-intent, SEO-oriented guide per PDF tool into the
// `blog_posts` table (Neon/Postgres via Prisma). Each post targets a
// "how to <task>" long-tail query and links back to the matching tool
// page, so it can rank for informational search intent while funneling
// readers straight into the tool.
//
// Run with: npx tsx prisma/seed-tool-guides.ts

import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { prisma } from "@/lib/prisma";

// The Neon serverless driver needs a WebSocket implementation outside
// browser/edge runtimes; Node doesn't provide one for this script.
neonConfig.webSocketConstructor = ws;

interface ToolGuide {
    slug: string;
    title: string;
    excerpt: string;
    seoTitle: string;
    seoDescription: string;
    category: string;
    tags: string[];
    content: string;
}

const guides: ToolGuide[] = [
    {
        slug: "how-to-merge-pdf-files-online-free",
        title: "How to Merge PDF Files Online for Free (Step-by-Step Guide)",
        excerpt:
            "Combining PDFs doesn't require desktop software. Here's exactly how to merge multiple PDF files into one clean document, free, in your browser.",
        seoTitle: "How to Merge PDF Files Online Free – Step-by-Step Guide | Filego",
        seoDescription:
            "Learn how to merge multiple PDF files into one document online for free, without installing software. Step-by-step instructions, tips, and FAQs.",
        category: "PDF Guides",
        tags: ["merge pdf", "combine pdf", "pdf tools"],
        content: `Merging PDF files is one of the most common document tasks — combining invoices into one file for accounting, stitching scanned pages into a single report, or putting together a portfolio from separate PDFs. You don't need Adobe Acrobat or any desktop software to do it. Here's how to merge PDF files online for free, in under a minute.

## Why merge PDFs instead of keeping them separate?

Sending or storing several separate PDF attachments is messy. A single merged file is easier to email, upload, print, and archive — and most application forms, submission portals, and printers expect one document, not a folder of loose pages.

## How to merge PDF files online, step by step

1. Open the [merge PDF tool](/merge-pdf).
2. Upload the PDF files you want to combine — drag and drop, or select them from your device.
3. Drag to reorder the files into the sequence you want in the final document.
4. Click merge. The tool combines every file into a single PDF.
5. Download the merged PDF instantly.

Because the merge happens in your browser, your files aren't uploaded to a server first — which matters if the documents contain anything sensitive, like contracts or ID scans.

## Tips for a clean merged PDF

- **Rename files before uploading** so the order is easy to reason about (e.g., \`01-cover.pdf\`, \`02-body.pdf\`).
- **Check page orientation** in each source file first — merging won't fix a sideways page. If you spot one, [rotate it](/rotate-pdf) before merging.
- **Keep file sizes reasonable.** If a source PDF is unusually large, the merged file will inherit that size.

## Common questions

**Is there a limit on how many PDFs I can merge?**
No — you can combine as many files as you need in a single merge.

**Will merging reduce PDF quality?**
No. Merging only combines pages; it doesn't recompress or alter the content of any page.

**Can I remove a page after merging?**
Yes — use the [split PDF tool](/split-pdf) or [edit PDF tool](/edit-pdf) afterward to remove or rearrange individual pages.

Ready to combine your files? [Merge your PDFs for free →](/merge-pdf)`,
    },
    {
        slug: "how-to-split-pdf-into-separate-pages",
        title: "How to Split a PDF Into Separate Pages or Files",
        excerpt:
            "Need one chapter, one invoice, or a single page pulled out of a bigger PDF? Here's how to split a PDF into separate files in seconds.",
        seoTitle: "How to Split a PDF Into Separate Pages – Free Online Guide | Filego",
        seoDescription:
            "Split a PDF into individual pages or custom page ranges online for free. Step-by-step instructions, use cases, and answers to common questions.",
        category: "PDF Guides",
        tags: ["split pdf", "extract pdf pages", "pdf tools"],
        content: `Sometimes you only need a handful of pages out of a much bigger PDF — one chapter from a report, a single invoice from a scanned batch, or a signature page to send separately. Splitting a PDF solves that without touching the original file.

## When you need to split a PDF

- Pulling a single page or section out of a large scanned document
- Breaking a multi-invoice PDF into one file per invoice
- Sharing only the relevant pages of a contract instead of the whole document
- Reducing file size by separating a document into smaller chunks

## How to split a PDF online, step by step

1. Open the [split PDF tool](/split-pdf).
2. Upload the PDF you want to split.
3. Preview every page directly in the browser.
4. Choose whether to split into individual pages or a custom page range.
5. Download the resulting file(s) instantly.

## Tips for splitting cleanly

- **Preview before you split.** Since every page renders in the browser first, you can confirm you're keeping the right pages before exporting.
- **Combine with merge afterward** if you need to split out a section and then attach it to a different document — use the [merge PDF tool](/merge-pdf) to stitch it back together with something else.
- **Fix orientation issues first.** If a page looks sideways in the preview, [rotate it](/rotate-pdf) before splitting so the extracted file is already correct.

## Common questions

**Can I split a PDF into a custom page range instead of one page per file?**
Yes — choose a custom range (e.g., pages 3–7) instead of splitting every page individually.

**Does splitting affect the quality of the pages?**
No. Splitting only separates existing pages; it doesn't recompress or re-render content.

**Do I need to install anything?**
No — the whole process runs in your browser, with no signup and no software to install.

Need to pull pages out of a PDF right now? [Split your PDF for free →](/split-pdf)`,
    },
    {
        slug: "how-to-edit-a-pdf-online-free",
        title: "How to Edit a PDF Online for Free (Text, Images & Pages)",
        excerpt:
            "Add text, cover up a mistake, insert an image, or reorder pages — all without buying software. Here's how to edit any PDF directly in your browser.",
        seoTitle: "How to Edit a PDF Online for Free – Text, Images, Pages | Filego",
        seoDescription:
            "Edit a PDF online for free: add text, images, shapes, and freehand drawing, plus rotate, reorder, and delete pages. Step-by-step guide.",
        category: "PDF Guides",
        tags: ["edit pdf", "pdf editor", "pdf tools"],
        content: `PDFs are meant to be a "final" format, but you'll often still need to tweak one — filling in a missing field, covering up an old figure, adding a note, or fixing the page order. Here's how to do it without a desktop editor.

## What you can typically fix without recreating the document

- Add text where a field was left blank
- Insert an image, logo, or signature
- Draw or highlight freehand to annotate a section
- Whiteout a mistake or outdated detail
- Rotate, reorder, or delete individual pages

## How to edit a PDF online, step by step

1. Open the [edit PDF tool](/edit-pdf).
2. Upload the PDF you need to change.
3. Add text boxes, images, or shapes directly onto the page, or use whiteout to cover something up.
4. Use the page panel to rotate, reorder, or delete pages as needed.
5. Download the edited PDF — the original file is left untouched.

## Tips for a professional-looking result

- **Match the existing font size** roughly when adding new text, so it doesn't stand out awkwardly.
- **Use whiteout sparingly** — it covers content visually but the goal is a clean final page, not a patch job, so double-check alignment before downloading.
- **Fix page order before adding content.** If pages are out of sequence, reorder them first so new annotations land on the right page.

## Common questions

**Can I edit a scanned PDF (an image, not real text)?**
You can add new text, images, and annotations on top of a scanned page, but the original scanned content itself isn't converted into editable text unless you convert it to Word first — see [PDF to Word](/pdf-to-word).

**Will editing change the rest of the document?**
No — only the elements you add or the pages you modify are affected; everything else stays as it was.

**Is my file uploaded to a server?**
The editor is built to process files in your browser, so editing doesn't require sending the document to a remote server first.

Have a PDF that needs a quick fix? [Edit your PDF for free →](/edit-pdf)`,
    },
    {
        slug: "how-to-add-watermark-to-pdf",
        title: "How to Add a Watermark to a PDF (Text, Position & Opacity Tips)",
        excerpt:
            "Mark a document as a draft, confidential, or copyrighted in seconds. Here's how to stamp a watermark across every page of a PDF for free.",
        seoTitle: "How to Add a Watermark to a PDF Online Free | Filego",
        seoDescription:
            "Add a text watermark to every page of a PDF online for free. Control size, opacity, rotation, and color. Step-by-step guide and tips.",
        category: "PDF Guides",
        tags: ["watermark pdf", "protect pdf", "pdf tools"],
        content: `A watermark is a fast way to signal that a document is a draft, confidential, or belongs to you — without redesigning the file. Here's how to stamp one across every page of a PDF online.

## Common reasons to add a watermark

- Marking a contract or proposal as **DRAFT** before it's final
- Adding **CONFIDENTIAL** across internal documents
- Stamping a company name or copyright notice across shared work
- Discouraging unauthorized redistribution of a document you're sharing for review

## How to add a watermark to a PDF, step by step

1. Open the [add watermark tool](/add-watermark).
2. Upload the PDF you want to stamp.
3. Type the watermark text.
4. Adjust size, opacity, rotation, and color until it looks right on the preview.
5. Apply it across every page and download the watermarked PDF.

## Tips for a watermark that doesn't ruin readability

- **Lower the opacity** (usually 10–25%) so the watermark is visible without obscuring the text underneath.
- **Diagonal rotation** (around 45°) is the most common choice — it reads clearly without competing with normal horizontal text.
- **Keep the text short.** A single word or short phrase ("DRAFT", "CONFIDENTIAL", a company name) works better than a long sentence repeated across the page.

## Common questions

**Can I remove a watermark later?**
This tool is for adding a watermark, not removing one added elsewhere. If you need to send an unmarked version, keep the original file and only watermark a copy.

**Does the watermark apply to every page automatically?**
Yes — once applied, it's stamped consistently across the whole document.

**Can I use an image or logo instead of text?**
This guide covers the text watermark workflow; for logo placement, use the [edit PDF tool](/edit-pdf) to insert an image directly onto the pages you need.

Ready to mark up your document? [Add a watermark for free →](/add-watermark)`,
    },
    {
        slug: "how-to-rotate-pdf-pages",
        title: "How to Rotate PDF Pages That Are Sideways or Upside Down",
        excerpt:
            "A scanned page came out sideways or upside down? Here's how to fix PDF page orientation in seconds, without re-scanning anything.",
        seoTitle: "How to Rotate PDF Pages Online Free | Filego",
        seoDescription:
            "Fix sideways or upside-down PDF pages online for free. Rotate individual pages or the whole document instantly. Step-by-step guide.",
        category: "PDF Guides",
        tags: ["rotate pdf", "fix pdf orientation", "pdf tools"],
        content: `Sideways or upside-down pages usually come from a scanner that fed a document in wrong, or a photo taken in the wrong orientation before converting it to PDF. It's an easy fix — you don't need to rescan or re-photograph anything.

## Why this happens

- A physical page was fed into a scanner rotated 90° or 180°
- A photo used to create the PDF was taken in landscape when the tool expected portrait (or vice versa)
- Pages from different sources were merged and some carried the wrong orientation

## How to rotate PDF pages, step by step

1. Open the [rotate PDF tool](/rotate-pdf).
2. Upload the PDF with the orientation problem.
3. Preview each page and identify which ones are rotated incorrectly.
4. Rotate just the affected pages, or the entire document, in 90° steps.
5. Download the corrected PDF.

## Tips

- **Rotate only what's broken.** If just one page in a 20-page document is sideways, there's no need to rotate the whole file — fix that page individually.
- **Do this before merging.** If you're about to combine several PDFs, fix orientation issues in the source files first so the final merged document is consistent — see [merge PDF](/merge-pdf).
- **Check both landscape and portrait pages** in mixed-orientation documents; rotating a page that's already correct will make it wrong.

## Common questions

**Does rotating a page change its content or quality?**
No — it only changes the page's orientation, not the content itself.

**Can I rotate just one page in a multi-page document?**
Yes — pages can be rotated individually rather than all at once.

**Will the fix apply permanently, or just to the preview?**
The rotation is applied to the file you download — it's a real, permanent fix, not just a viewing setting.

Have a sideways PDF to fix? [Rotate your PDF for free →](/rotate-pdf)`,
    },
    {
        slug: "how-to-convert-pdf-to-word-free",
        title: "How to Convert PDF to Word (DOCX) for Free",
        excerpt:
            "Need to actually edit the text in a PDF? Converting it to Word first is the fastest way. Here's how to do it online for free.",
        seoTitle: "How to Convert PDF to Word Free Online | Filego",
        seoDescription:
            "Convert PDF files to editable Word (DOCX) documents online for free. Extract text, preview the recovered structure, and download instantly.",
        category: "PDF Guides",
        tags: ["pdf to word", "pdf to docx", "convert pdf"],
        content: `PDF is great for sharing a final version of a document, but it's a poor format for actually editing text. If you need to change wording, fix a typo, or reuse a section, converting the PDF to Word first is much faster than retyping it.

## When you need PDF to Word conversion

- Editing a contract or resume that only exists as a PDF
- Reusing content from a PDF report inside a new Word document
- Fixing typos or formatting in a document you no longer have the original source file for
- Repurposing a scanned or exported PDF into an editable draft

## How to convert PDF to Word, step by step

1. Open the [PDF to Word tool](/pdf-to-word).
2. Upload the PDF file you want to convert.
3. Let the tool extract the text and recover the document structure.
4. Preview the result to confirm formatting looks right.
5. Download the DOCX file and continue editing in Word or Google Docs.

## Tips for the cleanest conversion

- **Text-based PDFs convert best.** A PDF created from a Word document, Google Doc, or similar source will convert far more accurately than a scanned image of a page.
- **Double-check tables and columns.** Complex layouts sometimes need small manual adjustments after conversion — quickly scan those sections before finalizing.
- **Keep the original PDF.** Conversion doesn't modify or delete the source file, so you always have the original to fall back on.

## Common questions

**Will the converted Word file look exactly like the PDF?**
It aims to preserve the text and structure as closely as possible, but very complex layouts (multi-column designs, heavy graphics) may need minor manual cleanup.

**Can I convert a scanned PDF (an image of text)?**
This tool is built for extracting text from PDFs that already contain real text data, not for OCR on scanned images.

**Is the file uploaded anywhere?**
Conversion runs in your browser, so there's no separate upload step to a remote server.

Need an editable version of a PDF? [Convert PDF to Word for free →](/pdf-to-word)`,
    },
    {
        slug: "how-to-convert-word-to-pdf-free",
        title: "How to Convert Word to PDF Without Losing Formatting",
        excerpt:
            "Turning a Word document into a PDF keeps formatting locked and makes it easy to share. Here's how to do it online, free.",
        seoTitle: "How to Convert Word to PDF Free Online | Filego",
        seoDescription:
            "Convert DOCX files to PDF online for free. Preview layout and spacing before exporting, and download instantly. Step-by-step guide.",
        category: "PDF Guides",
        tags: ["word to pdf", "docx to pdf", "convert pdf"],
        content: `A Word document can look different depending on which app opens it, what fonts are installed, and what device it's viewed on. Converting it to PDF locks the formatting in place — what you see is exactly what the reader sees, on any device.

## Why convert Word to PDF before sharing

- The layout stays identical regardless of the reader's software or fonts
- PDFs are the expected format for resumes, contracts, invoices, and formal submissions
- It prevents accidental edits — recipients view it, they don't casually change it
- It's easier to print consistently across different printers and devices

## How to convert Word to PDF, step by step

1. Open the [Word to PDF tool](/word-to-pdf).
2. Upload the DOCX file you want to convert.
3. Preview the layout and spacing to make sure everything rendered correctly.
4. Export and download the PDF.

## Tips before you convert

- **Finalize edits in Word first.** Once it's a PDF, further text edits require a PDF editor rather than simply retyping in Word — use [edit PDF](/edit-pdf) if you need small tweaks afterward.
- **Check page breaks.** Long documents sometimes shift page breaks slightly when exported — review the preview before downloading.
- **Watch for custom fonts.** If the Word document uses an unusual font that isn't widely available, double-check that it rendered as expected in the PDF preview.

## Common questions

**Will my formatting (fonts, spacing, images) be preserved?**
Yes — the conversion is designed to preserve layout, spacing, and images as closely as possible to the original document.

**Can I convert multiple Word documents into one PDF?**
Convert each DOCX to PDF individually, then use the [merge PDF tool](/merge-pdf) to combine them into a single file.

**Do I need Microsoft Word installed?**
No — the conversion happens directly from the uploaded file; you don't need Word or any other software installed.

Ready to lock in your document's formatting? [Convert Word to PDF for free →](/word-to-pdf)`,
    },
    {
        slug: "how-to-convert-jpg-to-pdf-free",
        title: "How to Convert JPG Images to a Single PDF File",
        excerpt:
            "Turning a batch of photos or scans into one PDF makes them far easier to send and store. Here's how to do it online, free.",
        seoTitle: "How to Convert JPG to PDF Free Online | Filego",
        seoDescription:
            "Convert JPG images to a single PDF online for free. Reorder pages, adjust layout and margins, and download instantly. Step-by-step guide.",
        category: "PDF Guides",
        tags: ["jpg to pdf", "image to pdf", "convert pdf"],
        content: `Whether it's a stack of photographed receipts, scanned pages, or screenshots, turning JPG images into a single PDF makes them dramatically easier to send, print, and store compared to a folder of separate image files.

## When JPG to PDF conversion is useful

- Photographed receipts that need to be submitted as one document for reimbursement
- Multiple scanned pages of a form that should read as a single file
- Screenshots that need to be combined into a shareable report
- Photos of handwritten notes that need to be archived as a proper document

## How to convert JPG to PDF, step by step

1. Open the [JPG to PDF tool](/jpg-to-pdf).
2. Upload the images you want to include.
3. Drag to reorder them into the sequence you want in the final PDF.
4. Choose the page size and margins.
5. Download the resulting PDF — one file instead of many images.

## Tips for a clean result

- **Crop and straighten photos beforehand** if a page was photographed at an angle; the PDF will preserve whatever the source image looks like.
- **Use consistent image dimensions** where possible so pages don't look jarringly different in size.
- **Check orientation before converting.** If a photo came out sideways, fix it first — or [rotate the resulting PDF page](/rotate-pdf) afterward.

## Common questions

**Can I convert more than one image at a time?**
Yes — upload as many images as you need and they'll be combined into a single multi-page PDF, in the order you choose.

**Does converting reduce image quality?**
The images are placed into the PDF as-is; there's no forced recompression during conversion.

**Can I add more images to the PDF later?**
Convert the new images separately, then use the [merge PDF tool](/merge-pdf) to combine them with the existing file.

Have images to turn into a document? [Convert JPG to PDF for free →](/jpg-to-pdf)`,
    },
    {
        slug: "how-to-convert-pdf-to-jpg-free",
        title: "How to Convert PDF Pages to JPG Images (High Quality)",
        excerpt:
            "Need a PDF page as an image — for a slide, a social post, or a preview thumbnail? Here's how to export PDF pages as JPG, free.",
        seoTitle: "How to Convert PDF to JPG Free Online | Filego",
        seoDescription:
            "Convert PDF pages to JPG images online for free. Choose quality and scale, preview pages, and download instantly. Step-by-step guide.",
        category: "PDF Guides",
        tags: ["pdf to jpg", "pdf to image", "convert pdf"],
        content: `Sometimes you don't need the whole PDF — you need one page of it as an image, so it can go into a presentation, a social post, a website, or a quick preview thumbnail. Converting PDF pages to JPG solves that directly.

## When PDF to JPG conversion is useful

- Pulling a single page out of a report to drop into a slide deck
- Sharing a document preview on social media or in a chat, where a PDF attachment is inconvenient
- Creating thumbnail images for a document library or website
- Extracting a diagram or chart from a PDF as a standalone image

## How to convert PDF to JPG, step by step

1. Open the [PDF to JPG tool](/pdf-to-jpg).
2. Upload the PDF file.
3. Choose the quality and scale for the exported images.
4. Preview each page before exporting.
5. Download the JPG image(s) — one per page, or just the pages you need.

## Tips for the best image quality

- **Increase the scale** for pages with fine text or detailed diagrams, so the exported JPG stays sharp when zoomed in.
- **Export only the pages you need** rather than the whole document, to keep file sizes manageable.
- **Match quality to the use case** — a quick chat preview needs less resolution than an image destined for print.

## Common questions

**Can I convert just one page instead of the whole PDF?**
Yes — preview the pages and export only the ones you actually need.

**Will text stay sharp in the JPG?**
Higher scale settings keep text and fine detail sharp; very low scale settings can make small text blurry, so preview before downloading.

**Can I convert the JPG back into a PDF later?**
Yes — use the [JPG to PDF tool](/jpg-to-pdf) to turn any image back into a PDF document.

Need a page from your PDF as an image? [Convert PDF to JPG for free →](/pdf-to-jpg)`,
    },
    {
        slug: "how-to-fill-out-a-pdf-form-online",
        title: "How to Fill Out and Create Fillable PDF Forms Online",
        excerpt:
            "No printer, no scanner, no problem. Here's how to fill out a PDF form online, or build your own fillable form from scratch, for free.",
        seoTitle: "How to Fill Out a PDF Form Online Free | Filego",
        seoDescription:
            "Fill in existing PDF forms online, or add new text fields and checkboxes to any PDF, for free. No printing or scanning required.",
        category: "PDF Guides",
        tags: ["pdf forms", "fillable pdf", "pdf tools"],
        content: `Printing a form, filling it in by hand, and scanning it back is slow and produces a worse-looking document than just filling it in digitally. Here's how to complete a PDF form — or build one — entirely online.

## Two different situations this solves

1. **You received a PDF form** (an application, a permission slip, an intake form) and need to fill it in and send it back.
2. **You need to create a form** — text fields and checkboxes on a document that doesn't have any yet, so someone else can fill it in.

## How to fill out an existing PDF form, step by step

1. Open [PDF Forms](/pdf-forms) and upload your own PDF, or pick a ready-made template.
2. Click into each field and type your answers directly onto the document.
3. Check boxes where needed.
4. Download the completed PDF — ready to email or submit.

## How to create a fillable PDF form, step by step

1. Upload the blank PDF you want to turn into a form.
2. Add text fields and checkboxes where the recipient needs to respond.
3. Download the form and share it with whoever needs to fill it in.

## Tips

- **Use a template when one fits** — common form types are available ready-made, which saves time over building fields from scratch.
- **Keep field labels close to their boxes** when creating a form, so it's obvious what belongs where.
- **Review before sending.** Once downloaded, double-check every field and checkbox reads correctly before submitting or sharing.

## Common questions

**Do I need a printer or scanner for any of this?**
No — the entire process, filling in or creating a form, happens on-screen with no printing or scanning involved.

**Can I add my own custom fields to any PDF?**
Yes — upload any PDF and add text fields or checkboxes wherever you need them.

**Is a signature supported?**
You can add a text field or an image for a signature using the [edit PDF tool](/edit-pdf) if the form doesn't already include a signature field.

Have a form to fill in or build? [Go to PDF Forms →](/pdf-forms)`,
    },
];

async function main() {
    for (const guide of guides) {
        await prisma.blogPost.upsert({
            where: { slug: guide.slug },
            create: {
                slug: guide.slug,
                title: guide.title,
                excerpt: guide.excerpt,
                content: guide.content,
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
                content: guide.content,
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
