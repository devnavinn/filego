import {
    Archive,
    Code2,
    FileSpreadsheet,
    FileText,
    ImageIcon,
    Music4,
    ShieldCheck,
    Sparkles,
    Video,
    type LucideIcon,
} from "lucide-react"

export type ToolItem = {
    name: string
    slug: string
    shortDescription: string
    seoTitle?: string
    seoDescription?: string
}

export type ToolCategory = {
    id: string
    slug: string
    title: string
    description: string
    heroDescription: string
    accent: string
    seoTitle?: string
    seoDescription?: string
    tools: ToolItem[]
}

const createTool = (name: string, shortDescription: string): ToolItem => ({
    name,
    slug: name
        .toLowerCase()
        .replace(/\(ai\)/g, "ai")
        .replace(/[()]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    shortDescription,
    seoTitle: `${name} Tool – Free Online Converter & Utility`,
    seoDescription: `${name} tool for fast, secure, browser-based processing. Upload files, process instantly, and download results in seconds.`,
})

export const toolCategories: ToolCategory[] = [
    {
        id: "pdf",
        slug: "pdf-tools",
        title: "PDF Tools",
        description: "Conversion, editing, protection, and page-level utilities.",
        heroDescription:
            "Handle PDF conversion, editing, compression, page actions, and protection from one clean workspace.",
        accent: "from-teal-500/20 to-cyan-500/10",
        seoTitle: "PDF Tools – Merge, Split, Compress, Convert PDFs Online",
        seoDescription:
            "Use fast PDF tools to merge, split, compress, convert, watermark, protect, unlock, and organize PDF files online.",
        tools: [
            createTool("Edit PDF", "Add text, images, shapes, and drawings, then manage pages and export."),
            createTool("PDF Merge", "Combine multiple PDF files into one document."),
            createTool("PDF Split", "Split one PDF into separate pages or custom ranges."),
            createTool("PDF Compress", "Reduce PDF file size while keeping quality balanced."),
            createTool("PDF to Word", "Convert PDF files into editable Word documents."),
            createTool("Word to PDF", "Convert DOC or DOCX files into PDF format."),
            createTool("PDF to JPG", "Export PDF pages into JPG images."),
            createTool("JPG to PDF", "Convert JPG images into a PDF document."),
            createTool("PDF Watermark", "Add text or image watermarks to PDF files."),
            createTool("PDF Password Protect", "Secure PDF files with password protection."),
            createTool("PDF Unlock", "Remove restrictions from accessible PDF files."),
            createTool("PDF Page Numbering", "Add page numbers to PDF documents."),
            createTool("Rotate PDF", "Rotate PDF pages to the correct orientation."),
            createTool("Delete PDF Pages", "Remove selected pages from PDF files."),
            createTool("Extract PDF Pages", "Extract selected pages into a new PDF file."),
        ],
    },
    {
        id: "image",
        slug: "image-tools",
        title: "Image Tools",
        description: "Compression, resize, crop, format conversion, and AI enhancement.",
        heroDescription:
            "Optimize and transform images for e-commerce, design, marketing, and everyday asset workflows.",
        accent: "from-sky-500/20 to-indigo-500/10",
        seoTitle: "Image Tools – Compress, Resize, Convert, Crop Images Online",
        seoDescription:
            "Compress, resize, crop, convert, watermark, remove backgrounds, and enhance images online with fast browser-based tools.",
        tools: [
            createTool("Image Compressor", "Reduce image file size for web and sharing."),
            createTool("Image Resizer", "Resize images to exact dimensions quickly."),
            createTool("Image Cropper", "Crop images for banners, thumbnails, and product photos."),
            createTool("Background Remover", "Remove image backgrounds for clean transparent results."),
            createTool("PNG to JPG", "Convert PNG images into JPG format."),
            createTool("JPG to PNG", "Convert JPG images into PNG format."),
            createTool("WEBP to JPG", "Convert WEBP files into JPG format."),
            createTool("WEBP to PNG", "Convert WEBP files into PNG format."),
            createTool("SVG to PNG", "Convert SVG graphics into PNG images."),
            createTool("Image Watermark", "Add watermark text or logos to images."),
            createTool("Image Upscaler (AI)", "Enhance and upscale images with AI assistance."),
            createTool("Image Metadata Viewer", "Inspect EXIF and metadata information from images."),
        ],
    },
    {
        id: "office",
        slug: "document-office-tools",
        title: "Document & Office Tools",
        description: "Formatting, conversion, and structured text workflows.",
        heroDescription:
            "Handle office conversions, markup transforms, and text formatting tasks from one efficient toolkit.",
        accent: "from-amber-500/20 to-orange-500/10",
        seoTitle: "Document & Office Tools – CSV, JSON, XML, Markdown Utilities",
        seoDescription:
            "Convert CSV, Excel, JSON, XML, Markdown, and text formats online with practical office and developer-friendly tools.",
        tools: [
            createTool("Excel to CSV", "Convert Excel sheets into CSV files."),
            createTool("CSV to Excel", "Convert CSV files into Excel format."),
            createTool("JSON Formatter", "Format and prettify raw JSON instantly."),
            createTool("JSON to CSV", "Convert structured JSON into CSV format."),
            createTool("XML Formatter", "Format and validate XML content."),
            createTool("XML to JSON", "Convert XML data into JSON format."),
            createTool("Markdown to HTML", "Transform Markdown into HTML output."),
            createTool("HTML to Markdown", "Convert HTML into readable Markdown."),
            createTool("Text Compare Tool", "Compare two text blocks and highlight differences."),
        ],
    },
    {
        id: "video",
        slug: "video-tools",
        title: "Video Tools",
        description: "Quick editing, conversion, and social-ready exports.",
        heroDescription:
            "Process videos faster with browser-based trimming, conversion, compression, and export utilities.",
        accent: "from-violet-500/20 to-fuchsia-500/10",
        seoTitle: "Video Tools – Compress, Trim, Convert, Merge Videos Online",
        seoDescription:
            "Compress, trim, merge, convert, and extract media from video files online with fast and simple tools.",
        tools: [
            createTool("Video Compressor", "Reduce video file size for uploads and sharing."),
            createTool("Video to GIF", "Convert short videos into animated GIFs."),
            createTool("Video Trimmer", "Trim unwanted parts from video files."),
            createTool("Video Merger", "Combine multiple video clips into one file."),
            createTool("Extract Audio from Video", "Extract audio tracks from uploaded videos."),
            createTool("Video Converter (MP4, MOV, AVI)", "Convert videos between popular file formats."),
            createTool("Thumbnail Generator", "Capture thumbnails from video frames."),
        ],
    },
    {
        id: "audio",
        slug: "audio-tools",
        title: "Audio Tools",
        description: "Cut, merge, convert, compress, and record in-browser audio.",
        heroDescription:
            "Use fast browser-ready audio tools for recording, conversion, clipping, compression, and merging.",
        accent: "from-emerald-500/20 to-lime-500/10",
        seoTitle: "Audio Tools – Cut, Convert, Merge, Compress Audio Online",
        seoDescription:
            "Cut MP3 files, merge audio, convert formats, record voice, and compress sound files online.",
        tools: [
            createTool("MP3 Cutter", "Trim MP3 files to the exact section you need."),
            createTool("Audio Converter", "Convert audio files between popular formats."),
            createTool("Audio Merger", "Combine multiple audio files into one track."),
            createTool("Audio Compressor", "Reduce audio file size for storage and delivery."),
            createTool("Voice Recorder", "Record voice directly in the browser."),
            createTool("Volume Booster", "Increase audio loudness quickly."),
        ],
    },
    {
        id: "security",
        slug: "security-tools",
        title: "Security Tools",
        description: "Encoding, encryption, hashing, and password utilities.",
        heroDescription:
            "Generate hashes, encrypt content, create passwords, and inspect file integrity from one utility set.",
        accent: "from-rose-500/20 to-red-500/10",
        seoTitle: "Security Tools – Hash, Encrypt, Encode, Generate Passwords",
        seoDescription:
            "Use online security tools for SHA256, MD5, AES encryption, base64 encoding, checksums, and password generation.",
        tools: [
            createTool("SHA256 Generator", "Generate SHA256 hashes instantly."),
            createTool("MD5 Generator", "Create MD5 hashes for text or values."),
            createTool("Password Generator", "Generate secure random passwords."),
            createTool("File Checksum Generator", "Create checksums for file integrity verification."),
            createTool("AES Encrypt/Decrypt", "Encrypt and decrypt data using AES workflows."),
            createTool("Base64 Encode/Decode", "Encode or decode Base64 text instantly."),
        ],
    },
    {
        id: "archive",
        slug: "archive-tools",
        title: "Archive Tools",
        description: "Create and extract common file archive formats quickly.",
        heroDescription:
            "Handle ZIP, TAR, and 7Z archive workflows with quick extraction and packaging tools.",
        accent: "from-orange-500/20 to-yellow-500/10",
        seoTitle: "Archive Tools – ZIP, TAR, 7Z Extractor and Creator Online",
        seoDescription:
            "Extract and create ZIP, TAR, and 7Z archives online with simple browser-based archive tools.",
        tools: [
            createTool("ZIP Extractor", "Open and extract ZIP files quickly."),
            createTool("ZIP Creator", "Package files into a ZIP archive."),
            createTool("TAR Extractor", "Extract files from TAR archives."),
            createTool("7Z Extractor", "Open and unpack 7Z files online."),
        ],
    },
    {
        id: "developer",
        slug: "developer-tools",
        title: "Developer Tools",
        description: "Practical utilities for APIs, debugging, and quick formatting.",
        heroDescription:
            "Use reliable small tools for debugging, payload inspection, formatting, and common engineering tasks.",
        accent: "from-cyan-500/20 to-blue-500/10",
        seoTitle: "Developer Tools – JWT, Regex, SQL, UUID, URL Utilities Online",
        seoDescription:
            "Use developer utilities online for JWT decoding, regex testing, SQL formatting, URL encoding, UUID generation, and more.",
        tools: [
            createTool("JWT Decoder", "Decode JWT tokens and inspect payload content."),
            createTool("URL Encoder/Decoder", "Encode or decode URLs safely."),
            createTool("Regex Tester", "Test regular expressions against sample text."),
            createTool("UUID Generator", "Generate UUID values quickly."),
            createTool("Timestamp Converter", "Convert Unix timestamps into readable dates."),
            createTool("SQL Formatter", "Beautify SQL queries for readability."),
            createTool("Code Beautifier", "Format code snippets cleanly."),
            createTool("QR Code Generator", "Generate QR codes from text or URLs."),
            createTool("QR Code Scanner", "Scan and decode QR code content."),
            createTool("Website to Markdown", "Fetch a web page and convert it into clean Markdown."),
        ],
    },
    {
        id: "ai",
        slug: "ai-tools",
        title: "AI-Powered Tools",
        description: "OCR, parsing, summarization, and question-answering workflows.",
        heroDescription:
            "Deliver document intelligence with OCR, parsing, summarization, and AI-powered file interactions.",
        accent: "from-fuchsia-500/20 to-pink-500/10",
        seoTitle: "AI File Tools – OCR, Summarizer, Resume Parser, PDF Chat",
        seoDescription:
            "Use AI-powered tools for OCR, handwriting recognition, document summarization, resume parsing, and PDF question answering.",
        tools: [
            createTool("OCR Image to Text", "Extract readable text from images."),
            createTool("PDF OCR", "Recognize text from scanned PDF documents."),
            createTool("Handwriting to Text", "Convert handwriting into editable text."),
            createTool("Document Summarizer", "Summarize long documents quickly."),
            createTool("Resume Parser", "Extract structured data from resumes."),
            createTool("AI File Chat", "Ask questions and get answers from PDFs and documents."),
        ],
    },
]

export function getCategoryBySlug(categorySlug: string) {
    return toolCategories.find((category) => category.slug === categorySlug)
}

export function getToolBySlugs(categorySlug: string, toolSlug: string) {
    const category = getCategoryBySlug(categorySlug)
    if (!category) return null

    const tool = category.tools.find((item) => item.slug === toolSlug)
    if (!tool) return null

    return { category, tool }
}

export type SearchableTool = ToolItem & { categorySlug: string; categoryTitle: string }

export function getAllTools(): SearchableTool[] {
    return toolCategories.flatMap((category) =>
        category.tools.map((tool) => ({
            ...tool,
            categorySlug: category.slug,
            categoryTitle: category.title,
        }))
    )
}

export const categoryIconMap: Record<string, LucideIcon> = {
    "pdf-tools": FileText,
    "image-tools": ImageIcon,
    "document-office-tools": FileSpreadsheet,
    "video-tools": Video,
    "audio-tools": Music4,
    "security-tools": ShieldCheck,
    "archive-tools": Archive,
    "developer-tools": Code2,
    "ai-tools": Sparkles,
}

export function getCategoryIcon(categorySlug: string): LucideIcon {
    return categoryIconMap[categorySlug] ?? Sparkles
}