import { BackgroundRemoverTool } from "@/components/tools/background-remover-tool"
import { JwtDecoderTool } from "@/components/tools/jwt-decoder-tool"
import { PdfEditorTool } from "@/components/tools/pdf-editor-tool"
import { PdfMergeTool } from "@/components/tools/pdf-merge-tool"
import { PdfSplitTool } from "@/components/tools/pdf-split-tool"
import { PdfCompressTool } from "@/components/tools/pdf-compress-tool"
import { PdfRotateTool } from "@/components/tools/pdf-rotate-tool"
import { PdfWatermarkTool } from "@/components/tools/pdf-watermark-tool"
import { PdfPageNumberingTool } from "@/components/tools/pdf-page-numbering-tool"
import { PdfDeletePagesTool } from "@/components/tools/pdf-delete-pages-tool"
import { PdfExtractPagesTool } from "@/components/tools/pdf-extract-pages-tool"
import { PdfPasswordProtectTool } from "@/components/tools/pdf-password-protect-tool"
import { PdfUnlockTool } from "@/components/tools/pdf-unlock-tool"
import { PdfToWordTool } from "@/components/tools/pdf-to-word-tool"
import { WordToPdfTool } from "@/components/tools/word-to-pdf-tool"
import { JpgToPdfTool } from "@/components/tools/jpg-to-pdf-tool"
import { PdfToJpgTool } from "@/components/tools/pdf-to-jpg-tool"
import { UrlEncoderDecoderTool } from "@/components/tools/url-encoder-decoder-tool"
import { RegexTesterTool } from "@/components/tools/regex-tester-tool"
import { UuidGeneratorTool } from "@/components/tools/uuid-generator-tool"
import { TimestampConverterTool } from "@/components/tools/timestamp-converter-tool"
import { SqlFormatterTool } from "@/components/tools/sql-formatter-tool"
import { CodeBeautifierTool } from "@/components/tools/code-beautifier-tool"
import { QrCodeGeneratorTool } from "@/components/tools/qr-code-generator-tool"
import { QrCodeScannerTool } from "@/components/tools/qr-code-scanner-tool"
import { WebsiteToMarkdownTool } from "@/components/tools/website-to-markdown-tool"
import { DocumentSummarizerTool } from "@/components/tools/document-summarizer-tool"
import { ResumeParserTool } from "@/components/tools/resume-parser-tool"
import { AiFileChatTool } from "@/components/tools/ai-file-chat-tool"
import {
    PngToJpgTool,
    JpgToPngTool,
    WebpToJpgTool,
    WebpToPngTool,
    SvgToPngTool,
} from "@/components/tools/image-format-converter"
import { ImageResizerTool } from "@/components/tools/image-resizer-tool"
import { ImageCropperTool } from "@/components/tools/image-cropper-tool"
import { ImageWatermarkTool } from "@/components/tools/image-watermark-tool"
import { ImageMetadataViewerTool } from "@/components/tools/image-metadata-viewer-tool"
import { ImageUpscalerTool } from "@/components/tools/image-upscaler-tool"
import { ImageCompressorRedirectTool } from "@/components/tools/image-compressor-redirect-tool"
import { ExcelToCsvTool } from "@/components/tools/excel-to-csv-tool"
import { CsvToExcelTool } from "@/components/tools/csv-to-excel-tool"
import { JsonFormatterTool } from "@/components/tools/json-formatter-tool"
import { JsonToCsvTool } from "@/components/tools/json-to-csv-tool"
import { XmlFormatterTool } from "@/components/tools/xml-formatter-tool"
import { XmlToJsonTool } from "@/components/tools/xml-to-json-tool"
import { MarkdownToHtmlTool } from "@/components/tools/markdown-to-html-tool"
import { HtmlToMarkdownTool } from "@/components/tools/html-to-markdown-tool"
import { TextCompareTool } from "@/components/tools/text-compare-tool"
import { Sha256GeneratorTool } from "@/components/tools/sha256-generator-tool"
import { Md5GeneratorTool } from "@/components/tools/md5-generator-tool"
import { PasswordGeneratorTool } from "@/components/tools/password-generator-tool"
import { FileChecksumTool } from "@/components/tools/file-checksum-tool"
import { AesEncryptDecryptTool } from "@/components/tools/aes-encrypt-decrypt-tool"
import { Base64EncodeDecodeTool } from "@/components/tools/base64-encode-decode-tool"
import { ZipExtractorTool } from "@/components/tools/zip-extractor-tool"
import { ZipCreatorTool } from "@/components/tools/zip-creator-tool"
import { TarExtractorTool } from "@/components/tools/tar-extractor-tool"
import { SevenZipExtractorTool } from "@/components/tools/seven-zip-extractor-tool"
import { VideoThumbnailGeneratorTool } from "@/components/tools/video-thumbnail-generator-tool"
import { VideoTrimmerTool } from "@/components/tools/video-trimmer-tool"
import { VideoCompressorTool } from "@/components/tools/video-compressor-tool"
import { VideoToGifTool } from "@/components/tools/video-to-gif-tool"
import { ExtractAudioTool } from "@/components/tools/extract-audio-tool"
import { VideoConverterTool } from "@/components/tools/video-converter-tool"
import { VideoMergerTool } from "@/components/tools/video-merger-tool"
import { VoiceRecorderTool } from "@/components/tools/voice-recorder-tool"
import { Mp3CutterTool } from "@/components/tools/mp3-cutter-tool"
import { AudioConverterTool } from "@/components/tools/audio-converter-tool"
import { AudioMergerTool } from "@/components/tools/audio-merger-tool"
import { AudioCompressorTool } from "@/components/tools/audio-compressor-tool"
import { VolumeBoosterTool } from "@/components/tools/volume-booster-tool"

