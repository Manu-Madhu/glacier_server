import { processAndUploadFile } from "../services/upload.service.js";

export const uploadSingleFileCtrl = async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded',
            data: null,
            error: 'INSUFFICIENT_DATA'
        });
    }

    try {
        const uploadedFile = await processAndUploadFile(file);
        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: { file: uploadedFile },
            error: null
        });
    } catch (error) {
        console.error('Single file upload error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error',
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        });
    }
};

export const uploadMultipleFileCtrl = async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No files uploaded',
            data: null,
            error: 'INSUFFICIENT_DATA'
        });
    }

    try {
        const timestamp = Date.now();
        const uploadedFiles = await Promise.all(
            files.map((file, index) => processAndUploadFile(file, index, timestamp))
        );

        return res.status(200).json({
            success: true,
            message: 'Files uploaded successfully',
            data: { files: uploadedFiles },
            error: null
        });
    } catch (error) {
        console.error('Multiple file upload error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error',
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        });
    }
};
