// prisma/seed-pdf-remaining-guides.ts
//
// Seeds guides for the PDF tools not already covered by
// prisma/seed-tool-guides.ts: PDF Compress, PDF Password Protect,
// PDF Unlock, PDF Page Numbering, Delete PDF Pages, and Extract PDF
// Pages. These tools don't have dedicated top-level routes like
// /merge-pdf, so their toolPath points at /tools/pdf-tools/<slug>
// instead. Closes the last gap in the SEO coverage audit.
//
// Run with: npm run seed:pdf-remaining-guides

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
        slug: "how-to-compress-a-pdf-online-free",
        title: "How to Compress a PDF File Online Without Losing Quality",
        excerpt:
            "A bloated PDF is slow to email and clogs up storage. Here's how to reduce a PDF's file size online, free, while keeping it readable.",
        seoTitle: "How to Compress a PDF Online Free | Filego",
        seoDescription:
            "Compress a PDF file online for free without major quality loss. Fit email attachment and upload limits. Step-by-step guide.",
        category: "PDF Guides",
        tags: ["compress pdf", "reduce pdf size", "pdf tools"],
        toolLabel: "PDF Compress",
        toolPath: "/tools/pdf-tools/pdf-compress",
        content: `A PDF full of high-resolution scans or embedded images can balloon to a size that email providers reject and upload forms cap out on. Compressing it brings the file down to a manageable size, usually without a noticeable difference in how it reads.

## Why PDF file size matters

- Email providers often reject attachments over a certain size outright
- Many upload forms and portals enforce a maximum file size
- Smaller PDFs upload and download faster, especially on a slow connection
- Compressed files take up less storage across devices and cloud accounts

## How to compress a PDF online, step by step

1. Open the [PDF Compress tool](/tools/pdf-tools/pdf-compress).
2. Upload the PDF you want to shrink.
3. Choose a compression level and see the estimated output size.
4. Preview the result to confirm text and images still look acceptable.
5. Download the compressed PDF.

## Tips for the best size-to-quality tradeoff

- **Image-heavy PDFs compress the most.** A scanned document or a PDF full of photos will shrink far more than a mostly-text file.
- **Don't over-compress documents with fine print or diagrams.** Very aggressive compression can make small text or detailed images blurry — preview before committing.
- **Extract only the pages you need first** if the PDF is longer than necessary — see [Extract PDF Pages](/tools/pdf-tools/extract-pdf-pages) — since a shorter document compresses to a smaller file at the same quality.

## Common questions

**Will compression make the text blurry?**
Text generally stays sharp even at higher compression, since compression mainly targets embedded images — always preview to confirm.

**How much smaller will my file get?**
It depends heavily on content — image-heavy PDFs shrink significantly, while already-compact text-only PDFs may only reduce slightly.

**Can I compress a PDF that's already been compressed once?**
Yes, though there's less to gain the second time — the first compression pass usually captures most of the possible size reduction.

Need to shrink a PDF file? [Compress your PDF for free →](/tools/pdf-tools/pdf-compress)`,
    },
    {
        slug: "how-to-password-protect-a-pdf-online",
        title: "How to Password Protect a PDF Online for Free",
        excerpt:
            "Keep a sensitive PDF from being opened by anyone but you. Here's how to add a password to a PDF file online, free, in seconds.",
        seoTitle: "How to Password Protect a PDF Online Free | Filego",
        seoDescription:
            "Add password protection to a PDF file online for free. Require a password to open a sensitive document. Step-by-step guide.",
        category: "PDF Guides",
        tags: ["password protect pdf", "encrypt pdf", "pdf tools"],
        toolLabel: "PDF Password Protect",
        toolPath: "/tools/pdf-tools/pdf-password-protect",
        content: `A PDF containing sensitive information — a contract, a financial statement, personal records — is only as protected as the channel you send it through. Adding a password means the file itself requires that password to open, regardless of where it ends up.

## When to password protect a PDF

- Sending a contract, invoice, or financial document that shouldn't be openable by just anyone
- Sharing personal records over email or a file-sharing link
- Adding a layer of protection to a document stored on a shared drive
- Restricting access to a document meant for a specific recipient only

## How to password protect a PDF, step by step

1. Open [PDF Password Protect](/tools/pdf-tools/pdf-password-protect).
2. Upload the PDF you want to secure.
3. Set a password for the file.
4. Download the password-protected PDF.

## Tips for protecting a PDF properly

- **Use a strong, unique password** — see the [Password Generator](/tools/security-tools/password-generator) if you need one.
- **Share the password through a different channel** than the PDF itself — sending both together in the same email defeats the purpose.
- **Keep a copy of the password somewhere safe.** A password-protected PDF can't be opened without it, and there's no recovery option built into the file.

## Common questions

**What happens if I forget the password?**
The PDF can't be opened without it — there's no built-in way to recover a forgotten password from a protected PDF.

**Does this stop someone from editing the PDF, or just opening it?**
This adds a password required to open the file. For restricting editing specifically, check whether your workflow needs additional permission controls beyond an open-password.

**Can I remove the password later?**
Yes — use the [PDF Unlock tool](/tools/pdf-tools/pdf-unlock) with the correct password to remove protection from a file you have legitimate access to.

Have a sensitive PDF to lock down? [Password protect your PDF for free →](/tools/pdf-tools/pdf-password-protect)`,
    },
    {
        slug: "how-to-unlock-a-password-protected-pdf-online",
        title: "How to Unlock a Password-Protected PDF You Have Access To",
        excerpt:
            "Tired of entering a password every time you open a PDF you own? Here's how to remove it online, free, when you already know the password.",
        seoTitle: "How to Unlock a PDF Online Free | Filego",
        seoDescription:
            "Remove password protection from a PDF you have legitimate access to, online and free. Step-by-step guide.",
        category: "PDF Guides",
        tags: ["unlock pdf", "remove pdf password", "pdf tools"],
        toolLabel: "PDF Unlock",
        toolPath: "/tools/pdf-tools/pdf-unlock",
        content: `Once a PDF no longer needs to be restricted — maybe it was password protected for one transfer and now lives somewhere secure — re-entering a password every time you open it is just friction. If you know the password, removing it makes the file open normally again.

## When you need to unlock a PDF

- Removing a password from a file you protected temporarily for one transfer
- Simplifying access to a document now stored somewhere already secure
- Removing protection from an old file you no longer need locked
- Preparing a document for a workflow that requires unrestricted access

## How to unlock a PDF, step by step

1. Open the [PDF Unlock tool](/tools/pdf-tools/pdf-unlock).
2. Upload the password-protected PDF.
3. Enter the current password.
4. Download the unlocked PDF, now openable without a password.

## Tips for using this responsibly

- **Only unlock PDFs you have legitimate access to.** This requires knowing the existing password — it's for removing protection you control, not for bypassing someone else's.
- **Store the unlocked file securely** if the content is still sensitive, since removing the password removes that layer of protection entirely.
- **Re-protect it later if needed** — use [PDF Password Protect](/tools/pdf-tools/pdf-password-protect) any time you need to add a password back.

## Common questions

**Do I need to know the password to unlock the PDF?**
Yes — this removes protection from a file using its existing password; it doesn't recover or bypass an unknown password.

**Is the PDF's content changed by unlocking it?**
No — only the password requirement is removed; the document's actual content stays the same.

**Can I re-add a password later if needed?**
Yes — use [PDF Password Protect](/tools/pdf-tools/pdf-password-protect) whenever you need to lock the file again.

Have a PDF you need to unlock? [Unlock your PDF for free →](/tools/pdf-tools/pdf-unlock)`,
    },
    {
        slug: "how-to-add-page-numbers-to-a-pdf-online",
        title: "How to Add Page Numbers to a PDF Online for Free",
        excerpt:
            "A long document without page numbers is hard to navigate and reference. Here's how to add them across every page, online and free.",
        seoTitle: "How to Add Page Numbers to a PDF Online Free | Filego",
        seoDescription:
            "Add page numbers to every page of a PDF online for free. Choose position and starting number. Step-by-step guide.",
        category: "PDF Guides",
        tags: ["pdf page numbers", "number pdf pages", "pdf tools"],
        toolLabel: "PDF Page Numbering",
        toolPath: "/tools/pdf-tools/pdf-page-numbering",
        content: `A report, thesis, or long contract without page numbers makes it hard to say "see page 12" or keep printed pages in order if they get shuffled. Adding page numbers across the whole document solves both problems in one pass.

## When you need to add page numbers

- Preparing a long report or document that needs to be referenced by page
- Making a printed document easier to keep in order if pages get separated
- Formatting a thesis, manual, or contract to a professional standard
- Adding numbering to a document assembled from multiple merged files

## How to add page numbers to a PDF, step by step

1. Open [PDF Page Numbering](/tools/pdf-tools/pdf-page-numbering).
2. Upload the PDF you want to number.
3. Choose the position (like bottom-center or bottom-right) and starting number.
4. Preview the numbering on the pages.
5. Download the numbered PDF.

## Tips for clean page numbering

- **Match numbering position to the document's existing margins**, so numbers don't overlap with content near the page edges.
- **Set the correct starting number** if the document is part of a larger set — for example, starting at 13 if it continues from a 12-page section.
- **Number after merging, not before**, if you're combining multiple files with the [PDF Merge tool](/tools/pdf-tools/merge-pdf) — that way the numbering runs continuously across the whole combined document.

## Common questions

**Can I start numbering from a page other than 1?**
Yes — set whatever starting number fits your document, useful when it continues from another section.

**Will page numbers cover up existing content?**
Choose a position with enough margin space so numbers don't overlap with your document's content — preview before downloading to confirm.

**Can I remove page numbers later if needed?**
This tool is for adding numbers; if you need a clean version without them, keep the original unnumbered file as a backup.

Need to number a long document? [Add page numbers for free →](/tools/pdf-tools/pdf-page-numbering)`,
    },
    {
        slug: "how-to-delete-pages-from-a-pdf-online",
        title: "How to Delete Pages from a PDF Online for Free",
        excerpt:
            "Got a blank, duplicate, or unwanted page in a PDF? Here's how to remove specific pages online, free, without touching the rest.",
        seoTitle: "How to Delete Pages from a PDF Online Free | Filego",
        seoDescription:
            "Remove specific pages from a PDF online for free. Preview and select exactly which pages to delete. Step-by-step guide.",
        category: "PDF Guides",
        tags: ["delete pdf pages", "remove pdf pages", "pdf tools"],
        toolLabel: "Delete PDF Pages",
        toolPath: "/tools/pdf-tools/delete-pdf-pages",
        content: `A scanned document sometimes picks up a blank page, a duplicate, or a page that doesn't belong. Rather than rescanning or rebuilding the whole file, you can remove exactly the pages you don't want and keep everything else intact.

## When you need to delete PDF pages

- Removing a blank page picked up accidentally during scanning
- Getting rid of a duplicate or irrelevant page in a larger document
- Cutting an outdated section out of a multi-page report
- Cleaning up a PDF before sharing or submitting it

## How to delete pages from a PDF, step by step

1. Open [Delete PDF Pages](/tools/pdf-tools/delete-pdf-pages).
2. Upload the PDF you want to edit.
3. Preview every page and select the ones you want to remove.
4. Confirm your selection.
5. Download the PDF with those pages removed.

## Tips for a clean result

- **Preview before deleting.** Since every page renders first, you can confirm exactly which ones you're removing before committing.
- **Double-check page order after removal** if the document has cross-references to page numbers, since deleting pages shifts everything after them.
- **Extract instead if you want the opposite result** — see [Extract PDF Pages](/tools/pdf-tools/extract-pdf-pages) if you'd rather keep a specific set of pages and discard the rest.

## Common questions

**Can I delete more than one page at once?**
Yes — select as many pages as you need to remove in a single pass.

**Does deleting a page affect the rest of the document?**
No — the remaining pages keep their content unchanged; only the selected pages are removed.

**Can I undo a deletion after downloading?**
Keep the original file if you might need those pages again — the tool doesn't modify the source file, only the exported copy.

Have unwanted pages in a PDF? [Delete them for free →](/tools/pdf-tools/delete-pdf-pages)`,
    },
    {
        slug: "how-to-extract-pages-from-a-pdf-online",
        title: "How to Extract Specific Pages from a PDF Online",
        excerpt:
            "Need just a few pages out of a much bigger PDF, as their own file? Here's how to extract them online, free, in seconds.",
        seoTitle: "How to Extract Pages from a PDF Online Free | Filego",
        seoDescription:
            "Extract specific pages from a PDF into a new file online for free. Preview and select exactly which pages to keep. Step-by-step guide.",
        category: "PDF Guides",
        tags: ["extract pdf pages", "pull pages from pdf", "pdf tools"],
        toolLabel: "Extract PDF Pages",
        toolPath: "/tools/pdf-tools/extract-pdf-pages",
        content: `Sometimes you don't need a whole document — you need one chapter, one signed page, or a handful of relevant pages pulled out as their own file. Extracting solves that without editing or affecting the original PDF.

## When you need to extract PDF pages

- Pulling one chapter or section out of a much longer report
- Getting just the signature page out of a signed contract
- Creating a smaller file from a few relevant pages of a bigger document
- Separating a specific form or invoice out of a scanned batch

## How to extract pages from a PDF, step by step

1. Open [Extract PDF Pages](/tools/pdf-tools/extract-pdf-pages).
2. Upload the PDF you want to pull pages from.
3. Preview every page and select the ones you want to keep.
4. Confirm your selection.
5. Download the new PDF containing just those pages.

## Tips for a clean extraction

- **Preview before extracting** to confirm you're selecting exactly the right pages, especially in a long or similar-looking document.
- **Combine extracted pages with something else afterward** using the [PDF Merge tool](/tools/pdf-tools/merge-pdf), if you need to attach them to a different document.
- **Use Delete instead if it's easier** — see [Delete PDF Pages](/tools/pdf-tools/delete-pdf-pages) if you'd rather remove the pages you don't want than select the ones you do.

## Common questions

**Does extracting pages affect the original PDF?**
No — the original file is left untouched; extraction creates a new file containing just the selected pages.

**Can I extract a non-continuous set of pages, not just a range?**
Yes — select individual pages in any combination, not just a consecutive range.

**Can I extract pages from more than one PDF into a single file?**
Extract from each PDF separately, then combine the results with the [PDF Merge tool](/tools/pdf-tools/merge-pdf).

Need just a few pages from a bigger PDF? [Extract them for free →](/tools/pdf-tools/extract-pdf-pages)`,
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
