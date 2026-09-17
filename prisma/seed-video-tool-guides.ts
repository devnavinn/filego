// prisma/seed-video-tool-guides.ts
//
// Seeds one high-intent, SEO-oriented guide per Video tool into the
// `blog_posts` table (Neon/Postgres via Prisma). Mirrors
// prisma/seed-tool-guides.ts, but for the Video Tools category
// (compression, trimming, merging, conversion, GIF export, audio
// extraction, and thumbnail generation).
//
// Run with: npm run seed:video-guides

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
        slug: "how-to-compress-a-video-online-without-losing-quality",
        title: "How to Compress a Video Online Without Losing Quality",
        excerpt:
            "A huge video file makes uploading and sharing painful. Here's how to shrink a video's file size online, free, while keeping it watchable.",
        seoTitle: "How to Compress a Video Online Free Without Losing Quality | Filego",
        seoDescription:
            "Compress MP4, MOV, and other video files online for free without major quality loss. Fit upload limits and email attachments. Step-by-step guide.",
        category: "Video Guides",
        tags: ["compress video", "reduce video size", "video tools"],
        toolLabel: "Video Compressor",
        toolPath: "/tools/video-tools/video-compressor",
        content: `A few minutes of phone-shot video can easily run into hundreds of megabytes, which makes it slow to upload, too big to email, and sometimes outright rejected by upload limits. Compressing it brings the file size down to something manageable, without turning it into a blurry mess.

## Why video file size matters

- Many platforms and forms cap upload size, and an uncompressed video can blow right past it
- Email attachments almost always reject large video files outright
- Smaller files upload and share faster, especially on a slow connection
- Compressed videos take up less phone or cloud storage

## How to compress a video online, step by step

1. Open the [Video Compressor](/tools/video-tools/video-compressor).
2. Upload the video file you want to shrink.
3. Choose a compression level and watch the estimated output size update.
4. Preview the result to confirm the quality still looks acceptable.
5. Download the compressed video.

## Tips for the best size-to-quality tradeoff

- **Match compression to the destination.** A video going to social media or WhatsApp can handle more compression than one meant for a presentation screen.
- **Trim before compressing** if the video has unnecessary footage — see the [Video Trimmer](/tools/video-tools/video-trimmer) — since a shorter video compresses to a smaller file at the same quality.
- **Don't over-compress.** Pushing quality too low introduces visible blocky artifacts; find the setting where size drops significantly without the video looking degraded.

## Common questions

**Will compression make my video blurry?**
At reasonable settings, no — compression removes data that's mostly imperceptible. Quality only degrades noticeably at very aggressive settings.

**What's the difference between compressing and converting format?**
Compression reduces file size within the same format. Converting to a different container or codec — see [Video Converter](/tools/video-tools/video-converter-mp4-mov-avi) — can also affect size and compatibility.

**Can I compress a video and also cut a section out of it?**
Yes — trim it with the [Video Trimmer](/tools/video-tools/video-trimmer) first, then compress the shorter result for an even smaller file.

Need to shrink a video file? [Compress your video for free →](/tools/video-tools/video-compressor)`,
    },
    {
        slug: "how-to-convert-video-to-gif-online",
        title: "How to Convert a Video Clip into a GIF Online for Free",
        excerpt:
            "Turn a short video clip into a looping GIF for chats, memes, or social posts. Here's how to do it online, free, in a few clicks.",
        seoTitle: "How to Convert Video to GIF Online Free | Filego",
        seoDescription:
            "Convert a short video clip into an animated GIF online for free. Choose the section, adjust quality, and download instantly. Step-by-step guide.",
        category: "Video Guides",
        tags: ["video to gif", "convert video", "video tools"],
        toolLabel: "Video to GIF",
        toolPath: "/tools/video-tools/video-to-gif",
        content: `A GIF is often more useful than a video clip — it autoplays, loops, and works everywhere from chat apps to forum posts without needing a video player. Turning a short video moment into a GIF takes just a few steps online.

## When a GIF works better than a video clip

- Sharing a short, funny, or reaction-worthy moment in a chat or on social media
- Creating a looping product demo or UI preview that autoplays without controls
- Making a meme from a video moment
- Embedding a short clip somewhere that doesn't support video playback

## How to convert a video to GIF, step by step

1. Open the [Video to GIF tool](/tools/video-tools/video-to-gif).
2. Upload the video containing the clip you want.
3. Select the start and end points of the section to convert.
4. Adjust quality and size settings for the output GIF.
5. Download the finished GIF.

## Tips for a good-looking GIF

- **Keep the clip short.** GIFs get large fast — a few seconds usually looks better and loads faster than a long clip.
- **Trim tightly around the moment you want** using the selection controls, rather than converting more footage than necessary.
- **Lower the frame rate or resolution** if the GIF file size is too large for where you're sharing it — most short clips still look good at a reduced size.

## Common questions

**Is there a length limit for the GIF?**
Shorter clips convert to smaller, more shareable GIFs — very long clips will produce a large file, so trimming to the essential moment is recommended.

**Can I convert a clip from any video format?**
Yes — upload the source video and select the section you want; the tool handles the conversion to GIF.

**Can I turn the GIF back into a video later?**
This tool is built for video-to-GIF conversion; if you need a short video file instead, trim the original with the [Video Trimmer](/tools/video-tools/video-trimmer).

Have a moment worth turning into a GIF? [Convert video to GIF for free →](/tools/video-tools/video-to-gif)`,
    },
    {
        slug: "how-to-trim-a-video-online-free",
        title: "How to Trim a Video Online Without Special Software",
        excerpt:
            "Cut the boring parts, keep the good bits. Here's how to trim a video to exactly the section you want, online and free.",
        seoTitle: "How to Trim a Video Online Free | Filego",
        seoDescription:
            "Trim unwanted parts from a video online for free. Cut to an exact start and end point and download the result instantly. Step-by-step guide.",
        category: "Video Guides",
        tags: ["trim video", "cut video", "video tools"],
        toolLabel: "Video Trimmer",
        toolPath: "/tools/video-tools/video-trimmer",
        content: `A recording rarely starts and ends exactly where you want it — there's dead air at the start, extra footage at the end, or a section in the middle you'd rather cut. Trimming solves that without needing a full video editor.

## When you need to trim a video

- Cutting out a slow intro or unnecessary ending before sharing a clip
- Extracting just the relevant moment from a longer recording
- Shortening a video to fit a platform's length limit
- Removing dead air or mistakes from the start or end of a recording

## How to trim a video online, step by step

1. Open the [Video Trimmer](/tools/video-tools/video-trimmer).
2. Upload the video you want to cut.
3. Drag the start and end handles to select the section you want to keep.
4. Preview the trimmed selection before exporting.
5. Download the trimmed video.

## Tips for a clean trim

- **Preview right at the cut points** to make sure you're not clipping off the first or last word of something important.
- **Trim before compressing** if you also need a smaller file — a shorter video compresses to a smaller size at the same quality, using the [Video Compressor](/tools/video-tools/video-compressor).
- **Extract just the audio instead** if all you need is the sound from a section — see [Extract Audio from Video](/tools/video-tools/extract-audio-from-video).

## Common questions

**Does trimming re-encode the whole video?**
The tool processes the selected section to produce the trimmed output — quality is preserved as closely as possible to the source.

**Can I cut out a section from the middle, not just the start or end?**
This tool keeps one continuous selected range. To remove a middle section, trim into two clips around it, or merge the outer sections back together with the [Video Merger](/tools/video-tools/video-merger).

**Will trimming reduce the file size?**
Yes, proportionally to how much you cut — a shorter video is naturally a smaller file at the same quality.

Have a video that needs cutting down? [Trim your video for free →](/tools/video-tools/video-trimmer)`,
    },
    {
        slug: "how-to-merge-multiple-videos-into-one-online",
        title: "How to Merge Multiple Video Clips into One File Online",
        excerpt:
            "Combine several video clips into a single file, in the order you choose. Here's how to do it online, free, without editing software.",
        seoTitle: "How to Merge Videos Online Free | Filego",
        seoDescription:
            "Combine multiple video clips into one file online for free. Reorder clips and export a single video, no editing software required.",
        category: "Video Guides",
        tags: ["merge video", "combine video clips", "video tools"],
        toolLabel: "Video Merger",
        toolPath: "/tools/video-tools/video-merger",
        content: `Multiple separate video clips are harder to share and watch than one combined file — especially if they're meant to be viewed as a sequence, like clips from an event or a multi-part recording. Merging them stitches everything into a single video, in the order you choose.

## When you need to merge videos

- Combining clips from an event or trip into one continuous video
- Stitching together multiple screen recordings into a single tutorial
- Joining separate takes of a recording into one file
- Putting a sequence of short clips into a single shareable video

## How to merge videos online, step by step

1. Open the [Video Merger](/tools/video-tools/video-merger).
2. Upload the video clips you want to combine.
3. Drag to reorder them into the sequence you want in the final video.
4. Preview the order before exporting.
5. Download the merged video as a single file.

## Tips for a smooth merge

- **Trim each clip first** if any of them have extra footage at the start or end — use the [Video Trimmer](/tools/video-tools/video-trimmer) before merging so the combined result flows cleanly.
- **Keep similar resolutions and orientations** across clips where possible, so the merged video doesn't look inconsistent between sections.
- **Double-check the order** in the preview before exporting — reordering afterward means merging again.

## Common questions

**Can I merge videos of different formats?**
Upload the clips you want combined; the tool handles bringing them together into a single output file.

**Is there a limit to how many clips I can merge?**
You can combine as many clips as you need into one sequence.

**Can I compress the merged video afterward?**
Yes — once merged, run the result through the [Video Compressor](/tools/video-tools/video-compressor) if the combined file is larger than you need.

Have separate clips to combine into one? [Merge your videos for free →](/tools/video-tools/video-merger)`,
    },
    {
        slug: "how-to-extract-audio-from-a-video-online",
        title: "How to Extract Audio from a Video Online for Free",
        excerpt:
            "Just need the sound, not the picture? Here's how to pull the audio track out of any video file online, free, in seconds.",
        seoTitle: "How to Extract Audio from Video Online Free | Filego",
        seoDescription:
            "Extract the audio track from a video file online for free. Get just the sound as a standalone audio file. Step-by-step guide.",
        category: "Video Guides",
        tags: ["extract audio", "video to audio", "video tools"],
        toolLabel: "Extract Audio from Video",
        toolPath: "/tools/video-tools/extract-audio-from-video",
        content: `Sometimes the video part is irrelevant and all you actually want is the sound — a podcast recorded on camera, a song from a music video, or the audio from a lecture recording. Extracting the audio gives you a standalone file without the much larger video attached.

## When you need audio extracted from video

- Turning a recorded interview or lecture into a podcast-style audio file
- Pulling a song or sound clip out of a video for reuse elsewhere
- Getting just the audio for a smaller file to share or archive
- Creating an audio-only version of a recording for listening on the go

## How to extract audio from a video, step by step

1. Open [Extract Audio from Video](/tools/video-tools/extract-audio-from-video).
2. Upload the video file containing the audio you want.
3. The tool pulls out the audio track automatically.
4. Preview the extracted audio.
5. Download it as a standalone audio file.

## Tips for the best result

- **Trim the video first** if you only need audio from part of it — use the [Video Trimmer](/tools/video-tools/video-trimmer) to isolate the section before extracting.
- **Check audio quality in the source video.** Extraction pulls out exactly what's there — background noise or low volume in the original will carry over to the extracted audio.
- **Compress the audio afterward** if the file is larger than needed — see the [Audio Compressor](/tools/audio-tools/audio-compressor).

## Common questions

**Does extraction affect audio quality?**
The audio track is pulled out as it exists in the source video, without adding extra compression on top.

**Can I extract audio from any video format?**
Upload the video file you have; the tool handles reading and extracting its audio track.

**Can I edit the audio afterward?**
Yes — use tools like the [MP3 Cutter](/tools/audio-tools/mp3-cutter) or [Audio Converter](/tools/audio-tools/audio-converter) on the extracted file for further editing.

Just need the sound from a video? [Extract the audio for free →](/tools/video-tools/extract-audio-from-video)`,
    },
    {
        slug: "how-to-convert-video-formats-online-mp4-mov-avi",
        title: "How to Convert Between Video Formats Online (MP4, MOV, AVI)",
        excerpt:
            "A video in the wrong format won't play or upload where you need it to. Here's how to convert between MP4, MOV, and AVI online, free.",
        seoTitle: "How to Convert Video Formats Online Free (MP4, MOV, AVI) | Filego",
        seoDescription:
            "Convert videos between MP4, MOV, and AVI formats online for free. Fix compatibility issues with devices, editors, and platforms.",
        category: "Video Guides",
        tags: ["video converter", "mp4 mov avi", "video tools"],
        toolLabel: "Video Converter (MP4, MOV, AVI)",
        toolPath: "/tools/video-tools/video-converter-mp4-mov-avi",
        content: `Not every device, app, or platform handles every video format the same way. A MOV file from an iPhone might not play well on a Windows PC, and some upload forms only accept MP4. Converting between formats fixes that without re-recording anything.

## When you need to convert a video's format

- A MOV file from an iPhone won't open properly in a Windows video player
- A platform or upload form only accepts a specific format like MP4
- An older AVI file needs to be converted to a more modern, widely supported format
- A video editor requires a different format than the one you have

## How to convert a video format, step by step

1. Open the [Video Converter](/tools/video-tools/video-converter-mp4-mov-avi).
2. Upload the video file you want to convert.
3. Choose the output format — MP4, MOV, or AVI.
4. Let the tool convert the file.
5. Download the converted video.

## Tips before converting

- **MP4 is the safest default** for the widest compatibility across devices, platforms, and editors, if you're not sure which format you need.
- **Check the target requirement first.** If you're uploading somewhere specific, confirm which format it expects before converting, to avoid doing it twice.
- **Compress afterward if needed** — format conversion and file size are separate; use the [Video Compressor](/tools/video-tools/video-compressor) if the converted file is still too large.

## Common questions

**Does converting formats reduce video quality?**
The conversion aims to preserve quality as closely as possible; very old or unusual source formats may show minor differences after conversion.

**Which format should I choose if I'm not sure?**
MP4 is the most broadly compatible choice across phones, computers, browsers, and social platforms.

**Can I convert multiple videos at once?**
Convert each file individually through the tool; for combining multiple clips into one file afterward, see the [Video Merger](/tools/video-tools/video-merger).

Have a video in the wrong format? [Convert your video for free →](/tools/video-tools/video-converter-mp4-mov-avi)`,
    },
    {
        slug: "how-to-generate-a-thumbnail-from-a-video-online",
        title: "How to Generate a Thumbnail Image from a Video Online",
        excerpt:
            "Need a still image that represents your video? Here's how to capture a clean thumbnail from any frame, online and free.",
        seoTitle: "How to Generate a Video Thumbnail Online Free | Filego",
        seoDescription:
            "Capture a thumbnail image from any frame of a video online for free. Preview frames and export a still image instantly.",
        category: "Video Guides",
        tags: ["video thumbnail", "thumbnail generator", "video tools"],
        toolLabel: "Thumbnail Generator",
        toolPath: "/tools/video-tools/thumbnail-generator",
        content: `A video needs a good still image to represent it — for a video library, a social post preview, or a content management system. Rather than screenshotting your screen while the video plays, you can capture a clean frame directly as an image.

## When you need a video thumbnail

- Creating a preview image for a video library, blog post, or upload
- Choosing a specific frame that best represents the video's content
- Generating a poster image for a video player
- Getting a quick still image from a video without screen-recording software

## How to generate a thumbnail, step by step

1. Open the [Thumbnail Generator](/tools/video-tools/thumbnail-generator).
2. Upload the video you want a thumbnail from.
3. Scrub through the video to find the frame you want.
4. Capture that frame as a still image.
5. Download the thumbnail image.

## Tips for a good thumbnail

- **Pick a frame with clear, in-focus content** — a frame during fast motion or a transition often looks blurry as a still image.
- **Avoid frames with mid-transition captions or overlays** if the video has any, since those can look awkward frozen as a thumbnail.
- **Crop or resize afterward** if you need an exact size for a specific platform — see the [Image Cropper](/tools/image-tools/image-cropper) or [Image Resizer](/tools/image-tools/image-resizer).

## Common questions

**Can I choose any frame in the video, not just the first one?**
Yes — scrub through the whole video and capture whichever frame you want as the thumbnail.

**What image format is the thumbnail saved as?**
It's exported as a standard still image file, ready to use directly or edit further with Filego's image tools.

**Can I generate more than one thumbnail from the same video?**
Yes — capture as many different frames as you need, one at a time.

Need a still image from your video? [Generate a thumbnail for free →](/tools/video-tools/thumbnail-generator)`,
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
