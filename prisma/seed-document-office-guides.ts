// prisma/seed-document-office-guides.ts
//
// Seeds one high-intent, SEO-oriented guide per Document & Office tool into
// the `blog_posts` table (Neon/Postgres via Prisma). Mirrors
// prisma/seed-tool-guides.ts, but for the Document & Office Tools category
// (spreadsheet conversion, JSON/XML formatting, Markdown/HTML conversion,
// and text comparison).
//
// Run with: npm run seed:document-office-guides

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
        slug: "how-to-convert-excel-to-csv-online-free",
        title: "How to Convert Excel to CSV Online for Free",
        excerpt:
            "Need a plain, universally compatible version of a spreadsheet? Here's how to convert an Excel file into CSV online, free, in seconds.",
        seoTitle: "How to Convert Excel to CSV Online Free | Filego",
        seoDescription:
            "Convert XLSX or XLS Excel files to CSV online for free. Keep your data compatible with imports, scripts, and other tools. Step-by-step guide.",
        category: "Document Guides",
        tags: ["excel to csv", "spreadsheet conversion", "office tools"],
        toolLabel: "Excel to CSV",
        toolPath: "/tools/document-office-tools/excel-to-csv",
        content: `Excel files carry formatting, formulas, and multiple sheets — great for working in Excel, but often exactly what breaks an import into another system. CSV strips all of that down to plain rows and columns, which is what most databases, scripts, and import tools actually expect.

## When you need Excel to CSV conversion

- Importing customer, product, or contact data into a CRM, database, or SaaS tool that only accepts CSV
- Feeding a spreadsheet into a script or data pipeline that expects plain delimited text
- Sharing data with someone who doesn't have Excel installed
- Reducing a file down to just the data, without formulas, formatting, or multiple sheets

## How to convert Excel to CSV, step by step

1. Open the [Excel to CSV tool](/tools/document-office-tools/excel-to-csv).
2. Upload your XLSX or XLS file.
3. Choose which sheet to export if the workbook has more than one.
4. Preview the converted rows and columns.
5. Download the CSV file.

## Tips for a clean conversion

- **Check for merged cells first.** Merged cells in Excel don't have a CSV equivalent and can shift columns unexpectedly — unmerge them in Excel before converting if the layout looks off.
- **Watch for formulas.** CSV stores only the calculated values, not the formulas themselves — that's expected, not a bug.
- **Convert one sheet at a time** if your workbook has several, since CSV is a single flat table format.

## Common questions

**What happens to Excel formulas after converting?**
Only the current calculated result is kept — CSV has no way to store formulas, just plain values.

**Can I convert a multi-sheet workbook in one go?**
Choose the sheet you want to export; each sheet converts to its own CSV file since CSV doesn't support multiple tabs.

**Will formatting like colors or bold text carry over?**
No — CSV is plain text only, so all visual formatting is dropped, keeping just the underlying data.

Need your spreadsheet in a universal format? [Convert Excel to CSV for free →](/tools/document-office-tools/excel-to-csv)`,
    },
    {
        slug: "how-to-convert-csv-to-excel-online-free",
        title: "How to Convert CSV to Excel Online for Free",
        excerpt:
            "A raw CSV file is hard to read and easy to break in a spreadsheet app. Here's how to turn it into a proper Excel file online, free.",
        seoTitle: "How to Convert CSV to Excel Online Free | Filego",
        seoDescription:
            "Convert CSV files to Excel (XLSX) format online for free. Fix column formatting issues and get a proper spreadsheet instantly.",
        category: "Document Guides",
        tags: ["csv to excel", "spreadsheet conversion", "office tools"],
        toolLabel: "CSV to Excel",
        toolPath: "/tools/document-office-tools/csv-to-excel",
        content: `Opening a CSV file directly in Excel can go wrong in small but annoying ways — leading zeros dropped from codes, dates reformatted incorrectly, or commas inside a field splitting it into the wrong columns. Converting CSV to a proper Excel file up front avoids those surprises.

## When to convert CSV to Excel

- You received a data export as CSV and need to work with it properly in Excel
- Leading zeros (like ZIP codes or ID numbers) keep disappearing when you open the raw CSV directly
- You want to apply Excel-specific formatting, filters, or formulas to the data
- You need to share the file with someone who expects a standard .xlsx spreadsheet, not a raw CSV

## How to convert CSV to Excel, step by step

1. Open the [CSV to Excel tool](/tools/document-office-tools/csv-to-excel).
2. Upload your CSV file.
3. Preview how the columns and rows are parsed.
4. Confirm the data lines up correctly.
5. Download the resulting XLSX file.

## Tips for avoiding common CSV pitfalls

- **Check delimiter consistency.** Most CSVs use commas, but some regional exports use semicolons — verify the preview looks right before downloading.
- **Watch text-formatted numbers.** Codes with leading zeros should stay as text in the converted file rather than being interpreted as numbers.
- **Review date columns closely**, since date formatting is one of the most common places CSV-to-Excel conversions can shift values unexpectedly.

## Common questions

**Will my data be reformatted automatically?**
The conversion preserves the raw values from the CSV as closely as possible — always check the preview for anything that looks auto-formatted in a way you didn't expect.

**Can I convert a CSV with thousands of rows?**
Yes — CSV to Excel conversion works the same regardless of row count, though very large files may take a moment longer to process.

**What if my CSV uses a different delimiter, like semicolons?**
Check the preview after upload; if columns look merged incorrectly, the file may use a non-comma delimiter that needs to be accounted for before converting.

Have a raw CSV to turn into a real spreadsheet? [Convert CSV to Excel for free →](/tools/document-office-tools/csv-to-excel)`,
    },
    {
        slug: "how-to-format-json-online-free",
        title: "How to Format and Prettify Messy JSON Online",
        excerpt:
            "A wall of minified JSON is nearly impossible to read. Here's how to format, indent, and validate JSON online, free, in seconds.",
        seoTitle: "How to Format JSON Online Free (Prettify & Validate) | Filego",
        seoDescription:
            "Format and prettify minified or messy JSON online for free. Instantly indent, validate syntax, and spot errors. Step-by-step guide.",
        category: "Document Guides",
        tags: ["json formatter", "prettify json", "developer tools"],
        toolLabel: "JSON Formatter",
        toolPath: "/tools/document-office-tools/json-formatter",
        content: `API responses, config files, and log output are often minified into a single dense line of JSON — technically valid, but unreadable at a glance. Formatting it adds indentation and line breaks back so you can actually see the structure and spot what's wrong.

## When you need to format JSON

- Debugging an API response that came back as one long, unreadable line
- Reviewing or editing a config file before committing it
- Spotting a syntax error (a missing comma or bracket) that's invisible in minified form
- Sharing readable JSON with a teammate instead of a wall of text

## How to format JSON online, step by step

1. Open the [JSON Formatter](/tools/document-office-tools/json-formatter).
2. Paste your raw or minified JSON.
3. The tool formats it with proper indentation and line breaks.
4. Check for any validation errors it flags.
5. Copy or download the formatted result.

## Tips for working with JSON faster

- **Use the formatter to catch syntax errors early** — a formatter that fails to parse your JSON is usually pointing at a real syntax problem, like a trailing comma or unmatched bracket.
- **Format before diffing.** If you're comparing two versions of a JSON payload, format both first with the [Text Compare Tool](/tools/document-office-tools/text-compare-tool) so differences aren't hidden by inconsistent whitespace.
- **Convert to CSV when you need a table view** — see [JSON to CSV](/tools/document-office-tools/json-to-csv) if you're trying to inspect array data in a spreadsheet instead.

## Common questions

**Will formatting change the actual data?**
No — formatting only adjusts whitespace and indentation for readability; the underlying data and structure stay identical.

**Can this catch invalid JSON?**
Yes — if the JSON can't be parsed, the formatter will flag it so you can find and fix the syntax issue.

**Can I minify JSON back down afterward?**
Once you've fixed and reviewed the structure, most JSON libraries and tools can re-minify it in one step when you're ready to ship it.

Have unreadable JSON to clean up? [Format your JSON for free →](/tools/document-office-tools/json-formatter)`,
    },
    {
        slug: "how-to-convert-json-to-csv-online-free",
        title: "How to Convert JSON to CSV Online for Free",
        excerpt:
            "API and export data usually comes as JSON, but spreadsheets need rows and columns. Here's how to convert JSON to CSV online, free.",
        seoTitle: "How to Convert JSON to CSV Online Free | Filego",
        seoDescription:
            "Convert structured JSON data into CSV format online for free. Turn API responses and exports into a spreadsheet-ready table.",
        category: "Document Guides",
        tags: ["json to csv", "convert json", "developer tools"],
        toolLabel: "JSON to CSV",
        toolPath: "/tools/document-office-tools/json-to-csv",
        content: `JSON is the standard format for API responses and data exports, but it's not built for scanning through in a spreadsheet. Converting it to CSV turns nested objects and arrays into flat rows and columns you can sort, filter, and share with anyone, technical or not.

## When you need JSON to CSV conversion

- Turning an API response into a spreadsheet for non-technical teammates to review
- Importing exported JSON data into a tool that only accepts CSV
- Quickly eyeballing a large array of records in table form instead of nested brackets
- Preparing data for a report or dashboard tool that expects tabular input

## How to convert JSON to CSV, step by step

1. Open the [JSON to CSV tool](/tools/document-office-tools/json-to-csv).
2. Paste or upload your JSON data.
3. The tool maps the fields into columns and rows.
4. Preview the resulting table to confirm the structure looks right.
5. Download the CSV file.

## Tips for a clean conversion

- **Flatten deeply nested JSON first if possible.** Very nested objects can produce awkward column names in CSV — simpler, flatter JSON converts more cleanly.
- **Validate the JSON first.** If the conversion fails or looks wrong, run it through the [JSON Formatter](/tools/document-office-tools/json-formatter) first to catch syntax issues.
- **Check array fields carefully** — arrays inside JSON objects don't map perfectly to single CSV cells, so review how they're represented in the output.

## Common questions

**Does this work with arrays of objects?**
Yes — an array of similarly structured objects converts cleanly, with each object becoming one row.

**What happens to deeply nested fields?**
They're typically flattened into dot-notation column names or stringified, depending on the structure — review the preview to confirm it matches what you need.

**Can I convert the CSV back to JSON later?**
Most spreadsheet and data tools can re-export CSV as JSON if you need to reverse the process later.

Need your JSON data as a spreadsheet? [Convert JSON to CSV for free →](/tools/document-office-tools/json-to-csv)`,
    },
    {
        slug: "how-to-format-xml-online-free",
        title: "How to Format and Validate XML Online for Free",
        excerpt:
            "Unformatted XML is dense and error-prone to read by eye. Here's how to format, indent, and validate XML online, free.",
        seoTitle: "How to Format XML Online Free (Prettify & Validate) | Filego",
        seoDescription:
            "Format and validate XML content online for free. Add proper indentation, spot syntax errors, and read complex documents easily.",
        category: "Document Guides",
        tags: ["xml formatter", "validate xml", "developer tools"],
        toolLabel: "XML Formatter",
        toolPath: "/tools/document-office-tools/xml-formatter",
        content: `XML documents from APIs, exports, or config systems are often generated as a single unbroken string — technically correct, but painful to read or debug by hand. Formatting adds indentation back so nested tags and attributes are actually legible.

## When you need to format XML

- Debugging an XML API response that came back as one dense line
- Reviewing a configuration file before making changes
- Checking whether an XML document is well-formed before feeding it into another system
- Making a document readable enough to share with a teammate

## How to format XML online, step by step

1. Open the [XML Formatter](/tools/document-office-tools/xml-formatter).
2. Paste your raw XML content.
3. The tool indents and structures it for readability.
4. Check for any validation errors flagged in the process.
5. Copy or download the formatted result.

## Tips for working with XML

- **Let the validator catch mismatched tags.** An unclosed or mismatched tag is one of the most common XML errors, and formatting will usually surface it immediately.
- **Convert to JSON if you need to work with it in code** — see [XML to JSON](/tools/document-office-tools/xml-to-json) for a more code-friendly structure.
- **Format before comparing two versions** of an XML file using the [Text Compare Tool](/tools/document-office-tools/text-compare-tool), so whitespace differences don't obscure the real changes.

## Common questions

**Will formatting change the actual XML data?**
No — only whitespace and indentation change; the tags, attributes, and content stay the same.

**Can this validate whether my XML is well-formed?**
Yes — if the document has a structural problem, like a mismatched tag, the formatter will flag it.

**Does this validate against a specific schema (XSD)?**
This checks that the XML itself is well-formed; it doesn't validate against a custom schema definition.

Have XML that's hard to read? [Format your XML for free →](/tools/document-office-tools/xml-formatter)`,
    },
    {
        slug: "how-to-convert-xml-to-json-online-free",
        title: "How to Convert XML to JSON Online for Free",
        excerpt:
            "Working with XML in modern code is often more painful than it needs to be. Here's how to convert XML into JSON online, free.",
        seoTitle: "How to Convert XML to JSON Online Free | Filego",
        seoDescription:
            "Convert XML documents into JSON format online for free. Get a structure that's easier to work with in modern code and APIs.",
        category: "Document Guides",
        tags: ["xml to json", "convert xml", "developer tools"],
        toolLabel: "XML to JSON",
        toolPath: "/tools/document-office-tools/xml-to-json",
        content: `Plenty of legacy systems and APIs still return data as XML, but most modern code, especially JavaScript and web APIs, is built around JSON. Converting XML to JSON makes that data far easier to parse, manipulate, and pass around in current tooling.

## When you need XML to JSON conversion

- Integrating a legacy XML API response into a modern JavaScript or web application
- Making an XML config or data file easier to work with in code that expects JSON
- Simplifying a deeply nested XML document into a more code-friendly structure
- Preparing XML data to be consumed by a tool or library that only accepts JSON

## How to convert XML to JSON, step by step

1. Open the [XML to JSON tool](/tools/document-office-tools/xml-to-json).
2. Paste or upload your XML content.
3. The tool converts the tags, attributes, and content into JSON structure.
4. Preview the result to confirm the mapping looks correct.
5. Copy or download the JSON output.

## Tips for a clean conversion

- **Validate the XML first.** If the source XML isn't well-formed, run it through the [XML Formatter](/tools/document-office-tools/xml-formatter) first to catch and fix errors.
- **Review how attributes are represented.** XML attributes don't have a single universal JSON equivalent — check the output convention matches what your code expects.
- **Watch for repeated tags.** Repeated sibling tags in XML typically become an array in JSON — confirm that's reflected correctly in the result.

## Common questions

**Do XML attributes convert cleanly to JSON?**
Yes, though the exact representation (as a nested key or a prefixed field) depends on the conversion convention used — check the preview against what your code expects.

**Will nested XML elements be preserved?**
Yes — nested structure carries over into nested JSON objects and arrays.

**Can I convert the JSON back to XML later?**
Most JSON-to-XML libraries can reverse the process if you need to send the data back to an XML-based system later.

Need your XML data in a modern format? [Convert XML to JSON for free →](/tools/document-office-tools/xml-to-json)`,
    },
    {
        slug: "how-to-convert-markdown-to-html-online-free",
        title: "How to Convert Markdown to HTML Online for Free",
        excerpt:
            "Writing in Markdown is fast, but you need real HTML to publish it. Here's how to convert Markdown into clean HTML online, free.",
        seoTitle: "How to Convert Markdown to HTML Online Free | Filego",
        seoDescription:
            "Convert Markdown files or text into clean HTML online for free. Publish-ready output for blogs, emails, and websites. Step-by-step guide.",
        category: "Document Guides",
        tags: ["markdown to html", "convert markdown", "developer tools"],
        toolLabel: "Markdown to HTML",
        toolPath: "/tools/document-office-tools/markdown-to-html",
        content: `Markdown is a fast way to write structured content — headings, lists, links, and bold text without touching a mouse. But to actually publish it on a website, in an email, or in a CMS that expects markup, you need real HTML. Converting handles that translation instantly.

## When you need Markdown to HTML conversion

- Publishing a README or docs page written in Markdown to a website that renders HTML
- Turning Markdown notes into formatted HTML for an email newsletter
- Pasting Markdown content into a CMS or editor that only accepts HTML
- Generating clean markup from a Markdown draft before further styling

## How to convert Markdown to HTML, step by step

1. Open the [Markdown to HTML tool](/tools/document-office-tools/markdown-to-html).
2. Paste your Markdown content.
3. The tool converts it into HTML output.
4. Preview the rendered result to confirm formatting looks right.
5. Copy or download the HTML.

## Tips for a clean conversion

- **Check links and images.** Markdown links and image syntax should convert to proper \`<a>\` and \`<img>\` tags — verify the paths still resolve correctly in the new context.
- **Review heading levels.** Markdown heading shorthand (\`#\`, \`##\`) maps directly to HTML heading tags — make sure the hierarchy still makes sense on the destination page.
- **Convert the other direction if needed** — see [HTML to Markdown](/tools/document-office-tools/html-to-markdown) if you're starting from HTML and want a simpler Markdown source instead.

## Common questions

**Will code blocks and formatting be preserved?**
Yes — standard Markdown elements like code blocks, bold, italics, and lists convert into their HTML equivalents.

**Can I paste a full Markdown file, not just a snippet?**
Yes — paste as much content as you need converted in one pass.

**Does the output include full HTML page structure (like \`<html>\` and \`<body>\`)?**
The conversion focuses on the content markup itself, which you can drop into an existing page template or wrap with your own document structure.

Have Markdown that needs to become real HTML? [Convert Markdown to HTML for free →](/tools/document-office-tools/markdown-to-html)`,
    },
    {
        slug: "how-to-convert-html-to-markdown-online-free",
        title: "How to Convert HTML to Markdown Online for Free",
        excerpt:
            "HTML markup is noisy to write and read by hand. Here's how to turn an HTML page or snippet into clean Markdown online, free.",
        seoTitle: "How to Convert HTML to Markdown Online Free | Filego",
        seoDescription:
            "Convert HTML content into clean, readable Markdown online for free. Great for docs, notes, and content migration. Step-by-step guide.",
        category: "Document Guides",
        tags: ["html to markdown", "convert html", "developer tools"],
        toolLabel: "HTML to Markdown",
        toolPath: "/tools/document-office-tools/html-to-markdown",
        content: `HTML is verbose — full of tags and attributes that make it hard to read or edit directly. If you just need the content in a simple, readable, and easy-to-edit format, converting it to Markdown strips away the markup noise while keeping the structure intact.

## When you need HTML to Markdown conversion

- Migrating content from a web page into a Markdown-based docs system or static site generator
- Turning a copied HTML snippet into clean, editable text for notes
- Simplifying HTML email content into a plain, structured format
- Preparing web content to be version-controlled as readable Markdown files

## How to convert HTML to Markdown, step by step

1. Open the [HTML to Markdown tool](/tools/document-office-tools/html-to-markdown).
2. Paste your HTML content.
3. The tool converts tags and structure into Markdown syntax.
4. Preview the result to confirm it reads the way you expect.
5. Copy or download the Markdown output.

## Tips for a clean conversion

- **Strip unnecessary wrapper markup first** (like styling divs or scripts) if the source HTML is heavy with non-content elements, so the Markdown output stays focused on the actual content.
- **Check tables and nested lists.** These are the elements most likely to need a small manual cleanup after conversion, since Markdown's table and list syntax is more limited than HTML's.
- **Convert back if needed** — use [Markdown to HTML](/tools/document-office-tools/markdown-to-html) if you need to round-trip the content back into markup later.

## Common questions

**Will links and images convert correctly?**
Yes — standard \`<a>\` and \`<img>\` tags convert into Markdown link and image syntax.

**What happens to inline styles or custom classes?**
Markdown has no equivalent for inline styling, so purely visual attributes are dropped, leaving just the structural content.

**Can I convert an entire web page's HTML at once?**
Yes — paste as much HTML as you need converted in a single pass.

Need HTML turned into clean, editable Markdown? [Convert HTML to Markdown for free →](/tools/document-office-tools/html-to-markdown)`,
    },
    {
        slug: "how-to-compare-two-text-files-online-free",
        title: "How to Compare Two Text Files and Spot Differences Online",
        excerpt:
            "Trying to find what changed between two versions of a document by eye is slow and error-prone. Here's how to compare text online, free, and see every difference highlighted.",
        seoTitle: "How to Compare Two Text Files Online Free | Filego",
        seoDescription:
            "Compare two blocks of text or files online for free and instantly see every difference highlighted, line by line. Step-by-step guide.",
        category: "Document Guides",
        tags: ["text compare", "diff tool", "developer tools"],
        toolLabel: "Text Compare Tool",
        toolPath: "/tools/document-office-tools/text-compare-tool",
        content: `Two versions of a document, a config file, or a block of code can look nearly identical at a glance — until one tiny change causes a real problem. Comparing them side by side, with differences highlighted automatically, finds that change in seconds instead of minutes of manual scanning.

## When you need to compare text

- Checking what changed between two drafts of a document or contract
- Spotting the difference between two versions of a config file before deploying
- Reviewing edits a teammate made to a shared document
- Comparing two JSON or XML payloads after formatting them consistently

## How to compare two text blocks, step by step

1. Open the [Text Compare Tool](/tools/document-office-tools/text-compare-tool).
2. Paste the first version of the text into one panel.
3. Paste the second version into the other panel.
4. The tool highlights every line that was added, removed, or changed.
5. Review the differences directly in the browser.

## Tips for a cleaner comparison

- **Format structured data first.** If you're comparing JSON or XML, run both through the [JSON Formatter](/tools/document-office-tools/json-formatter) or [XML Formatter](/tools/document-office-tools/xml-formatter) first so inconsistent whitespace doesn't create false differences.
- **Compare smaller sections when the diff is large.** If the whole document shows extensive changes, narrowing to one section at a time makes the real edits easier to spot.
- **Double-check whitespace-only differences** — sometimes a highlighted change is just a trailing space or different line ending, not a meaningful edit.

## Common questions

**Does this compare whole files or just pasted text?**
You paste the text you want compared directly — copy the contents of a file in if you're comparing two documents.

**Will it catch small changes, like a single word?**
Yes — the comparison highlights differences down to the specific words or characters that changed, not just whole lines.

**Can I compare code snippets, not just plain text?**
Yes — it works on any plain text content, including code, config files, and structured data formats.

Need to find what changed between two versions? [Compare your text for free →](/tools/document-office-tools/text-compare-tool)`,
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
