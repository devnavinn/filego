// prisma/seed-developer-tool-guides.ts
//
// Seeds one high-intent, SEO-oriented guide per Developer tool into the
// `blog_posts` table (Neon/Postgres via Prisma). Mirrors
// prisma/seed-tool-guides.ts, but for the Developer Tools category
// (JWT, URL encoding, regex, UUIDs, timestamps, SQL/code formatting,
// QR codes, and website-to-markdown extraction).
//
// Run with: npm run seed:developer-guides

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
        slug: "how-to-decode-a-jwt-token-online",
        title: "How to Decode a JWT Token Online for Free",
        excerpt:
            "Need to see what's actually inside a JWT — without writing code? Here's how to decode a JSON Web Token online, free, in seconds.",
        seoTitle: "How to Decode a JWT Token Online Free | Filego",
        seoDescription:
            "Decode a JWT (JSON Web Token) online for free and inspect its header and payload. No code required. Step-by-step guide.",
        category: "Developer Guides",
        tags: ["jwt decoder", "json web token", "developer tools"],
        toolLabel: "JWT Decoder",
        toolPath: "/tools/developer-tools/jwt-decoder",
        content: `A JWT looks like a long, meaningless string of characters, but it actually encodes a header and a payload — often containing useful debugging information like a user ID, expiry time, or role. Decoding it lets you see exactly what's inside without writing a single line of code.

## When you need to decode a JWT

- Debugging why an API call is failing by checking the token's claims
- Confirming a token hasn't expired by checking its expiry (\`exp\`) field
- Verifying a token contains the fields your application expects
- Inspecting a token from a bug report or support ticket

## How to decode a JWT, step by step

1. Open the [JWT Decoder](/tools/developer-tools/jwt-decoder).
2. Paste the JWT token.
3. The tool splits it into its header and payload and displays both as readable JSON.
4. Review the claims — issuer, subject, expiry, and any custom fields.

## Tips for working with JWTs

- **Decoding isn't the same as verifying.** Anyone can decode a JWT and read its contents — decoding doesn't confirm the token is genuine or hasn't been tampered with, which requires checking its signature against the issuer's secret or key.
- **Check the \`exp\` field for expiry issues.** A token that's failing authentication is very often simply expired — use the [Timestamp Converter](/tools/developer-tools/timestamp-converter) to turn that Unix timestamp into a readable date.
- **Never paste a production token from a real user session into a third-party tool** you don't trust — treat tokens as sensitive credentials.

## Common questions

**Can decoding a JWT reveal a secret or password?**
No — a JWT's payload only contains whatever claims the issuer put in it; it doesn't expose the signing secret.

**Does this verify whether the token is valid?**
No — this decodes and displays the token's contents. Verifying a signature requires the issuer's secret or public key, which happens server-side.

**Why does the payload contain a timestamp instead of a date?**
JWTs store dates as Unix timestamps for compactness — convert them to a readable date with the [Timestamp Converter](/tools/developer-tools/timestamp-converter).

Have a token you need to inspect? [Decode a JWT for free →](/tools/developer-tools/jwt-decoder)`,
    },
    {
        slug: "how-to-url-encode-and-decode-online",
        title: "How to URL Encode and Decode Text Online",
        excerpt:
            "Special characters break URLs unless they're properly encoded. Here's how to URL encode or decode text online, free, in seconds.",
        seoTitle: "How to URL Encode and Decode Online Free | Filego",
        seoDescription:
            "URL encode or decode text online for free. Safely handle special characters in query strings and links. Step-by-step guide.",
        category: "Developer Guides",
        tags: ["url encode", "url decode", "developer tools"],
        toolLabel: "URL Encoder/Decoder",
        toolPath: "/tools/developer-tools/url-encoder-decoder",
        content: `URLs can only safely contain a limited set of characters — spaces, ampersands, and many symbols have to be encoded into a percent-escaped format, or they'll break the link or get misinterpreted. URL encoding handles that conversion, and decoding reverses it so you can read the original value.

## When you need URL encoding or decoding

- Building a query string that includes spaces, symbols, or special characters
- Reading a value out of a URL that's been encoded (like \`%20\` for a space)
- Debugging a broken link caused by an unencoded special character
- Preparing a parameter value to safely pass through a URL

## How to URL encode or decode, step by step

1. Open the [URL Encoder/Decoder](/tools/developer-tools/url-encoder-decoder).
2. Paste the text or URL you want to encode, or the encoded string you want to decode.
3. Choose encode or decode.
4. Copy the result.

## Tips for working with URL encoding

- **Encode individual parameter values, not the whole URL**, when building a query string — encoding the full URL including \`http://\` and slashes will break it.
- **Watch for double-encoding.** Encoding an already-encoded string turns \`%20\` into \`%2520\`, which is usually not what you want — decode first if you're unsure of the current state.
- **Spaces can appear as \`%20\` or \`+\`** depending on context — both are valid in different parts of a URL, so check which your system expects.

## Common questions

**What characters need to be URL encoded?**
Spaces, symbols like \`&\`, \`?\`, \`#\`, \`%\`, and non-ASCII characters generally need encoding to safely appear in a URL.

**Why does my decoded text look wrong?**
It may have been encoded more than once — try decoding again, or check the original encoding was done correctly.

**Is URL encoding the same as Base64?**
No — they're different encoding schemes. URL encoding uses percent escapes for URL-unsafe characters; Base64 represents binary data as text. See [Base64 Encode/Decode](/tools/security-tools/base64-encode-decode) if you need that instead.

Have a URL with special characters to handle? [URL encode or decode for free →](/tools/developer-tools/url-encoder-decoder)`,
    },
    {
        slug: "how-to-test-a-regular-expression-online",
        title: "How to Test a Regular Expression Online for Free",
        excerpt:
            "Stop guessing whether your regex actually works. Here's how to test a regular expression against sample text online, free, instantly.",
        seoTitle: "How to Test a Regex Online Free | Filego",
        seoDescription:
            "Test a regular expression against sample text online for free. See matches highlighted instantly without writing test code.",
        category: "Developer Guides",
        tags: ["regex tester", "regular expression", "developer tools"],
        toolLabel: "Regex Tester",
        toolPath: "/tools/developer-tools/regex-tester",
        content: `Writing a regular expression that works exactly as intended usually takes a few tries — an easy character or quantifier mistake can silently match too much, too little, or nothing at all. Testing it against real sample text before dropping it into code catches those mistakes immediately.

## When you need to test a regex

- Confirming a pattern matches exactly the text you expect, and nothing else
- Debugging why a regex isn't matching in your actual code
- Building a validation pattern (like for emails or phone numbers) before using it
- Understanding what an unfamiliar regex from someone else's code actually matches

## How to test a regular expression, step by step

1. Open the [Regex Tester](/tools/developer-tools/regex-tester).
2. Type or paste your regular expression.
3. Paste sample text to test it against.
4. Matches are highlighted directly in the text as you adjust the pattern.

## Tips for writing better regex

- **Test against both matching and non-matching examples.** A pattern that correctly matches valid input but also matches invalid input isn't actually doing its job.
- **Watch out for greedy quantifiers.** A pattern like \`.*\` often matches far more than intended — testing against real text quickly reveals over-matching.
- **Build the pattern incrementally.** Start with a simple version, confirm it matches, then add complexity piece by piece rather than writing the whole thing at once.

## Common questions

**Why does my regex work here but not in my code?**
Different programming languages sometimes have slightly different regex syntax or flags — double-check the flavor your language expects.

**What do the highlighted matches mean?**
Each highlighted section is a portion of the text your pattern matched — if it's highlighting the wrong (or no) text, the pattern needs adjusting.

**Can I test multiple patterns against the same text?**
Yes — swap out the pattern and re-check the same sample text as many times as needed.

Need to confirm your regex actually works? [Test your regex for free →](/tools/developer-tools/regex-tester)`,
    },
    {
        slug: "how-to-generate-a-uuid-online",
        title: "How to Generate a UUID Online for Free",
        excerpt:
            "Need a guaranteed-unique identifier for a database record, API key, or object? Here's how to generate a UUID online, free, instantly.",
        seoTitle: "How to Generate a UUID Online Free | Filego",
        seoDescription:
            "Generate a random UUID (v4) online for free — a unique identifier for databases, APIs, and objects. Step-by-step guide.",
        category: "Developer Guides",
        tags: ["uuid generator", "unique identifier", "developer tools"],
        toolLabel: "UUID Generator",
        toolPath: "/tools/developer-tools/uuid-generator",
        content: `A UUID (universally unique identifier) is a 128-bit value designed so that generating one anywhere, at any time, has a vanishingly small chance of colliding with another. That makes it a safe default for database record IDs, API keys, session tokens, and anywhere else you need a unique value without coordinating with a central counter.

## When you need a UUID

- Assigning a unique ID to a new database record
- Generating a temporary identifier for a session, request, or object
- Creating a placeholder key for testing an API or data structure
- Naming a file or resource where a guaranteed-unique name matters

## How to generate a UUID, step by step

1. Open the [UUID Generator](/tools/developer-tools/uuid-generator).
2. A random UUID is generated instantly.
3. Copy it, or generate another if you need more than one.

## Tips for working with UUIDs

- **UUIDs are unique, not sequential.** Don't expect them to sort in creation order — if you need that, look at a sortable ID scheme designed for it instead.
- **Use a fresh UUID per record**, not a reused or hardcoded one, to get the collision-resistance benefit that makes them useful in the first place.
- **UUIDs are safe to expose publicly** in most cases, since they don't reveal sequence or count information the way an incrementing ID might.

## Common questions

**Can two generated UUIDs ever collide?**
It's technically possible but astronomically unlikely with standard UUID generation — collisions aren't a practical concern for virtually any real-world use case.

**What format does the UUID come in?**
The standard UUID format: 32 hexadecimal characters grouped into five sections separated by hyphens.

**Can I generate more than one at a time?**
Generate as many as you need, one at a time, copying each as you go.

Need a unique identifier right now? [Generate a UUID for free →](/tools/developer-tools/uuid-generator)`,
    },
    {
        slug: "how-to-convert-unix-timestamp-to-date-online",
        title: "How to Convert a Unix Timestamp to a Readable Date Online",
        excerpt:
            "Unix timestamps are a string of digits, not something you can read at a glance. Here's how to convert one into a real date online, free.",
        seoTitle: "How to Convert Unix Timestamp to Date Online Free | Filego",
        seoDescription:
            "Convert a Unix timestamp into a readable date and time online for free, or convert a date back into a timestamp. Step-by-step guide.",
        category: "Developer Guides",
        tags: ["timestamp converter", "unix timestamp", "developer tools"],
        toolLabel: "Timestamp Converter",
        toolPath: "/tools/developer-tools/timestamp-converter",
        content: `A Unix timestamp — a number like \`1735689600\` — represents a specific moment in time as the number of seconds since January 1, 1970. It's compact and unambiguous for computers, but meaningless to read at a glance. Converting it to a normal date makes it usable for humans.

## When you need to convert a timestamp

- Debugging an API response or database record that stores dates as Unix timestamps
- Checking whether a token or session has actually expired, based on its expiry timestamp
- Converting a readable date into a timestamp to use in code or a query
- Making sense of log entries that record time as raw timestamps

## How to convert a timestamp, step by step

1. Open the [Timestamp Converter](/tools/developer-tools/timestamp-converter).
2. Paste the Unix timestamp you want to convert.
3. The tool displays it as a readable date and time.
4. To go the other way, enter a date and get its Unix timestamp.

## Tips for working with timestamps

- **Check whether it's in seconds or milliseconds.** Unix timestamps are traditionally in seconds, but some systems (like JavaScript's \`Date.now()\`) use milliseconds — a timestamp that converts to a date far in the past or future is often just off by that factor of 1000.
- **Account for time zones.** A timestamp itself is timezone-independent, but the readable date it converts to depends on which timezone you're viewing it in.
- **Use this alongside a JWT decoder** — a decoded token's \`exp\` and \`iat\` fields are Unix timestamps; see the [JWT Decoder](/tools/developer-tools/jwt-decoder) to extract them first.

## Common questions

**Why is my converted date wildly wrong?**
The timestamp is likely in a different unit than expected — check whether it should be treated as seconds or milliseconds.

**Does the conversion account for my local time zone?**
Readable dates are typically shown relative to a specific timezone reference — check which one is displayed if precise timezone matters for your use case.

**Can I convert a date back into a timestamp?**
Yes — enter a date and time to get its corresponding Unix timestamp.

Need to make sense of a Unix timestamp? [Convert it for free →](/tools/developer-tools/timestamp-converter)`,
    },
    {
        slug: "how-to-format-sql-queries-online",
        title: "How to Format and Beautify SQL Queries Online",
        excerpt:
            "A dense, unformatted SQL query is hard to read and easy to misjudge. Here's how to format SQL for readability online, free.",
        seoTitle: "How to Format SQL Queries Online Free | Filego",
        seoDescription:
            "Format and beautify SQL queries online for free. Add proper indentation and line breaks for readability. Step-by-step guide.",
        category: "Developer Guides",
        tags: ["sql formatter", "beautify sql", "developer tools"],
        toolLabel: "SQL Formatter",
        toolPath: "/tools/developer-tools/sql-formatter",
        content: `A SQL query written as one dense line — common in generated queries, logs, or minified code — is hard to read and easy to misjudge, especially with several joins and conditions packed together. Formatting it adds indentation and line breaks so the query's structure is actually visible.

## When you need to format SQL

- Reviewing a generated or logged query that's hard to read as one line
- Cleaning up a query before sharing it with a teammate for review
- Understanding a complex query with multiple joins and subqueries
- Preparing SQL for documentation or a code review

## How to format SQL, step by step

1. Open the [SQL Formatter](/tools/developer-tools/sql-formatter).
2. Paste your raw SQL query.
3. The tool formats it with clear indentation and line breaks.
4. Copy the formatted result.

## Tips for readable SQL

- **Check join and condition alignment** in the formatted output — this is usually where a dense query becomes much easier to reason about once broken into clear lines.
- **Format before debugging a complex query.** It's much easier to spot a misplaced condition or missing join once the structure is visible line by line.
- **Keep a formatted copy for documentation**, since a properly indented query is far easier for a teammate to review later.

## Common questions

**Will formatting change what the query does?**
No — formatting only adjusts whitespace and indentation; the query logic and result stay identical.

**Does this work for any SQL dialect?**
Formatting focuses on general SQL structure and indentation; dialect-specific syntax should still work, though highly vendor-specific extensions may format less predictably.

**Can I format a very long query with many joins?**
Yes — longer, more complex queries benefit the most from formatting, since that's exactly where readability matters most.

Have a dense SQL query to clean up? [Format your SQL for free →](/tools/developer-tools/sql-formatter)`,
    },
    {
        slug: "how-to-beautify-code-online-free",
        title: "How to Beautify and Format Code Online for Free",
        excerpt:
            "Minified or inconsistently formatted code is painful to read. Here's how to beautify code online, free, in any common language.",
        seoTitle: "How to Beautify Code Online Free | Filego",
        seoDescription:
            "Beautify and format minified or messy code online for free. Add proper indentation for readability. Step-by-step guide.",
        category: "Developer Guides",
        tags: ["code beautifier", "format code", "developer tools"],
        toolLabel: "Code Beautifier",
        toolPath: "/tools/developer-tools/code-beautifier",
        content: `Minified code, copy-pasted snippets, or code from an inconsistent source can end up dense and hard to read — no consistent indentation, everything crammed onto a few lines. Beautifying it restores clear structure so you can actually read and understand it.

## When you need to beautify code

- Reading minified JavaScript or CSS pulled from a live website
- Cleaning up a snippet copied from a chat, email, or forum post with lost formatting
- Making inconsistently indented code from multiple contributors uniform
- Preparing a code snippet to share cleanly in documentation or a report

## How to beautify code, step by step

1. Open the [Code Beautifier](/tools/developer-tools/code-beautifier).
2. Paste the code you want to format.
3. The tool adds consistent indentation and line breaks.
4. Copy the cleaned-up result.

## Tips for working with beautified code

- **Beautify before debugging minified code** pulled from a production site — it's much easier to trace logic once it's properly indented.
- **Check for consistent style afterward** if you're merging code from multiple sources, since beautifying standardizes formatting but won't fix stylistic choices like variable naming.
- **Keep the original if you need it exactly as-is** for something like a checksum comparison — beautifying changes whitespace, which would affect an exact-match comparison.

## Common questions

**Will beautifying change what the code does?**
No — only whitespace and indentation change; the logic and behavior of the code stay the same.

**Does this work for any programming language?**
It handles common web and general-purpose languages well; highly specialized or unusual syntax may format less predictably.

**Is this the same as formatting SQL?**
For SQL specifically, the [SQL Formatter](/tools/developer-tools/sql-formatter) is tuned for query structure; this tool is for general-purpose code.

Have messy code to clean up? [Beautify your code for free →](/tools/developer-tools/code-beautifier)`,
    },
    {
        slug: "how-to-generate-a-qr-code-online-free",
        title: "How to Generate a QR Code Online for Free",
        excerpt:
            "Turn a link, text, or contact info into a scannable QR code in seconds. Here's how to generate one online, free.",
        seoTitle: "How to Generate a QR Code Online Free | Filego",
        seoDescription:
            "Generate a QR code from a URL or text online for free. Download it as an image for print or digital use. Step-by-step guide.",
        category: "Developer Guides",
        tags: ["qr code generator", "generate qr code", "developer tools"],
        toolLabel: "QR Code Generator",
        toolPath: "/tools/developer-tools/qr-code-generator",
        content: `A QR code turns a link, block of text, or piece of contact info into a pattern that any phone camera can scan instantly — no typing required. It's an easy way to bridge printed material and digital content, from a poster linking to a website to a business card linking to a contact card.

## When a QR code is useful

- Linking a printed flyer, poster, or menu to a website or online form
- Sharing Wi-Fi credentials or contact details without typing them out
- Adding a scannable link to a product package or business card
- Making a URL easy to open on a phone from a screen or printed page

## How to generate a QR code, step by step

1. Open the [QR Code Generator](/tools/developer-tools/qr-code-generator).
2. Enter the URL or text you want the QR code to contain.
3. Preview the generated QR code.
4. Download it as an image to use in print or digital designs.

## Tips for a QR code that scans reliably

- **Keep enough contrast** between the QR code and its background — a code printed too small or on a low-contrast background may fail to scan.
- **Test it before printing widely.** Scan the generated QR code with a phone camera to confirm it opens the correct link before using it on printed material.
- **Keep the underlying link stable.** If the destination URL changes or is deleted later, the printed QR code will point to a dead link.

## Common questions

**Can a QR code contain more than just a URL?**
Yes — QR codes can encode plain text, contact details, Wi-Fi credentials, and other short data, not just links.

**Is there a size limit for the data in a QR code?**
QR codes can hold a fair amount of data, but shorter content (like a URL) produces a simpler, more reliably scannable code than very long text.

**Can I scan a QR code with this same site?**
Yes — use the [QR Code Scanner](/tools/developer-tools/qr-code-scanner) to read a QR code's contents from an image.

Need a scannable QR code? [Generate one for free →](/tools/developer-tools/qr-code-generator)`,
    },
    {
        slug: "how-to-scan-a-qr-code-online-from-an-image",
        title: "How to Scan a QR Code from an Image Online",
        excerpt:
            "Have a QR code in a photo or screenshot but no way to scan it with a camera? Here's how to decode it online, free.",
        seoTitle: "How to Scan a QR Code from an Image Online Free | Filego",
        seoDescription:
            "Decode a QR code from an uploaded image online for free — no phone camera needed. Step-by-step guide.",
        category: "Developer Guides",
        tags: ["qr code scanner", "decode qr code", "developer tools"],
        toolLabel: "QR Code Scanner",
        toolPath: "/tools/developer-tools/qr-code-scanner",
        content: `Sometimes a QR code shows up in a screenshot, a saved image, or a document rather than in front of a physical camera — a slide from a presentation, a photo someone sent you, or a code embedded in a PDF. Scanning it from the image file directly decodes its contents without needing a phone camera pointed at it.

## When you need to scan a QR code from an image

- Decoding a QR code that appears in a screenshot or saved photo
- Reading a QR code embedded in a document or presentation slide
- Checking what a QR code links to before scanning it with your own device
- Extracting a QR code's contents when you don't have physical access to scan it

## How to scan a QR code from an image, step by step

1. Open the [QR Code Scanner](/tools/developer-tools/qr-code-scanner).
2. Upload the image containing the QR code.
3. The tool detects and decodes the QR code automatically.
4. View the decoded link or text.

## Tips for reliable scanning

- **Use a clear, uncropped image of the QR code** — a blurry, tilted, or partially cut-off code is much harder to decode correctly.
- **Check the decoded link before opening it**, especially from a QR code you didn't generate yourself, since QR codes can point anywhere.
- **Crop tightly around the code first** if the image has a lot of surrounding content, using the [Image Cropper](/tools/image-tools/image-cropper), to help with detection.

## Common questions

**What if the tool can't detect a QR code in my image?**
Try a clearer, higher-resolution image with the QR code more prominently in frame, without heavy blur or extreme angles.

**Is it safe to scan a QR code from an untrusted source?**
Reviewing the decoded content before opening any link is a good habit, regardless of how the code was scanned.

**Can I generate my own QR code with this site too?**
Yes — use the [QR Code Generator](/tools/developer-tools/qr-code-generator) to create one from a link or text.

Have a QR code you can't scan with a camera? [Decode it for free →](/tools/developer-tools/qr-code-scanner)`,
    },
    {
        slug: "how-to-convert-a-website-to-markdown-online",
        title: "How to Convert a Web Page into Clean Markdown",
        excerpt:
            "Need a web page's content as clean, structured text instead of a browser tab? Here's how to convert it to Markdown online, free.",
        seoTitle: "How to Convert a Website to Markdown Online Free | Filego",
        seoDescription:
            "Fetch a web page and convert its content into clean Markdown online for free. Great for notes, documentation, and AI prompts.",
        category: "Developer Guides",
        tags: ["website to markdown", "convert webpage", "developer tools"],
        toolLabel: "Website to Markdown",
        toolPath: "/tools/developer-tools/website-to-markdown",
        content: `A web page's raw HTML is full of markup noise — navigation bars, ads, scripts, styling — that has nothing to do with its actual content. Converting a page to Markdown extracts just the readable content in a clean, structured, plain-text format that's easy to save, edit, or feed into another tool.

## When converting a website to Markdown helps

- Saving an article's content as clean notes instead of a bookmarked tab
- Preparing a web page's content to paste into a documentation system that uses Markdown
- Getting a page's text into a simple format to feed into an AI tool or script
- Archiving a page's content in a readable, portable text format

## How to convert a website to Markdown, step by step

1. Open the [Website to Markdown tool](/tools/developer-tools/website-to-markdown).
2. Paste the URL of the page you want to convert.
3. The tool fetches the page and converts its content into Markdown.
4. Copy or download the Markdown output.

## Tips for a cleaner conversion

- **Use the direct article or content URL** rather than a homepage or listing page, since those often contain more navigation and less actual content to extract.
- **Review the output for leftover navigation text.** Complex page layouts can occasionally include a sidebar or menu item along with the main content — a quick scan catches this.
- **Convert the result further if needed** — use [Markdown to HTML](/tools/document-office-tools/markdown-to-html) if you need it back in HTML form after editing.

## Common questions

**Does this work on any website?**
It works well on most standard article and content pages; sites that require login or heavily rely on JavaScript to render content may not convert as cleanly.

**Will images be included?**
The focus is on extracting readable text content; image handling depends on the page structure — check the output for how images are referenced.

**Can I edit the Markdown after converting?**
Yes — the output is plain Markdown text, fully editable in any text editor.

Need a web page's content as clean text? [Convert it to Markdown for free →](/tools/developer-tools/website-to-markdown)`,
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
