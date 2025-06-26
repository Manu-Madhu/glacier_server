import sharp from 'sharp';
import { s3Client, Bucket } from '../middlewares/storage.middleware.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';

const endpoint = process.env.DO_SPACES_ENDPOINT;

const MAX_ALLOWED_SIZE = 20 * 1024 * 1024; // 20MB limit 

export const processAndUploadFile = async (file, index = 0, timestamp = Date.now()) => {
    if (file.size > MAX_ALLOWED_SIZE) {
        throw new Error(`File "${file.originalname}" exceeds maximum size limit`);
    }

    let finalBuffer = file.buffer;
    let contentType = file.mimetype;
    let ext = path.extname(file.originalname).replace('.', '');
    const baseName = path.basename(file.originalname, path.extname(file.originalname))
        .replace(/\s+/g, '_');

    if (contentType.startsWith('image/')) {
        const image = sharp(file.buffer);
        const metadata = await image.metadata();

        const resizedImage = metadata.width > 1920 ? image.resize({ width: 1920 }) : image;
        finalBuffer = await resizedImage.webp({ quality: 90 }).toBuffer();
        contentType = 'image/webp';
        ext = 'webp';
    }

    const key = `Media/${timestamp}-${index}-${baseName}.${ext}`;
    const fileUrl = `${endpoint}/${Bucket}/${key}`;

    await s3Client.send(new PutObjectCommand({
        Bucket,
        Key: key,
        Body: finalBuffer,
        ContentType: contentType,
        ACL: 'public-read',
        ContentDisposition: 'inline',
    }));

    return {
        name: file.originalname,
        key,
        location: fileUrl,
        size: finalBuffer.length,
        mimeType: contentType,
    };
};