export const toolComponentMap = {
    "edit-pdf": PdfEditorTool,
    "pdf-merge": PdfMergeTool,
    "pdf-split": PdfSplitTool,
    "pdf-compress": PdfCompressTool,
    "pdf-to-word": PdfToWordTool,
    "word-to-pdf": WordToPdfTool,
    "pdf-to-jpg": PdfToJpgTool,
    "jpg-to-pdf": JpgToPdfTool,
    "pdf-watermark": PdfWatermarkTool,
    "pdf-password-protect": PdfPasswordProtectTool,
    "pdf-unlock": PdfUnlockTool,
    "pdf-page-numbering": PdfPageNumberingTool,
    "rotate-pdf": PdfRotateTool,
    "delete-pdf-pages": PdfDeletePagesTool,
    "extract-pdf-pages": PdfExtractPagesTool,
    "background-remover": BackgroundRemoverTool,
    "jwt-decoder": JwtDecoderTool,
    "url-encoder-decoder": UrlEncoderDecoderTool,
    "regex-tester": RegexTesterTool,
    "uuid-generator": UuidGeneratorTool,
    "timestamp-converter": TimestampConverterTool,
    "sql-formatter": SqlFormatterTool,
    "code-beautifier": CodeBeautifierTool,
    "qr-code-generator": QrCodeGeneratorTool,
    "qr-code-scanner": QrCodeScannerTool,
    "website-to-markdown": WebsiteToMarkdownTool,
    "document-summarizer": DocumentSummarizerTool,
    "resume-parser": ResumeParserTool,
    "ai-file-chat": AiFileChatTool,
    "image-compressor": ImageCompressorRedirectTool,
    "image-resizer": ImageResizerTool,
    "image-cropper": ImageCropperTool,
    "png-to-jpg": PngToJpgTool,
    "jpg-to-png": JpgToPngTool,
    "webp-to-jpg": WebpToJpgTool,
    "webp-to-png": WebpToPngTool,
    "svg-to-png": SvgToPngTool,
    "image-watermark": ImageWatermarkTool,
    "image-upscaler-ai": ImageUpscalerTool,
    "image-metadata-viewer": ImageMetadataViewerTool,
    "excel-to-csv": ExcelToCsvTool,
    "csv-to-excel": CsvToExcelTool,
    "json-formatter": JsonFormatterTool,
    "json-to-csv": JsonToCsvTool,
    "xml-formatter": XmlFormatterTool,
    "xml-to-json": XmlToJsonTool,
    "markdown-to-html": MarkdownToHtmlTool,
    "html-to-markdown": HtmlToMarkdownTool,
    "text-compare-tool": TextCompareTool,
    "sha256-generator": Sha256GeneratorTool,
    "md5-generator": Md5GeneratorTool,
    "password-generator": PasswordGeneratorTool,
    "file-checksum-generator": FileChecksumTool,
    "aes-encrypt-decrypt": AesEncryptDecryptTool,
    "base64-encode-decode": Base64EncodeDecodeTool,
    "zip-extractor": ZipExtractorTool,
    "zip-creator": ZipCreatorTool,
    "tar-extractor": TarExtractorTool,
    "7z-extractor": SevenZipExtractorTool,
    "video-compressor": VideoCompressorTool,
    "video-to-gif": VideoToGifTool,
    "video-trimmer": VideoTrimmerTool,
    "video-merger": VideoMergerTool,
    "extract-audio-from-video": ExtractAudioTool,
    "video-converter-mp4-mov-avi": VideoConverterTool,
    "thumbnail-generator": VideoThumbnailGeneratorTool,
    "mp3-cutter": Mp3CutterTool,
    "audio-converter": AudioConverterTool,
    "audio-merger": AudioMergerTool,
    "audio-compressor": AudioCompressorTool,
    "voice-recorder": VoiceRecorderTool,
    "volume-booster": VolumeBoosterTool,
} as const

export type ToolComponentSlug = keyof typeof toolComponentMap