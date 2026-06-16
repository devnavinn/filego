// lib/cloudinary.ts
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary environment variables.");
}

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
});

export { cloudinary };
export type { UploadApiResponse, UploadApiErrorResponse };

export async function uploadBufferToCloudinary(params: {
    buffer: Buffer;
    folder?: string;
    publicId?: string;
    resourceType?: "image" | "video" | "raw" | "auto";
    format?: string;
    tags?: string[];
    overwrite?: boolean;
}): Promise<UploadApiResponse> {
    const {
        buffer,
        folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "filego/blog",
        publicId,
        resourceType = "image",
        format = "png",
        tags = [],
        overwrite = false,
    } = params;

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                resource_type: resourceType,
                format,
                overwrite,
                tags,
            },
            (error, result) => {
                if (error || !result) {
                    return reject(error ?? new Error("Cloudinary upload failed."));
                }
                resolve(result);
            }
        );

        stream.end(buffer);
    });
}

export async function destroyCloudinaryImage(publicId: string) {
    if (!publicId) return null;

    return cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
    });
}